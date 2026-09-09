export default function StatBand() {
  return (
    <section className="border-y border-ink-line bg-ink-800 py-[82px] text-center text-ink-text">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="font-mono text-[clamp(3.4rem,2.4rem+5vw,6.2rem)] font-semibold leading-none text-ramp-bright">
          79<sup className="align-super text-[0.42em] font-medium">%</sup>
        </div>
        <h2 className="mx-auto mt-5 max-w-[620px] text-[1.5rem] font-extrabold text-white-soft">
          of companies rank innovation among their top 3 priorities. Have you?
        </h2>
        <p className="mt-[18px] inline-flex items-center gap-[9px] font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-dim before:content-['//'] before:opacity-50">
          Boston Consulting Group
        </p>
      </div>
    </section>
  )
}
