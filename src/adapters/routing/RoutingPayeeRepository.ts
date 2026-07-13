import { PayeeRepository } from "../../ports/PayeeRepository";
import { Payee } from "../../domain/models";
import { hasActiveSupabaseSession } from "../real/supabaseClient";

export class RoutingPayeeRepository implements PayeeRepository {
  constructor(
    private readonly local: PayeeRepository,
    private readonly remote: PayeeRepository | null
  ) {}

  private async active(): Promise<PayeeRepository> {
    if (this.remote && (await hasActiveSupabaseSession())) return this.remote;
    return this.local;
  }

  async save(payee: Payee): Promise<Payee> {
    return (await this.active()).save(payee);
  }

  async listForUser(userId: string): Promise<Payee[]> {
    return (await this.active()).listForUser(userId);
  }

  async getByVpa(userId: string, vpa: string): Promise<Payee | null> {
    return (await this.active()).getByVpa(userId, vpa);
  }
}
