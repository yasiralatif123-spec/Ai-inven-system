"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { resetPassword } from "../services/auth.service";
import { doPasswordsMatch, isPasswordValid, passwordStrength } from "../utils";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#1C1917]";
const inputClass =
  "h-[40px] w-full rounded-[6px] border border-[#E6E3DC] bg-white px-3 text-[14px] text-[#1C1917] transition duration-150 placeholder:text-[#8C877D] focus:border-[#1F6F5C] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C]";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);
  const passwordOk = isPasswordValid(password);
  const passwordsMatch = doPasswordsMatch(password, confirmPassword);
  const canSubmit = Boolean(token) && passwordOk && passwordsMatch && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ token, password, confirmPassword });
      router.push("/login?reset=1");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset password.";
      setError(message || "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="my-auto w-full max-w-[380px] pb-10 pt-8">
      <div className="mb-7">
        <h1 className="text-[24px] font-medium leading-tight tracking-tight text-[#1C1917]">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-[13.5px] font-normal leading-relaxed text-[#68645C]">
          Your new password must meet the password policy.
        </p>
      </div>

      {!token ? (
        <div className="space-y-4">
          <div className="rounded-[6px] border border-[#F0C9C9] bg-[#FFF5F5] px-4 py-3 text-[14px] text-[#991B1B]">
            This reset link is missing a token. Request a new password reset link.
          </div>
          <Link href="/forgot-password" className="text-[13px] font-medium text-[#1F6F5C] hover:underline">
            Request new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="reset_password" className="mb-0 block text-[13px] font-medium text-[#1C1917]">New password</label>
              <button type="button" onClick={() => setShowPassword((c) => !c)} className="text-[12px] font-medium text-[#737067] hover:text-[#1A1917]">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="reset_password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Create password"
              autoComplete="new-password"
              required
            />
            <div className="mt-2 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((segment) => (
                <div key={segment} className={`h-1 flex-1 rounded-full ${segment < strength.filledSegments ? "bg-[#1F6F5C]" : "bg-[#E6E3DC]"}`} />
              ))}
              {strength.label ? <span className="ml-1 font-mono text-[11px] text-[#1F6F5C]">{strength.label}</span> : null}
            </div>
            <p className="mt-1 text-[11px] text-[#737067]">At least 8 characters, with a letter and number.</p>
          </div>

          <div>
            <label htmlFor="reset_confirm" className={labelClass}>Confirm password</label>
            <input
              id="reset_confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={confirmPassword && !passwordsMatch ? `${inputClass} border-[#DC2626]` : inputClass}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(confirmPassword && !passwordsMatch)}
            />
            {confirmPassword && !passwordsMatch ? (
              <p className="mt-1.5 text-[12px] text-[#DC2626]" role="alert">Passwords don&apos;t match</p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[6px] border border-[#F0C9C9] bg-[#FFF5F5] px-3 py-2 text-[13px] text-[#991B1B]" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-[40px] w-full rounded-[6px] bg-[#1F6F5C] text-[13.5px] font-medium text-white shadow-sm transition-colors hover:bg-[#185949] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}

      <div className="pt-6 text-[13px] text-[#68645C]">
        <Link href="/login" className="font-medium text-[#1F6F5C] hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
