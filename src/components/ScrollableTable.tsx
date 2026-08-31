"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollableTableProps {
  children: ReactNode;
  className?: string;
}

export function ScrollableTable({ children, className = "" }: ScrollableTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false);
  const [hasRightOverflow, setHasRightOverflow] = useState(false);

  const updateOverflow = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    setHasLeftOverflow(hasOverflow && container.scrollLeft > 1);
    setHasRightOverflow(hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateOverflow();

    const container = scrollRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateOverflow]);

  return (
    <div className={`scrollable-table ${className}`}>
      <div ref={scrollRef} className="scrollable-table-viewport" onScroll={updateOverflow}>
        {children}
      </div>
      {hasLeftOverflow && <span className="scrollable-table-edge scrollable-table-edge-left" aria-hidden="true" />}
      {hasRightOverflow && <span className="scrollable-table-edge scrollable-table-edge-right" aria-hidden="true" />}
    </div>
  );
}
