import { useMemo } from "react";
import { useBudgetStore } from "@/store/useBudgetStore";
import {
  getExpenseCategoryIds,
  getIncomeCategoryIds,
  getCategoryLabel as getLabel,
  getCategoryColor as getColor,
  type CategoryId,
} from "@/types/transaction";

export function useCategories() {
  const customCategories = useBudgetStore((s) => s.customCategories);
  const expenseIds = useMemo(() => getExpenseCategoryIds(customCategories), [customCategories]);
  const incomeIds = useMemo(() => getIncomeCategoryIds(customCategories), [customCategories]);
  const getCategoryLabel = (id: CategoryId) => getLabel(id, customCategories);
  const getCategoryColor = (id: CategoryId) => getColor(id, customCategories);
  return {
    expenseIds,
    incomeIds,
    customCategories,
    getCategoryLabel,
    getCategoryColor,
  };
}
