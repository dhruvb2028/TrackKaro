import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("trackkaro.db").then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          merchant TEXT,
          category TEXT NOT NULL,
          categoryConfidence TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL,
          source TEXT NOT NULL,
          receiptImageUri TEXT,
          referenceNumber TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS payees (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          vpa TEXT NOT NULL,
          displayName TEXT NOT NULL,
          lastUsedCategory TEXT
        );
        CREATE TABLE IF NOT EXISTS category_overrides (
          userId TEXT NOT NULL,
          merchantKey TEXT NOT NULL,
          category TEXT NOT NULL,
          PRIMARY KEY (userId, merchantKey)
        );
        CREATE TABLE IF NOT EXISTS rate_limits (
          identityKey TEXT NOT NULL,
          action TEXT NOT NULL,
          day TEXT NOT NULL,
          count INTEGER NOT NULL,
          PRIMARY KEY (identityKey, action, day)
        );
      `);
      return db;
    });
  }
  return dbPromise;
}
