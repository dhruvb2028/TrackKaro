import { ExpenseRepository } from "../../ports/ExpenseRepository";
import { Expense } from "../../domain/models";
import { getSupabase } from "./supabaseClient";

interface Row {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  merchant: string | null;
  category: string;
  category_confidence: string;
  note: string | null;
  date: string;
  source: string;
  receipt_image_uri: string | null;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExpense(row: Row): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    currency: row.currency as Expense["currency"],
    merchant: row.merchant,
    category: row.category as Expense["category"],
    categoryConfidence: row.category_confidence as Expense["categoryConfidence"],
    note: row.note,
    date: row.date,
    source: row.source as Expense["source"],
    receiptImageUri: row.receipt_image_uri,
    referenceNumber: row.reference_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function expenseToRow(expense: Expense): Omit<Row, "created_at"> & { created_at?: string } {
  return {
    id: expense.id,
    user_id: expense.userId,
    amount: expense.amount,
    currency: expense.currency,
    merchant: expense.merchant,
    category: expense.category,
    category_confidence: expense.categoryConfidence,
    note: expense.note,
    date: expense.date,
    source: expense.source,
    receipt_image_uri: expense.receiptImageUri,
    reference_number: expense.referenceNumber,
    updated_at: expense.updatedAt,
  };
}

export class SupabaseExpenseRepository implements ExpenseRepository {
  async create(expense: Expense): Promise<Expense> {
    const { error } = await getSupabase()
      .from("expenses")
      .insert({ ...expenseToRow(expense), created_at: expense.createdAt });
    if (error) throw error;
    return expense;
  }

  async update(expense: Expense): Promise<Expense> {
    const { error } = await getSupabase()
      .from("expenses")
      .update(expenseToRow(expense))
      .eq("id", expense.id)
      .eq("user_id", expense.userId);
    if (error) throw error;
    return expense;
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await getSupabase()
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async getById(id: string, userId: string): Promise<Expense | null> {
    const { data, error } = await getSupabase()
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToExpense(data as Row) : null;
  }

  async listForUser(userId: string): Promise<Expense[]> {
    const { data, error } = await getSupabase()
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map(rowToExpense);
  }

  async listForMonth(userId: string, yearMonth: string): Promise<Expense[]> {
    const { data, error } = await getSupabase()
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .gte("date", `${yearMonth}-01`)
      .lt("date", nextMonth(yearMonth))
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map(rowToExpense);
  }
}

function nextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, 1)); // m is already 1-based -> next month
  return next.toISOString().slice(0, 10);
}
