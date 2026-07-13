import { ParsedTransaction } from "../ports/StatementParser";

/**
 * A real (non-quoted-comma-naive) CSV tokenizer: handles quoted fields,
 * embedded commas/newlines inside quotes, and escaped quotes (""). Bank
 * narration text routinely contains commas, so a naive split(",") would
 * silently shift columns on real statements.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }

  return rows;
}

interface ColumnMap {
  date: number;
  narration: number;
  debit: number | null;
  credit: number | null;
  amount: number | null;
  type: number | null;
  reference: number | null;
}

const HEADER_ALIASES = {
  date: ["date", "txn date", "transaction date", "value date"],
  narration: ["narration", "description", "particulars", "transaction details", "remarks", "details"],
  debit: ["debit", "withdrawal amt", "withdrawal amount", "debit amount", "dr amount"],
  credit: ["credit", "deposit amt", "deposit amount", "credit amount", "cr amount"],
  amount: ["amount"],
  type: ["type", "transaction type", "dr/cr", "cr/dr"],
  reference: ["ref no", "ref no.", "reference no", "reference number", "chq/ref no", "chq./ref.no.", "utr", "transaction id"],
};

function findColumn(header: string[], aliases: string[]): number | null {
  const normalized = header.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h === alias);
    if (idx !== -1) return idx;
  }
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h.includes(alias));
    if (idx !== -1) return idx;
  }
  return null;
}

/**
 * Locates the header row and maps its columns. Returns null if no row
 * plausibly has both a date-like and narration-like column — callers
 * should surface this as "unsupported" rather than guessing.
 */
export function detectColumns(rows: string[][]): { headerRowIndex: number; columns: ColumnMap } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const header = rows[i];
    const date = findColumn(header, HEADER_ALIASES.date);
    const narration = findColumn(header, HEADER_ALIASES.narration);
    if (date === null || narration === null) continue;

    const debit = findColumn(header, HEADER_ALIASES.debit);
    const credit = findColumn(header, HEADER_ALIASES.credit);
    const amount = findColumn(header, HEADER_ALIASES.amount);
    const type = findColumn(header, HEADER_ALIASES.type);
    const reference = findColumn(header, HEADER_ALIASES.reference);

    // Need either a debit column, or a combined amount(+type) column, to know spend direction.
    if (debit === null && amount === null) continue;

    return { headerRowIndex: i, columns: { date, narration, debit, credit, amount, type, reference } };
  }
  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isFinite(n) && n > 0 ? n : null;
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();
  // DD/MM/YYYY or DD-MM-YYYY (the common Indian statement format).
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Already ISO.
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return null;
}

function isDebitRow(cells: string[], columns: ColumnMap): boolean {
  if (columns.debit !== null) {
    return parseAmount(cells[columns.debit] ?? "") !== null;
  }
  if (columns.type !== null) {
    const type = (cells[columns.type] ?? "").trim().toLowerCase();
    return /^(dr|debit|sent|paid|withdrawal)/.test(type);
  }
  // No explicit direction signal and no separate credit column to rule it
  // out: treat a bare positive amount as a debit (conservative default —
  // matches the "assume spend, let the user correct" fallback elsewhere).
  return columns.credit === null;
}

/**
 * Rows -> expenses-only transactions (v1 scope, §8.3 — credits/refunds are
 * not tracked). A row missing a usable date or amount is silently skipped
 * rather than producing a garbage transaction.
 */
export function rowsToTransactions(rows: string[][], headerRowIndex: number, columns: ColumnMap): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells || cells.every((c) => !c.trim())) continue;

    if (!isDebitRow(cells, columns)) continue;

    const date = parseDate(cells[columns.date] ?? "");
    const amount =
      columns.debit !== null
        ? parseAmount(cells[columns.debit] ?? "")
        : parseAmount(cells[columns.amount!] ?? "");

    if (!date || amount === null) continue;

    transactions.push({
      date,
      amount,
      narration: (cells[columns.narration] ?? "").trim(),
      referenceNumber: columns.reference !== null ? (cells[columns.reference] ?? "").trim() || null : null,
    });
  }

  return transactions;
}
