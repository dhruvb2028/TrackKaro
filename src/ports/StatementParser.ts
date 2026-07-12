export interface ParsedTransaction {
  date: string; // ISO date
  amount: number; // debit amount, positive
  narration: string;
  referenceNumber: string | null;
}

export type StatementParseResult =
  | { status: "ok"; transactions: ParsedTransaction[] }
  | { status: "password_required" }
  | { status: "unsupported"; reason: string };

export interface StatementParser {
  parse(
    fileUri: string,
    mimeType: string | null,
    fileName: string,
    password?: string
  ): Promise<StatementParseResult>;
}
