import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/server/db";
import { config } from "@/config";

export function buildStorageKey(userId: string, bookId: string, imageId: string, filename: string) {
  const ext = filename.split('.').pop() || 'jpeg';
  return `users/${userId}/books/${bookId}/images/${imageId}.${ext}`;
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
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.warn("storage.delete.skipped_no_object_storage_config", { storageKey });
    return;
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
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
