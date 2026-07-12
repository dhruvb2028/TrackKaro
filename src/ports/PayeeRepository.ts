import { Payee } from "../domain/models";

export interface PayeeRepository {
  save(payee: Payee): Promise<Payee>;
  listForUser(userId: string): Promise<Payee[]>;
  getByVpa(userId: string, vpa: string): Promise<Payee | null>;
}
