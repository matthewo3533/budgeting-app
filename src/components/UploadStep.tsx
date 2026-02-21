import { useRef } from "react";
import { Upload, FileSpreadsheet, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBudgetStore } from "@/store/useBudgetStore";
import { parseBankCSV } from "@/lib/csvParser";
import { getDemoTransactions } from "@/lib/demoData";

export function UploadStep() {
  const inputRef = useRef<HTMLInputElement>(null);
  const setTransactions = useBudgetStore((s) => s.setTransactions);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const transactions = parseBankCSV(text);
      setTransactions(transactions);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent relative z-10">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4 animate-fade-in-up">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] transition-transform duration-300 hover:scale-110 hover:bg-[var(--primary)]/15">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] font-display">
            Budget Tracker
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
            Upload your bank export CSV to analyse spending and see where your money goes.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group w-full relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-12 transition-all duration-300 hover:border-[var(--primary)]/60 hover:bg-[var(--secondary)]/80 hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--primary)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
        >
          <Upload className="mx-auto h-12 w-12 text-[var(--muted-foreground)] mb-4 transition-colors duration-200 group-hover:text-[var(--primary)]" />
          <span className="block text-sm font-semibold text-[var(--foreground)]">
            Choose CSV file
          </span>
          <span className="block text-xs text-[var(--muted-foreground)] mt-1">
            or drag and drop
          </span>
        </button>

        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setTransactions(getDemoTransactions())}
          >
            <Play className="h-4 w-4 mr-2" />
            Try with demo data
          </Button>
        </div>

        <p className="text-xs text-[var(--muted-foreground)] animate-fade-in-up max-w-xs mx-auto" style={{ animationDelay: "0.15s" }}>
          Export from your bank (e.g. ANZ, BNZ) as CSV with columns: Account number, Transaction Date, Description, Amount, etc.
        </p>
      </div>
    </div>
  );
}
