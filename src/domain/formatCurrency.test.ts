import { formatINR } from "./formatCurrency";

describe("formatINR", () => {
  it("uses Indian digit grouping, not Western", () => {
    // ₹1,29,900 — grouping by 2s after the first 3, the whole point of this util.
    expect(formatINR(129900).replace(/\s/g, "")).toBe("₹1,29,900");
  });

  it("formats small amounts without grouping", () => {
    expect(formatINR(45).replace(/\s/g, "")).toBe("₹45");
  });

  it("rounds to whole rupees", () => {
    expect(formatINR(299.5).replace(/\s/g, "")).toBe("₹300");
  });

  it("handles zero", () => {
    expect(formatINR(0).replace(/\s/g, "")).toBe("₹0");
  });

  it("groups lakhs correctly", () => {
    expect(formatINR(1000000).replace(/\s/g, "")).toBe("₹10,00,000");
  });
});
