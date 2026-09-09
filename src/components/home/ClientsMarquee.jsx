import Eyebrow from "../ui/Eyebrow"
import { clients } from "../../data/clients"

export default function ClientsMarquee() {
  const track = [...clients, ...clients]

  return (
    <section className="border-y border-paper-line bg-paper-raised py-24">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Eyebrow tone="paper">Clients &amp; partners</Eyebrow>
            <h2 className="mt-3 text-balance font-display text-[clamp(1.7rem,1.4rem+1.5vw,2.5rem)] font-extrabold text-ink-900">
              Run with the organisations
              <br />
              shaping the next decade of tech.
            </h2>
          </div>
          <div className="text-right font-display text-[2.4rem] font-extrabold leading-none text-ink-900">
            5,000+
            <span className="mt-2 block font-sans text-[0.78rem] font-medium text-graphite-dim">
              ideas incubated for 200+ organisations
            </span>
          </div>
        </div>

        <div className="mt-[46px] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-14">
            {track.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="whitespace-nowrap font-display text-[1.28rem] font-bold tracking-tight text-[#969bb6]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
