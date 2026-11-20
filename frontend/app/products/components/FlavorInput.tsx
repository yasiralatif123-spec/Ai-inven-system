"use client";

import { useState, type KeyboardEvent } from "react";

type FlavorInputProps = {
  value: string[];
  onChange: (flavors: string[]) => void;
  id?: string;
};

const CHIP_CLASS =
  "inline-flex items-center gap-1 rounded border border-outline-variant bg-surface-container px-2 py-1 font-body-dense text-body-dense text-on-surface";
const INPUT_CLASS =
  "h-[34px] min-w-[180px] flex-1 rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";

export function FlavorInput({ value, onChange, id }: FlavorInputProps) {
  const [draft, setDraft] = useState("");

  function addFlavor() {
    const flavor = draft
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);
    setDraft("");
    if (!flavor) return;
    if (value.some((item) => item.toLowerCase() === flavor.toLowerCase())) return;
    onChange([...value, flavor]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFlavor();
      return;
    }
    if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((flavor) => (
            <span key={flavor} className={CHIP_CLASS}>
              <span className="material-symbols-outlined text-[14px] text-primary">local_offer</span>
              {flavor}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== flavor))}
                aria-label={`Remove flavor ${flavor}`}
                className="flex h-4 w-4 items-center justify-center rounded text-secondary transition-colors hover:bg-surface-container-high hover:text-error"
              >
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Plain, Chocolate, Strawberry"
          autoComplete="off"
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={addFlavor}
          className="flex h-[34px] items-center gap-1 rounded border border-outline-variant bg-surface-container px-3 font-body-medium text-body-medium text-primary transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add flavor
        </button>
      </div>
      <p className="font-mono-data-sm text-mono-data-sm text-secondary">
        Optional. Press Enter to add each flavor. Inventory is tracked at product level, not per flavor.
      </p>
    </div>
  );
}
