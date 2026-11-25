"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "../services/auth.service";

const labelClass = "mb-1.5 block text-[13px] font-medium text-on-surface";
const inputClass =
  "h-[40px] w-full rounded-[6px] border border-border bg-card px-3 text-[14px] text-on-surface transition duration-150 placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
    } catch {
      // Always show the same generic success message to avoid account enumeration.
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="my-auto w-full max-w-[380px] pb-10 pt-8">
      <div className="mb-7">
        <h1 className="text-[24px] font-medium leading-tight tracking-tight text-on-surface">
          Reset your password
        </h1>
        <p className="mt-1.5 text-[13.5px] font-normal leading-relaxed text-secondary">
          Enter your email and we&apos;ll send a reset link if the account exists.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-[6px] border border-primary/20 bg-primary-container px-4 py-3 text-[14px] text-primary">
          If the account exists, a reset link has been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot_email" className={labelClass}>Email address</label>
            <input
              id="forgot_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@company.pk"
              autoComplete="email"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="h-[40px] w-full rounded-[6px] bg-primary text-[13.5px] font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send reset link"}
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
