import { Expense, ExpenseCategory, ExpenseSource } from "./models";
import { container } from "../adapters/container";
import { categorize } from "./categorize";
import { newId } from "./id";

export interface AddExpenseInput {
  userId: string;
  amount: number;
  merchant?: string | null;
  category?: ExpenseCategory;
  note?: string | null;
  date?: string;
  source: ExpenseSource;
  receiptImageUri?: string | null;
}

export async function addExpense(input: AddExpenseInput): Promise<Expense> {
  const now = new Date().toISOString();
  let category = input.category ?? null;
  let categoryConfidence: Expense["categoryConfidence"] = "user";

  if (!category) {
    const result = await categorize(
      input.userId,
      input.merchant ?? null,
      container.categoryOverrideRepository
    );
    category = result.category;
    categoryConfidence = result.confidence === "override" ? "override" : "default";
  }

  const expense: Expense = {
    id: newId(),
    userId: input.userId,
    amount: input.amount,
    currency: "INR",
    merchant: input.merchant ?? null,
    category,
    categoryConfidence,
    note: input.note ?? null,
    date: input.date ?? now.slice(0, 10),
    source: input.source,
    receiptImageUri: input.receiptImageUri ?? null,
    referenceNumber: null,
    createdAt: now,
    updatedAt: now,
  };

  return container.expenseRepository.create(expense);
}

export interface ExpenseEdits {
  amount: number;
  merchant: string | null;
  category: ExpenseCategory;
  note: string | null;
  date: string;
}

export async function updateExpense(
  expense: Expense,
  edits: ExpenseEdits
): Promise<Expense> {
  const categoryChanged = edits.category !== expense.category;
  const updated: Expense = {
    ...expense,
    amount: edits.amount,
    merchant: edits.merchant,
    category: edits.category,
    categoryConfidence: categoryChanged ? "user" : expense.categoryConfidence,
    note: edits.note,
    date: edits.date,
    updatedAt: new Date().toISOString(),
  };
  await container.expenseRepository.update(updated);

  // A manual category change teaches the per-user override for next time.
  if (categoryChanged && edits.merchant) {
    const key = edits.merchant.toLowerCase().replace(/[^a-z0-9]/g, "");
    await container.categoryOverrideRepository.set(expense.userId, key, edits.category);
  }

  return updated;
}

export async function deleteExpense(expense: Expense): Promise<void> {
  await container.expenseRepository.delete(expense.id, expense.userId);
}

export async function setExpenseCategory(
  expense: Expense,
  category: ExpenseCategory
): Promise<Expense> {
  const updated: Expense = {
    ...expense,
    category,
    categoryConfidence: "user",
    updatedAt: new Date().toISOString(),
  };
  await container.expenseRepository.update(updated);

  if (expense.merchant) {
    const key = expense.merchant.toLowerCase().replace(/[^a-z0-9]/g, "");
    await container.categoryOverrideRepository.set(expense.userId, key, category);
  }

  return updated;
}
