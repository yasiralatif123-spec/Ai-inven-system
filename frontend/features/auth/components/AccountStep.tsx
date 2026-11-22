"use client";

import { useState } from "react";
import Link from "next/link";
import type { AccountFormValues } from "../types";
import { doPasswordsMatch, isAccountStepValid, passwordStrength } from "../utils";

type AccountStepProps = {
  values: AccountFormValues;
  onChange: (patch: Partial<AccountFormValues>) => void;
  onContinue: () => void;
};

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#1A1917]";

const inputClass =
  "h-[40px] w-full rounded-[6px] border border-[#E6E3DC] bg-white px-3 text-[14px] text-[#1A1917] transition-colors focus:border-[#1F6F5C] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C]";

const emailInputClass =
  "h-[40px] w-full rounded-[6px] border-2 border-[#1F6F5C] bg-white px-3 text-[14px] text-[#1A1917] outline-none shadow-[0_0_0_2px_#1F6F5C]";

export function AccountStep({ values, onChange, onContinue }: AccountStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = passwordStrength(values.password);
  const hasMismatch = values.confirmPassword.length > 0 && !doPasswordsMatch(values);
  const isValid = isAccountStepValid(values);
  const continueDisabled = !values.termsAccepted || !isValid;

  const hint = !values.termsAccepted
    ? "(Tick checkbox above to activate Continue)"
    : !isValid
      ? "Fix the highlighted fields to continue"
      : "Click Continue to proceed to Step 2";

  const confirmInputClass = hasMismatch
    ? `${inputClass} border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]`
    : inputClass;

  return (
    <div className="w-full space-y-4">
      <div>
        <label htmlFor="full_name" className={labelClass}>
          Full name
        </label>
        <input
          id="full_name"
          type="text"
          value={values.fullName}
          onChange={(event) => onChange({ fullName: event.target.value })}
          className={inputClass}
          placeholder="e.g. Tariq Mahmood"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="email" className="mb-0 block text-[13px] font-medium text-[#1A1917]">
            Email address
          </label>
          <span className="font-mono text-[11px] text-[#1F6F5C]">Active focus ring</span>
        </div>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => onChange({ email: event.target.value })}
          className={emailInputClass}
          placeholder="you@company.pk"
        />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone number
        </label>
        <div className="flex overflow-hidden rounded-[6px] border border-[#E6E3DC] bg-white transition-colors focus-within:border-[#1F6F5C] focus-within:ring-2 focus-within:ring-[#1F6F5C]">
          <span className="inline-flex select-none items-center border-r border-[#E6E3DC] bg-[#F7F6F3] px-3 font-mono text-[13px] text-[#737067]">
            +92
          </span>
          <input
            id="phone"
            type="tel"
            value={values.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            className="h-[40px] w-full px-3 text-[14px] text-[#1A1917] focus:outline-none"
            placeholder="300 1234567"
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="mb-0 block text-[13px] font-medium text-[#1A1917]">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="text-[12px] font-medium text-[#737067] hover:text-[#1A1917]"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={values.password}
          onChange={(event) => onChange({ password: event.target.value })}
          className={inputClass}
          placeholder="Create password"
        />

        <div className="mt-2 flex items-center gap-1.5">
          {[0, 1, 2, 3].map((segment) => (
            <div
              key={segment}
              className={`h-1 flex-1 rounded-full ${
                segment < strength.filledSegments ? "bg-[#1F6F5C]" : "bg-[#E6E3DC]"
              }`}
            />
          ))}
          {strength.label ? (
            <span className="ml-1 font-mono text-[11px] text-[#1F6F5C]">{strength.label}</span>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-[#737067]">At least 8 characters, with a number</p>
      </div>

      <div>
        <label htmlFor="confirm_password" className={labelClass}>
          Confirm password
        </label>
        <input
          id="confirm_password"
          type="password"
          value={values.confirmPassword}
          onChange={(event) => onChange({ confirmPassword: event.target.value })}
          className={confirmInputClass}
          placeholder="Repeat password"
          aria-invalid={hasMismatch}
        />
        {hasMismatch ? (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]" role="alert">
            <span className="font-bold">✕</span> Passwords don&apos;t match
          </p>
        ) : null}
      </div>

      <div className="pt-2">
        <label className="flex cursor-pointer select-none items-start gap-2.5">
          <input
            id="terms-toggle"
            type="checkbox"
            checked={values.termsAccepted}
            onChange={(event) => onChange({ termsAccepted: event.target.checked })}
            className="mt-0.5 h-4 w-4 rounded-[4px] border-[#E6E3DC] accent-[#1F6F5C] focus:ring-[#1F6F5C]"
          />
          <span className="text-[13px] leading-tight text-[#737067]">
            I agree to the{" "}
            <a href="#" className="text-[#1F6F5C] underline hover:text-[#175647]">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#1F6F5C] underline hover:text-[#175647]">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled}
          className={`flex h-[40px] w-full items-center justify-center rounded-[6px] text-[14px] font-medium transition-all ${
            continueDisabled
              ? "cursor-not-allowed bg-[#E6E3DC] text-[#9E9B91]"
              : "cursor-pointer bg-[#1F6F5C] text-white shadow-sm hover:bg-[#175647]"
          }`}
        >
          Continue
        </button>
        <p
          id="terms-hint"
          className={`mt-1.5 text-center font-mono text-[11px] ${
            continueDisabled && values.termsAccepted ? "text-[#DC2626]" : "text-[#9E9B91]"
          }`}
        >
          {hint}
        </p>
      </div>

      <div className="pt-2 text-center">
        <p className="text-[13px] text-[#737067]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#1F6F5C] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
