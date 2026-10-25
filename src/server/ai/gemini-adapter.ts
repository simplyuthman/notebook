import dns from "node:dns";
import { GoogleGenAI } from "@google/genai";
import { config } from "@/config";
import type { ImageInput, TranscriptionResult, SectionInput, ChapterProposal } from "./index";

// Force IPv4 first in Node.js to prevent ECONNRESET/timeouts caused by broken ISP IPv6 routes
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in environments without node:dns support
}

/**
 * Gemini Vision Adapter implementing handwritten note OCR and transcription.
 * All configurable parameters are loaded from src/config/index.ts.
 */
export class GeminiVisionAdapter {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });
  }

  /**
   * Transcribes handwritten note images, extracts confidence spans (HIGH, LOW, GAP),
   * and identifies any diagram bounding positions.
   * Enforces R11 fabrication prevention: unreadable spans are marked as GAP without inventing text.
   */
  async transcribe(input: ImageInput): Promise<TranscriptionResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }

    const base64Data = input.buffer.toString("base64");
    const mimeType = input.mimeType || "image/jpeg";

    const prompt = `You are an accurate optical character recognition system specializing in student handwritten notes.
Transcribe the handwritten text exactly as written.
Do NOT fabricate, guess, or invent words for unreadable, smudged, or cut-off handwriting.
For any text you are uncertain of or cannot decipher, mark it explicitly with a confidence of GAP or LOW.

Return valid JSON matching this exact structure:
{
  "spans": [
    {
      "text": "transcribed text string",
      "confidence": "HIGH" | "LOW" | "GAP",
      "startOffset": 0,
      "endOffset": 15
    }
  ],
  "diagrams": [
    {
      "caption": "brief diagram description",
      "order": 1
    }
  ]
}`;

    // Try primary model first, followed by fallbacks if encountering 503 capacity spikes or network errors
    const modelsToTry = [
      config.ai.gemini.model,
      ...(config.ai.gemini.fallbackModels || []),
    ];
    let response: any = null;
    let lastErr: unknown;

    for (const model of modelsToTry) {
      // Retry transient network drops or temporary 503 demand spikes up to 2 attempts per model
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await this.ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType,
                    },
                  },
                ],
              },
            ],
            config: {
              temperature: config.ai.gemini.temperature,
              maxOutputTokens: config.ai.gemini.maxOutputTokens,
              responseMimeType: "application/json",
            },
          });
          if (response) break;
        } catch (err: any) {
          lastErr = err;
          const errMsg = String(err?.message || err);
          const isTransient =
            err?.status === 503 ||
            err?.status === 429 ||
            err?.code === "ECONNRESET" ||
            errMsg.includes("fetch failed") ||
            errMsg.includes("ECONNRESET") ||
            errMsg.includes("ConnectTimeoutError") ||
            errMsg.includes("high demand");

          if (isTransient && attempt < 2) {
            console.warn(`Gemini model ${model} transient error (attempt ${attempt}/2): ${errMsg}. Retrying in ${attempt}s...`);
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            continue;
          }
          console.warn(`Gemini model ${model} failed, attempting next available model:`, errMsg);
          break;
        }
      }
      if (response) break;
    }

    if (!response) {
      throw lastErr;
    }

    const text = response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { spans: [], diagrams: [] };
    }

    const rawSpans = Array.isArray(parsed.spans) ? parsed.spans : [];
    let currentOffset = 0;

    const normalizedSpans = rawSpans.map((s: any) => {
      const spanText = typeof s.text === "string" ? s.text : "";
      const rawConf = String(s.confidence || "HIGH").toUpperCase();
      const confidence: "HIGH" | "LOW" | "GAP" =
        rawConf === "GAP" || rawConf === "LOW" ? rawConf : "HIGH";

      const start = typeof s.startOffset === "number" ? s.startOffset : currentOffset;
      const end = typeof s.endOffset === "number" ? s.endOffset : start + spanText.length;
      currentOffset = end;

      return {
        text: confidence === "GAP" && !spanText ? "[Unreadable]" : spanText,
        confidence,
        startOffset: start,
        endOffset: end,
      };
    });

    const diagrams = (Array.isArray(parsed.diagrams) ? parsed.diagrams : []).map(
      (d: any, idx: number) => ({
        storageKey: input.storageKey,
        caption: d.caption || "Diagram",
        order: typeof d.order === "number" ? d.order : idx + 1,
      })
    );

    return {
      spans: normalizedSpans,
      diagrams,
      costMinor: config.ai.gemini.costPerImageMinor,
    };
  }

  /**
   * Structuring fallback using Gemini when DeepSeek is unavailable or out of credits.
   */
  async structureWithGemini(sections: SectionInput[]): Promise<{ chapters: ChapterProposal[] }> {
    if (!sections || sections.length === 0) {
      return { chapters: [] };
    }

    const systemPrompt = `You are an expert academic editor structuring student notes into a clear digital book.
Analyze the provided transcript sections and organize them into proposed chapters.
Return ONLY valid JSON matching this exact structure:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "order": 1,
      "sectionIds": ["section-id-1", "section-id-2"]
    }
  ]
}`;

    const userPrompt = JSON.stringify(
      sections.map((s, idx) => ({
        id: s.id,
        order: s.order ?? idx + 1,
        text: s.originalText,
      }))
    );

    const modelsToTry = [
      config.ai.gemini.model,
      ...(config.ai.gemini.fallbackModels || []),
    ];
    let lastErr: unknown;

    for (const model of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nSections:\n${userPrompt}` }],
            },
          ],
          config: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text) as { chapters?: ChapterProposal[] };
        return {
          chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
        };
      } catch (err) {
        lastErr = err;
        console.warn(`structureWithGemini: model ${model} failed, trying next available model:`, err);
      }
    }

    throw lastErr;
  }
}

