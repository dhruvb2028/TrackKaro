import { PayeeRepository } from "../../ports/PayeeRepository";
import { Payee } from "../../domain/models";
import { getDb } from "./db";

function rowToPayee(row: any): Payee {
  return {
    id: row.id,
    userId: row.userId,
    vpa: row.vpa,
    displayName: row.displayName,
    lastUsedCategory: row.lastUsedCategory,
  };
}

export class LocalPayeeRepository implements PayeeRepository {
  async save(payee: Payee): Promise<Payee> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO payees (id, userId, vpa, displayName, lastUsedCategory)
       VALUES ($id, $userId, $vpa, $displayName, $lastUsedCategory)
       ON CONFLICT(id) DO UPDATE SET
         displayName = excluded.displayName,
         lastUsedCategory = excluded.lastUsedCategory`,
      {
        $id: payee.id,
        $userId: payee.userId,
        $vpa: payee.vpa,
        $displayName: payee.displayName,
        $lastUsedCategory: payee.lastUsedCategory,
      }
    );
    return payee;
  }

  async listForUser(userId: string): Promise<Payee[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM payees WHERE userId=? ORDER BY displayName COLLATE NOCASE`,
      [userId]
    );
    return rows.map(rowToPayee);
  }

  async getByVpa(userId: string, vpa: string): Promise<Payee | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM payees WHERE userId=? AND vpa=?`,
      [userId, vpa]
    );
    return row ? rowToPayee(row) : null;
  }
}
