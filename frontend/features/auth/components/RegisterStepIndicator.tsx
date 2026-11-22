import type { RegisterStep } from "../types";

type RegisterStepIndicatorProps = {
  step: RegisterStep;
  onStepChange: (step: 1 | 2) => void;
};

const tabBase = "relative pb-3 -mb-3 transition-colors border-b-2";
const activeTab = `${tabBase} font-semibold text-[#1F6F5C] border-[#1F6F5C]`;
const inactiveTab = `${tabBase} text-[#737067] hover:text-[#1A1917] border-transparent`;

const pillBase = "text-[11px] font-medium px-2.5 py-1 rounded-[4px]";
const activePill = `${pillBase} bg-white text-[#1F6F5C] shadow-sm`;
const inactivePill = `${pillBase} text-[#737067] hover:text-[#1A1917]`;

export function RegisterStepIndicator({ step, onStepChange }: RegisterStepIndicatorProps) {
  const doneIsActive = step === 3;

  return (
    <>
      <div className="mb-8 flex items-center gap-6 border-b border-[#E6E3DC] pb-3 text-[13px] font-medium">
        <button
          type="button"
          onClick={() => onStepChange(1)}
          className={step === 1 ? activeTab : inactiveTab}
        >
          1 Account
        </button>
        <span className="select-none text-[#9E9B91]">·</span>
        <button
          type="button"
          onClick={() => onStepChange(2)}
          className={step === 2 ? activeTab : inactiveTab}
        >
          2 Business
        </button>
        <span className="select-none text-[#9E9B91]">·</span>
        <span
          className={`pb-3 -mb-3 ${
            doneIsActive ? "font-semibold text-[#1F6F5C]" : "cursor-default text-[#9E9B91]"
          }`}
        >
          3 Done
        </span>
      </div>

      <div className="mb-7 flex max-w-[420px] items-center justify-between rounded-[6px] border border-[#E6E3DC] bg-[#EFEDE7] p-1">
        <span className="px-2.5 font-mono text-[11px] text-[#737067]">VIEWING STEP</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onStepChange(1)}
            className={step === 1 ? activePill : inactivePill}
          >
            Step 1: Account
          </button>
          <button
            type="button"
            onClick={() => onStepChange(2)}
            className={step === 2 ? activePill : inactivePill}
          >
            Step 2: Business
          </button>
        </div>
      </div>
    </>
  );
}
