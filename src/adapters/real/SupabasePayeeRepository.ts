import { PayeeRepository } from "../../ports/PayeeRepository";
import { Payee } from "../../domain/models";
import { getSupabase } from "./supabaseClient";

interface Row {
  id: string;
  user_id: string;
  vpa: string;
  display_name: string;
  last_used_category: string | null;
}

function rowToPayee(row: Row): Payee {
  return {
    id: row.id,
    userId: row.user_id,
    vpa: row.vpa,
    displayName: row.display_name,
    lastUsedCategory: row.last_used_category as Payee["lastUsedCategory"],
  };
}

export class SupabasePayeeRepository implements PayeeRepository {
  async save(payee: Payee): Promise<Payee> {
    const { error } = await getSupabase().from("payees").upsert(
      {
        id: payee.id,
        user_id: payee.userId,
        vpa: payee.vpa,
        display_name: payee.displayName,
        last_used_category: payee.lastUsedCategory,
      },
      { onConflict: "user_id,vpa" }
    );
    if (error) throw error;
    return payee;
  }

  async listForUser(userId: string): Promise<Payee[]> {
    const { data, error } = await getSupabase()
      .from("payees")
      .select("*")
      .eq("user_id", userId)
      .order("display_name", { ascending: true });
    if (error) throw error;
    return (data as Row[]).map(rowToPayee);
  }

  async getByVpa(userId: string, vpa: string): Promise<Payee | null> {
    const { data, error } = await getSupabase()
      .from("payees")
      .select("*")
      .eq("user_id", userId)
      .eq("vpa", vpa)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToPayee(data as Row) : null;
  }
}
