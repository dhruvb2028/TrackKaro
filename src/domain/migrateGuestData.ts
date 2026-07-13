import { container, localOnly } from "../adapters/container";
import { newId } from "./id";

/**
 * One-time step on sign-up (PRD §9): moves everything a guest built up
 * locally into the new account. Must run after the Supabase session is
 * already active, since container.expenseRepository/payeeRepository route
 * to the real backend only once hasActiveSupabaseSession() is true.
 *
 * Category overrides intentionally don't migrate — the port only supports
 * point lookups, not "list all for a user" (CategoryOverrideRepository has
 * no listForUser). This is an accepted v1 gap: overrides are cheap to
 * relearn (one re-categorization per merchant) and not worth widening the
 * interface for.
 */
export async function migrateGuestData(guestUserId: string, newUserId: string): Promise<void> {
  const [expenses, payees] = await Promise.all([
    localOnly.expenseRepository.listForUser(guestUserId),
    localOnly.payeeRepository.listForUser(guestUserId),
  ]);

  for (const expense of expenses) {
    await container.expenseRepository.create({ ...expense, userId: newUserId });
  }
  for (const payee of payees) {
    await container.payeeRepository.save({ ...payee, id: newId(), userId: newUserId });
  }
}
