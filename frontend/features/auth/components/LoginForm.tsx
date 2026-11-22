"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { INITIAL_LOGIN_VALUES } from "../constants";
import type { LoginFormValues } from "../types";
import { isLoginFormValid } from "../utils";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#1C1917]";

const inputClass =
  "h-[40px] w-full rounded-[6px] border border-[#E6E3DC] bg-white px-3 text-[14px] text-[#1C1917] transition duration-150 placeholder:text-[#8C877D] focus:border-[#1F6F5C] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C]";

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_LOGIN_VALUES);
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(true);

  const updateValues = (patch: Partial<LoginFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setShowError(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoginFormValid(values)) {
      setShowError(true);
      return;
    }
    router.push("/");
  };

  const passwordInputClass = showError
    ? `${inputClass} border-[#C53030]`
    : inputClass;

  return (
    <div className="my-auto w-full max-w-[380px] pb-10 pt-8">
      <div className="mb-7">
        <h1 className="text-[24px] font-medium leading-tight tracking-tight text-[#1C1917]">
          Sign in to StockFlow
        </h1>
        <p className="mt-1.5 text-[13.5px] font-normal leading-relaxed text-[#68645C]">
          Manage your stock, sales and payments in one place.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login_email" className={labelClass}>
            Email address
          </label>
          <input
            id="login_email"
            type="email"
            value={values.email}
            onChange={(event) => updateValues({ email: event.target.value })}
            className={inputClass}
            placeholder="you@company.pk"
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login_password" className="mb-0 block text-[13px] font-medium text-[#1C1917]">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="cursor-pointer text-[12px] font-medium text-[#68645C] transition hover:text-[#1C1917] focus:outline-none focus:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="login_password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(event) => updateValues({ password: event.target.value })}
            className={passwordInputClass}
            placeholder="••••••••"
            required
            aria-invalid={showError}
          />
          {showError ? (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] font-normal text-[#C53030]" role="alert">
              Incorrect email or password.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-1">
          <label htmlFor="keep_signed_in" className="flex cursor-pointer select-none items-center gap-2">
            <input
              id="keep_signed_in"
              type="checkbox"
              checked={values.keepSignedIn}
              onChange={(event) => updateValues({ keepSignedIn: event.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-[#E6E3DC] accent-[#1F6F5C] focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[13px] text-[#1C1917]">Keep me signed in</span>
          </label>

          <a
            href="#"
            className="text-[13px] font-medium text-[#1F6F5C] hover:text-[#185949] focus:outline-none focus:underline"
          >
            Forgot password?
          </a>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="h-[40px] w-full rounded-[6px] bg-[#1F6F5C] text-[13.5px] font-medium text-white shadow-sm transition-colors hover:bg-[#185949] active:bg-[#13473a] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:ring-offset-2"
          >
            Sign in
          </button>
        </div>

        <div className="pt-2 text-left">
          <p className="text-[13px] text-[#68645C]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="ml-0.5 font-medium text-[#1F6F5C] hover:underline">
              Create business account
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-8 border-t border-[#E6E3DC]/70 pt-5">
        <div className="flex items-center gap-2 text-[11.5px] text-[#8C877D]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>256-bit encrypted ledger · FBR Sales Tax Integrated</span>
        </div>
      </div>
    </div>
  );
}
