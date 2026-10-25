import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/server/db";
import { config } from "@/config";
import path from "path";
import { readFile, readdir } from "fs/promises";

export function buildStorageKey(userId: string, bookId: string, imageId: string, filename: string) {
  const ext = filename.split(".").pop() || "jpeg";
  return `users/${userId}/books/${bookId}/images/${imageId}.${ext}`;
}

export function isObjectStorageConfigured(): boolean {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    return false;
  }
  // If variables are still default placeholders from documentation/examples
  const isPlaceholder =
    R2_ACCOUNT_ID.includes("your_") ||
    R2_ACCESS_KEY_ID.includes("your_") ||
    R2_SECRET_ACCESS_KEY.includes("your_") ||
    R2_BUCKET.includes("your_");
  return !isPlaceholder;
}

export function getStorageClient(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Generates a short-lived (5 min) presigned PUT URL for direct client-to-storage upload (R7).
 * Avoids proxying raw binary bytes through the Next.js server.
 */
export async function createPresignedUploadUrl(
  storageKey: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const client = getStorageClient();
  const bucket = process.env.R2_BUCKET;

  if (!client || !bucket) {
    return null;
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a short-lived (5 min) presigned GET URL so the browser can
 * display a private R2 image without exposing the bucket publicly.
 * Returns null when object storage is not configured (dev fallback).
 */
export async function createPresignedReadUrl(
  storageKey: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const client = getStorageClient();
  const bucket = process.env.R2_BUCKET;

  if (!client || !bucket) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Downloads an object buffer from cloud storage (used by the AI worker pipeline).
 */
export async function getObjectBuffer(storageKey: string): Promise<Buffer | null> {
  const client = getStorageClient();
  const bucket = process.env.R2_BUCKET;

  if (client && bucket && isObjectStorageConfigured()) {
    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: storageKey,
        })
      );

      if (response.Body) {
        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
      }
    } catch (error) {
      console.warn("storage.get.cloud_fetch_failed_falling_back", { storageKey, error });
    }
  }

  // Dev-mode fallback: load from local .uploads directory
  try {
    const uploadsDir = path.join(process.cwd(), ".uploads");
    const baseName = path.basename(storageKey);
    const primaryPath = path.join(uploadsDir, baseName);

    try {
      return await readFile(primaryPath);
    } catch {
      // If extension differs, find by image ID
      const nameWithoutExt = path.parse(baseName).name;
      const files = await readdir(uploadsDir).catch(() => []);
      const matched = files.find((f) => f.startsWith(nameWithoutExt));
      if (matched) {
        return await readFile(path.join(uploadsDir, matched));
      }
    }
  } catch (err) {
    console.warn("storage.get.local_fallback_error", { storageKey, err });
  }

  return null;
}

/**
 * Deletes one object from cloud storage (R2/S3).
 * Part of deletion parity (R28/R29): every DB row delete that owns an object
 * must call this in the same operation — never rely on the DB cascade alone.
 *
 * When object storage isn't configured yet (dev uploads don't persist bytes),
 * this logs and no-ops so a delete can't fail for a file that doesn't exist.
 */
export async function deleteObject(storageKey: string): Promise<void> {
  const client = getStorageClient();
  const bucket = process.env.R2_BUCKET;

  if (!client || !bucket) {
    console.warn("storage.delete.skipped_no_object_storage_config", { storageKey });
    return;
  }

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
  } catch (error) {
    console.error("storage.delete.failed", { storageKey, error });
    // Surface or log failure according to error-handling standards
  }
}

export async function checkUploadAllowance(userId: string, uploadCount: number, bookId: string) {
  // Load user details and subscription
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });

  const hasActivePro =
    subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd > new Date();

  const limits = hasActivePro ? config.limits.pro : config.limits.free;

  // 1. Check batch ceiling (R3: 50 images max per upload batch)
  if (uploadCount > config.limits.batchCeiling) {
    throw new Error(`Upload exceeds maximum batch ceiling of ${config.limits.batchCeiling} images.`);
  }

  // 2. Check monthly images limit (R31)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const imagesThisMonth = await db.sourceImage.count({
    where: {
      book: { userId },
      createdAt: { gte: startOfMonth },
    },
  });

  if (imagesThisMonth + uploadCount > limits.monthlyImages) {
    throw new Error(
      `Upload exceeds your ${hasActivePro ? 'Pro' : 'Free'} plan monthly limit of ${limits.monthlyImages} images (used ${imagesThisMonth}).`
    );
  }

  // 3. Check per-book image cap (R31)
  const currentBookImages = await db.sourceImage.count({
    where: { bookId },
  });

  if (currentBookImages + uploadCount > limits.perBookImages) {
    throw new Error(
      `Upload exceeds per-book limit of ${limits.perBookImages} images for this book (currently has ${currentBookImages}).`
    );
  }

  return { limits, hasActivePro, imagesThisMonth, currentBookImages };
}
