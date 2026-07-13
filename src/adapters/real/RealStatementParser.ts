import { File } from "expo-file-system";
import * as XLSX from "xlsx";
import { StatementParser, StatementParseResult } from "../../ports/StatementParser";
import { parseCsv, detectColumns, rowsToTransactions } from "../../domain/statementCsv";

function isPdf(mimeType: string | null, fileName: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

function isExcel(mimeType: string | null, fileName: string): boolean {
  return (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    /\.xlsx?$/i.test(fileName)
  );
}

function rowsFromCsvText(text: string): string[][] {
  return parseCsv(text);
}

function rowsFromWorkbook(bytes: Uint8Array): string[][] {
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  return raw.map((row) => row.map((cell) => String(cell ?? "")));
}

/**
 * Real rules-based statement parsing (PRD §8.3) for CSV and Excel exports —
 * a fuzzy header matcher (src/domain/statementCsv.ts) handles the header
 * naming variation across Indian banks/UPI apps without hardcoding one
 * bank's exact column names.
 *
 * PDF is intentionally NOT parsed here: real text extraction from a
 * (possibly password-protected) PDF needs either a native module or
 * server-side processing, out of scope for this pass. Returning
 * "unsupported" is the honest behavior — no fake password-prompt flow for
 * a capability that doesn't exist yet.
 */
export class RealStatementParser implements StatementParser {
  async parse(
    fileUri: string,
    mimeType: string | null,
    fileName: string,
    _password?: string
  ): Promise<StatementParseResult> {
    if (isPdf(mimeType, fileName)) {
      return {
        status: "unsupported",
        reason: "PDF statements aren't supported yet — please export as CSV or Excel instead.",
      };
    }

    const file = new File(fileUri);
    let rows: string[][];
    try {
      rows = isExcel(mimeType, fileName)
        ? rowsFromWorkbook(file.bytesSync())
        : rowsFromCsvText(file.textSync());
    } catch {
      return { status: "unsupported", reason: "Couldn't read this file. Try a CSV or Excel export instead." };
    }

    const detected = detectColumns(rows);
    if (!detected) {
      return {
        status: "unsupported",
        reason: "Couldn't recognize this statement's columns. Try a CSV or Excel export from your bank/UPI app.",
      };
    }

    const transactions = rowsToTransactions(rows, detected.headerRowIndex, detected.columns);
    return { status: "ok", transactions };
  }
}
