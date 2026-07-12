/**
 * Bank statement narrations rarely contain a clean merchant name. Pull out
 * whatever signal exists — a UPI VPA handle, a POS merchant string, or an
 * NEFT/IMPS beneficiary — for fuzzy matching against the merchant table.
 * Returns null when the row is a pure transfer with no merchant behind it.
 */
export function extractMerchantSignal(narration: string): string | null {
  // UPI VPA, e.g. swiggy@icici -> "swiggy"
  const vpa = narration.match(/([a-z0-9._-]+)@[a-z]+/i);
  if (vpa) {
    const handle = vpa[1];
    // Generic person handles (names/numbers) aren't merchants.
    if (/^\d+$/.test(handle)) return null;
    return handle;
  }

  // POS merchant, e.g. "POS 442156 AMAZON BANGALORE IN" -> "AMAZON"
  const pos = narration.match(/POS\s+\d+\s+([A-Z][A-Z ]+?)(?:\s+[A-Z]{2}\s*$|\s{2,}|$)/);
  if (pos) {
    return pos[1].trim().split(/\s+/)[0];
  }

  // NEFT/IMPS beneficiary, e.g. "NEFT/HDFC/EMI HOME LOAN" -> "EMI HOME LOAN"
  const neft = narration.match(/\b(?:NEFT|IMPS)\/[^/]+\/(.+)$/i);
  if (neft) {
    return neft[1].trim();
  }

  return null;
}

export function isPureTransfer(narration: string): boolean {
  return /\b(sent to|transfer|received from|p2p)\b/i.test(narration);
}
