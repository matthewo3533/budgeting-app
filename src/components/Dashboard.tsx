import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { parseISO, isWithinInterval, startOfWeek, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategories } from "@/lib/useCategories";
import { getDisplayDescription } from "@/lib/csvParser";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler
);

export function Dashboard() {
  const getCategorized = useBudgetStore((s) => s.getCategorized);
  const excludedIds = useBudgetStore((s) => s.excludedIds);
  const dateRange = useBudgetStore((s) => s.dateRange);
  const setStep = useBudgetStore((s) => s.setStep);
  const setDateRange = useBudgetStore((s) => s.setDateRange);
  const reset = useBudgetStore((s) => s.reset);
  const { expenseIds, incomeIds, getCategoryLabel, getCategoryColor } = useCategories();

  const [rangeStart, setRangeStart] = useState(() => dateRange.start || "");
  const [rangeEnd, setRangeEnd] = useState(() => dateRange.end || "");

  const categorized = useMemo(() => getCategorized(), [getCategorized, excludedIds]);
  const filtered = useMemo(() => {
    if (!rangeStart || !rangeEnd) return categorized;
    const start = parseISO(rangeStart);
    const end = parseISO(rangeEnd);
    return categorized.filter((t) => {
      const d = parseISO(t.transactionDate);
      return isWithinInterval(d, { start, end });
    });
  }, [categorized, rangeStart, rangeEnd]);

  const handleRangeStart = (v: string) => {
    setRangeStart(v);
    if (v && rangeEnd) setDateRange(v, rangeEnd);
  };
  const handleRangeEnd = (v: string) => {
    setRangeEnd(v);
    if (rangeStart && v) setDateRange(rangeStart, v);
  };

  const expenses = useMemo(
    () => filtered.filter((t) => t.amount < 0),
    [filtered]
  );
  const income = useMemo(
    () => filtered.filter((t) => t.amount > 0),
    [filtered]
  );

  const byExpenseCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenseIds.forEach((c) => (map[c] = 0));
    expenses.forEach((t) => {
      if (expenseIds.includes(t.category)) {
        map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount);
      }
    });
    return map;
  }, [expenses, expenseIds]);

  const byIncomeCategory = useMemo(() => {
    const map: Record<string, number> = {};
    incomeIds.forEach((c) => (map[c] = 0));
    income.forEach((t) => {
      if (incomeIds.includes(t.category)) {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      }
    });
    return map;
  }, [income, incomeIds]);

  const expenseCategoryData = useMemo(() => {
    const entries = Object.entries(byExpenseCategory).filter(([, v]) => v > 0);
    const labels = entries.map(([k]) => getCategoryLabel(k));
    const values = entries.map(([, v]) => v);
    const colors = entries.map(([k]) => getCategoryColor(k));
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  }, [byExpenseCategory, getCategoryLabel, getCategoryColor]);

  const POINT_STYLES = ["circle", "triangle", "rect", "rectRounded", "cross", "star", "line"] as const;

  const spendingByCategoryOverTime = useMemo(() => {
    const expenseCats = expenseIds.filter((c) => byExpenseCategory[c] > 0);
    if (expenseCats.length === 0 || expenses.length === 0) return null;
    const weekKeys = new Map<string, number>();
    expenses.forEach((t) => {
      const d = parseISO(t.transactionDate);
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      const key = format(weekStart, "yyyy-MM-dd");
      if (!weekKeys.has(key)) weekKeys.set(key, weekKeys.size);
    });
    const sortedWeeks = Array.from(weekKeys.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k]) => k);
    const labels = sortedWeeks.map((w) => format(parseISO(w), "d MMM"));
    const datasets = expenseCats.map((cat, i) => {
      const values = sortedWeeks.map((weekStr) => {
        return expenses
          .filter((t) => t.category === cat)
          .filter((t) => {
            const d = parseISO(t.transactionDate);
            const tw = startOfWeek(d, { weekStartsOn: 1 });
            return format(tw, "yyyy-MM-dd") === weekStr;
          })
          .reduce((s, t) => s + Math.abs(t.amount), 0);
      });
      return {
        label: getCategoryLabel(cat),
        data: values,
        borderColor: getCategoryColor(cat),
        backgroundColor: getCategoryColor(cat) + "20",
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: getCategoryColor(cat),
        pointBorderColor: "#151921",
        pointBorderWidth: 1,
        pointStyle: POINT_STYLES[i % POINT_STYLES.length],
      };
    });
    return { labels, datasets };
  }, [expenses, byExpenseCategory, expenseIds, getCategoryLabel, getCategoryColor]);

  const incomeCategoryData = useMemo(() => {
    const entries = Object.entries(byIncomeCategory).filter(([, v]) => v > 0);
    const labels = entries.map(([k]) => getCategoryLabel(k));
    const values = entries.map(([, v]) => v);
    const colors = entries.map(([k]) => getCategoryColor(k));
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  }, [byIncomeCategory, getCategoryLabel, getCategoryColor]);

  const incomeBySource = useMemo(() => {
    const map = new Map<string, number>();
    income.forEach((t) => {
      const desc = getDisplayDescription(t);
      map.set(desc, (map.get(desc) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [income]);

  const expensesByMerchant = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((t) => {
      const desc = getDisplayDescription(t);
      map.set(desc, (map.get(desc) ?? 0) + Math.abs(t.amount));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [expenses]);

  const totalIncome = useMemo(
    () => income.filter((t) => incomeIds.includes(t.category)).reduce((s, t) => s + t.amount, 0),
    [income, incomeIds]
  );
  const totalExpenses = useMemo(
    () =>
      expenses
        .filter((t) => expenseIds.includes(t.category))
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    [expenses, expenseIds]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#b1bac4", font: { family: "Plus Jakarta Sans", size: 14 } },
      },
      tooltip: {
        bodyFont: { size: 14 },
        titleFont: { size: 14 },
      },
    },
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
        onClick: () => {},
      },
      tooltip: chartOptions.plugins.tooltip,
    },
    onClick: () => {},
  };

  const lineOptions = useMemo(
    () => ({
      ...chartOptions,
      interaction: { intersect: false, mode: "index" as const },
      plugins: {
        ...chartOptions.plugins,
        legend: {
          ...chartOptions.plugins.legend,
          labels: {
            ...chartOptions.plugins.legend.labels,
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
          },
        },
        tooltip: {
          ...chartOptions.plugins.tooltip,
          bodyFont: { size: 13 },
          titleFont: { size: 13 },
          padding: 12,
          backgroundColor: "var(--card)",
          titleColor: "var(--foreground)",
          bodyColor: "var(--foreground)",
          borderColor: "var(--border)",
          borderWidth: 1,
          displayColors: true,
          boxPadding: 6,
          // Show categories in order: largest to smallest
          itemSort: (a: { raw: unknown }, b: { raw: unknown }) =>
            (Number(b.raw) || 0) - (Number(a.raw) || 0),
          callbacks: {
            title: (items: { dataIndex: number; label: string }[]) => {
              if (items.length === 0) return "";
              return `Week of ${items[0].label}`;
            },
            label: (ctx: { raw: unknown; dataset: { label: string } }) =>
              ` ${ctx.dataset.label}: $${(Number(ctx.raw) || 0).toFixed(2)}`,
            afterBody: (items: { raw: unknown }[]) => {
              const total = items.reduce((s, i) => s + (Number(i.raw) || 0), 0);
              if (total <= 0) return [];
              return ["", `Total: $${total.toFixed(2)}`];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#8b949e", font: { size: 12 }, maxRotation: 45 },
          grid: { color: "rgba(48,54,61,0.5)" },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#8b949e",
            font: { size: 12 },
            callback: (value: string | number) => (typeof value === "number" ? `$${value}` : value),
          },
          grid: { color: "rgba(48,54,61,0.5)" },
        },
      },
    }),
    [chartOptions]
  );

  return (
    <div className="min-h-screen p-3 sm:p-5 pb-20 sm:pb-12 bg-transparent relative z-10 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 min-w-0">
        <header className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 animate-fade-in-up">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] font-display">
            Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 transition-all duration-200 hover:border-[var(--muted-foreground)]/30 min-w-0">
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => handleRangeStart(e.target.value)}
                className="h-9 flex-1 min-w-0 rounded-lg border-0 bg-transparent px-2 sm:px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              <span className="text-[var(--muted-foreground)] shrink-0">→</span>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => handleRangeEnd(e.target.value)}
                className="h-9 flex-1 min-w-0 rounded-lg border-0 bg-transparent px-2 sm:px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-h-10" onClick={() => setStep("categorize")}>
                Categories
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

        {/* Hero summary strip */}
        <div
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 md:p-8 shadow-lg overflow-hidden relative animate-fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-wrap items-end justify-between gap-4 sm:gap-6">
            <div className="flex flex-wrap gap-6 sm:gap-10 md:gap-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Income</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-[var(--primary)] font-display truncate max-w-[140px] sm:max-w-none">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Expenses</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-[var(--destructive)] font-display truncate max-w-[140px] sm:max-w-none">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Net</p>
                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums font-display truncate max-w-[140px] sm:max-w-none ${totalIncome - totalExpenses >= 0 ? "text-[var(--primary)]" : "text-[var(--destructive)]"}`}>
                  ${(totalIncome - totalExpenses).toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] w-full sm:w-auto">Selected period</p>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-1">
              <CardTitle>Spending by category over time</CardTitle>
              <CardDescription>Weekly totals by category (line chart)</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px] sm:h-[320px] md:h-[340px] min-h-0">
              {spendingByCategoryOverTime && spendingByCategoryOverTime.datasets.length > 0 ? (
                <Line data={spendingByCategoryOverTime} options={lineOptions} />
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] flex items-center h-full">
                  No categorized expenses in this period.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <CardHeader className="pb-1">
                <CardTitle>Expense breakdown</CardTitle>
                <CardDescription>Totals by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseCategoryData.datasets[0].data.length > 0 ? (
                  <>
                    <div className="h-[220px] sm:h-[260px] md:h-[280px] min-h-0">
                      <Doughnut data={expenseCategoryData} options={doughnutOptions} />
                    </div>
                    <div className="rounded-lg border border-[var(--border)] overflow-x-auto overflow-y-hidden">
                      <table className="w-full text-sm min-w-[200px]">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                            <th className="text-left font-semibold text-[var(--foreground)] px-3 py-2">Category</th>
                            <th className="text-right font-semibold text-[var(--foreground)] px-3 py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseCategoryData.labels.map((label, i) => (
                            <tr key={label} className="border-b border-[var(--border)]/50 last:border-b-0 hover:bg-[var(--secondary)]/30">
                              <td className="px-3 py-2 text-[var(--foreground)]">{label}</td>
                              <td className="px-3 py-2 text-right font-medium tabular-nums text-[var(--destructive)]">
                                ${(expenseCategoryData.datasets[0].data[i] as number).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)] py-8">
                    No categorized expenses in this period.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="pb-1">
                <CardTitle>Income by category</CardTitle>
                <CardDescription>Money in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {incomeCategoryData.datasets[0].data.length > 0 ? (
                  <>
                    <div className="h-[220px] sm:h-[260px] md:h-[280px] min-h-0">
                      <Doughnut data={incomeCategoryData} options={doughnutOptions} />
                    </div>
                    <div className="rounded-lg border border-[var(--border)] overflow-x-auto overflow-y-hidden">
                      <table className="w-full text-sm min-w-[200px]">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                            <th className="text-left font-semibold text-[var(--foreground)] px-3 py-2">Category</th>
                            <th className="text-right font-semibold text-[var(--foreground)] px-3 py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeCategoryData.labels.map((label, i) => (
                            <tr key={label} className="border-b border-[var(--border)]/50 last:border-b-0 hover:bg-[var(--secondary)]/30">
                              <td className="px-3 py-2 text-[var(--foreground)]">{label}</td>
                              <td className="px-3 py-2 text-right font-medium tabular-nums text-[var(--primary)]">
                                ${(incomeCategoryData.datasets[0].data[i] as number).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)] py-8">
                    No categorized income in this period.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <CardHeader className="pb-1">
              <CardTitle>Top income sources</CardTitle>
              <CardDescription>Top 10 by amount</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeBySource.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                        <th className="text-left font-semibold text-[var(--foreground)] px-4 py-3">Source</th>
                        <th className="text-right font-semibold text-[var(--foreground)] px-4 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeBySource.map(([label, amount]) => (
                        <tr key={label} className="border-b border-[var(--border)]/50 last:border-b-0 hover:bg-[var(--secondary)]/30">
                          <td className="px-3 sm:px-4 py-2.5 text-[var(--foreground)] truncate max-w-[120px] sm:max-w-[200px]" title={label}>{label}</td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums text-[var(--primary)]">+${amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] py-6">
                  No income in this period.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="pb-1">
              <CardTitle>Top costs</CardTitle>
              <CardDescription>Top 10 merchants by spending</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByMerchant.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                        <th className="text-left font-semibold text-[var(--foreground)] px-4 py-3">Merchant</th>
                        <th className="text-right font-semibold text-[var(--foreground)] px-4 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesByMerchant.map(([label, amount]) => (
                        <tr key={label} className="border-b border-[var(--border)]/50 last:border-b-0 hover:bg-[var(--secondary)]/30">
                          <td className="px-3 sm:px-4 py-2.5 text-[var(--foreground)] truncate max-w-[120px] sm:max-w-[200px]" title={label}>{label}</td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums text-[var(--destructive)]">${amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] py-6">
                  No expenses in this period.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
