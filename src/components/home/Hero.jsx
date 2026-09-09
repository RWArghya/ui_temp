import { useOutletContext } from "react-router-dom"
import Eyebrow from "../ui/Eyebrow"
import StatItem from "../ui/StatItem"
import Button from "../ui/Button"
import HeroConsole from "./HeroConsole"

const heroStats = [
  { value: "7M+", label: "Innovators in the network" },
  { value: "200+", label: "Organisations served" },
  { value: "5,000+", label: "Ideas incubated" },
]

export default function Hero() {
  const { openExplore } = useOutletContext()

  return (
    <section className="relative overflow-hidden bg-paper py-[104px] pb-[100px]">
      <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:px-8 md:grid-cols-[1.35fr_0.65fr]">
        <div>
          <Eyebrow tone="paper">India's largest innovation network</Eyebrow>
          <h1 className="mt-[18px] text-balance text-[clamp(2.6rem,2rem+3.2vw,4.4rem)] font-black leading-[1.08] text-ink-900">
            Build it. Prove it.
            <br />
            Get seen.
          </h1>
          <p className="mt-[22px] max-w-[560px] text-[1.08rem] text-graphite">
            Hack2skill runs the hackathons, innovation challenges and hiring drives behind Google, Samsung, Intel
            and <b className="font-semibold text-ink-900">200+ organisations</b> — with{" "}
            <b className="font-semibold text-ink-900">7M+ innovators</b> building alongside them, for free.
          </p>
          <div className="mb-8 mt-[34px] flex flex-wrap gap-11">
            {heroStats.map((s) => (
              <StatItem key={s.label} value={s.value} label={s.label} tone="ink" size="lg" />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="signal" size="lg" onClick={openExplore}>
              Explore Hack2skill
            </Button>
          </div>
          <p className="mt-[18px] text-[0.82rem] text-graphite-dim">
            One click in — we'll ask what you're here for. No form, no persona pick up front.
          </p>
        </div>
        <HeroConsole />
      </div>
    </section>
  )
}
