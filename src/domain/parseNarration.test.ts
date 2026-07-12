import { extractMerchantSignal, isPureTransfer } from "./parseNarration";

describe("extractMerchantSignal", () => {
  it("pulls the handle from a UPI VPA", () => {
    expect(extractMerchantSignal("UPI/406712345678/Payment/swiggy@icici/YESB0001")).toBe("swiggy");
  });

  it("pulls the merchant from a POS line", () => {
    expect(extractMerchantSignal("POS 442156 AMAZON BANGALORE IN")).toBe("AMAZON");
  });

  it("pulls the beneficiary from an NEFT line", () => {
    expect(extractMerchantSignal("NEFT/HDFC/EMI HOME LOAN")).toBe("EMI HOME LOAN");
  });

  it("returns null for a numeric-only VPA handle", () => {
    expect(extractMerchantSignal("UPI/999/9876543210@paytm")).toBeNull();
  });

  it("returns null when there is no merchant signal", () => {
    expect(extractMerchantSignal("ATM WITHDRAWAL")).toBeNull();
  });
});

describe("isPureTransfer", () => {
  it("detects a sent-to transfer", () => {
    expect(isPureTransfer("UPI/301122334455/Sent to/rahul@okhdfc/transfer")).toBe(true);
  });

  it("is false for a normal merchant payment", () => {
    expect(isPureTransfer("POS 442156 AMAZON BANGALORE IN")).toBe(false);
  });
});
