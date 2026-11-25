"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useBrandSearch } from "../hooks/useBrandSearch";
import type { Brand } from "../types";

type BrandAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (brandId: string, brand: Brand | null) => void;
  selectedBrand?: Brand | null;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-dense text-on-surface placeholder:text-on-surface-variant/70 outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary";

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

/**
 * Searchable brand picker. Mirrors the sale-order product autocomplete's
 * interaction pattern, but queries the brands API with a debounced, bounded
 * search so large catalogs are filtered on the server.
 */
export function BrandAutocomplete({
  id = "brand",
  value,
  onChange,
  selectedBrand = null,
  placeholder = "Search brands or choose No Brand",
  required = false,
  className = "",
}: BrandAutocompleteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const {
    input,
    setInput,
    brands,
    total,
    loading,
    error,
    searching,
    hasMore,
    loadMore,
  } = useBrandSearch();

  const displayValue = open ? input : value ? selectedBrand?.name || "" : "";
  const optionCount = brands.length + 1; // "No Brand" plus the matching brands.

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.max(rect.width, 260);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const maxHeight = Math.min(256, Math.max(120, Math.max(spaceBelow, spaceAbove)));
      const top =
        spaceBelow >= 160 || spaceBelow >= spaceAbove
          ? rect.bottom + 4
          : Math.max(8, rect.top - maxHeight - 4);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

      setPosition({ top, left, width, maxHeight });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  function openDropdown() {
    // Start each interaction from the default list; the selected name is shown
    // again when the dropdown closes.
    if (!open) setInput("");
    setActiveIndex(-1);
    setOpen(true);
  }

  function selectBrand(brand: Brand | null) {
    // Only the chosen brandId is saved. Typed search text is never used as a brand.
    onChange(brand?._id || "", brand);
    setOpen(false);
    setActiveIndex(-1);
    setInput("");
    inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
      setInput("");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setInput("");
        setOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((current) => Math.min(current + 1, optionCount - 1));
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setInput("");
        setOpen(true);
      } else {
        setActiveIndex((current) => Math.max(current - 1, -1));
      }
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      if (activeIndex >= 0) {
        selectBrand(activeIndex === 0 ? null : brands[activeIndex - 1] || null);
      } else if (brands.length > 0) {
        selectBrand(brands[0]);
      }
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface"
        htmlFor={id}
      >
        Brand / Manufacturer
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <div className="relative min-w-0">
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            value={displayValue}
            onChange={(event) => {
              setInput(event.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onFocus={openDropdown}
            onClick={openDropdown}
            onBlur={() => {
              setOpen(false);
              setActiveIndex(-1);
              setInput("");
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Brand / Manufacturer"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={
              open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
            }
            autoComplete="off"
            className={`${INPUT_CLASS} pr-9`}
          />
          <button
            type="button"
            aria-label="Show brands"
            onMouseDown={(event) => event.preventDefault()}
            onClick={openDropdown}
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant transition duration-200 hover:bg-row-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[15px]">expand_more</span>
          </button>
        </div>

        {error ? (
          <span className="font-body-dense text-body-dense text-error">
            {error} <Link href="/brands" className="underline">Manage brands</Link>
          </span>
        ) : null}

        {open && position && typeof document !== "undefined"
          ? createPortal(
              <div
                id={listId}
                role="listbox"
                aria-label="Brands"
                style={{
                  top: position.top,
                  left: position.left,
                  width: position.width,
                  maxHeight: position.maxHeight,
                }}
                className="fixed z-[200] overflow-y-auto rounded-xl border border-outline-variant/80 bg-surface-container-lowest py-1 shadow-panel"
                onMouseDown={(event) => event.preventDefault()}
              >
                <div className="flex items-center justify-between gap-2 border-b border-outline-variant/70 bg-surface-container-low px-3 py-2 font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">
                  <span>{input.trim() ? "Matching brands" : "Available brands"}</span>
                  {searching ? (
                    <span className="flex items-center gap-1.5 normal-case tracking-normal">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
                      Searching...
                    </span>
                  ) : null}
                </div>

                <button
                  id={`${listId}-option-0`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === 0}
                  onClick={() => selectBrand(null)}
                  onMouseEnter={() => setActiveIndex(0)}
                  className={`flex w-full items-center justify-between gap-2 border-b border-outline-variant/60 px-3 py-2.5 text-left transition duration-200 last:border-b-0 ${
                    activeIndex === 0
                      ? "bg-primary-container/10"
                      : "hover:bg-row-hover focus-visible:bg-row-hover focus-visible:outline-none"
                  }`}
                >
                  <span className="font-body-medium text-body-medium text-on-surface">
                    No Brand
                  </span>
                  <span className="font-body-dense text-body-dense text-on-surface-variant">
                    Clear selection
                  </span>
                </button>

                {brands.map((brand, index) => {
                  const optionIndex = index + 1;
                  return (
                    <button
                      key={brand._id}
                      id={`${listId}-option-${optionIndex}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === optionIndex}
                      onClick={() => selectBrand(brand)}
                      onMouseEnter={() => setActiveIndex(optionIndex)}
                      className={`flex w-full flex-col gap-0.5 border-b border-outline-variant/60 px-3 py-2.5 text-left transition duration-200 last:border-b-0 ${
                        activeIndex === optionIndex
                          ? "bg-primary-container/10"
                          : "hover:bg-row-hover focus-visible:bg-row-hover focus-visible:outline-none"
                      }`}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="truncate font-body-medium text-body-medium text-on-surface">
                          {brand.name}
                        </span>
                        {brand.isActive ? null : (
                          <span className="shrink-0 font-label-caps text-[10px] uppercase text-on-surface-variant">
                            Inactive
                          </span>
                        )}
                      </span>
                      {brand.description ? (
                        <span className="truncate font-body-dense text-body-dense text-on-surface-variant">
                          {brand.description}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                {brands.length === 0 && !searching ? (
                  <div className="px-3 py-2.5 font-body-dense text-body-dense text-on-surface-variant">
                    {error ? (
                      `Brands unavailable: ${error}`
                    ) : input.trim() ? (
                      "No brands found"
                    ) : total === 0 ? (
                      <>
                        No active brands yet.{" "}
                        <Link href="/brands" className="text-primary underline">
                          Add a brand
                        </Link>{" "}
                        before selecting one.
                      </>
                    ) : (
                      "No brands found"
                    )}
                  </div>
                ) : null}

                {hasMore && !error ? (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="flex w-full items-center justify-center gap-2 border-t border-outline-variant/70 bg-surface-container-low px-3 py-2 font-body-dense text-body-dense text-primary transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {loading ? "Loading more..." : "Show more brands"}
                  </button>
                ) : null}
              </div>,
              document.body
            )
          : null}
      </div>
    </div>
  );
}
