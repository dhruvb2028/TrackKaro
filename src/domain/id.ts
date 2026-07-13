import * as Crypto from "expo-crypto";

/**
 * Standard UUID v4 — required so locally-created ids are valid values for
 * Supabase's Postgres `uuid` primary key columns (a plain hex string
 * without dashes is rejected by Postgres). Used for every entity id that
 * may eventually be written to a real backend (expenses, payees).
 */
export function newId(): string {
  return Crypto.randomUUID();
}
