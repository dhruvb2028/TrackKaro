import { CategoryOverrideRepository } from "../../ports/CategoryOverrideRepository";
import { CategoryOverride, ExpenseCategory } from "../../domain/models";
import { hasActiveSupabaseSession } from "../real/supabaseClient";

export class RoutingCategoryOverrideRepository implements CategoryOverrideRepository {
  constructor(
    private readonly local: CategoryOverrideRepository,
    private readonly remote: CategoryOverrideRepository | null
  ) {}

  private async active(): Promise<CategoryOverrideRepository> {
    if (this.remote && (await hasActiveSupabaseSession())) return this.remote;
    return this.local;
  }

  async set(userId: string, merchantKey: string, category: ExpenseCategory): Promise<void> {
    return (await this.active()).set(userId, merchantKey, category);
  }

  async get(userId: string, merchantKey: string): Promise<CategoryOverride | null> {
    return (await this.active()).get(userId, merchantKey);
  }
}
