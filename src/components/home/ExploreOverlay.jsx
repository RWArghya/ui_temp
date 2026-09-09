import { forwardRef } from "react"
import Modal from "../ui/Modal"
import PurposeCard from "./PurposeCard"
import { primaryPurposeOptions, secondaryPurposeOptions } from "../../data/purposeOptions"

const ExploreOverlay = forwardRef(function ExploreOverlay({ onClose }, ref) {
  return (
    <Modal ref={ref} labelledBy="explore-title">
      <div className="h-[3px] bg-ramp" />
      <div className="flex justify-between gap-5 px-7 pt-7 pb-1">
        <div>
          <h3 id="explore-title" className="font-display text-[1.4rem] font-extrabold text-ink-900">
            What brings you to Hack2skill?
          </h3>
          <p className="mt-2 text-[0.88rem] text-graphite">
            Pick one — you can change it any time once you're in. This choice just sets where we take you next.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="h-8 w-8 shrink-0 rounded-btn border border-paper-line text-graphite hover:border-violet hover:text-violet"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 px-7 pb-7 pt-6 sm:grid-cols-2">
        {primaryPurposeOptions.map((opt) => (
          <PurposeCard key={opt.id} {...opt} onNavigate={onClose} />
        ))}
        <div className="col-span-full flex items-center gap-3.5 font-mono text-[0.66rem] tracking-[0.14em] uppercase text-graphite-dim before:h-px before:flex-1 before:content-[''] before:bg-paper-line after:h-px after:flex-1 after:content-[''] after:bg-paper-line">
          Here in another capacity?
        </div>
        {secondaryPurposeOptions.map((opt) => (
          <PurposeCard key={opt.id} {...opt} onNavigate={onClose} />
        ))}
      </div>
    </Modal>
  )
})

export default ExploreOverlay
