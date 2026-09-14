import { Link } from "react-router-dom"

/**
 * Catch-all for any unmatched route. Deliberately self-contained (no
 * <Layout>/<Outlet> dependency) since it has to render correctly no matter
 * where in the route tree the miss happened — including under /dashboard,
 * where Layout's header/footer wouldn't make sense anyway.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-[14px] bg-ramp font-display text-lg font-bold text-white">
        H2S
      </span>
      <p className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.13em] text-graphite-dim">Error 404</p>
      <h1 className="mt-2 font-display text-3xl font-black text-ink-900 sm:text-4xl">
        This page wandered off the track.
      </h1>
      <p className="mt-3 max-w-md text-graphite">
        The link might be old, mistyped, or something you were meant to see got moved. Let's get you back
        somewhere useful.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn btn-primary rounded-btn px-5">
          Go to homepage
        </Link>
        <Link to="/dashboard" className="btn btn-ghost rounded-btn border border-paper-line px-5 text-ink-900">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
