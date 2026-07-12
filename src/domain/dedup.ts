import { Expense } from "./models";
import { ParsedTransaction } from "../ports/StatementParser";

export type Disposition =
  | "add" // confident, no duplicate — auto-add
  | "duplicate" // high-confidence duplicate — skip silently
  | "possible_duplicate" // low-confidence match — ask the user
  | "needs_category"; // no merchant signal (transfer) — ask the user

export interface ClassifiedTransaction {
  transaction: ParsedTransaction;
  disposition: Disposition;
}

function daysApart(a: string, b: string): number {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return ms / (1000 * 60 * 60 * 24);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMerchantMatch(narration: string, merchant: string | null): boolean {
  if (!merchant) return false;
  const n = normalize(narration);
  const m = normalize(merchant);
  return m.length >= 3 && n.includes(m);
}

/**
 * Bias: only auto-merge when confidence is high (§4.8). A false merge
 * silently deletes a real expense — worse than surfacing an extra
 * possible-duplicate for a one-tap decision.
 */
export function classifyTransaction(
  tx: ParsedTransaction,
  existing: Expense[],
  hasMerchantSignal: boolean
): Disposition {
  for (const e of existing) {
    // High-confidence: same reference/UTR number.
    if (tx.referenceNumber && e.referenceNumber && tx.referenceNumber === e.referenceNumber) {
      return "duplicate";
    }
    // High-confidence: same amount, within a day, fuzzy merchant match.
    if (
      e.amount === tx.amount &&
      daysApart(e.date, tx.date) <= 1 &&
      fuzzyMerchantMatch(tx.narration, e.merchant)
    ) {
      return "duplicate";
    }
    // Low-confidence: same amount within a day, but merchant unclear.
    if (e.amount === tx.amount && daysApart(e.date, tx.date) <= 1) {
      return "possible_duplicate";
    }
  }

  if (!hasMerchantSignal) {
    return "needs_category";
  }
  return "add";
}
