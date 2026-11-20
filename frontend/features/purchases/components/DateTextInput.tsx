"use client";

import { useState } from "react";
import { formatDate, toIsoDate } from "../utils";

type DateTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

export function DateTextInput({ value, onChange, ariaLabel }: DateTextInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (!trimmed) return;

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return;

    const iso = toIsoDate(parsed);
    if (iso !== value) onChange(iso);
  }

  return (
    <input
      value={editing ? draft : formatDate(value)}
      onFocus={() => {
        setDraft(formatDate(value));
        setEditing(true);
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
      }}
      aria-label={ariaLabel}
      placeholder="16 Nov 2026"
      className="h-10 w-full rounded bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
    />
  );
}
