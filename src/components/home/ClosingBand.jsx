import { useOutletContext } from "react-router-dom"
import Eyebrow from "../ui/Eyebrow"
import Button from "../ui/Button"

export default function ClosingBand() {
  const { openExplore } = useOutletContext()

  return (
    <section className="bg-ink-900 py-24 text-ink-text">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:px-8 md:grid-cols-[1fr_auto]">
        <div>
          <Eyebrow tone="dark">Outcomes over decks</Eyebrow>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,1.4rem+1.5vw,2.5rem)] font-extrabold text-white-soft">
            We deliver results,
            <br />
            not presentations.
          </h2>
          <p className="mt-4 max-w-[520px] text-ink-text">
            Our customisable platform gives you the flexibility to hit your own innovation objectives — R&amp;D,
            adoption, brand reach or hiring — without forcing a template on it.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="signal" size="lg" onClick={openExplore}>
            Explore Hack2skill
          </Button>
          <Button variant="onDark" size="lg" to="/sponsor">
            Talk to the team
          </Button>
        </div>
      </div>
    </section>
  )
}
