import { ExpenseRepository } from "../../ports/ExpenseRepository";
import { Expense } from "../../domain/models";
import { hasActiveSupabaseSession } from "../real/supabaseClient";

/**
 * Guests (no Supabase session) always stay on local storage; a signed-in
 * user's calls route to the real backend. Screens never see this — they
 * still just call container.expenseRepository (PRD §9.1 payoff).
 */
export class RoutingExpenseRepository implements ExpenseRepository {
  constructor(
    private readonly local: ExpenseRepository,
    private readonly remote: ExpenseRepository | null
  ) {}

  private async active(): Promise<ExpenseRepository> {
    if (this.remote && (await hasActiveSupabaseSession())) return this.remote;
    return this.local;
  }

  async create(expense: Expense): Promise<Expense> {
    return (await this.active()).create(expense);
  }

  async update(expense: Expense): Promise<Expense> {
    return (await this.active()).update(expense);
  }

  async delete(id: string, userId: string): Promise<void> {
    return (await this.active()).delete(id, userId);
  }

  async getById(id: string, userId: string): Promise<Expense | null> {
    return (await this.active()).getById(id, userId);
  }

  async listForUser(userId: string): Promise<Expense[]> {
    return (await this.active()).listForUser(userId);
  }

  async listForMonth(userId: string, yearMonth: string): Promise<Expense[]> {
    return (await this.active()).listForMonth(userId, yearMonth);
  }
}
