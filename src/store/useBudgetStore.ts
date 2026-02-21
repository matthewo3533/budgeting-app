import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BankTransaction, CategoryId, CategorizedTransaction, CustomCategory } from "@/types/transaction";
import { CATEGORY_COLORS } from "@/types/transaction";

type AppStep = "upload" | "categorize" | "dashboard";

interface LastExcludeBatch {
  phrase: string;
  ids: string[];
}

interface BudgetState {
  step: AppStep;
  transactions: BankTransaction[];
  categories: Record<string, CategoryId>;
  excludedIds: Record<string, true>;
  lastExcludedBatch: LastExcludeBatch | null;
  dateRange: { start: string; end: string };
  customCategories: CustomCategory[];
  setStep: (step: AppStep) => void;
  setTransactions: (tx: BankTransaction[]) => void;
  setCategory: (txId: string, category: CategoryId) => void;
  setCategoryForIds: (ids: string[], category: CategoryId) => void;
  setDateRange: (start: string, end: string) => void;
  excludeByIds: (ids: string[], phrase: string) => void;
  unexcludeIds: (ids: string[]) => void;
  undoLastExclude: () => void;
  addCustomCategory: (label: string, type: "expense" | "income") => CategoryId;
  removeCustomCategory: (id: string) => void;
  reset: () => void;
  getCategorized: () => CategorizedTransaction[];
}

const initialState = {
  step: "upload" as AppStep,
  transactions: [] as BankTransaction[],
  categories: {} as Record<string, CategoryId>,
  excludedIds: {} as Record<string, true>,
  lastExcludedBatch: null as LastExcludeBatch | null,
  dateRange: { start: "", end: "" },
  customCategories: [] as CustomCategory[],
};

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      setTransactions: (transactions) => {
        const start = transactions.length
          ? transactions.reduce(
              (min, t) => (t.transactionDate < min ? t.transactionDate : min),
              transactions[0].transactionDate
            )
          : "";
        const end = transactions.length
          ? transactions.reduce(
              (max, t) => (t.transactionDate > max ? t.transactionDate : max),
              transactions[0].transactionDate
            )
          : "";
        set({
          transactions,
          categories: {},
          excludedIds: {},
          lastExcludedBatch: null,
          dateRange: { start, end },
          step: transactions.length ? "categorize" : "upload",
        });
      },

      setCategory: (txId, category) =>
        set((s) => ({
          categories: { ...s.categories, [txId]: category },
        })),

      setCategoryForIds: (ids, category) =>
        set((s) => {
          const next = { ...s.categories };
          ids.forEach((id) => (next[id] = category));
          return { categories: next };
        }),

      setDateRange: (start, end) => set({ dateRange: { start, end } }),

      excludeByIds: (ids, phrase) =>
        set((s) => {
          const next: Record<string, true> = { ...s.excludedIds };
          ids.forEach((id) => (next[id] = true));
          return {
            excludedIds: next,
            lastExcludedBatch: { phrase, ids: [...ids] },
          };
        }),

      unexcludeIds: (ids) =>
        set((s) => {
          const next = { ...s.excludedIds };
          ids.forEach((id) => delete next[id]);
          return { excludedIds: next, lastExcludedBatch: null };
        }),

      undoLastExclude: () => {
        const { lastExcludedBatch } = get();
        if (!lastExcludedBatch) return;
        get().unexcludeIds(lastExcludedBatch.ids);
      },

      addCustomCategory: (label, type) => {
        const id = `custom_${crypto.randomUUID()}`;
        const custom = get().customCategories;
        const color = CATEGORY_COLORS[(custom.length) % CATEGORY_COLORS.length];
        set({ customCategories: [...custom, { id, label: label.trim() || "New category", type, color }] });
        return id;
      },

      removeCustomCategory: (id) => {
        set((s) => ({
          customCategories: s.customCategories.filter((c) => c.id !== id),
          categories: Object.fromEntries(
            Object.entries(s.categories).filter(([, cat]) => cat !== id)
          ),
        }));
      },

      reset: () => set(initialState),

      getCategorized: () => {
        const { transactions, categories, excludedIds } = get();
        return transactions
          .filter((t) => !excludedIds[t.id])
          .map((t) => ({
            ...t,
            category: categories[t.id] ?? "uncategorized",
          }));
      },
    }),
    {
      name: "budget-tracker-storage",
      partialize: (state) => ({
        step: state.step,
        transactions: state.transactions,
        categories: state.categories,
        excludedIds: state.excludedIds,
        lastExcludedBatch: state.lastExcludedBatch,
        dateRange: state.dateRange,
        customCategories: state.customCategories,
      }),
    }
  )
);
