import { CategoryOverrideRepository } from "../../ports/CategoryOverrideRepository";
import { CategoryOverride, ExpenseCategory } from "../../domain/models";
import { getSupabase } from "./supabaseClient";

export class SupabaseCategoryOverrideRepository implements CategoryOverrideRepository {
  async set(userId: string, merchantKey: string, category: ExpenseCategory): Promise<void> {
    const { error } = await getSupabase()
      .from("category_overrides")
      .upsert(
        { user_id: userId, merchant_key: merchantKey, category },
        { onConflict: "user_id,merchant_key" }
      );
    if (error) throw error;
  }

  async get(userId: string, merchantKey: string): Promise<CategoryOverride | null> {
    const { data, error } = await getSupabase()
      .from("category_overrides")
      .select("*")
      .eq("user_id", userId)
      .eq("merchant_key", merchantKey)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      userId: data.user_id,
      merchantKey: data.merchant_key,
      category: data.category as ExpenseCategory,
    };
  }
}
