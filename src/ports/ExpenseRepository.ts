import { Expense } from "../domain/models";

export interface ExpenseRepository {
  create(expense: Expense): Promise<Expense>;
  update(expense: Expense): Promise<Expense>;
  delete(id: string, userId: string): Promise<void>;
  getById(id: string, userId: string): Promise<Expense | null>;
  listForUser(userId: string): Promise<Expense[]>;
  listForMonth(userId: string, yearMonth: string): Promise<Expense[]>;
}
