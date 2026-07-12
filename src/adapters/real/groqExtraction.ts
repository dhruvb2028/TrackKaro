import { ExtractedFields } from "../../domain/models";

export const EXTRACTION_SYSTEM_PROMPT =
  "You extract structured expense data from receipts and bank transaction text. " +
  "Reply with ONLY a JSON object, no prose, no code fences. " +
  'Shape: {"merchant": string|null, "date": string|null, "amount": number|null}. ' +
  "date must be ISO format YYYY-MM-DD or null. amount is the total in rupees as a " +
  "number (no currency symbol) or null. merchant is the business name or null.";

export const IMAGE_USER_PROMPT =
  "Extract the merchant, date, and total amount from this receipt.";

export function textUserPrompt(narration: string): string {
  return `Extract the merchant, date, and amount from this bank statement line:\n${narration}`;
}

interface RawExtraction {
  merchant?: unknown;
  date?: unknown;
  amount?: unknown;
}

/**
 * Parses the model's reply into ExtractedFields. Tolerates code fences or
 * surrounding prose by pulling out the first JSON object. Confidence is
 * "high" only when a usable amount was extracted — otherwise callers fall
 * back to manual entry rather than trusting a blank guess.
 */
export function parseExtractionResponse(content: string): ExtractedFields {
  const empty: ExtractedFields = {
    merchant: null,
    date: null,
    amount: null,
    confidence: "low",
  };

  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return empty;

  let raw: RawExtraction;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return empty;
  }

  const merchant =
    typeof raw.merchant === "string" && raw.merchant.trim() ? raw.merchant.trim() : null;

  const date =
    typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null;

  let amount: number | null = null;
  if (typeof raw.amount === "number" && isFinite(raw.amount) && raw.amount > 0) {
    amount = raw.amount;
  } else if (typeof raw.amount === "string") {
    const n = parseFloat(raw.amount.replace(/[^0-9.]/g, ""));
    if (isFinite(n) && n > 0) amount = n;
  }

  return {
    merchant,
    date,
    amount,
    confidence: amount !== null ? "high" : "low",
  };
}

export function dataUri(base64: string, mimeType = "image/jpeg"): string {
  return `data:${mimeType};base64,${base64}`;
}
