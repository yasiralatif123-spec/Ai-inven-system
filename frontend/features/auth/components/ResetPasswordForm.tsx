"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { resetPassword } from "../services/auth.service";
import { doPasswordsMatch, isPasswordValid, passwordStrength } from "../utils";

const labelClass = "mb-1.5 block text-[13px] font-medium text-on-surface";
const inputClass =
  "h-[40px] w-full rounded-[6px] border border-border bg-card px-3 text-[14px] text-on-surface transition duration-150 placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

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
        <h1 className="text-[24px] font-medium leading-tight tracking-tight text-on-surface">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-[13.5px] font-normal leading-relaxed text-secondary">
          Your new password must meet the password policy.
        </p>
      </div>

      {!token ? (
        <div className="space-y-4">
          <div className="rounded-[6px] border border-error-border bg-error-container px-4 py-3 text-[14px] text-error">
            This reset link is missing a token. Request a new password reset link.
          </div>
          <Link href="/forgot-password" className="text-[13px] font-medium text-primary hover:underline">
            Request new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="reset_password" className="mb-0 block text-[13px] font-medium text-on-surface">New password</label>
              <button type="button" onClick={() => setShowPassword((c) => !c)} className="text-[12px] font-medium text-secondary hover:text-on-surface">
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
                <div key={segment} className={`h-1 flex-1 rounded-full ${segment < strength.filledSegments ? "bg-primary" : "bg-surface-container"}`} />
              ))}
              {strength.label ? <span className="ml-1 font-mono text-[11px] text-primary">{strength.label}</span> : null}
            </div>
            <p className="mt-1 text-[11px] text-secondary">At least 8 characters, with a letter and number.</p>
          </div>

          <div>
            <label htmlFor="reset_confirm" className={labelClass}>Confirm password</label>
            <input
              id="reset_confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={confirmPassword && !passwordsMatch ? `${inputClass} border-error` : inputClass}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(confirmPassword && !passwordsMatch)}
            />
            {confirmPassword && !passwordsMatch ? (
              <p className="mt-1.5 text-[12px] text-error" role="alert">Passwords don&apos;t match</p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[6px] border border-error-border bg-error-container px-3 py-2 text-[13px] text-error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-[40px] w-full rounded-[6px] bg-primary text-[13.5px] font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}

      <div className="pt-6 text-[13px] text-secondary">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
