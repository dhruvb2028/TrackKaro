import { categorize } from "./categorize";
import { CategoryOverrideRepository } from "../ports/CategoryOverrideRepository";
import { CategoryOverride, ExpenseCategory } from "./models";

const noOverrides: CategoryOverrideRepository = {
  get: async () => null,
  set: async () => {},
};

function overrideOf(category: ExpenseCategory): CategoryOverrideRepository {
  return {
    get: async (userId, merchantKey): Promise<CategoryOverride> => ({ userId, merchantKey, category }),
    set: async () => {},
  };
}

describe("categorize", () => {
  it("maps a known merchant to its default category", async () => {
    const r = await categorize("u", "Swiggy", noOverrides);
    expect(r).toEqual({ category: "food", confidence: "default" });
  });

  it("detects EMI/loan narrations", async () => {
    const r = await categorize("u", "EMI HOME LOAN", noOverrides);
    expect(r.category).toBe("emi");
  });

  it("falls back to other for an unknown merchant", async () => {
    const r = await categorize("u", "SomeRandomShop", noOverrides);
    expect(r).toEqual({ category: "other", confidence: "other" });
  });

  it("returns other for a null merchant", async () => {
    const r = await categorize("u", null, noOverrides);
    expect(r).toEqual({ category: "other", confidence: "other" });
  });

  it("prefers a per-user override over the default table", async () => {
    const r = await categorize("u", "Swiggy", overrideOf("bills"));
    expect(r).toEqual({ category: "bills", confidence: "override" });
  });
});
