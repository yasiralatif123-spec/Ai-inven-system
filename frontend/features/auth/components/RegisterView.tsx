"use client";

import { useState } from "react";
import Link from "next/link";
import { INITIAL_ACCOUNT_VALUES, INITIAL_BUSINESS_VALUES } from "../constants";
import type { AccountFormValues, BusinessFormValues, RegisterStep } from "../types";
import { AccountStep } from "./AccountStep";
import { BusinessStep } from "./BusinessStep";
import { DoneStep } from "./DoneStep";
import { RegisterStepIndicator } from "./RegisterStepIndicator";
import { WorkspacePanel } from "./WorkspacePanel";

export function RegisterView() {
  const [step, setStep] = useState<RegisterStep>(1);
  const [account, setAccount] = useState<AccountFormValues>(INITIAL_ACCOUNT_VALUES);
  const [business, setBusiness] = useState<BusinessFormValues>(INITIAL_BUSINESS_VALUES);

  const updateAccount = (patch: Partial<AccountFormValues>) => {
    setAccount((current) => ({ ...current, ...patch }));
  };

  const updateBusiness = (patch: Partial<BusinessFormValues>) => {
    setBusiness((current) => ({ ...current, ...patch }));
  };

  return (
    <main className="min-h-screen bg-[#F7F6F3] text-[#1A1917] antialiased selection:bg-[#1F6F5C] selection:text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="flex w-full max-w-[620px] flex-col justify-between px-8 py-10 sm:px-12 sm:py-14 lg:px-16 xl:px-20">
          <div>
            <Link href="/" className="mb-10 inline-flex items-center gap-2">
              <span className="text-[20px] font-bold tracking-tight text-[#1A1917]">StockFlow</span>
              <span className="rounded-[4px] bg-[#E6E3DC] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[#737067]">
                B2B
              </span>
            </Link>

            <div className="mb-7">
              <h1 className="text-[24px] font-medium leading-snug tracking-tight text-[#1A1917]">
                Create your business account
              </h1>
              <p className="mt-1.5 text-[14px] font-normal text-[#737067]">
                Set up your workspace in about two minutes.
              </p>
            </div>

            <RegisterStepIndicator step={step} onStepChange={setStep} />

            {step === 1 ? (
              <AccountStep values={account} onChange={updateAccount} onContinue={() => setStep(2)} />
            ) : null}
            {step === 2 ? (
              <BusinessStep
                values={business}
                onChange={updateBusiness}
                onBack={() => setStep(1)}
                onCreate={() => setStep(3)}
              />
            ) : null}
            {step === 3 ? (
              <DoneStep
                businessName={business.businessName}
                onEdit={() => setStep(2)}
              />
            ) : null}
          </div>

          <footer className="mt-10 border-t border-[#E6E3DC]/60 pt-10">
            <div className="flex items-center justify-between text-[11px] text-[#9E9B91]">
              <span>© 2026 StockFlow · Pakistan Supply Chain Network</span>
              <div className="flex gap-3">
                <Link href="#" className="hover:underline">
                  Help
                </Link>
                <span>·</span>
                <Link href="#" className="hover:underline">
                  Privacy
                </Link>
                <span>·</span>
                <Link href="#" className="hover:underline">
                  Security
                </Link>
              </div>
            </div>
          </footer>
        </section>

        <WorkspacePanel />
      </div>
    </main>
  );
}
