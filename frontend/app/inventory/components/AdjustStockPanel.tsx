"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Product } from "../../products/types";
import { adjustStock } from "../services/inventory.service";
import {
  ADJUSTMENT_REASONS,
  type StockMovementDto,
  type StockRow,
} from "../data";
import { formatNumber, formatRs } from "../utils";
import { STOCK_UNITS, toBasePieces, type StockUnit } from "../../lib/units";

type AdjustStockPanelProps = {
  row: StockRow;
  onClose: () => void;
  onAdjusted: (product: Product, movement: StockMovementDto) => void;
};

type Direction = "deduct" | "add";

export function AdjustStockPanel({ row, onClose, onAdjusted }: AdjustStockPanelProps) {
  const [direction, setDirection] = useState<Direction>("deduct");
  const [unit, setUnit] = useState<StockUnit>("Piece");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<string>(ADJUSTMENT_REASONS[0]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const quantityInPieces = useMemo(() => toBasePieces(quantity, unit), [quantity, unit]);
  const maxQuantity =
    direction === "deduct"
      ? Math.max(0, Math.floor(row.available / (toBasePieces(1, unit) || 1)))
      : null;

  const projected = useMemo(() => {
    if (direction === "deduct") return Math.max(0, row.available - quantityInPieces);
    return row.available + quantityInPieces;
  }, [direction, quantityInPieces, row.available]);

  const delta = direction === "deduct" ? `-${quantityInPieces}` : `+${quantityInPieces}`;
  const belowMin = row.available < row.minSafety;

  function clampQuantity(value: number, minimum = 1) {
    const next = Math.max(minimum, Math.floor(value));
    return maxQuantity === null ? next : Math.min(next, Math.max(maxQuantity, minimum));
  }

  function changeQuantity(value: string) {
    const parsed = Number(value);
    setQuantity(Number.isFinite(parsed) ? clampQuantity(parsed, 0) : 0);
    setError(null);
    setSuccess(null);
  }

  function stepQuantity(change: number) {
    setQuantity((current) => clampQuantity(current + change));
    setError(null);
    setSuccess(null);
  }

  function changeDirection(next: Direction) {
    setDirection(next);
    setQuantity((current) => {
      const limit =
        next === "deduct"
          ? Math.max(1, Math.floor(row.available / (toBasePieces(1, unit) || 1)))
          : null;
      const base = Math.max(1, current || 1);
      return limit === null ? base : Math.min(base, Math.max(limit, 1));
    });
    setError(null);
    setSuccess(null);
  }

  function changeUnit(next: StockUnit) {
    setUnit(next);
    setQuantity((current) => {
      const limit =
        direction === "deduct"
          ? Math.max(0, Math.floor(row.available / (toBasePieces(1, next) || 1)))
          : null;
      const base = Math.max(1, current || 1);
      return limit === null ? base : Math.min(base, Math.max(limit, 1));
    });
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (quantity < 1) {
      setError("Enter a quantity of at least 1.");
      return;
    }
    if (quantityInPieces < 1) {
      setError("Selected quantity converts to 0 pieces.");
      return;
    }
    if (direction === "deduct" && quantityInPieces > row.available) {
      setError(`You can deduct at most ${formatNumber(row.available)} pieces.`);
      return;
    }
    if (!reference.trim()) {
      setError("Incident reference number is required.");
      return;
    }
    if (!notes.trim()) {
      setError("Incident detail / notes are required.");
      return;
    }

    try {
      setSaving(true);
      const result = await adjustStock(row.productId, {
        direction,
        quantity,
        unit,
        reason,
        reference: reference.trim(),
        notes: notes.trim(),
      });

      const updatedStock = Number(result.product.openingStock || 0);
      setSuccess(
        `Adjustment committed: ${formatNumber(row.available)} -> ${formatNumber(updatedStock)} pcs. Logged to the stock ledger.`
      );
      setQuantity(1);
      setReference("");
      setNotes("");
      onAdjusted(result.product, result.movement);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to adjust stock. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel xl:sticky xl:top-20">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant bg-surface-container px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
          </span>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Adjust Stock</h2>
            <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              Audit-logged stock adjustment
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close adjust stock panel"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition duration-200 hover:bg-surface-container-high disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <span className="material-symbols-outlined text-[19px]">close</span>
        </button>
      </div>

      <div className="flex items-start gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-3">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[17px] text-primary">gavel</span>
        <p className="font-mono-data-sm text-mono-data-sm leading-relaxed text-on-surface-variant">
          All adjustments are permanently logged to the immutable audit trail and immediately impact
          financial ledger balance valuations.
        </p>
      </div>

      <form className="space-y-4 p-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
              Selected SKU
            </span>
            <span className="font-mono-data-sm text-mono-data-sm font-semibold text-primary">{row.sku}</span>
          </div>
          <span className="truncate font-body-medium text-body-medium font-semibold text-on-surface">
            {row.name}
          </span>
          <div className="flex items-center justify-between gap-2 border-t border-outline-variant pt-2 font-mono-data-sm text-mono-data-sm">
            <span className="truncate text-on-surface-variant">
              Depot: <strong className="text-on-surface">{row.warehouse}</strong>
            </span>
            <span className="shrink-0 text-on-surface">
              Cost: <strong>{formatRs(row.purchasePrice)} / Piece</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
            <span className="block font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
              Current Physical Balance
            </span>
            <span className="mt-1 block font-mono-data text-base font-bold tabular-nums text-on-surface">
              {formatNumber(row.available)} pcs
            </span>
            <span className="block font-mono-data-sm text-mono-data-sm text-on-surface-variant">{row.stockDisplay}</span>
            <span
              className={`font-mono-data-sm text-mono-data-sm font-semibold ${
                belowMin ? "text-error" : "text-primary"
              }`}
            >
              {row.minSafety
                ? belowMin
                  ? `Below Min (${row.minSafety})`
                  : `At / Above Min (${row.minSafety})`
                : "No safety threshold set"}
            </span>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
            <span className="block font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
              New Projected Stock
            </span>
            <span className="mt-1 block font-mono-data text-base font-bold tabular-nums text-primary">
              {formatNumber(projected)} pcs
            </span>
            <span className="font-mono-data-sm text-mono-data-sm font-medium text-on-surface-variant">
              {delta} pcs (Net)
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            Adjustment Direction
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-outline-variant bg-surface-container p-1.5">
            <button
              type="button"
              onClick={() => changeDirection("deduct")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-body-medium text-body-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                direction === "deduct"
                  ? "border border-outline-variant bg-surface-container-lowest font-semibold text-error shadow-panel"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">remove_circle</span>
              Stock Deduction (-)
            </button>
            <button
              type="button"
              onClick={() => changeDirection("add")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-body-medium text-body-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                direction === "add"
                  ? "border border-outline-variant bg-surface-container-lowest font-semibold text-primary shadow-panel"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              Stock Addition (+)
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            Quantity to {direction === "deduct" ? "Deduct" : "Add"} <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="flex h-9 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition duration-200 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
              <input
                className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono-data text-base font-bold tabular-nums text-on-surface focus:outline-none disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                max={maxQuantity ?? undefined}
                min={1}
                step={1}
                type="number"
                value={quantity}
                onChange={(event) => changeQuantity(event.target.value)}
                disabled={saving}
                aria-label={`Quantity to ${direction === "deduct" ? "deduct" : "add"}`}
              />
              <div className="flex w-8 flex-col border-l border-outline-variant">
                <button
                  type="button"
                  onClick={() => stepQuantity(1)}
                  disabled={saving || (maxQuantity !== null && quantity >= maxQuantity)}
                  aria-label="Increase quantity by one"
                  className="flex h-1/2 items-center justify-center text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[17px]">keyboard_arrow_up</span>
                </button>
                <button
                  type="button"
                  onClick={() => stepQuantity(-1)}
                  disabled={saving || quantity <= 1}
                  aria-label="Decrease quantity by one"
                  className="flex h-1/2 items-center justify-center border-t border-outline-variant text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[17px]">keyboard_arrow_down</span>
                </button>
              </div>
            </div>
            <select
              value={unit}
              onChange={(event) => changeUnit(event.target.value as StockUnit)}
              disabled={saving}
              className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-60"
            >
              {STOCK_UNITS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            1 {unit} = {toBasePieces(1, unit)} pieces. Equivalent: {formatNumber(quantityInPieces)} pcs.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            Reason Classification <span className="text-error">*</span>
          </label>
          <div className="relative">
            <select
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
                setSuccess(null);
              }}
              disabled={saving}
              className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-9 font-body-default text-body-default text-on-surface transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-60"
            >
              {ADJUSTMENT_REASONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[18px] text-on-surface-variant">
              arrow_drop_down
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            Incident Reference # <span className="text-error">*</span>
          </label>
          <input
            value={reference}
            onChange={(event) => {
              setReference(event.target.value);
              setError(null);
              setSuccess(null);
            }}
            disabled={saving}
            className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-60"
            placeholder="e.g. INC-2026-092 or AUD-Q4"
            type="text"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            Incident Detail / Notes <span className="text-error">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setError(null);
              setSuccess(null);
            }}
            disabled={saving}
            className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-body-default text-body-default text-on-surface placeholder:text-outline transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-60"
            placeholder="Specify cause, bay coordinates, affected batch number..."
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[19px] text-primary">badge</span>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
                Authorized Sign-off
              </span>
              <span className="font-body-medium text-body-medium font-semibold text-on-surface">
                System
              </span>
            </div>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Audit enabled</span>
        </div>

        {error ? (
          <div className="rounded-lg border border-error/30 bg-error-container/30 px-3 py-2 font-body-default text-body-default text-error">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-primary/20 bg-primary-fixed/20 px-3 py-2 font-body-default text-body-default text-on-primary-fixed">
            {success}
          </div>
        ) : null}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 w-1/3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || quantity < 1}
            className="flex h-9 w-2/3 items-center justify-center gap-1.5 rounded-lg bg-primary-container font-body-medium text-body-medium font-semibold text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[17px]">
              {saving ? "hourglass_top" : "verified"}
            </span>
            <span>{saving ? "Committing..." : "Commit Adjustment"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
