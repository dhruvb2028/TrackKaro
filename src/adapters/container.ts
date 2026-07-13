import { LocalExpenseRepository } from "./mock/LocalExpenseRepository";
import { LocalCategoryOverrideRepository } from "./mock/LocalCategoryOverrideRepository";
import { MockAuthProvider } from "./mock/MockAuthProvider";
import { LocalFileStorage } from "./mock/LocalFileStorage";
import { MockAIExtractor } from "./mock/MockAIExtractor";
import { LocalRateLimiter } from "./mock/LocalRateLimiter";
import { MockStatementParser } from "./mock/MockStatementParser";
import { LocalPayeeRepository } from "./mock/LocalPayeeRepository";
import { AIExtractor } from "../ports/AIExtractor";
import { AuthProvider } from "../ports/AuthProvider";
import { GroqAIExtractor } from "./real/GroqAIExtractor";
import { isSupabaseConfigured } from "./real/supabaseClient";
import { SupabaseAuthProvider } from "./real/SupabaseAuthProvider";
import { SupabaseExpenseRepository } from "./real/SupabaseExpenseRepository";
import { SupabasePayeeRepository } from "./real/SupabasePayeeRepository";
import { SupabaseCategoryOverrideRepository } from "./real/SupabaseCategoryOverrideRepository";
import { SupabaseFileStorage } from "./real/SupabaseFileStorage";
import { RoutingExpenseRepository } from "./routing/RoutingExpenseRepository";
import { RoutingPayeeRepository } from "./routing/RoutingPayeeRepository";
import { RoutingCategoryOverrideRepository } from "./routing/RoutingCategoryOverrideRepository";
import { RoutingFileStorage } from "./routing/RoutingFileStorage";

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
 * Auth itself establishes the Supabase session, so it always points at the
 * real provider once configured — unlike the data ports below, there's no
 * "guest calling this" case to protect.
 */
function makeAuthProvider(): AuthProvider {
  return isSupabaseConfigured() ? new SupabaseAuthProvider() : new MockAuthProvider();
}

const localExpenseRepository = new LocalExpenseRepository();
const localPayeeRepository = new LocalPayeeRepository();
const localCategoryOverrideRepository = new LocalCategoryOverrideRepository();
const localFileStorage = new LocalFileStorage();

/**
 * Single place where ports are bound to their current implementations.
 * Data ports (expenses/payees/overrides/files) route per-call between local
 * storage and Supabase based on whether a real session exists — a guest
 * (no Supabase session) always stays local even when Supabase is
 * configured, since RLS requires auth.uid() (PRD §4.4/§9). Swapping or
 * adding a provider means changing only this file.
 */
export const container = {
  expenseRepository: new RoutingExpenseRepository(
    localExpenseRepository,
    isSupabaseConfigured() ? new SupabaseExpenseRepository() : null
  ),
  categoryOverrideRepository: new RoutingCategoryOverrideRepository(
    localCategoryOverrideRepository,
    isSupabaseConfigured() ? new SupabaseCategoryOverrideRepository() : null
  ),
  payeeRepository: new RoutingPayeeRepository(
    localPayeeRepository,
    isSupabaseConfigured() ? new SupabasePayeeRepository() : null
  ),
  authProvider: makeAuthProvider(),
  fileStorage: new RoutingFileStorage(
    localFileStorage,
    isSupabaseConfigured() ? new SupabaseFileStorage() : null
  ),
  aiExtractor: makeAIExtractor(),
  rateLimiter: new LocalRateLimiter(),
  statementParser: new MockStatementParser(),
};

/** Local-only handles, for the guest-to-account migration step (see migrateGuestData.ts). */
export const localOnly = {
  expenseRepository: localExpenseRepository,
  payeeRepository: localPayeeRepository,
  categoryOverrideRepository: localCategoryOverrideRepository,
};
