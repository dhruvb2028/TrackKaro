import { File } from "expo-file-system";
import { AIExtractor } from "../../ports/AIExtractor";
import { ExtractedFields } from "../../domain/models";
import {
  EXTRACTION_SYSTEM_PROMPT,
  IMAGE_USER_PROMPT,
  textUserPrompt,
  parseExtractionResponse,
  dataUri,
} from "./groqExtraction";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqConfig {
  apiKey: string;
  /** A Groq multimodal model for receipt images. */
  visionModel?: string;
  /** A fast Groq text model for narration parsing. */
  textModel?: string;
}

/**
 * Real AIExtractor backed by Groq's OpenAI-compatible API. Selected only when
 * an API key is configured (see container.ts); otherwise the mock is used.
 *
 * NOTE: calling the model directly from the client embeds the key in the app.
 * That is acceptable for this local/dev build stage; per PRD §9 the real
 * deployment moves these calls behind the backend, which is a new adapter,
 * not a change to any calling code.
 */
export class GroqAIExtractor implements AIExtractor {
  private readonly apiKey: string;
  private readonly visionModel: string;
  private readonly textModel: string;

  constructor(config: GroqConfig) {
    this.apiKey = config.apiKey;
    this.visionModel = config.visionModel ?? "meta-llama/llama-4-scout-17b-16e-instruct";
    this.textModel = config.textModel ?? "llama-3.1-8b-instant";
  }

  async extractFromImage(imageUri: string): Promise<ExtractedFields> {
    const base64 = await new File(imageUri).base64();
    const content = await this.chat(this.visionModel, [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: IMAGE_USER_PROMPT },
          { type: "image_url", image_url: { url: dataUri(base64) } },
        ],
      },
    ]);
    return parseExtractionResponse(content);
  }

  async extractFromText(narration: string): Promise<ExtractedFields> {
    const content = await this.chat(this.textModel, [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: textUserPrompt(narration) },
    ]);
    return parseExtractionResponse(content);
  }

  private async chat(model: string, messages: unknown[]): Promise<string> {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq request failed: ${res.status}`);
    }
    const json = await res.json();
    return json?.choices?.[0]?.message?.content ?? "";
  }
}
