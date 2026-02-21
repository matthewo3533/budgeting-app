import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CategoryId } from "@/types/transaction";
import { getCategoryIcon } from "@/lib/categoryIcons";
import type { CategorizedTransaction } from "@/types/transaction";
import { TransactionChip } from "./TransactionChip";

interface CategoryBucketProps {
  id: CategoryId;
  title: string;
  color: string;
  transactions: CategorizedTransaction[];
  onRemove: (txId: string) => void;
  /** Show fewer items and tighter layout (for grid view). */
  compact?: boolean;
}

export function CategoryBucket({
  id,
  title,
  color,
  transactions,
  onRemove,
  compact = false,
}: CategoryBucketProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `category-${id}` });
  const showCount = compact ? 5 : 15;
  const Icon = getCategoryIcon(id);

  return (
    <Card
      ref={setNodeRef}
      className={`transition-all duration-200 ${compact ? "min-h-0" : "min-h-[140px]"} ${
        isOver ? "ring-2 ring-[var(--primary)] border-[var(--primary)]/40" : ""
      }`}
      style={{ borderLeftWidth: "3px", borderLeftColor: color }}
    >
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 gap-2 ${compact ? "py-2 px-3" : "py-3 px-4"}`}>
        <span className={`font-semibold text-[var(--foreground)] flex items-center gap-1.5 min-w-0 ${compact ? "text-xs" : "text-sm"}`}>
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" style={{ color }} />
          {title}
        </span>
        <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
          {transactions.length} · ${transactions
            .reduce((s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : t.amount), 0)
            .toFixed(0)}
        </span>
      </CardHeader>
      <CardContent className={`pt-0 space-y-2 ${compact ? "px-3 pb-3" : "px-4 pb-4"}`}>
        {transactions.slice(0, showCount).map((tx) => (
          <div key={tx.id} className="flex items-center gap-2 group">
            <TransactionChip transaction={tx} compact draggable={false} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-md"
              onClick={() => onRemove(tx.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {transactions.length > showCount && (
          <p className="text-xs text-[var(--muted-foreground)] pt-1">
            +{transactions.length - showCount} more
          </p>
        )}
      </CardContent>
    </Card>
  );
}
