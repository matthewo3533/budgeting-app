import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBudgetStore } from "@/store/useBudgetStore";
import { Settings2, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ManageCategoriesDialog() {
  const customCategories = useBudgetStore((s) => s.customCategories);
  const addCustomCategory = useBudgetStore((s) => s.addCustomCategory);
  const removeCustomCategory = useBudgetStore((s) => s.removeCustomCategory);
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    addCustomCategory(trimmed, newType);
    setNewLabel("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Categories
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl outline-none"
          onPointerDownOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <Dialog.Title className="text-lg font-semibold font-display">
            Manage categories
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[var(--muted-foreground)] mt-1">
            Add your own categories. Built-in categories cannot be removed.
          </Dialog.Description>

          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New category name"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "expense" | "income")}
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 text-sm text-[var(--foreground)]"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <Button type="button" onClick={handleAdd} disabled={!newLabel.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {customCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                  Your categories
                </p>
                <ul className="space-y-2">
                  {customCategories.map((c) => (
                    <li
                      key={c.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 px-3 py-2"
                      )}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: c.color }}
                      >
                        {c.label}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {c.type === "expense" ? "Expense" : "Income"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                        onClick={() => removeCustomCategory(c.id)}
                        title="Remove category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Done
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
