import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useBudgetStore } from "@/store/useBudgetStore";
import {
  type CategoryId,
  type CategorizedTransaction,
} from "@/types/transaction";
import { getDisplayDescription, getMeaningfulDescription, getGroupKey } from "@/lib/csvParser";
import { getRecommendedCategory } from "@/lib/categoryRecommendations";
import { getCategoryIcon } from "@/lib/categoryIcons";
import anime from "animejs";
import { Ban, ThumbsDown, ThumbsUp, Sparkles } from "lucide-react";

const SWIPE_THRESHOLD = 80;
const DRAG_ROTATION = 12;

interface OneByOneCategorizeProps {
  queue: CategorizedTransaction[];
  onProgress: (assigned: number) => void;
  expenseIds: CategoryId[];
  incomeIds: CategoryId[];
  getCategoryLabel: (id: CategoryId) => string;
  getCategoryColor: (id: CategoryId) => string;
}

export function OneByOneCategorize({
  queue,
  onProgress,
  expenseIds,
  incomeIds,
  getCategoryLabel,
  getCategoryColor,
}: OneByOneCategorizeProps) {
  const setCategory = useBudgetStore((s) => s.setCategory);
  const setCategoryForIds = useBudgetStore((s) => s.setCategoryForIds);
  const excludeByIds = useBudgetStore((s) => s.excludeByIds);

  const [index, setIndex] = useState(0);
  const [applyToGroup, setApplyToGroup] = useState(true);
  const [drag, setDrag] = useState({ x: 0, y: 0, isDragging: false });
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerStart = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });

  const current = queue[index];
  const isIncome = current?.amount > 0;
  const recommendedId = current
    ? getRecommendedCategory(getDisplayDescription(current), isIncome)
    : null;
  const categoryIds = isIncome ? incomeIds : expenseIds;
  const categoryIdsSorted = useMemo(() => {
    if (!recommendedId || !categoryIds.includes(recommendedId)) return categoryIds;
    const rest = categoryIds.filter((c) => c !== recommendedId);
    return [recommendedId, ...rest];
  }, [categoryIds, recommendedId]);
  const groupInQueue = current
    ? queue.slice(index).filter((t) => getGroupKey(t) === getGroupKey(current))
    : [];
  const groupSize = groupInQueue.length;

  // Enter animation when current changes
  useEffect(() => {
    if (!current || !cardRef.current || exitDirection) return;
    const el = cardRef.current;
    el.style.transform = "";
    el.style.opacity = "1";
    anime({
      targets: el,
      opacity: [0, 1],
      scale: [0.85, 1],
      duration: 400,
      easing: "easeOutElastic(1, 0.5)",
    });
  }, [current?.id, exitDirection]);

  const advanceToNext = useCallback(() => {
    setIndex((i) => i);
    setExitDirection(null);
    setDrag({ x: 0, y: 0, isDragging: false });
  }, []);

  const assignToCategory = useCallback(
    (cat: CategoryId) => {
      if (!current) return;
      if (applyToGroup && groupSize > 1) {
        setCategoryForIds(groupInQueue.map((t) => t.id), cat);
        onProgress(groupSize);
      } else {
        setCategory(current.id, cat);
        onProgress(1);
      }
      advanceToNext();
    },
    [current, applyToGroup, groupSize, groupInQueue, setCategory, setCategoryForIds, onProgress, advanceToNext]
  );

  const handleExclude = useCallback(() => {
    if (!current) return;
    if (applyToGroup && groupSize > 1) {
      excludeByIds(groupInQueue.map((t) => t.id), "swipe");
      setIndex((i) => Math.min(i + groupSize, queue.length));
    } else {
      excludeByIds([current.id], "swipe");
      setIndex((i) => Math.min(i + 1, queue.length));
    }
    setDrag({ x: 0, y: 0, isDragging: false });
    setExitDirection(null);
  }, [current, applyToGroup, groupSize, groupInQueue, excludeByIds, queue.length]);

  const runExitAnimation = useCallback(
    (direction: "left" | "right", onComplete: () => void) => {
      const el = cardRef.current;
      if (!el) {
        onComplete();
        return;
      }
      const x = direction === "left" ? -400 : 400;
      anime({
        targets: el,
        translateX: x,
        rotate: direction === "left" ? -30 : 30,
        opacity: 0,
        duration: 280,
        easing: "easeOutQuad",
        complete: onComplete,
      });
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      pointerStart.current = { x: e.clientX, y: e.clientY };
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setDropTargetIndex(null);
      setDrag({ x: 0, y: 0, isDragging: true });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.isDragging) return;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - pointerStart.current.x;
      const dy = (e.clientY - pointerStart.current.y) * 0.3;
      setDrag((d) => ({ ...d, x: dx, y: dy }));
      if (dx > SWIPE_THRESHOLD) {
        const pills = pillRefs.current.filter(Boolean);
        let overIdx: number | null = null;
        for (let i = 0; i < pills.length; i++) {
          const pill = pills[i];
          if (!pill) continue;
          const r = pill.getBoundingClientRect();
          if (
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          ) {
            overIdx = i;
            break;
          }
        }
        setDropTargetIndex(overIdx);
      } else {
        setDropTargetIndex(null);
      }
    },
    [drag.isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!drag.isDragging || !current) return;
    const { x } = drag;
    setDropTargetIndex(null);
    if (x < -SWIPE_THRESHOLD) {
      setExitDirection("left");
      runExitAnimation("left", () => {
        handleExclude();
        setExitDirection(null);
        setDrag({ x: 0, y: 0, isDragging: false });
      });
    } else if (x > SWIPE_THRESHOLD) {
      const pills = pillRefs.current.filter(Boolean);
      const { x: px, y: py } = lastPointer.current;
      let assigned = false;
      for (let i = 0; i < pills.length; i++) {
        const pill = pills[i];
        if (!pill) continue;
        const r = pill.getBoundingClientRect();
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          const cat = categoryIdsSorted[i];
          if (cat) {
            setExitDirection("right");
            runExitAnimation("right", () => {
              assignToCategory(cat);
              setExitDirection(null);
              setDrag({ x: 0, y: 0, isDragging: false });
            });
            assigned = true;
          }
          break;
        }
      }
      if (!assigned) {
        setDrag({ x: 0, y: 0, isDragging: false });
        const el = cardRef.current;
        if (el) {
          anime({
            targets: el,
            translateX: 0,
            translateY: 0,
            rotate: 0,
            duration: 250,
            easing: "easeOutQuad",
          });
        }
      }
    } else {
      setDrag({ x: 0, y: 0, isDragging: false });
      const el = cardRef.current;
      if (el) {
        anime({
          targets: el,
          translateX: 0,
          translateY: 0,
          rotate: 0,
          duration: 250,
          easing: "easeOutQuad",
        });
      }
    }
  }, [drag.isDragging, drag.x, current, categoryIdsSorted, runExitAnimation, handleExclude, assignToCategory]);

  const handlePillClick = useCallback(
    (cat: CategoryId) => {
      if (!current) return;
      const el = cardRef.current;
      const doAssign = () => assignToCategory(cat);
      if (el) {
        setExitDirection("right");
        anime({
          targets: el,
          translateX: 300,
          opacity: 0,
          duration: 220,
          easing: "easeOutQuad",
          complete: doAssign,
        });
      } else {
        doAssign();
      }
    },
    [current, assignToCategory]
  );

  const handleExcludeClick = useCallback(() => {
    if (!current) return;
    const el = cardRef.current;
    const doExclude = () => {
      handleExclude();
      advanceToNext();
    };
    if (el) {
      setExitDirection("left");
      anime({
        targets: el,
        translateX: -300,
        opacity: 0,
        duration: 220,
        easing: "easeOutQuad",
        complete: doExclude,
      });
    } else {
      doExclude();
    }
  }, [current, handleExclude, advanceToNext]);

  if (!current) {
    return null;
  }

  const meaningful = getMeaningfulDescription(current);
  const showMeaningful = meaningful !== getDisplayDescription(current);
  const rotation = drag.isDragging ? (drag.x * DRAG_ROTATION) / 200 : 0;

  return (
    <div ref={containerRef} className="w-full max-w-lg mx-auto">
      <div className="relative flex flex-col items-center min-h-[380px]">
        {/* Swipe hints */}
        {drag.isDragging && (
          <>
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 rounded-xl border-2 border-[var(--destructive)]/60 bg-[var(--destructive)]/10 px-4 py-2 text-[var(--destructive)] transition-opacity duration-150"
              style={{ opacity: drag.x < -50 ? 1 : 0.3 }}
            >
              <ThumbsDown className="h-6 w-6" />
              <span className="font-semibold">Exclude</span>
            </div>
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 rounded-xl border-2 border-[var(--primary)]/60 bg-[var(--primary)]/10 px-4 py-2 text-[var(--primary)] transition-opacity duration-150"
              style={{ opacity: drag.x > SWIPE_THRESHOLD ? 1 : 0.3 }}
            >
              <ThumbsUp className="h-6 w-6" />
              <span className="font-semibold">Drag to a category</span>
            </div>
          </>
        )}

        {/* Card stack: next card peek */}
        {queue[index + 1] && (
          <div
            className="absolute w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg scale-95 opacity-60"
            style={{ top: 8, zIndex: 0 }}
          >
            <p className="text-sm text-[var(--muted-foreground)] truncate">
              {getDisplayDescription(queue[index + 1])}
            </p>
            <p className="text-lg font-semibold tabular-nums mt-1">
              {queue[index + 1].amount >= 0 ? "+" : ""}${queue[index + 1].amount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Draggable current card */}
        <div
          ref={cardRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full max-w-md rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] p-6 shadow-xl cursor-grab active:cursor-grabbing touch-none select-none"
          style={{
            zIndex: 1,
            transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
            transition: drag.isDragging ? "none" : "transform 0.25s ease-out",
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
            {isIncome ? "Income" : "Expense"}
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)] break-words">
            {getDisplayDescription(current)}
          </p>
          {showMeaningful && meaningful && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1 truncate" title={meaningful}>
              → {meaningful}
            </p>
          )}
          <p
            className={`text-2xl font-bold tabular-nums mt-4 ${
              current.amount >= 0 ? "text-[var(--primary)]" : "text-[var(--destructive)]"
            }`}
          >
            {current.amount >= 0 ? "+" : ""}${current.amount.toFixed(2)}
          </p>
          {groupSize > 1 && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 overflow-hidden">
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted-foreground)] cursor-pointer hover:bg-[var(--secondary)]/50">
                <input
                  type="checkbox"
                  checked={applyToGroup}
                  onChange={(e) => setApplyToGroup(e.target.checked)}
                  className="rounded border-[var(--border)] bg-[var(--card)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="font-medium">Apply to all {groupSize} similar</span>
              </label>
              <div className="max-h-32 overflow-y-auto border-t border-[var(--border)]">
                {groupInQueue.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm border-b border-[var(--border)]/50 last:border-b-0"
                  >
                    <span className="truncate text-[var(--foreground)]" title={getDisplayDescription(tx)}>
                      {getDisplayDescription(tx)}
                    </span>
                    <span
                      className={`shrink-0 tabular-nums font-medium ${
                        tx.amount >= 0 ? "text-[var(--primary)]" : "text-[var(--destructive)]"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category pills: drag target or tap. Recommended first, much larger and highlighted. */}
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mt-6 mb-2 text-center">
        Swipe left to exclude · Swipe right and drop on a category
      </p>
      <div className="flex flex-col items-stretch gap-3">
        {recommendedId && categoryIdsSorted[0] === recommendedId && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Suggested for this transaction
            </span>
            <button
              ref={(el) => { pillRefs.current[0] = el; }}
              type="button"
              onClick={() => handlePillClick(recommendedId)}
              className={`w-full rounded-2xl border-2 px-6 py-4 text-base font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
                drag.isDragging && dropTargetIndex === 0
                  ? "border-[var(--primary)] bg-[var(--primary)]/25 scale-[1.02] shadow-xl shadow-[var(--primary)]/25"
                  : "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 hover:shadow-lg hover:shadow-[var(--primary)]/10"
              }`}
              style={{
                borderLeftWidth: "6px",
                borderLeftColor: getCategoryColor(recommendedId),
              }}
            >
              {(() => {
                const Icon = getCategoryIcon(recommendedId);
                return <Icon className="h-6 w-6 shrink-0" />;
              })()}
              {getCategoryLabel(recommendedId)}
            </button>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {categoryIdsSorted.map((cat, i) => {
            const isRecommended = cat === recommendedId;
            if (isRecommended && recommendedId && categoryIdsSorted[0] === recommendedId) {
              return null;
            }
            const isDropTarget = drag.isDragging && dropTargetIndex === i;
            const Icon = getCategoryIcon(cat);
            return (
              <button
                key={cat}
                ref={(el) => { pillRefs.current[i] = el; }}
                type="button"
                onClick={() => handlePillClick(cat)}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDropTarget
                    ? "border-[var(--primary)] bg-[var(--primary)]/20 scale-110 shadow-lg shadow-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50 hover:scale-105 hover:shadow-md"
                }`}
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: getCategoryColor(cat),
                  color: isDropTarget ? "var(--primary)" : "var(--foreground)",
                }}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleExcludeClick}
        className="flex items-center justify-center gap-2 w-full mt-4 rounded-xl border-2 border-dashed border-[var(--border)] bg-transparent px-4 py-3 text-sm font-medium text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
      >
        <Ban className="h-4 w-4" />
        Don&apos;t include
      </button>
    </div>
  );
}
