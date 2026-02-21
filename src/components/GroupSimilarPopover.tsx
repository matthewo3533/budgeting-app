import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import type { CategoryId } from "@/types/transaction";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Layers } from "lucide-react";

interface UniqueDesc {
  key: string;
  label: string;
}

interface GroupSimilarPopoverProps {
  uniqueDescriptions: UniqueDesc[];
  onAssign: (descriptionKey: string, category: CategoryId) => void;
  categoryIds: CategoryId[];
  getCategoryLabel: (id: CategoryId) => string;
  label: string;
  disabled?: boolean;
}

export function GroupSimilarPopover({
  uniqueDescriptions,
  onAssign,
  categoryIds,
  getCategoryLabel,
  label,
  disabled,
}: GroupSimilarPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState<string | null>(null);

  const handleAssign = (cat: CategoryId) => {
    if (selectedDesc) {
      onAssign(selectedDesc, cat);
      setSelectedDesc(null);
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm" disabled={disabled ?? uniqueDescriptions.length === 0}>
          <Layers className="h-4 w-4" />
          {label}
        </Button>
      </Popover.Trigger>
      <Popover.Content
        className="w-80 rounded-xl border border-[var(--border)] bg-[var(--popover)] p-4 shadow-xl shadow-black/30 outline-none"
        align="start"
      >
        <p className="text-sm font-medium mb-2">Assign all matching transactions</p>
        {!selectedDesc ? (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {uniqueDescriptions.slice(0, 50).map(({ key, label: descLabel }) => (
              <button
                key={key}
                type="button"
                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-[var(--muted)] truncate"
                onClick={() => setSelectedDesc(key)}
              >
                {descLabel}
              </button>
            ))}
            {uniqueDescriptions.length > 50 && (
              <p className="text-xs text-[var(--muted-foreground)]">+ more...</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted-foreground)]">
              Category for &quot;{uniqueDescriptions.find((d) => d.key === selectedDesc)?.label}&quot;
            </p>
            <div className="grid grid-cols-2 gap-1">
              {categoryIds.map((cat) => {
                const Icon = getCategoryIcon(cat);
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAssign(cat)}
                    className="justify-start gap-2"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    {getCategoryLabel(cat)}
                  </Button>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDesc(null)}>
              Back
            </Button>
          </div>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
