import {
  StatementParser,
  StatementParseResult,
  ParsedTransaction,
} from "../../ports/StatementParser";

function isPdf(mimeType: string | null, fileName: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

/**
 * Placeholder parser until a real one is wired up (rules-based per bank +
 * AI fallback, per PRD §8.3). Returns a fixed, realistic set of Indian
 * bank-statement rows so the import → dedup → review pipeline can be built
 * and tested. PDFs are treated as password-protected (as real Indian bank
 * statements almost always are) to exercise the password-prompt flow.
 */
export class MockStatementParser implements StatementParser {
  async parse(
    _fileUri: string,
    mimeType: string | null,
    fileName: string,
    password?: string
  ): Promise<StatementParseResult> {
    if (isPdf(mimeType, fileName) && !password) {
      return { status: "password_required" };
    }
    return { status: "ok", transactions: SAMPLE };
  }
}

const SAMPLE: ParsedTransaction[] = [
  {
    date: monthDay(2),
    amount: 480,
    narration: "UPI/406712345678/Payment/swiggy@icici/YESB0001",
    referenceNumber: "406712345678",
  },
  {
    date: monthDay(4),
    amount: 1299,
    narration: "POS 442156 AMAZON BANGALORE IN",
    referenceNumber: "P442156",
  },
  {
    date: monthDay(7),
    amount: 5000,
    narration: "NEFT/HDFC/EMI HOME LOAN",
    referenceNumber: "N778812",
  },
  {
    date: monthDay(9),
    amount: 2000,
    narration: "UPI/301122334455/Sent to/rahul@okhdfc/transfer",
    referenceNumber: "301122334455",
  },
  {
    date: monthDay(12),
    amount: 150,
    narration: "UPI/509988776655/Payment/unknownvendor@ybl",
    referenceNumber: "509988776655",
  },
];

/** Builds an ISO date in the current month on the given day. */
function monthDay(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
