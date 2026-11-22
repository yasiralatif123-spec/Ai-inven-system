import { WORKSPACE_FEATURES } from "../constants";

export function WorkspacePanel() {
  return (
    <aside className="flex min-h-screen flex-col justify-between border-l border-[#E6E3DC] bg-[#EFEDE7] px-8 py-10 sm:px-12 sm:py-14 lg:px-16 xl:px-20">
      <div className="flex items-center justify-between font-mono text-[11px] text-[#737067]">
        <span>WORKSPACE INITIALIZATION</span>
        <span>KARACHI HUB · 16 NOV 2026</span>
      </div>

      <div className="my-auto max-w-[460px] py-12">
        <div className="mb-2 font-mono text-[12px] font-medium uppercase tracking-wider text-[#737067]">
          WHAT&apos;S INCLUDED
        </div>
        <h2 className="mb-6 text-[20px] font-medium leading-snug text-[#1A1917]">
          Everything you need to run your daily wholesale godown.
        </h2>

        <div className="divide-y divide-[#E6E3DC] rounded-[6px] border border-[#E6E3DC] bg-white/60">
          {WORKSPACE_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-baseline justify-between px-4 py-3.5"
            >
              <span className="text-[14px] font-medium text-[#1A1917]">{feature.title}</span>
              <span
                className={`font-mono text-[11px] ${
                  index === WORKSPACE_FEATURES.length - 1
                    ? "font-semibold text-[#1F6F5C]"
                    : "text-[#737067]"
                }`}
              >
                {feature.meta}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[6px] border border-[#E6E3DC] bg-white/40 p-3.5">
          <p className="text-[13px] leading-relaxed text-[#737067]">
            You&apos;ll be the <strong className="font-semibold text-[#1A1917]">Owner</strong>. Add
            your staff later from <span className="font-mono text-[12px] text-[#1F6F5C]">Staff &amp; Roles</span>.
          </p>
        </div>

        <div className="mt-8 border-l-2 border-[#1F6F5C] py-1 pl-3">
          <p className="text-[13px] italic text-[#1A1917]">
            “No cloud clutter. Fast data entry designed for the counter desk.”
          </p>
          <span className="mt-1 block font-mono text-[11px] text-[#737067]">
            StockFlow Operational Core · Verified Double-Entry
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[#E6E3DC] pt-6 text-[11px] text-[#737067]">
        <span className="h-2 w-2 rounded-full bg-[#1F6F5C]" />
        <span>Double-entry ledger standard · 256-bit AES · FBR Sales Tax Ready</span>
      </div>
    </aside>
  );
}
