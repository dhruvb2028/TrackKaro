import { summarize } from "./spendSummary";
import { Expense } from "./models";

function expense(partial: Partial<Expense>): Expense {
  return {
    id: "x",
    userId: "u",
    amount: 0,
    currency: "INR",
    merchant: null,
    category: "other",
    categoryConfidence: "default",
    note: null,
    date: "2026-07-01",
    source: "manual",
    receiptImageUri: null,
    referenceNumber: null,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...partial,
  };
}

describe("summarize", () => {
  it("returns an empty summary for no expenses", () => {
    expect(summarize([])).toEqual({ monthTotal: 0, byCategory: [] });
  });

  it("totals and sorts categories high to low", () => {
    const result = summarize([
      expense({ category: "food", amount: 300 }),
      expense({ category: "food", amount: 150 }),
      expense({ category: "travel", amount: 200 }),
      expense({ category: "emi", amount: 5000 }),
    ]);
    expect(result.monthTotal).toBe(5650);
    expect(result.byCategory.map((c) => c.category)).toEqual(["emi", "food", "travel"]);
    expect(result.byCategory.find((c) => c.category === "food")!.total).toBe(450);
  });

  it("computes shares that sum to 1", () => {
    const result = summarize([
      expense({ category: "food", amount: 250 }),
      expense({ category: "bills", amount: 750 }),
    ]);
    const sum = result.byCategory.reduce((s, c) => s + c.share, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
