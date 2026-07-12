export type ExpenseSource = "photo" | "statement" | "manual" | "upi";

export type ExpenseCategory =
  | "food"
  | "travel"
  | "shopping"
  | "bills"
  | "emi"
  | "family_transfer"
  | "other";

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: "INR";
  merchant: string | null;
  category: ExpenseCategory;
  categoryConfidence: "user" | "override" | "ai" | "default";
  note: string | null;
  date: string; // ISO date
  source: ExpenseSource;
  receiptImageUri: string | null;
  referenceNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payee {
  id: string;
  userId: string;
  vpa: string;
  displayName: string;
  lastUsedCategory: ExpenseCategory | null;
}

export interface CategoryOverride {
  userId: string;
  merchantKey: string;
  category: ExpenseCategory;
}

export interface User {
  id: string;
  phoneNumber: string | null;
  createdAt: string;
}

export interface ExtractedFields {
  merchant: string | null;
  date: string | null;
  amount: number | null;
  confidence: "high" | "low";
}
