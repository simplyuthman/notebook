import { GeminiVisionAdapter } from "./gemini-adapter";
import { DeepSeekAdapter } from "./deepseek-adapter";

export interface ConfidenceSpan {
  text: string;
  confidence: "HIGH" | "LOW" | "GAP";
  startOffset: number;
  endOffset: number;
}

export interface DiagramRegion {
  storageKey: string;
  caption: string;
  order: number;
}

export interface TranscriptionResult {
  spans: ConfidenceSpan[];
  diagrams: DiagramRegion[];
  costMinor: number;
}

export interface ImageInput {
  buffer: Buffer;
  storageKey: string;
  mimeType?: string;
}

export interface SectionInput {
  id: string;
  order?: number;
  originalText: string;
}

export interface ChapterProposal {
  title: string;
  order: number;
  sectionIds: string[];
}

/**
 * Unified AiService contract (AGENTS.md Section 2).
 * Exposes exactly two capabilities:
 * 1. transcribe: vision OCR with span-level confidence (Gemini Vision)
 * 2. structure: chapter organization and semantic structuring (DeepSeek)
 */
export interface AiService {
  transcribe(image: ImageInput): Promise<TranscriptionResult>;
  structure(sections: SectionInput[]): Promise<{ chapters: ChapterProposal[] }>;
}

export class AppAiService implements AiService {
  private visionAdapter: GeminiVisionAdapter;
  private structuringAdapter: DeepSeekAdapter;

  constructor() {
    this.visionAdapter = new GeminiVisionAdapter();
    this.structuringAdapter = new DeepSeekAdapter();
  }

  async transcribe(image: ImageInput): Promise<TranscriptionResult> {
    return this.visionAdapter.transcribe(image);
  }

  async structure(sections: SectionInput[]): Promise<{ chapters: ChapterProposal[] }> {
    try {
      return await this.structuringAdapter.structure(sections);
    } catch (err) {
      console.warn("aiService.deepseek_structure_failed_falling_back_to_gemini", err);
      try {
        return await this.visionAdapter.structureWithGemini(sections);
      } catch (geminiErr) {
        console.error("aiService.gemini_structure_fallback_failed", geminiErr);
        // Default deterministic fallback: 1 chapter with all sections so the pipeline never hangs
        return {
          chapters: [
            {
              title: "Chapter 1: Notes",
              order: 1,
              sectionIds: sections.map((s) => s.id),
            },
          ],
        };
      }
    }
  }
}

// Single exported instance per project architecture rules
export const aiService: AiService = new AppAiService();
export { GeminiVisionAdapter } from "./gemini-adapter";
export { DeepSeekAdapter } from "./deepseek-adapter";
