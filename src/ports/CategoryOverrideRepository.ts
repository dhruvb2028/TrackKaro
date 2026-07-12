import { CategoryOverride, ExpenseCategory } from "../domain/models";

export interface CategoryOverrideRepository {
  set(userId: string, merchantKey: string, category: ExpenseCategory): Promise<void>;
  get(userId: string, merchantKey: string): Promise<CategoryOverride | null>;
}
