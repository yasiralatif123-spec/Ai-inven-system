type DoneStepProps = {
  businessName: string;
  onEdit: () => void;
};

export function DoneStep({ businessName, onEdit }: DoneStepProps) {
  return (
    <div className="w-full rounded-[6px] border border-[#1F6F5C]/20 bg-[#E8F1EE] p-4">
      <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#1F6F5C]">
        WORKSPACE READY
      </div>
      <h2 className="mt-2 text-[20px] font-medium leading-snug tracking-tight text-[#1A1917]">
        {businessName} is ready.
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#175647]">
        Your StockFlow workspace has been created. You can now add products, suppliers and customers
        from the dashboard.
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="mt-4 rounded-[6px] border border-[#1F6F5C]/30 bg-white px-3 py-2 text-[13px] font-medium text-[#1F6F5C] transition-colors hover:bg-[#F7F6F3]"
      >
        Edit business details
      </button>
    </div>
  );
}
