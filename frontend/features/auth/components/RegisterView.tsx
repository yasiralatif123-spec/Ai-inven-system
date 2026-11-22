"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { acceptInvite, validateInvite } from "../services/auth.service";
import type { InviteDetails } from "../types";
import { doPasswordsMatch, isPasswordValid, passwordStrength } from "../utils";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#1A1917]";
const inputClass =
  "h-[40px] w-full rounded-[6px] border border-[#E6E3DC] bg-white px-3 text-[14px] text-[#1A1917] transition-colors focus:border-[#1F6F5C] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C]";

function InviteRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadInvite() {
      if (!token) {
        setInviteError("This invitation link is missing a token. Ask your workspace owner for a new invite.");
        setLoading(false);
        return;
      }
      try {
        const data = await validateInvite(token);
        if (!active) return;
        setInvite(data.invite);
      } catch {
        if (!active) return;
        setInviteError("This invitation is invalid, expired, or has already been used.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadInvite();
    return () => {
      active = false;
    };
  }, [token]);

  const strength = passwordStrength(password);
  const passwordOk = isPasswordValid(password);
  const passwordsMatch = doPasswordsMatch(password, confirmPassword);
  const canSubmit =
    Boolean(invite) &&
    name.trim().length >= 2 &&
    passwordOk &&
    passwordsMatch &&
    !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invite || !canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await acceptInvite({
        token,
        name: name.trim(),
        email: invite.email,
        password,
        confirmPassword,
      });
      router.push("/login?registered=1");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to accept invitation.";
      setSubmitError(message || "Unable to accept invitation.");
    } finally {
      setSubmitting(false);
    }
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
                Accept your invitation
              </h1>
              <p className="mt-1.5 text-[14px] font-normal text-[#737067]">
                Create your account to join your workspace.
              </p>
            </div>

            {loading ? (
              <div className="rounded-[6px] border border-[#E6E3DC] bg-white p-4 text-[14px] text-[#737067]">
                Validating invitation...
              </div>
            ) : null}

            {!loading && inviteError ? (
              <div className="space-y-4">
                <div className="rounded-[6px] border border-[#F0C9C9] bg-[#FFF5F5] p-4 text-[14px] text-[#991B1B]">
                  {inviteError}
                </div>
                <p className="text-[13px] text-[#737067]">
                  Need help? Contact your workspace owner or{" "}
                  <Link href="/login" className="font-medium text-[#1F6F5C] hover:underline">
                    sign in
                  </Link>
                  .
                </p>
              </div>
            ) : null}

            {!loading && invite ? (
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="rounded-[6px] border border-[#1F6F5C]/20 bg-[#E8F1EE] p-3">
                  <div className="text-[12px] font-medium text-[#1F6F5C]">Workspace invitation</div>
                  <div className="mt-0.5 text-[13px] text-[#175647]">
                    {invite.businessName || "Your workspace"} · {invite.role}
                  </div>
                </div>

                <div>
                  <label htmlFor="invite_name" className={labelClass}>Full name</label>
                  <input
                    id="invite_name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="invite_email" className={labelClass}>Email address</label>
                  <input
                    id="invite_email"
                    type="email"
                    value={invite.email}
                    readOnly
                    className={`${inputClass} bg-[#F7F6F3] text-[#737067]`}
                    autoComplete="email"
                  />
                  <p className="mt-1 text-[11px] text-[#737067]">Email is set by your invitation.</p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="invite_password" className="mb-0 block text-[13px] font-medium text-[#1A1917]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((c) => !c)}
                      className="text-[12px] font-medium text-[#737067] hover:text-[#1A1917]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id="invite_password"
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
                      <div
                        key={segment}
                        className={`h-1 flex-1 rounded-full ${segment < strength.filledSegments ? "bg-[#1F6F5C]" : "bg-[#E6E3DC]"}`}
                      />
                    ))}
                    {strength.label ? <span className="ml-1 font-mono text-[11px] text-[#1F6F5C]">{strength.label}</span> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-[#737067]">At least 8 characters, with a letter and number.</p>
                </div>

                <div>
                  <label htmlFor="invite_confirm" className={labelClass}>Confirm password</label>
                  <input
                    id="invite_confirm"
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

                {submitError ? (
                  <div className="rounded-[6px] border border-[#F0C9C9] bg-[#FFF5F5] px-3 py-2 text-[13px] text-[#991B1B]" role="alert">
                    {submitError}
                  </div>
                ) : null}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`flex h-[40px] w-full items-center justify-center rounded-[6px] text-[14px] font-medium transition-all ${
                      canSubmit
                        ? "cursor-pointer bg-[#1F6F5C] text-white shadow-sm hover:bg-[#175647]"
                        : "cursor-not-allowed bg-[#E6E3DC] text-[#9E9B91]"
                    }`}
                  >
                    {submitting ? "Creating account..." : "Create account"}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[13px] text-[#737067]">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-[#1F6F5C] hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            ) : null}
          </div>

          <footer className="mt-10 border-t border-[#E6E3DC]/60 pt-10">
            <div className="flex items-center justify-between text-[11px] text-[#9E9B91]">
              <span>© 2026 StockFlow · Pakistan Supply Chain Network</span>
              <div className="flex gap-3">
                <Link href="#" className="hover:underline">Help</Link>
                <span>·</span>
                <Link href="#" className="hover:underline">Privacy</Link>
              </div>
            </div>
          </footer>
        </section>

        <aside className="hidden min-h-screen flex-col justify-center border-l border-[#E6E3DC] bg-[#EFEDE7] px-12 lg:flex xl:px-20">
          <div className="max-w-[460px]">
            <div className="mb-2 font-mono text-[12px] font-medium uppercase tracking-wider text-[#737067]">
              INVITE-ONLY ACCESS
            </div>
            <h2 className="mb-6 text-[20px] font-medium leading-snug text-[#1A1917]">
              Join your business workspace securely.
            </h2>
            <div className="rounded-[6px] border border-[#E6E3DC] bg-white/60 p-4 text-[14px] text-[#737067]">
              Your role and business are assigned by the invitation. StockFlow does not allow public registration.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export function RegisterView() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F7F6F3] p-8 text-[14px] text-[#737067]">Loading...</main>}>
      <InviteRegisterForm />
    </Suspense>
  );
}
