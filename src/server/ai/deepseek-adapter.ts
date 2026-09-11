import OpenAI from "openai";
import { config } from "@/config";
import type { SectionInput, ChapterProposal } from "./index";

/**
 * DeepSeek Adapter implementing text structuring and reasoning capabilities.
 * Built via the OpenAI SDK targeting DeepSeek's OpenAI-compatible API endpoint.
 * All configurable parameters are loaded directly from src/config/index.ts.
 */
export class DeepSeekAdapter {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseURL: config.ai.deepseek.baseURL,
      timeout: config.ai.deepseek.timeoutMs,
    });
  }

  /**
   * Structures transcript sections into coherent chapters using DeepSeek.
   * Ensures chapter proposals are bounded and logically grouped.
   */
  async structure(sections: SectionInput[]): Promise<{ chapters: ChapterProposal[] }> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured in environment variables.");
    }

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

    const response = await this.client.chat.completions.create({
      model: config.ai.deepseek.model,
      temperature: config.ai.deepseek.temperature,
      max_tokens: config.ai.deepseek.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { chapters: [] };
    }

    try {
      const parsed = JSON.parse(content) as { chapters: ChapterProposal[] };
      return {
        chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
      };
    } catch {
      return { chapters: [] };
    }
  }

  /**
   * Generic completion helper with DeepSeek.
   */
  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured in environment variables.");
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await this.client.chat.completions.create({
      model: config.ai.deepseek.model,
      temperature: config.ai.deepseek.temperature,
      max_tokens: config.ai.deepseek.maxTokens,
      messages,
    });

    return completion.choices[0]?.message?.content ?? "";
  }
}
