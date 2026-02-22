export interface BankTransaction {
  id: string;
  accountNumber: string;
  effectiveDate: string;
  transactionDate: string;
  description: string;
  transactionCode: string;
  particulars: string;
  code: string;
  reference: string;
  otherPartyName: string;
  otherPartyAccountNumber: string;
  otherPartyParticulars: string;
  otherPartyCode: string;
  otherPartyReference: string;
  amount: number;
  balance: number;
}

/** Built-in expense category ids. */
export type BuiltInExpenseId =
  | "rent"
  | "utilities"
  | "subscriptions"
  | "groceries"
  | "dining"
  | "transport"
  | "petrol"
  | "healthcare"
  | "insurance"
  | "loans"
  | "buy_now_pay_later"
  | "shopping"
  | "leisure"
  | "self_employment_costs"
  | "gifts_donations"
  | "education"
  | "personal_care"
  | "savings_transfer"
  | "other";

/** Built-in income category ids. */
export type BuiltInIncomeId =
  | "income_employment"
  | "income_self_employment"
  | "income_investments"
  | "income_rent"
  | "income_government"
  | "income_other";

/** Any category id: built-in or custom (custom_<uuid>). */
export type CategoryId = BuiltInExpenseId | BuiltInIncomeId | "uncategorized" | (string & {});

export interface CustomCategory {
  id: string;
  label: string;
  type: "expense" | "income";
  color: string;
}

export const EXPENSE_CATEGORY_IDS: BuiltInExpenseId[] = [
  "rent",
  "utilities",
  "subscriptions",
  "groceries",
  "dining",
  "transport",
  "petrol",
  "healthcare",
  "insurance",
  "loans",
  "buy_now_pay_later",
  "shopping",
  "leisure",
  "self_employment_costs",
  "gifts_donations",
  "education",
  "personal_care",
  "savings_transfer",
  "other",
];

export const INCOME_CATEGORY_IDS: BuiltInIncomeId[] = [
  "income_employment",
  "income_self_employment",
  "income_investments",
  "income_rent",
  "income_government",
  "income_other",
];

export const CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent & mortgage",
  utilities: "Utilities",
  subscriptions: "Subscriptions",
  groceries: "Groceries",
  dining: "Dining & takeout",
  takeout: "Dining & takeout", // legacy id
  transport: "Transport",
  petrol: "Petrol",
  healthcare: "Healthcare",
  insurance: "Insurance",
  loans: "Loans & debt",
  buy_now_pay_later: "Buy now pay later",
  shopping: "Shopping",
  leisure: "Leisure & entertainment",
  self_employment_costs: "Self employment costs",
  gifts_donations: "Gifts & donations",
  education: "Education",
  personal_care: "Personal care",
  savings_transfer: "Savings & transfers",
  other: "Other",
  uncategorized: "Uncategorized",
  income_employment: "Employment",
  income_self_employment: "Self employment",
  income_investments: "Investments",
  income_rent: "Rent (property)",
  income_government: "Government & benefits",
  income_other: "Other",
};

/** Palette for built-in and custom category colors. */
export const CATEGORY_COLORS = [
  "#2c6e49", "#4c956c", "#3d5a80", "#6a4c93", "#d68c45", "#e07a5f",
  "#95d5b2", "#f4a261", "#ffc9b9", "#74c69d", "#b5838d", "#457b9d",
];

export function isIncomeCategory(cat: CategoryId): boolean {
  return typeof cat === "string" && cat.startsWith("income_");
}
export function isExpenseCategory(cat: CategoryId): boolean {
  return typeof cat === "string" && cat !== "uncategorized" && !cat.startsWith("income_");
}

export function isIncomeCategoryBucket(cat: CategoryId): boolean {
  return typeof cat === "string" && cat.startsWith("income_");
}

/** Resolve label for any category id (built-in or custom). */
export function getCategoryLabel(id: CategoryId, customCategories: CustomCategory[] = []): string {
  const builtIn = CATEGORY_LABELS[id as keyof typeof CATEGORY_LABELS];
  if (builtIn) return builtIn;
  const custom = customCategories.find((c) => c.id === id);
  return custom?.label ?? String(id);
}

/** Resolve color for any category id. */
export function getCategoryColor(id: CategoryId, customCategories: CustomCategory[] = []): string {
  const custom = customCategories.find((c) => c.id === id);
  if (custom) return custom.color;
  const idx = [...EXPENSE_CATEGORY_IDS, ...INCOME_CATEGORY_IDS].indexOf(id as never);
  if (idx >= 0) return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  return CATEGORY_COLORS[0];
}

/** All expense category ids (built-in + custom). */
export function getExpenseCategoryIds(customCategories: CustomCategory[]): CategoryId[] {
  const custom = customCategories.filter((c) => c.type === "expense").map((c) => c.id);
  return [...EXPENSE_CATEGORY_IDS, ...custom];
}

/** All income category ids (built-in + custom). */
export function getIncomeCategoryIds(customCategories: CustomCategory[]): CategoryId[] {
  const custom = customCategories.filter((c) => c.type === "income").map((c) => c.id);
  return [...INCOME_CATEGORY_IDS, ...custom];
}

export interface CategorizedTransaction extends BankTransaction {
  category: CategoryId;
}
