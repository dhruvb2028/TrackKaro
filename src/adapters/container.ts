import { LocalExpenseRepository } from "./mock/LocalExpenseRepository";
import { LocalCategoryOverrideRepository } from "./mock/LocalCategoryOverrideRepository";
import { MockAuthProvider } from "./mock/MockAuthProvider";
import { LocalFileStorage } from "./mock/LocalFileStorage";
import { MockAIExtractor } from "./mock/MockAIExtractor";
import { LocalRateLimiter } from "./mock/LocalRateLimiter";
import { MockStatementParser } from "./mock/MockStatementParser";
import { LocalPayeeRepository } from "./mock/LocalPayeeRepository";
import { AIExtractor } from "../ports/AIExtractor";
import { GroqAIExtractor } from "./real/GroqAIExtractor";

/**
 * Uses the real Groq-backed extractor when an API key is configured, and
 * falls back to the mock otherwise — so local dev has zero external
 * dependencies while a key flips on real extraction with no other change.
 */
function makeAIExtractor(): AIExtractor {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (apiKey) {
    return new GroqAIExtractor({
      apiKey,
      visionModel: process.env.EXPO_PUBLIC_GROQ_VISION_MODEL,
      textModel: process.env.EXPO_PUBLIC_GROQ_TEXT_MODEL,
    });
  }
  return new MockAIExtractor();
}

/**
 * Single place where ports are bound to their current implementations.
 * Storage/auth are local/mock today (PRD §4.5) — swapping to a real
 * provider later means changing only this file, not any calling code.
 */
export const container = {
  expenseRepository: new LocalExpenseRepository(),
  categoryOverrideRepository: new LocalCategoryOverrideRepository(),
  payeeRepository: new LocalPayeeRepository(),
  authProvider: new MockAuthProvider(),
  fileStorage: new LocalFileStorage(),
  aiExtractor: makeAIExtractor(),
  rateLimiter: new LocalRateLimiter(),
  statementParser: new MockStatementParser(),
};
