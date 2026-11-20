"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatFlavors, toFlavorArray } from "../lib/flavors";

type FlavorMultiSelectProps = {
  options: string[];
  value: string[];
  onChange: (flavors: string[]) => void;
  ariaLabel: string;
  compact?: boolean;
  align?: "left" | "right";
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function FlavorMultiSelect({
  options,
  value,
  onChange,
  ariaLabel,
  compact = false,
  align = "left",
}: FlavorMultiSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const selected = toFlavorArray(value);
  const allOptions = [...options];

  for (const flavor of selected) {
    if (!allOptions.some((option) => option.toLowerCase() === flavor.toLowerCase())) {
      allOptions.push(flavor);
    }
  }

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.max(rect.width, 190);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const maxHeight = Math.min(220, Math.max(120, Math.max(spaceBelow, spaceAbove)));
      const top =
        spaceBelow >= 140 || spaceBelow >= spaceAbove
          ? rect.bottom + 4
          : Math.max(8, rect.top - maxHeight - 4);
      const rawLeft = align === "right" ? rect.right - width : rect.left;
      const left = Math.max(8, Math.min(rawLeft, window.innerWidth - width - 8));

      setPosition({ top, left, width, maxHeight });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function isSelected(flavor: string) {
    return selected.some((item) => item.toLowerCase() === flavor.toLowerCase());
  }

  function toggle(flavor: string) {
    if (isSelected(flavor)) {
      onChange(selected.filter((item) => item.toLowerCase() !== flavor.toLowerCase()));
    } else {
      onChange([...selected, flavor]);
    }
  }

  if (allOptions.length === 0) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-1 rounded border border-outline-variant bg-surface-container-lowest text-left text-on-surface transition-colors hover:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container ${
          compact
            ? "h-8 px-2 font-body-dense text-body-dense"
            : "h-[34px] px-2.5 font-body-default text-body-default"
        }`}
      >
        <span className="truncate">
          {selected.length > 0 ? formatFlavors(selected) : "No flavor"}
        </span>
        <span className="material-symbols-outlined shrink-0 text-[16px] text-secondary">
          expand_more
        </span>
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dropdownRef}
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              className="fixed z-[350] overflow-y-auto rounded border border-outline-variant bg-surface-container-lowest p-1.5 shadow-lg"
            >
              <div className="mb-1 flex items-center justify-between border-b border-outline-variant px-1 pb-1">
                <span className="font-label-caps text-label-caps uppercase text-secondary">
                  Select flavors
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close flavor selector"
                  className="text-secondary transition-colors hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              </div>
              {allOptions.map((flavor) => (
                <label
                  key={flavor}
                  className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 font-body-dense text-body-dense text-on-surface transition-colors hover:bg-surface-container"
                >
                  <input
                    type="checkbox"
                    checked={isSelected(flavor)}
                    onChange={() => toggle(flavor)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {flavor}
                </label>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
