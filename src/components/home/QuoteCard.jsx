export default function QuoteCard({ status, placeholder, quote, role }) {
  return (
    <div className="rounded-card border border-paper-line bg-paper p-6">
      <div className="mb-4 flex gap-[5px]">
        <i className="h-[5px] w-[5px] rounded-full bg-[#cbd0e4]" />
        <i className="h-[5px] w-[5px] rounded-full bg-[#cbd0e4]" />
        <i className="h-[5px] w-[5px] rounded-full bg-[#cbd0e4]" />
      </div>
      <p className="text-[0.9rem] text-graphite">{status === "pending" ? placeholder : quote}</p>
      <div className="mt-[18px] font-mono text-[0.66rem] uppercase leading-relaxed tracking-[0.09em] text-graphite-dim">
        {role}
      </div>
      {status === "pending" && (
        <span className="mt-3.5 inline-block rounded-btn bg-violet-soft px-[9px] py-1 font-mono text-[0.6rem] uppercase tracking-[0.13em] text-violet">
          Quote pending
        </span>
      )}
    </div>
  )
}
