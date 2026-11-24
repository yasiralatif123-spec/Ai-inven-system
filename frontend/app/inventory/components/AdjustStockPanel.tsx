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
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest xl:sticky xl:top-20">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[15px]">edit_note</span>
          </span>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Adjust Stock</h2>
            <span className="font-mono-data-sm text-mono-data-sm text-secondary">
              Audit-logged stock adjustment
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close adjust stock panel"
          className="flex h-7 w-7 items-center justify-center rounded text-secondary transition-colors hover:bg-surface-container-highest disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex items-start gap-2 border-b border-[#F4E3C4] bg-[#FDF6E8]/60 px-4 py-2.5">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-[#B47818]">gavel</span>
        <p className="font-mono-data-sm text-mono-data-sm leading-tight text-on-surface">
          All adjustments are permanently logged to the immutable audit trail and immediately impact
          financial ledger balance valuations.
        </p>
      </div>

      <form className="space-y-3.5 p-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1 rounded border border-outline-variant bg-surface-container p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Selected SKU</span>
            <span className="font-mono-data-sm text-mono-data-sm font-semibold text-primary">{row.sku}</span>
          </div>
          <span className="truncate font-body-medium text-body-medium font-semibold text-on-surface">
            {row.name}
          </span>
          <div className="flex items-center justify-between gap-2 border-t border-outline-variant pt-1 font-mono-data-sm text-mono-data-sm">
            <span className="truncate text-secondary">
              Depot: <strong className="text-on-surface">{row.warehouse}</strong>
            </span>
            <span className="shrink-0 text-on-surface">
              Cost: <strong>{formatRs(row.purchasePrice)} / Piece</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-outline-variant bg-surface-container-low p-2.5">
            <span className="block font-label-caps text-[10px] uppercase text-secondary">
              Current Physical Balance
            </span>
            <span className="mt-1 block font-mono-data text-[15px] font-bold text-on-surface">
              {formatNumber(row.available)} pcs
            </span>
            <span className="block font-mono-data-sm text-[10px] text-secondary">{row.stockDisplay}</span>
            <span
              className={`font-mono-data-sm text-[10px] font-semibold ${
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
          <div className="rounded border border-outline-variant bg-surface-container-low p-2.5">
            <span className="block font-label-caps text-[10px] uppercase text-secondary">
              New Projected Stock
            </span>
            <span className="mt-1 block font-mono-data text-[15px] font-bold text-primary">
              {formatNumber(projected)} pcs
            </span>
            <span className="font-mono-data-sm text-[10px] font-medium text-secondary">
              {delta} pcs (Net)
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
            Adjustment Direction
          </label>
          <div className="grid grid-cols-2 gap-1.5 rounded border border-outline-variant bg-surface-container p-1">
            <button
              type="button"
              onClick={() => changeDirection("deduct")}
              className={`flex items-center justify-center gap-1 rounded py-1 font-body-medium text-body-medium transition-colors ${
                direction === "deduct"
                  ? "border border-outline-variant bg-surface-container-lowest font-semibold text-error shadow-sm"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">remove_circle</span>
              Stock Deduction (-)
            </button>
            <button
              type="button"
              onClick={() => changeDirection("add")}
              className={`flex items-center justify-center gap-1 rounded py-1 font-body-medium text-body-medium transition-colors ${
                direction === "add"
                  ? "border border-outline-variant bg-surface-container-lowest font-semibold text-primary shadow-sm"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">add_circle</span>
              Stock Addition (+)
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
            Quantity to {direction === "deduct" ? "Deduct" : "Add"} <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div className="flex h-[34px] w-full overflow-hidden rounded border border-outline-variant bg-surface-container-lowest focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container">
              <input
                className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono-data text-base font-bold text-on-surface focus:outline-none disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                  className="flex h-1/2 items-center justify-center text-secondary transition-colors hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
                </button>
                <button
                  type="button"
                  onClick={() => stepQuantity(-1)}
                  disabled={saving || quantity <= 1}
                  aria-label="Decrease quantity by one"
                  className="flex h-1/2 items-center justify-center border-t border-outline-variant text-secondary transition-colors hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                </button>
              </div>
            </div>
            <select
              value={unit}
              onChange={(event) => changeUnit(event.target.value as StockUnit)}
              disabled={saving}
              className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2 font-mono-data text-sm focus:border-primary-container focus:outline-none"
            >
              {STOCK_UNITS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 font-mono-data-sm text-mono-data-sm text-secondary">
            1 {unit} = {toBasePieces(1, unit)} pieces. Equivalent: {formatNumber(quantityInPieces)} pcs.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
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
              className="h-[34px] w-full cursor-pointer appearance-none rounded border border-outline-variant bg-surface-container-lowest pl-2.5 pr-8 font-body-default text-body-default text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-60"
            >
              {ADJUSTMENT_REASONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2 text-[18px] text-secondary">
              arrow_drop_down
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
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
            className="h-[34px] w-full rounded border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-60"
            placeholder="e.g. INC-2026-092 or AUD-Q4"
            type="text"
          />
        </div>

        <div>
          <label className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
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
            className="w-full resize-none rounded border border-outline-variant bg-surface-container-lowest p-2.5 font-body-dense text-body-dense text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-60"
            placeholder="Specify cause, bay coordinates, affected batch number..."
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between rounded border border-outline-variant bg-surface-container-low p-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
            <div className="flex flex-col">
              <span className="font-label-caps text-[10px] uppercase text-secondary">
                Authorized Sign-off
              </span>
              <span className="font-body-medium text-body-medium font-semibold text-on-surface">
                System
              </span>
            </div>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">Audit enabled</span>
        </div>

        {error ? (
          <div className="rounded border border-[#F7D1CD] bg-[#FDF0EE] px-2.5 py-2 font-body-dense text-body-dense text-[#BA3C34]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded border border-[#D1E8DC] bg-[#EBF5F0] px-2.5 py-2 font-body-dense text-body-dense text-[#2E7D58]">
            {success}
          </div>
        ) : null}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 w-1/3 rounded border border-outline-variant bg-surface-container-lowest font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || quantity < 1}
            className="flex h-9 w-2/3 items-center justify-center gap-1.5 rounded bg-primary-container font-body-medium text-body-medium font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {saving ? "hourglass_top" : "verified"}
            </span>
            <span>{saving ? "Committing..." : "Commit Adjustment"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
