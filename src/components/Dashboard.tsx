import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { parseISO, isWithinInterval, startOfWeek, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategories } from "@/lib/useCategories";
import { getDisplayDescription } from "@/lib/csvParser";

ChartJS.register(
  ArcElement,
  BarElement,
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
    const datasets = expenseCats.map((cat) => {
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
        fill: true,
        tension: 0.3,
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

  const incomeChartData = useMemo(
    () => ({
      labels: incomeBySource.map(([label]) => (label.length > 25 ? label.slice(0, 22) + "…" : label)),
      datasets: [
        {
          label: "Income",
          data: incomeBySource.map(([, v]) => v),
          backgroundColor: "#4c956c",
        },
      ],
    }),
    [incomeBySource]
  );

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

  const expensesChartData = useMemo(
    () => ({
      labels: expensesByMerchant.map(([label]) => (label.length > 25 ? label.slice(0, 22) + "…" : label)),
      datasets: [
        {
          label: "Spending",
          data: expensesByMerchant.map(([, v]) => v),
          backgroundColor: "#d68c45",
        },
      ],
    }),
    [expensesByMerchant]
  );

  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const totalExpenses = useMemo(
    () => expenses.reduce((s, t) => s + Math.abs(t.amount), 0),
    [expenses]
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

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: "#8b949e", font: { size: 13 } },
        grid: { color: "rgba(48,54,61,0.5)" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#8b949e", font: { size: 13 } },
        grid: { color: "rgba(48,54,61,0.5)" },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    interaction: { intersect: false, mode: "index" as const },
    scales: {
      x: {
        ticks: { color: "#8b949e", font: { size: 13 }, maxRotation: 45 },
        grid: { color: "rgba(48,54,61,0.5)" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#8b949e", font: { size: 13 } },
        grid: { color: "rgba(48,54,61,0.5)" },
      },
    },
  };

  return (
    <div className="min-h-screen p-5 pb-12 bg-transparent relative z-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] font-display">
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 transition-all duration-200 hover:border-[var(--muted-foreground)]/30">
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => handleRangeStart(e.target.value)}
                className="h-9 rounded-lg border-0 bg-transparent px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              <span className="text-[var(--muted-foreground)]">→</span>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => handleRangeEnd(e.target.value)}
                className="h-9 rounded-lg border-0 bg-transparent px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <Button variant="outline" onClick={() => setStep("categorize")}>
              Categories
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined" && window.confirm("Clear all data and start over? This cannot be undone.")) {
                  reset();
                }
              }}
              className="text-[var(--muted-foreground)] border-[var(--border)]"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </header>

        {/* Hero summary strip */}
        <div
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-lg overflow-hidden relative animate-fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-wrap gap-10 sm:gap-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Income</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums text-[var(--primary)] font-display">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Expenses</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums text-[var(--destructive)] font-display">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Net</p>
                <p className={`text-3xl sm:text-4xl font-bold tabular-nums font-display ${totalIncome - totalExpenses >= 0 ? "text-[var(--primary)]" : "text-[var(--destructive)]"}`}>
                  ${(totalIncome - totalExpenses).toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">Selected period</p>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-1">
              <CardTitle>Spending by category over time</CardTitle>
              <CardDescription>Weekly totals by category (line chart)</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
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
                <CardDescription>Totals by category (donut)</CardDescription>
              </CardHeader>
              <CardContent className="h-[340px]">
                {expenseCategoryData.datasets[0].data.length > 0 ? (
                  <Doughnut data={expenseCategoryData} options={chartOptions} />
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)] flex items-center h-full">
                    No categorized expenses in this period.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="pb-1">
                <CardTitle>Income by category</CardTitle>
                <CardDescription>Money in (donut)</CardDescription>
              </CardHeader>
              <CardContent className="h-[340px]">
                {incomeCategoryData.datasets[0].data.length > 0 ? (
                  <Doughnut data={incomeCategoryData} options={chartOptions} />
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)] flex items-center h-full">
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
            <CardContent className="h-[340px]">
              {incomeBySource.length > 0 ? (
                <Bar data={incomeChartData} options={barOptions} />
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] flex items-center h-full">
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
            <CardContent className="h-[340px]">
              {expensesByMerchant.length > 0 ? (
                <Bar data={expensesChartData} options={barOptions} />
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] flex items-center h-full">
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
