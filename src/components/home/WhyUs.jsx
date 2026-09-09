import Eyebrow from "../ui/Eyebrow"
import WhyUsCard from "./WhyUsCard"
import { whyUsFeatures, whyUsMetrics } from "../../data/whyUsFeatures"
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll"

export default function WhyUs() {
  const [revealRef, isVisible] = useRevealOnScroll()

  return (
    <section id="why-us" className="bg-paper py-24">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-[640px]">
          <Eyebrow tone="paper">Why Hack2skill</Eyebrow>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.7rem,1.4rem+1.5vw,2.5rem)] font-extrabold text-ink-900">
            Structure, manage, and
            <br />
            accelerate innovation.
          </h2>
          <p className="mt-4 text-graphite">
            Ready-to-use templates, a vetted expert network, a dedicated success team and outreach into the
            country's largest innovator pool — turning a brief into a live program without months of setup.
          </p>
        </div>

        <div
          ref={revealRef}
          className={`mt-11 grid grid-cols-1 gap-[18px] transition-transform duration-500 ease-out sm:grid-cols-2 lg:grid-cols-4 ${
            isVisible ? "translate-y-0" : "translate-y-3.5"
          }`}
        >
          {whyUsFeatures.map((f) => (
            <WhyUsCard key={f.title} {...f} />
          ))}
        </div>

        <div className="mt-11 grid grid-cols-2 gap-5 border-t border-paper-line pt-8 sm:grid-cols-4">
          {whyUsMetrics.map((m) => (
            <div key={m.label}>
              <div className="font-mono text-[1.5rem] font-semibold text-signal">{m.value}</div>
              <p className="mt-[5px] text-[0.8rem] text-graphite-dim">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-[26px] flex flex-wrap items-start justify-between gap-6">
          <p className="max-w-[660px] text-[0.84rem] text-graphite">
            Companies running structured innovation programs are <b className="font-mono text-ink-900">10x</b>{" "}
            faster in product development and <b className="font-mono text-ink-900">6x</b> better at scaling new
            ventures. <span className="font-mono text-[0.72rem] text-graphite-dim">— McKinsey</span>
          </p>
          <span className="whitespace-nowrap rounded-btn bg-violet-soft px-[10px] py-[5px] font-mono text-[0.64rem] uppercase tracking-[0.11em] text-violet">
            Source figures pending verification
          </span>
        </div>
      </div>
    </section>
  )
}
