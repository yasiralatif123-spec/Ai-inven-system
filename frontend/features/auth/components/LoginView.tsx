import Link from "next/link";
import { Suspense } from "react";
import { DashboardPreview } from "./DashboardPreview";
import { LoginForm } from "./LoginForm";

export function LoginView() {
  return (
    <main className="min-h-screen bg-page text-on-surface antialiased selection:bg-primary/15 selection:text-primary">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <section className="flex min-h-screen w-full flex-col justify-between bg-page px-8 py-10 sm:px-14 lg:w-1/2 lg:px-20 lg:py-12 xl:px-24">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 focus:outline-none">
              <span className="text-xl font-bold tracking-tight text-on-surface">StockFlow</span>
              <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                B2B
              </span>
            </Link>
          </div>

          <Suspense fallback={<div className="my-auto w-full max-w-[380px] pb-10 pt-8 text-[13px] text-secondary">Loading...</div>}>
            <LoginForm />
          </Suspense>

          <footer className="pt-6 text-[12px] text-secondary">
            <span>
              © 2026 StockFlow · <Link href="#" className="hover:text-secondary">Help</Link> ·{" "}
              <Link href="#" className="hover:text-secondary">Privacy</Link>
            </span>
          </footer>
        </section>

        <DashboardPreview />
      </div>
    </main>
  );
}
