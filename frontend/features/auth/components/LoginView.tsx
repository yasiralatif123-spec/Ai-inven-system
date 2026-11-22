import Link from "next/link";
import { DashboardPreview } from "./DashboardPreview";
import { LoginForm } from "./LoginForm";

export function LoginView() {
  return (
    <main className="min-h-screen bg-[#F7F6F3] text-[#1C1917] antialiased selection:bg-[#1F6F5C]/15 selection:text-[#1F6F5C]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <section className="flex min-h-screen w-full flex-col justify-between bg-[#F7F6F3] px-8 py-10 sm:px-14 lg:w-1/2 lg:px-20 lg:py-12 xl:px-24">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 focus:outline-none">
              <span className="text-xl font-bold tracking-tight text-[#1C1917]">StockFlow</span>
              <span className="rounded bg-[#EAE7DF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8C877D]">
                B2B
              </span>
            </Link>
          </div>

          <LoginForm />

          <footer className="pt-6 text-[12px] text-[#8C877D]">
            <span>
              © 2026 StockFlow · <Link href="#" className="hover:text-[#68645C]">Help</Link> ·{" "}
              <Link href="#" className="hover:text-[#68645C]">Privacy</Link>
            </span>
          </footer>
        </section>

        <DashboardPreview />
      </div>
    </main>
  );
}
