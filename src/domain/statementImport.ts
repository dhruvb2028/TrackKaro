import { ParsedTransaction } from "../ports/StatementParser";
import { container } from "../adapters/container";
import { classifyTransaction, Disposition } from "./dedup";
import { extractMerchantSignal, isPureTransfer } from "./parseNarration";
import { categorize } from "./categorize";
import { addExpense } from "./addExpense";
import { currentYearMonth } from "./spendSummary";

export interface ReviewItem {
  transaction: ParsedTransaction;
  reason: "possible_duplicate" | "needs_category";
  merchantSignal: string | null;
}

export interface ImportSummary {
  added: number;
  skippedDuplicates: number;
  needsReview: ReviewItem[];
}

/**
 * Runs a parsed statement through dedup + categorization: confident,
 * non-duplicate rows are added automatically; everything uncertain is
 * returned for a one-tap user decision (§8.3 summary screen).
 */
export async function importStatement(
  userId: string,
  transactions: ParsedTransaction[]
): Promise<ImportSummary> {
  const existing = await container.expenseRepository.listForMonth(userId, currentYearMonth());

  let added = 0;
  let skippedDuplicates = 0;
  const needsReview: ReviewItem[] = [];

  for (const tx of transactions) {
    const merchantSignal = extractMerchantSignal(tx.narration);
    const disposition: Disposition = classifyTransaction(tx, existing, merchantSignal !== null);

    if (disposition === "duplicate") {
      skippedDuplicates++;
      continue;
    }
    if (disposition === "possible_duplicate" || disposition === "needs_category") {
      needsReview.push({
        transaction: tx,
        reason: disposition,
        merchantSignal,
      });
      continue;
    }

    // disposition === "add"
    const category = isPureTransfer(tx.narration)
      ? "family_transfer"
      : (await categorize(userId, merchantSignal, container.categoryOverrideRepository)).category;
    await addExpense({
      userId,
      amount: tx.amount,
      merchant: merchantSignal,
      category,
      date: tx.date,
      source: "statement",
    });
    added++;
  }

  return { added, skippedDuplicates, needsReview };
}
