import Eyebrow from "../ui/Eyebrow"
import Icon from "../ui/Icon"
import PhotoSlot from "./PhotoSlot"
import { useCountUp } from "../../hooks/useCountUp"

const recordFacts = [
  { value: "30", label: "hours on the floor" },
  { value: "1", label: "single build sprint" },
  { value: "Agentic AI", label: "the category" },
]

const shots = [
  ["Certificate", "moment"],
  ["Hackathon", "participants"],
  ["Event hall", "full floor"],
  ["Team", "collaboration"],
  ["Award", "ceremony i"],
  ["Award", "ceremony ii"],
]

export default function RecordSection() {
  const [countRef, count] = useCountUp(1941)

  return (
    <section className="bg-ink-950 py-24 text-ink-text">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[0.34fr_1fr]">
          <div className="relative mx-auto grid h-[150px] w-[150px] place-items-center rounded-full bg-ramp shadow-[0_0_0_1px_var(--color-ink-line),0_30px_70px_-30px_rgba(63,29,128,.85)]">
            <span className="absolute inset-[9px] rounded-full border border-white/20" />
            <Icon name="medal" className="h-12 w-12 text-white opacity-95" />
          </div>
          <div>
            <Eyebrow tone="brand">Guinness World Records™ title holder</Eyebrow>
            <div
              ref={countRef}
              className="font-mono text-[clamp(3rem,2.2rem+4vw,5rem)] font-semibold leading-none text-ramp-bright"
            >
              {count.toLocaleString("en-IN")}
              <sup className="align-super text-[0.4em]">+</sup>
            </div>
            <h2 className="mt-[14px] max-w-[640px] text-[1.55rem] font-extrabold text-white-soft">
              Most participants in an Agentic AI hackathon — on the floor for 30 hours straight.
            </h2>
            <div className="mt-[26px] flex flex-wrap gap-10">
              {recordFacts.map((f) => (
                <div key={f.label}>
                  <div className="font-mono text-[1.15rem] font-semibold text-white-soft">{f.value}</div>
                  <div className="mt-[3px] text-[0.76rem] text-ink-dim">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-11 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shots.map((lines) => (
            <PhotoSlot key={lines.join("-")} lines={lines} />
          ))}
        </div>
        <p className="mt-4 text-[0.78rem] text-ink-dim">
          Photo slots — send the real files and they drop straight in.
        </p>
      </div>
    </section>
  )
}
