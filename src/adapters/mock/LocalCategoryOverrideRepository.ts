import { CategoryOverrideRepository } from "../../ports/CategoryOverrideRepository";
import { CategoryOverride, ExpenseCategory } from "../../domain/models";
import { getDb } from "./db";

export class LocalCategoryOverrideRepository implements CategoryOverrideRepository {
  async set(userId: string, merchantKey: string, category: ExpenseCategory): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO category_overrides (userId, merchantKey, category) VALUES (?, ?, ?)
       ON CONFLICT(userId, merchantKey) DO UPDATE SET category = excluded.category`,
      [userId, merchantKey, category]
    );
  }

  async get(userId: string, merchantKey: string): Promise<CategoryOverride | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<CategoryOverride>(
      `SELECT userId, merchantKey, category FROM category_overrides WHERE userId=? AND merchantKey=?`,
      [userId, merchantKey]
    );
    return row ?? null;
  }
}
