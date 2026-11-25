"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

const labelClass = "mb-1.5 block text-[13px] font-medium text-on-surface";

const inputClass =
  "h-[40px] w-full rounded-[6px] border border-border bg-card px-3 text-[14px] text-on-surface transition duration-150 placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sessionExpired = searchParams.get("reason") === "session_expired";
  const registered = searchParams.get("registered") === "1";
  const reset = searchParams.get("reset") === "1";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push("/");
      router.refresh();
    } catch {
      setError("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="my-auto w-full max-w-[380px] pb-10 pt-8">
      <div className="mb-7">
        <h1 className="text-[24px] font-medium leading-tight tracking-tight text-on-surface">
          Sign in to StockFlow
        </h1>
        <p className="mt-1.5 text-[13.5px] font-normal leading-relaxed text-secondary">
          Manage your stock, sales and payments in one place.
        </p>
      </div>

      {sessionExpired ? (
        <div className="mb-4 rounded-[6px] border border-warning-border bg-warning-container px-3 py-2 text-[13px] text-warning">
          Your session expired. Please sign in again.
        </div>
      ) : null}
      {registered ? (
        <div className="mb-4 rounded-[6px] border border-primary/20 bg-primary-container px-3 py-2 text-[13px] text-primary">
          Account created. You can sign in now.
        </div>
      ) : null}
      {reset ? (
        <div className="mb-4 rounded-[6px] border border-primary/20 bg-primary-container px-3 py-2 text-[13px] text-primary">
          Password reset. Please sign in with your new password.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login_email" className={labelClass}>
            Email address
          </label>
          <input
            id="login_email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="you@company.pk"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login_password" className="mb-0 block text-[13px] font-medium text-on-surface">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="cursor-pointer text-[12px] font-medium text-secondary transition hover:text-on-surface focus:outline-none focus:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="login_password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={error ? `${inputClass} border-error` : inputClass}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(error)}
          />
          {error ? (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] font-normal text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-[13px] font-medium text-primary hover:text-primary-hover focus:outline-none focus:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="h-[40px] w-full rounded-[6px] bg-primary text-[13.5px] font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-hover active:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </div>

        <div className="pt-2 text-left">
          <p className="text-[13px] text-secondary">
            Have an invite?{" "}
            <Link href="/register" className="ml-0.5 font-medium text-primary hover:underline">
              Accept invitation
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-8 border-t border-border/70 pt-5">
        <div className="flex items-center gap-2 text-[11.5px] text-secondary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          <span>256-bit encrypted ledger · FBR Sales Tax Integrated</span>
        </div>
      </div>
    </div>
  );
}
