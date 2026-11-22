import { DASHBOARD_PREVIEW_KPIS, DASHBOARD_PREVIEW_ORDERS } from "../constants";

const tiltStyle = {
  transform: "perspective(1200px) rotateY(-4deg) rotateX(2.5deg) rotateZ(-0.8deg)",
  boxShadow:
    "0 20px 45px -15px rgba(28, 25, 23, 0.12), 0 4px 12px -2px rgba(28, 25, 23, 0.06)",
};

export function DashboardPreview() {
  return (
    <aside className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden border-t border-[#E6E3DC] bg-[#EFEDE7] p-8 sm:p-12 lg:w-1/2 lg:border-l lg:border-t-0 lg:p-16">
      <div className="flex items-center justify-between text-[12px] text-[#68645C]">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#8C877D]">
          LIVE OPERATIONAL VIEW
        </span>
        <span className="font-mono text-[11px] text-[#8C877D]">Karachi Hub · 16 Nov 2026</span>
      </div>

      <div className="relative my-auto w-full max-w-[620px] self-start lg:translate-x-6 xl:translate-x-10" aria-hidden="true">
        <div
          style={tiltStyle}
          className="w-[640px] select-none overflow-hidden rounded-lg border border-[#D8D4CA] bg-white xl:w-[680px]"
        >
          <div className="flex items-center justify-between border-b border-[#E6E3DC] bg-[#FAF8F5] px-4 py-2.5 text-[11.5px] text-[#68645C]">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-[#1C1917]">StockFlow Admin</span>
              <span className="text-[#8C877D]">/</span>
              <span>Wholesale Operations</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Reconciled
              </span>
              <span>Tariq M. #001</span>
            </div>
          </div>

          <div className="grid grid-cols-4 border-b border-[#E6E3DC] bg-[#FCFBF8]">
            {DASHBOARD_PREVIEW_KPIS.map((kpi, index) => (
              <div
                key={kpi.label}
                className={`p-3.5 ${index === 3 ? "bg-[#FAF6F2]" : "border-r border-[#E6E3DC]"}`}
              >
                <span
                  className={`block font-mono text-[10px] uppercase tracking-wider ${
                    kpi.highlighted ? "text-[#991B1B]" : "text-[#8C877D]"
                  }`}
                >
                  {kpi.label}
                </span>
                <span
                  className={`mt-0.5 block text-[18px] font-semibold ${
                    kpi.highlighted ? "text-[#991B1B]" : "text-[#1C1917]"
                  }`}
                >
                  {kpi.value}
                </span>
                <span className={`font-mono text-[10.5px] ${kpi.noteClass}`}>{kpi.note}</span>
              </div>
            ))}
          </div>

          <div className="bg-white">
            <div className="flex items-center justify-between border-b border-[#E6E3DC] bg-[#F9F7F2] px-4 py-2 text-[11px] font-medium text-[#68645C]">
              <span>RECENT WHOLESALE DISPATCHES</span>
              <span className="font-mono text-[10px] text-[#8C877D]">REAL-TIME SYNC</span>
            </div>
            <table className="w-full border-collapse text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-[#E6E3DC] bg-[#FAF9F6] font-mono text-[10.5px] uppercase text-[#8C877D]">
                  <th className="px-3 py-2 font-medium">Order ID</th>
                  <th className="px-3 py-2 font-medium">Customer / Party</th>
                  <th className="px-3 py-2 font-medium">Manifest</th>
                  <th className="px-3 py-2 text-right font-medium">Amount (PKR)</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3DC] font-mono text-[11px]">
                {DASHBOARD_PREVIEW_ORDERS.map((order) => (
                  <tr
                    key={order.orderId}
                    className={order.muted ? "opacity-70" : "hover:bg-slate-50/50"}
                  >
                    <td className={`px-3 font-medium text-[#1C1917] ${order.muted ? "py-2" : "py-2.5"}`}>
                      {order.orderId}
                    </td>
                    <td className={`px-3 font-sans font-medium text-[#1C1917] ${order.muted ? "py-2" : "py-2.5"}`}>
                      {order.customer}
                      {order.location ? (
                        <span className="mt-0.5 block font-mono text-[10px] text-[#8C877D]">
                          {order.location}
                        </span>
                      ) : null}
                    </td>
                    <td className={`px-3 font-sans text-[#68645C] ${order.muted ? "py-2" : "py-2.5"}`}>
                      {order.manifest}
                    </td>
                    <td className={`px-3 text-right font-medium text-[#1C1917] ${order.muted ? "py-2" : "py-2.5"}`}>
                      {order.amount}
                    </td>
                    <td className={`px-3 text-center ${order.muted ? "py-2" : "py-2.5"}`}>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] ${order.statusClass}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4">
        <blockquote className="border-l-2 border-[#1F6F5C] py-0.5 pl-4">
          <p className="text-[15px] font-normal leading-snug tracking-tight text-[#1C1917]">
            “Know what&apos;s in the godown before the customer asks.”
          </p>
          <p className="mt-1 font-mono text-[12px] text-[#8C877D]">
            StockFlow Wholesale Intelligence · Pakistan Supply Chain Network
          </p>
        </blockquote>
      </div>
    </aside>
  );
}
