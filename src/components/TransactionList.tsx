import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBudgetStore } from "@/store/useBudgetStore";
import type { CategoryId, CategorizedTransaction } from "@/types/transaction";
import { getDisplayDescription } from "@/lib/csvParser";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Search, Ban, ChevronDown, CheckSquare, Square } from "lucide-react";
import { format, parseISO } from "date-fns";

type ListFilter = "all" | "uncategorized" | "income" | "expense";

interface TransactionListProps {
  categorized: CategorizedTransaction[];
  expenseIds: CategoryId[];
  incomeIds: CategoryId[];
  getCategoryLabel: (id: CategoryId) => string;
  getCategoryColor: (id: CategoryId) => string;
}

export function TransactionList({
  categorized,
  expenseIds,
  incomeIds,
  getCategoryLabel,
  getCategoryColor,
}: TransactionListProps) {
  const setCategory = useBudgetStore((s) => s.setCategory);
  const setCategoryForIds = useBudgetStore((s) => s.setCategoryForIds);
  const excludeByIds = useBudgetStore((s) => s.excludeByIds);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);

  const searchLower = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = categorized;
    if (filter === "uncategorized") {
      list = list.filter((t) => t.category === "uncategorized");
    } else if (filter === "income") {
      list = list.filter((t) => t.amount > 0);
    } else if (filter === "expense") {
      list = list.filter((t) => t.amount < 0);
    }
    if (searchLower) {
      list = list.filter((t) =>
        getDisplayDescription(t).toLowerCase().includes(searchLower)
      );
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    );
  }, [categorized, filter, searchLower]);

  const selectAll = () => {
    if (selectedIds.size >= filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssignSelected = (cat: CategoryId) => {
    if (selectedIds.size === 0) return;
    setCategoryForIds(Array.from(selectedIds), cat);
    setSelectedIds(new Set());
    setAssignDropdownOpen(false);
  };

  const handleExcludeSelected = () => {
    if (selectedIds.size === 0) return;
    excludeByIds(Array.from(selectedIds), "selected");
    setSelectedIds(new Set());
  };

  const handleAssignOne = (id: string, cat: CategoryId) => {
    setCategory(id, cat);
  };

  const handleExcludeOne = (id: string) => {
    excludeByIds([id], "single");
  };

  const selectedCount = selectedIds.size;
  const allSelected = filtered.length > 0 && selectedCount === filtered.length;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-shadow duration-200 hover:shadow-lg">
      <div className="p-4 border-b border-[var(--border)] space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-[var(--secondary)]"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "uncategorized", "income", "expense"] as const).map(
              (f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="transition-all duration-200"
                >
                  {f === "all" ? "All" : f === "uncategorized" ? "Uncategorised" : f === "income" ? "Income" : "Expenses"}
                </Button>
              )
            )}
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {selectedCount} selected
            </span>
            <div className="flex gap-2">
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
                >
                  Assign to <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
                {assignDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAssignDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 z-20 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl min-w-[180px] max-h-64 overflow-y-auto">
                      <p className="px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                        Income
                      </p>
                      {incomeIds.map((cat) => {
                        const Icon = getCategoryIcon(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)]"
                            onClick={() => handleAssignSelected(cat)}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            {getCategoryLabel(cat)}
                          </button>
                        );
                      })}
                      <p className="px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase mt-1">
                        Expenses
                      </p>
                      {expenseIds.map((cat) => {
                        const Icon = getCategoryIcon(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--secondary)]"
                            onClick={() => handleAssignSelected(cat)}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            {getCategoryLabel(cat)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExcludeSelected}
                className="border-[var(--destructive)]/50 text-[var(--destructive)] hover:bg-[var(--destructive)]/20"
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Exclude
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            No transactions match.
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] bg-[var(--card)] border-b border-[var(--border)]">
              <button
                type="button"
                onClick={selectAll}
                className="flex items-center gap-2 hover:text-[var(--foreground)]"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 text-[var(--primary)]" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Select all ({filtered.length})
              </button>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((tx) => {
                const isIncome = tx.amount > 0;
                const categoryIds = isIncome ? incomeIds : expenseIds;
                const selected = selectedIds.has(tx.id);
                return (
                  <li
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-[var(--secondary)]/60 ${
                      selected ? "bg-[var(--primary)]/5" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelect(tx.id)}
                      className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150"
                    >
                      {selected ? (
                        <CheckSquare className="h-4 w-4 text-[var(--primary)]" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <span
                        className="truncate text-sm text-[var(--foreground)]"
                        title={getDisplayDescription(tx)}
                      >
                        {getDisplayDescription(tx)}
                      </span>
                      <span
                        className={`shrink-0 text-sm font-medium tabular-nums ${
                          isIncome ? "text-[var(--primary)]" : "text-[var(--destructive)]"
                        }`}
                      >
                        {isIncome ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                        {format(parseISO(tx.transactionDate), "d MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={tx.category}
                        onChange={(e) =>
                          handleAssignOne(tx.id, e.target.value as CategoryId)
                        }
                        className="h-8 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2 text-xs text-[var(--foreground)] transition-colors duration-150 hover:border-[var(--muted-foreground)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        style={{
                          maxWidth: "120px",
                          color:
                            tx.category !== "uncategorized"
                              ? getCategoryColor(tx.category)
                              : undefined,
                        }}
                      >
                        <option value="uncategorized">Uncategorised</option>
                        {categoryIds.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat)}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                        onClick={() => handleExcludeOne(tx.id)}
                        title="Exclude"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
