import { GoogleGenAI } from "@google/genai";
import { config } from "@/config";
import type { ImageInput, TranscriptionResult } from "./index";

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

    const response = await this.ai.models.generateContent({
      model: config.ai.gemini.model,
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
}
