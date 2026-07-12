import { classifyTransaction } from "./dedup";
import { Expense } from "./models";
import { ParsedTransaction } from "../ports/StatementParser";

function existing(partial: Partial<Expense>): Expense {
  return {
    id: "e",
    userId: "u",
    amount: 0,
    currency: "INR",
    merchant: null,
    category: "other",
    categoryConfidence: "default",
    note: null,
    date: "2026-07-01",
    source: "photo",
    receiptImageUri: null,
    referenceNumber: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

function tx(partial: Partial<ParsedTransaction>): ParsedTransaction {
  return { date: "2026-07-01", amount: 100, narration: "x", referenceNumber: null, ...partial };
}

describe("classifyTransaction", () => {
  it("marks a shared reference number as a duplicate", () => {
    const e = [existing({ referenceNumber: "N778812", amount: 99 })];
    const result = classifyTransaction(
      tx({ referenceNumber: "N778812", amount: 5000, date: "2026-07-07" }),
      e,
      true
    );
    expect(result).toBe("duplicate");
  });

  it("marks same amount + date + fuzzy merchant as a duplicate", () => {
    const e = [existing({ amount: 480, date: "2026-07-02", merchant: "Swiggy" })];
    const result = classifyTransaction(
      tx({ amount: 480, date: "2026-07-02", narration: "UPI/../swiggy@icici", referenceNumber: "A1" }),
      e,
      true
    );
    expect(result).toBe("duplicate");
  });

  it("surfaces a same amount+date match with no merchant as possible_duplicate", () => {
    const e = [existing({ amount: 99, date: "2026-07-05" })];
    const result = classifyTransaction(
      tx({ amount: 99, date: "2026-07-05", narration: "random", referenceNumber: "Z1" }),
      e,
      true
    );
    expect(result).toBe("possible_duplicate");
  });

  it("flags a transaction with no merchant signal for review", () => {
    expect(classifyTransaction(tx({ amount: 77 }), [], false)).toBe("needs_category");
  });

  it("adds a new, confidently-categorized transaction", () => {
    expect(classifyTransaction(tx({ amount: 1299 }), [], true)).toBe("add");
  });
});
