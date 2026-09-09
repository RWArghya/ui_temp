import { useSearchParams } from "react-router-dom"

/**
 * Stands in for a destination the reference design links to but doesn't
 * design (initiatives, enterprise, customer-register, sponsor, auth) —
 * keeps navigation from the home page working without inventing UI.
 */
export default function PlaceholderPage({ title }) {
  const [searchParams] = useSearchParams()
  const params = Object.fromEntries(searchParams.entries())

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1180px] px-4 py-24 sm:px-6 lg:px-8">
      <span className="inline-block rounded-btn bg-violet-soft px-[9px] py-1 font-mono text-[0.64rem] uppercase tracking-[0.13em] text-violet">
        TBD — not yet designed
      </span>
      <h1 className="mt-4 font-display text-3xl font-black text-ink-900">{title}</h1>
      <p className="mt-3 max-w-xl text-graphite">
        This page wasn't part of the reference design, so it isn't built yet. This placeholder only keeps
        navigation from the home page from breaking.
      </p>
      {Object.keys(params).length > 0 && (
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm text-graphite-dim">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="text-ink-900">{key}:</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </main>
  )
}
