import { RateLimiter } from "../../ports/RateLimiter";
import { getDb } from "./db";

const GUEST_DAILY_LIMIT = 20;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Guests are capped per device per day; signed-up users pass a limit high
 * enough to be a no-op in practice. Same interface/table regardless of
 * identity tier — see PRD §4.4/§8.5 for why the asymmetry exists.
 */
export class LocalRateLimiter implements RateLimiter {
  async tryConsume(identityKey: string, action: string): Promise<boolean> {
    const db = await getDb();
    const day = today();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT count FROM rate_limits WHERE identityKey=? AND action=? AND day=?`,
      [identityKey, action, day]
    );
    const count = row?.count ?? 0;
    if (count >= GUEST_DAILY_LIMIT) {
      return false;
    }
    await db.runAsync(
      `INSERT INTO rate_limits (identityKey, action, day, count) VALUES (?, ?, ?, 1)
       ON CONFLICT(identityKey, action, day) DO UPDATE SET count = count + 1`,
      [identityKey, action, day]
    );
    return true;
  }
}
