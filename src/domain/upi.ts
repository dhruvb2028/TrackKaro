export interface UpiPaymentRequest {
  vpa: string;
  payeeName: string;
  amount: number;
  note?: string | null;
}

/**
 * Builds a standard UPI deep link. The OS shows an app chooser of installed
 * UPI apps (PhonePe/GPay/Paytm/…) with the fields pre-filled; the user
 * authorizes inside that app. This app never touches funds or credentials
 * (PRD §4.7).
 */
export function buildUpiUri(req: UpiPaymentRequest): string {
  const params = new URLSearchParams({
    pa: req.vpa,
    pn: req.payeeName,
    am: req.amount.toFixed(2),
    cu: "INR",
  });
  if (req.note) {
    params.set("tn", req.note);
  }
  return `upi://pay?${params.toString()}`;
}

const VPA_PATTERN = /^[a-z0-9.\-_]{2,256}@[a-z]{2,64}$/i;

export function isValidVpa(vpa: string): boolean {
  return VPA_PATTERN.test(vpa.trim());
}
