import { ExpenseCategory } from "./models";
import { CategoryOverrideRepository } from "../ports/CategoryOverrideRepository";

const DEFAULT_MERCHANT_CATEGORIES: Record<string, ExpenseCategory> = {
  swiggy: "food",
  zomato: "food",
  uber: "travel",
  ola: "travel",
  irctc: "travel",
  amazon: "shopping",
  flipkart: "shopping",
  bses: "bills",
  airtel: "bills",
  jio: "bills",
};

function normalizeMerchant(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Detects a pure person-to-person UPI transfer (no merchant behind it). */
export function looksLikeFamilyTransfer(narration: string): boolean {
  return /\b(p2p|transfer|sent to|received from)\b/i.test(narration);
}

export async function categorize(
  userId: string,
  merchantOrNarration: string | null,
  overrides: CategoryOverrideRepository
): Promise<{ category: ExpenseCategory; confidence: "override" | "default" | "other" }> {
  if (!merchantOrNarration) {
    return { category: "other", confidence: "other" };
  }
  const key = normalizeMerchant(merchantOrNarration);

  const override = await overrides.get(userId, key);
  if (override) {
    return { category: override.category, confidence: "override" };
  }

  for (const [needle, category] of Object.entries(DEFAULT_MERCHANT_CATEGORIES)) {
    if (key.includes(needle)) {
      return { category, confidence: "default" };
    }
  }

  if (/emi|loan/i.test(merchantOrNarration)) {
    return { category: "emi", confidence: "default" };
  }

  if (looksLikeFamilyTransfer(merchantOrNarration)) {
    return { category: "family_transfer", confidence: "default" };
  }

  return { category: "other", confidence: "other" };
}
