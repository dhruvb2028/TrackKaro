import { ExpenseRepository } from "../../ports/ExpenseRepository";
import { Expense } from "../../domain/models";
import { getDb } from "./db";

function rowToExpense(row: any): Expense {
  return {
    id: row.id,
    userId: row.userId,
    amount: row.amount,
    currency: row.currency,
    merchant: row.merchant,
    category: row.category,
    categoryConfidence: row.categoryConfidence,
    note: row.note,
    date: row.date,
    source: row.source,
    receiptImageUri: row.receiptImageUri,
    referenceNumber: row.referenceNumber,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class LocalExpenseRepository implements ExpenseRepository {
  async create(expense: Expense): Promise<Expense> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO expenses (id, userId, amount, currency, merchant, category, categoryConfidence, note, date, source, receiptImageUri, referenceNumber, createdAt, updatedAt)
       VALUES ($id, $userId, $amount, $currency, $merchant, $category, $categoryConfidence, $note, $date, $source, $receiptImageUri, $referenceNumber, $createdAt, $updatedAt)`,
      {
        $id: expense.id,
        $userId: expense.userId,
        $amount: expense.amount,
        $currency: expense.currency,
        $merchant: expense.merchant,
        $category: expense.category,
        $categoryConfidence: expense.categoryConfidence,
        $note: expense.note,
        $date: expense.date,
        $source: expense.source,
        $receiptImageUri: expense.receiptImageUri,
        $referenceNumber: expense.referenceNumber,
        $createdAt: expense.createdAt,
        $updatedAt: expense.updatedAt,
      }
    );
    return expense;
  }

  async update(expense: Expense): Promise<Expense> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE expenses SET amount=$amount, merchant=$merchant, category=$category, categoryConfidence=$categoryConfidence,
       note=$note, date=$date, updatedAt=$updatedAt WHERE id=$id AND userId=$userId`,
      {
        $id: expense.id,
        $userId: expense.userId,
        $amount: expense.amount,
        $merchant: expense.merchant,
        $category: expense.category,
        $categoryConfidence: expense.categoryConfidence,
        $note: expense.note,
        $date: expense.date,
        $updatedAt: expense.updatedAt,
      }
    );
    return expense;
  }

  async delete(id: string, userId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM expenses WHERE id=? AND userId=?`, [id, userId]);
  }

  async getById(id: string, userId: string): Promise<Expense | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM expenses WHERE id=? AND userId=?`,
      [id, userId]
    );
    return row ? rowToExpense(row) : null;
  }

  async listForUser(userId: string): Promise<Expense[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM expenses WHERE userId=? ORDER BY date DESC, createdAt DESC`,
      [userId]
    );
    return rows.map(rowToExpense);
  }

  async listForMonth(userId: string, yearMonth: string): Promise<Expense[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM expenses WHERE userId=? AND date LIKE ? ORDER BY date DESC, createdAt DESC`,
      [userId, `${yearMonth}%`]
    );
    return rows.map(rowToExpense);
  }
}
