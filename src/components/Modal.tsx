"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Accessible dialog: labelled by its title, closes on Escape, restores focus
 * to the trigger, and locks background scroll while open.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const headingId = `modal-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--color-scrim)] p-4 sm:items-center">
      <button type="button" aria-label="Close dialog" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="card-surface relative z-10 my-auto w-full max-w-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-hairline)] px-6 py-4">
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost h-11 w-11 border-0 px-0" aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
