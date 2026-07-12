import { ExpenseCategory } from "./models";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Food",
  travel: "Travel",
  shopping: "Shopping",
  bills: "Bills",
  emi: "EMI / Loan",
  family_transfer: "Family Transfer",
  other: "Other",
};

export const ALL_CATEGORIES: ExpenseCategory[] = [
  "food",
  "travel",
  "shopping",
  "bills",
  "emi",
  "family_transfer",
  "other",
];
