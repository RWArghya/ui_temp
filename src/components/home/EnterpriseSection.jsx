import { Link } from "react-router-dom"
import Eyebrow from "../ui/Eyebrow"
import StatItem from "../ui/StatItem"
import NetworkDiagram from "./NetworkDiagram"
import ProgramCard from "./ProgramCard"
import StepItem from "./StepItem"
import DoorsCTA from "./DoorsCTA"
import { programTypes } from "../../data/programTypes"
import { processSteps } from "../../data/processSteps"
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll"

const entStats = [
  { value: "6", label: "Program types, one platform" },
  { value: "10,000+", label: "Partner institutes — IITs, NITs" },
  { value: "100%", label: "Free talent acquisition pipeline" },
]

export default function EnterpriseSection() {
  const [progsRef, progsVisible] = useRevealOnScroll()
  const [stepsRef, stepsVisible] = useRevealOnScroll()

  return (
    <section id="enterprise" className="bg-paper py-24">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-[1fr_0.78fr]">
          <div>
            <Eyebrow tone="paper">For enterprises</Eyebrow>
            <h2 className="mt-3 text-balance font-display text-[clamp(1.7rem,1.4rem+1.5vw,2.5rem)] font-extrabold text-ink-900">
              Put your problem in front
              <br />
              of 7 million innovators.
            </h2>
            <p className="mt-4 text-graphite">
              Innovation challenges, internal hackathons, product evangelism, startup pitches and skill-based
              hiring — designed, mobilised and run end to end by our team, on our platform.
            </p>
            <div className="mt-[30px] flex flex-wrap gap-10">
              {entStats.map((s) => (
                <StatItem key={s.label} value={s.value} label={s.label} tone="ink" size="md" />
              ))}
            </div>
          </div>
          <NetworkDiagram />
        </div>

        <div className="mt-[68px] flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="paper">What you can run</Eyebrow>
            <h2 className="mt-3 text-[1.7rem] font-extrabold text-ink-900">Six program types, one platform</h2>
          </div>
          <Link
            to="/enterprise"
            className="font-mono text-[0.76rem] tracking-[0.08em] text-signal hover:text-ink-900"
          >
            Full enterprise breakdown →
          </Link>
        </div>
        <div
          ref={progsRef}
          className={`mt-7 grid grid-cols-1 gap-[18px] transition-transform duration-500 ease-out sm:grid-cols-2 lg:grid-cols-3 ${
            progsVisible ? "translate-y-0" : "translate-y-3.5"
          }`}
        >
          {programTypes.map((p) => (
            <ProgramCard key={p.slug} {...p} />
          ))}
        </div>

        <div className="mt-[68px] max-w-[640px]">
          <Eyebrow tone="paper">Innovation-as-a-Service</Eyebrow>
          <h2 className="mt-3 text-[1.7rem] font-extrabold text-ink-900">How a program actually runs</h2>
        </div>
        <div
          ref={stepsRef}
          className={`mt-7 grid grid-cols-1 gap-x-8 gap-y-7 transition-transform duration-500 ease-out sm:grid-cols-2 lg:grid-cols-3 ${
            stepsVisible ? "translate-y-0" : "translate-y-3.5"
          }`}
        >
          {processSteps.map((s, i) => (
            <StepItem key={s.title} index={i + 1} {...s} />
          ))}
        </div>

        <DoorsCTA />
      </div>
    </section>
  )
}
