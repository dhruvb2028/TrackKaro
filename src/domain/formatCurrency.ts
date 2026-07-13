/**
 * Single place for rupee formatting (skill: use Intl for currency, don't
 * scatter toFixed). Indian digit grouping is not the same as Western —
 * ₹1,29,900, not ₹129,900 — so `.toFixed()` was both wrong and duplicated.
 *
 * Intl is created lazily inside a try/catch and never at module scope: if
 * a given Hermes build lacks the en-IN/currency data, this degrades to a
 * pure-JS fallback instead of crashing the app at import (the failure mode
 * that the pdf.js DOMMatrix issue taught us to guard against).
 */
let formatter: Intl.NumberFormat | null | undefined;

function getFormatter(): Intl.NumberFormat | null {
  if (formatter === undefined) {
    try {
      formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });
    } catch {
      formatter = null;
    }
  }
  return formatter;
}

/** Pure-JS Indian-grouping fallback (no Intl dependency). */
function manualINR(amount: number): string {
  const rounded = Math.round(Math.abs(amount)).toString();
  let grouped = rounded;
  if (rounded.length > 3) {
    const last3 = rounded.slice(-3);
    const rest = rounded.slice(0, -3);
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  return (amount < 0 ? "-₹" : "₹") + grouped;
}

/** Formats a rupee amount as e.g. "₹1,29,900" (Indian grouping, no decimals). */
export function formatINR(amount: number): string {
  const f = getFormatter();
  if (f) {
    try {
      return f.format(Math.round(amount));
    } catch {
      // fall through
    }
  }
  return manualINR(amount);
}
