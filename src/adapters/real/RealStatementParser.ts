import { File } from "expo-file-system";
import * as XLSX from "xlsx";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { StatementParser, StatementParseResult } from "../../ports/StatementParser";
import { parseCsv, detectColumns, rowsToTransactions } from "../../domain/statementCsv";
import { reconstructRows, PdfTextItem } from "../../domain/statementPdfLayout";

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
 * Extracts rows from every page of a PDF. Throws pdf.js's own
 * PasswordException (name === "PasswordException") when a password is
 * missing or wrong — callers distinguish that from other failures. No
 * worker is configured, and pdf.js falls back to parsing on the calling
 * thread automatically in environments with no Worker global — verified
 * against real password-protected and plain PDFs in a plain Node.js
 * environment (no DOM/worker); see CLAUDE.md for the verification notes
 * and the one thing that verification couldn't rule out (native/Hermes
 * behavior, untested — no device/emulator available in this environment).
 */
async function rowsFromPdf(bytes: Uint8Array, password?: string): Promise<string[][]> {
  const doc = await getDocument({ data: bytes, password }).promise;
  const allRows: string[][] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item)
      .map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5] }));
    allRows.push(...reconstructRows(items));
  }

  return allRows;
}

/**
 * Real rules-based statement parsing (PRD §8.3) for CSV, Excel, and PDF
 * exports. CSV/Excel go through a fuzzy header matcher
 * (src/domain/statementCsv.ts) that handles naming variation across
 * Indian banks/UPI apps without hardcoding one bank's exact columns. PDF
 * text has no inherent row/column structure — statementPdfLayout.ts
 * reconstructs it from each word's on-page position — and the result
 * feeds through the same header-detection/row logic as CSV.
 */
export class RealStatementParser implements StatementParser {
  async parse(
    fileUri: string,
    mimeType: string | null,
    fileName: string,
    password?: string
  ): Promise<StatementParseResult> {
    const file = new File(fileUri);
    let rows: string[][];

    try {
      if (isPdf(mimeType, fileName)) {
        rows = await rowsFromPdf(file.bytesSync(), password);
      } else if (isExcel(mimeType, fileName)) {
        rows = rowsFromWorkbook(file.bytesSync());
      } else {
        rows = rowsFromCsvText(file.textSync());
      }
    } catch (e: any) {
      if (e?.name === "PasswordException") {
        return { status: "password_required" };
      }
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
