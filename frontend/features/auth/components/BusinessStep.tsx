import {
  BUSINESS_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../constants";
import type { BusinessFormValues } from "../types";
import { isBusinessStepValid } from "../utils";

type BusinessStepProps = {
  values: BusinessFormValues;
  onChange: (patch: Partial<BusinessFormValues>) => void;
  onBack: () => void;
  onCreate: () => void;
};

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#1A1917]";

const inputClass =
  "h-[40px] w-full rounded-[6px] border border-[#E6E3DC] bg-white px-3 text-[14px] text-[#1A1917] transition-colors focus:border-[#1F6F5C] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C]";

const selectClass = `${inputClass} appearance-none pr-8`;

function SelectChevron({ compact = false }: { compact?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#737067]">
      <svg
        className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export function BusinessStep({ values, onChange, onBack, onCreate }: BusinessStepProps) {
  const canCreate = isBusinessStepValid(values);

  return (
    <div className="w-full space-y-4">
      <div className="mb-2 rounded-[6px] border border-[#1F6F5C]/20 bg-[#E8F1EE] p-3">
        <div className="text-[12px] font-medium text-[#1F6F5C]">Workspace Setup</div>
        <div className="mt-0.5 text-[11px] text-[#175647]">
          Configure your primary trade currency, timezone, and business profile.
        </div>
      </div>

      <div>
        <label htmlFor="business_name" className={labelClass}>
          Business name
        </label>
        <input
          id="business_name"
          type="text"
          value={values.businessName}
          onChange={(event) => onChange({ businessName: event.target.value })}
          className={inputClass}
          placeholder="e.g. Al-Madina Traders"
        />
      </div>

      <div>
        <label htmlFor="business_type" className={labelClass}>
          Business type
        </label>
        <div className="relative">
          <select
            id="business_type"
            value={values.businessType}
            onChange={(event) => onChange({ businessType: event.target.value })}
            className={selectClass}
          >
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      <div>
        <label htmlFor="city" className={labelClass}>
          City
        </label>
        <input
          id="city"
          type="text"
          value={values.city}
          onChange={(event) => onChange({ city: event.target.value })}
          className={inputClass}
          placeholder="e.g. Karachi, Lahore, Faisalabad"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="currency" className={labelClass}>
            Currency
          </label>
          <div className="relative">
            <select
              id="currency"
              value={values.currency}
              onChange={(event) => onChange({ currency: event.target.value })}
              className={`${selectClass} font-mono`}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <SelectChevron compact />
          </div>
          <span className="mt-1 block font-mono text-[11px] text-[#737067]">Default ledger</span>
        </div>

        <div>
          <label htmlFor="timezone" className={labelClass}>
            Timezone
          </label>
          <div className="relative">
            <select
              id="timezone"
              value={values.timezone}
              onChange={(event) => onChange({ timezone: event.target.value })}
              className={`${selectClass} font-mono text-[13px]`}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <SelectChevron compact />
          </div>
          <span className="mt-1 block font-mono text-[11px] text-[#737067]">GMT+5 standard</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-2 py-2 text-[13px] font-medium text-[#737067] transition-colors hover:text-[#1A1917]"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate}
          className={`h-[40px] flex-1 rounded-[6px] text-[14px] font-medium transition-colors ${
            canCreate
              ? "cursor-pointer bg-[#1F6F5C] text-white shadow-sm hover:bg-[#175647]"
              : "cursor-not-allowed bg-[#E6E3DC] text-[#9E9B91]"
          }`}
        >
          Create workspace
        </button>
      </div>

      <div className="pt-2 text-center">
        <p className="text-[12px] text-[#737067]">
          Setting up for multiple godowns? You can add warehouses in Settings.
        </p>
      </div>
    </div>
  );
}
