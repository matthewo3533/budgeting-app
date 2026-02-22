import { useMemo, useState, useRef, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategories } from "@/lib/useCategories";
import type { CategoryId, CategorizedTransaction } from "@/types/transaction";
import { getDisplayDescription, isSimilarDescription } from "@/lib/csvParser";
import { CategoryBucket } from "./CategoryBucket";
import { GroupSimilarPopover } from "./GroupSimilarPopover";
import { OneByOneCategorize } from "./OneByOneCategorize";
import { TransactionList } from "./TransactionList";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { Search, RotateCcw } from "lucide-react";
import { CheckCircle2, LayoutGrid } from "lucide-react";

export function CategorizeStep() {
  const categories = useBudgetStore((s) => s.categories);
  const setCategory = useBudgetStore((s) => s.setCategory);
  const setCategoryForIds = useBudgetStore((s) => s.setCategoryForIds);
  const setStep = useBudgetStore((s) => s.setStep);
  const reset = useBudgetStore((s) => s.reset);
  const getCategorized = useBudgetStore((s) => s.getCategorized);
  const excludedIds = useBudgetStore((s) => s.excludedIds);
  const { expenseIds, incomeIds, getCategoryLabel, getCategoryColor } = useCategories();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"onebyone" | "grid">("onebyone");
  const initialQueueRef = useRef<number>(0);

  const categorized = useMemo(() => getCategorized(), [getCategorized, categories, excludedIds]);
  const byCategory = useMemo(() => {
    const map: Record<string, CategorizedTransaction[]> = {};
    [...expenseIds, ...incomeIds, "uncategorized"].forEach((c) => {
      map[c] = [];
    });
    categorized.forEach((t) => {
      const cat = t.category in map ? t.category : "uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(t);
    });
    return map;
  }, [categorized, expenseIds, incomeIds]);

  const uncategorizedIncome = useMemo(
    () => (byCategory.uncategorized ?? []).filter((t) => t.amount > 0),
    [byCategory.uncategorized]
  );
  const uncategorizedExpenses = useMemo(
    () => (byCategory.uncategorized ?? []).filter((t) => t.amount < 0),
    [byCategory.uncategorized]
  );

  const searchLower = search.trim().toLowerCase();
  const filteredUncategorizedIncome = useMemo(
    () =>
      searchLower
        ? uncategorizedIncome.filter((t) =>
            getDisplayDescription(t).toLowerCase().includes(searchLower)
          )
        : uncategorizedIncome,
    [uncategorizedIncome, searchLower]
  );
  const filteredUncategorizedExpenses = useMemo(
    () =>
      searchLower
        ? uncategorizedExpenses.filter((t) =>
            getDisplayDescription(t).toLowerCase().includes(searchLower)
          )
        : uncategorizedExpenses,
    [uncategorizedExpenses, searchLower]
  );

  const queue = useMemo(
    () => [...filteredUncategorizedIncome, ...filteredUncategorizedExpenses],
    [filteredUncategorizedIncome, filteredUncategorizedExpenses]
  );
  useEffect(() => {
    if (queue.length > initialQueueRef.current) initialQueueRef.current = queue.length;
  }, [queue.length]);
  const progressDenom = initialQueueRef.current || 1;
  const progressPct = Math.round(100 * (1 - queue.length / progressDenom));

  const uniqueIncomeDescriptions = useMemo(() => {
    const seen = new Map<string, string>();
    uncategorizedIncome.forEach((t) => {
      const d = getDisplayDescription(t);
      const key = d.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, d);
    });
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }, [uncategorizedIncome]);

  const uniqueExpenseDescriptions = useMemo(() => {
    const seen = new Map<string, string>();
    uncategorizedExpenses.forEach((t) => {
      const d = getDisplayDescription(t);
      const key = d.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, d);
    });
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }, [uncategorizedExpenses]);

  const handleGroupSimilarIncome = (descriptionKey: string, category: CategoryId) => {
    const ids = uncategorizedIncome
      .filter((t) => isSimilarDescription(getDisplayDescription(t), descriptionKey))
      .map((t) => t.id);
    setCategoryForIds(ids, category);
  };
  const handleGroupSimilarExpense = (descriptionKey: string, category: CategoryId) => {
    const ids = uncategorizedExpenses
      .filter((t) => isSimilarDescription(getDisplayDescription(t), descriptionKey))
      .map((t) => t.id);
    setCategoryForIds(ids, category);
  };

  const totalUncategorized = uncategorizedIncome.length + uncategorizedExpenses.length;

  return (
    <div className="min-h-screen p-3 sm:p-5 pb-24 bg-transparent relative z-10 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 min-w-0">
        <header className="flex flex-col gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] font-display">
              Categorise transactions
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 leading-relaxed">
              One at a time — click a category to assign. Similar transactions are grouped by merchant.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative w-full sm:w-48 md:w-56 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Filter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 sm:h-9 bg-[var(--card)] border-[var(--border)] w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 flex-1 sm:flex-none"
                onClick={() => setViewMode(viewMode === "onebyone" ? "grid" : "onebyone")}
              >
                {viewMode === "onebyone" ? <LayoutGrid className="h-4 w-4 sm:mr-1" /> : null}
                <span className="hidden sm:inline">{viewMode === "onebyone" ? " Grid" : " One by one"}</span>
                <span className="sm:hidden">{viewMode === "onebyone" ? "Grid" : "List"}</span>
              </Button>
              <ManageCategoriesDialog />
              <Button className="min-h-10 flex-1 sm:flex-none" onClick={() => setStep("dashboard")}>
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 text-[var(--muted-foreground)] border-[var(--border)]"
                onClick={() => {
                  if (typeof window !== "undefined" && window.confirm("Clear all data and start over? This cannot be undone.")) {
                    reset();
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </header>

        {viewMode === "onebyone" && (
          <>
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
                <div className="rounded-full bg-[var(--primary)]/10 p-4 mb-4">
                  <CheckCircle2 className="h-16 w-16 text-[var(--primary)]" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--foreground)] font-display">
                  All categorised
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {totalUncategorized > 0
                    ? "No more uncategorised transactions in this filter."
                    : "Every transaction has a category."}
                </p>
                <Button className="mt-6" onClick={() => setStep("dashboard")}>
                  View dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    <span className="font-semibold text-[var(--foreground)]">{queue.length}</span> left
                  </span>
                  <div className="h-2.5 flex-1 max-w-xs rounded-full bg-[var(--secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-500 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <OneByOneCategorize
                  queue={queue}
                  onProgress={() => {}}
                  expenseIds={expenseIds}
                  incomeIds={incomeIds}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                />
              </>
            )}
            <div className="mt-6 sm:mt-8 overflow-hidden">
              <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 font-display">
                All transactions
              </h2>
              <TransactionList
                categorized={categorized}
                expenseIds={expenseIds}
                incomeIds={incomeIds}
                getCategoryLabel={getCategoryLabel}
                getCategoryColor={getCategoryColor}
              />
            </div>
          </>
        )}

        {viewMode === "grid" && (
          <DndContext onDragStart={() => {}} onDragEnd={() => {}}>
            <div className="flex flex-wrap gap-2 mb-4">
              <GroupSimilarPopover
                uniqueDescriptions={uniqueIncomeDescriptions}
                onAssign={handleGroupSimilarIncome}
                categoryIds={incomeIds}
                getCategoryLabel={getCategoryLabel}
                label="Group similar (income)"
              />
              <GroupSimilarPopover
                uniqueDescriptions={uniqueExpenseDescriptions}
                onAssign={handleGroupSimilarExpense}
                categoryIds={expenseIds}
                getCategoryLabel={getCategoryLabel}
                label="Group similar (expenses)"
              />
            </div>
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Income
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {incomeIds.map((cat) => (
                  <CategoryBucket
                    key={cat}
                    id={cat}
                    title={getCategoryLabel(cat)}
                    color={getCategoryColor(cat)}
                    transactions={byCategory[cat] ?? []}
                    onRemove={(txId) => setCategory(txId, "uncategorized")}
                    compact
                  />
                ))}
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Expenses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseIds.map((cat) => (
                  <CategoryBucket
                    key={cat}
                    id={cat}
                    title={getCategoryLabel(cat)}
                    color={getCategoryColor(cat)}
                    transactions={byCategory[cat] ?? []}
                    onRemove={(txId) => setCategory(txId, "uncategorized")}
                    compact
                  />
                ))}
              </div>
            </section>
          </DndContext>
        )}
      </div>
    </div>
  );
}
