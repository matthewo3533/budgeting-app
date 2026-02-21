import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BankTransaction } from "@/types/transaction";
import { getDisplayDescription } from "@/lib/csvParser";
import { cn } from "@/lib/utils";

interface TransactionChipProps {
  transaction: BankTransaction;
  isDragging?: boolean;
  compact?: boolean;
  draggable?: boolean;
  /** Border color when this tx is in a group (same first 8 letters). */
  groupBorderColor?: string;
  /** Number of transactions in this group (show badge if > 1). */
  groupCount?: number;
}

export function TransactionChip({
  transaction,
  isDragging = false,
  compact = false,
  draggable = true,
  groupBorderColor,
  groupCount,
}: TransactionChipProps) {
  const draggableResult = useDraggable(
    draggable ? { id: transaction.id } : { id: transaction.id, disabled: true }
  );
  const { setNodeRef, transform, isDragging: dndDragging } = draggableResult;
  const attributes = draggable ? draggableResult.attributes : {};
  const listeners = draggable ? draggableResult.listeners : {};

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: dndDragging ? 50 : undefined,
      }
    : undefined;

  const desc = getDisplayDescription(transaction);
  const amount = transaction.amount;
  const isExpense = amount < 0;

  return (
    <div
      ref={setNodeRef}
      data-drag-id={transaction.id}
      style={{
        ...style,
        ...(groupBorderColor && groupCount && groupCount > 1
          ? { borderLeftWidth: "4px", borderLeftColor: groupBorderColor }
          : {}),
      }}
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left transition-all duration-200",
        draggable && "cursor-grab active:cursor-grabbing hover:border-[var(--muted-foreground)]/40",
        (isDragging || dndDragging) && "opacity-95 shadow-xl ring-2 ring-[var(--primary)] scale-[1.02]"
      )}
      {...listeners}
      {...attributes}
    >
      <div className={cn("flex items-center justify-between gap-2", compact && "text-xs")}>
        <span className="flex items-center gap-1.5 min-w-0">
          {groupCount != null && groupCount > 1 && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--primary)]/20 text-[var(--primary)]">
              {groupCount}
            </span>
          )}
          <span className="truncate max-w-[180px]" title={desc}>
            {desc}
          </span>
        </span>
        <span className={cn("shrink-0 font-medium", isExpense ? "text-[var(--destructive)]" : "text-[var(--primary)]")}>
          {isExpense ? "" : "+"}${Math.abs(amount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
