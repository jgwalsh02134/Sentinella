"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Draggable bottom sheet with three detents: peek (a strip of glanceable
 * content), half, and full. Lives inside a `position: relative` container
 * and never exceeds it, so a fixed map screen keeps the page scroll-free —
 * dragging the sheet moves the sheet, panning the map pans the map, and
 * neither ever scrolls the document.
 *
 * Drag starts only on the grab-handle zone; the content area scrolls
 * natively (only meaningful at the full detent). Tapping the handle cycles
 * detents for keyboard and switch-control users. The height transition is
 * 200ms ease-out and collapses under prefers-reduced-motion.
 */
export type SheetDetent = "peek" | "half" | "full";

export function sheetHeights(containerHeight: number, peekHeight: number) {
  return {
    peek: peekHeight,
    half: Math.round(containerHeight * 0.5),
    full: Math.max(peekHeight, containerHeight - 8),
  } as const;
}

export default function BottomSheet({
  detent,
  onDetentChange,
  peekHeight = 96,
  label,
  children,
}: {
  detent: SheetDetent;
  onDetentChange: (next: SheetDetent) => void;
  /** Height of the peek detent in px (~96 fits a handle + one live line). */
  peekHeight?: number;
  /** Accessible name for the sheet region. */
  label: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const dragRef = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    const measure = () => setContainerH(parent.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const heights = sheetHeights(containerH, peekHeight);
  const height = dragHeight ?? heights[detent];
  const dragging = dragHeight !== null;

  function snapTo(h: number) {
    const order: SheetDetent[] = ["peek", "half", "full"];
    let nearest: SheetDetent = "peek";
    for (const d of order) {
      if (Math.abs(heights[d] - h) < Math.abs(heights[nearest] - h)) nearest = d;
    }
    onDetentChange(nearest);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { pointerId: e.pointerId, startY: e.clientY, startHeight: heights[detent] };
    movedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dy = drag.startY - e.clientY;
    if (Math.abs(dy) > 4) movedRef.current = true;
    setDragHeight(Math.min(heights.full, Math.max(heights.peek, drag.startHeight + dy)));
  }

  function onPointerEnd(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (movedRef.current && dragHeight !== null) {
      snapTo(dragHeight);
    } else {
      // Treated as a tap: cycle detents so the sheet works without dragging.
      onDetentChange(detent === "peek" ? "half" : detent === "half" ? "full" : "peek");
    }
    setDragHeight(null);
  }

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={label}
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-strong bg-card"
      style={{
        height: containerH > 0 ? height : peekHeight,
        transition: dragging || reduceMotion ? "none" : "height 200ms ease-out",
      }}
      data-detent={detent}
    >
      <button
        type="button"
        aria-label={
          detent === "full" ? "Collapse map details" : "Expand map details"
        }
        aria-expanded={detent !== "peek"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onDetentChange(detent === "peek" ? "half" : "full");
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onDetentChange(detent === "full" ? "half" : "peek");
          }
        }}
        className="flex min-h-11 w-full shrink-0 touch-none items-center justify-center rounded-t-2xl"
      >
        <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-line" />
      </button>
      <div
        className={`min-h-0 flex-1 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] ${
          detent === "full" ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
