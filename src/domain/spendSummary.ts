import { Expense, ExpenseCategory } from "./models";

export interface CategorySpend {
  category: ExpenseCategory;
  total: number;
  share: number; // 0..1 of the month total
}

export interface SpendSummary {
  monthTotal: number;
  byCategory: CategorySpend[]; // sorted high -> low, only categories with spend
}

export function summarize(expenses: Expense[]): SpendSummary {
  const monthTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totals = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }

  const byCategory: CategorySpend[] = Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      total,
      share: monthTotal > 0 ? total / monthTotal : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { monthTotal, byCategory };
}

export function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
