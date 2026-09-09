import Button from "../ui/Button"

export default function DoorsCTA() {
  return (
    <div className="relative mt-14 overflow-hidden rounded-card bg-ink-900 px-6 py-11 text-center sm:px-10">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-ramp" />
      <h2 className="text-[1.6rem] font-extrabold text-white-soft">Ready to scope your first program?</h2>
      <p className="mx-auto mt-3 max-w-[520px] text-[0.92rem] text-ink-dim">
        Two ways in: set up your workspace yourself, or have us scope it on a call. Create an account and our
        programs team picks it up the same day.
      </p>
      <div className="mt-[26px] flex flex-wrap justify-center gap-3">
        <Button variant="signal" size="lg" to="/customer-register">
          Create organisation account
        </Button>
        <Button variant="onDark" size="lg" to="/sponsor">
          Book a demo instead
        </Button>
      </div>
      <p className="mt-[22px] font-mono text-[0.66rem] uppercase tracking-[0.12em] text-ink-dim">
        ISO 27001 · ISO 9001 · GDPR compliant
      </p>
    </div>
  )
}
