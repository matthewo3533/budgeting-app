import { useBudgetStore } from "@/store/useBudgetStore";
import { UploadStep } from "@/components/UploadStep";
import { CategorizeStep } from "@/components/CategorizeStep";
import { Dashboard } from "@/components/Dashboard";

export default function App() {
  const step = useBudgetStore((s) => s.step);

  if (step === "upload") return <UploadStep />;
  if (step === "categorize") return <CategorizeStep />;
  return <Dashboard />;
}
