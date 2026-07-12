import { AIExtractor } from "../../ports/AIExtractor";
import { ExtractedFields } from "../../domain/models";

/**
 * Placeholder until a real open-source vision/text model (via Groq or
 * Hugging Face inference, per the PRD) is wired up behind this same
 * interface. Always returns low confidence so callers fall back to the
 * manual short-entry form rather than showing fabricated data.
 */
export class MockAIExtractor implements AIExtractor {
  async extractFromImage(_imageUri: string): Promise<ExtractedFields> {
    return { merchant: null, date: null, amount: null, confidence: "low" };
  }

  async extractFromText(_narration: string): Promise<ExtractedFields> {
    return { merchant: null, date: null, amount: null, confidence: "low" };
  }
}
