import { LocalExpenseRepository } from "./mock/LocalExpenseRepository";
import { LocalCategoryOverrideRepository } from "./mock/LocalCategoryOverrideRepository";
import { MockAuthProvider } from "./mock/MockAuthProvider";
import { LocalFileStorage } from "./mock/LocalFileStorage";
import { MockAIExtractor } from "./mock/MockAIExtractor";
import { LocalRateLimiter } from "./mock/LocalRateLimiter";

/**
 * Single place where ports are bound to their current implementations.
 * Every adapter here is local/mock today (PRD §4.5) — swapping to a real
 * provider later means changing only this file, not any calling code.
 */
export const container = {
  expenseRepository: new LocalExpenseRepository(),
  categoryOverrideRepository: new LocalCategoryOverrideRepository(),
  authProvider: new MockAuthProvider(),
  fileStorage: new LocalFileStorage(),
  aiExtractor: new MockAIExtractor(),
  rateLimiter: new LocalRateLimiter(),
};
