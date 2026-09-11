import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, Trophy, BookOpen, Wrench, ArrowRight } from 'lucide-react'
import { daysLeft, deadlineText, journeyFor, reachedFor, toScreenStep, isSaved, toggleSaved, logRecentView } from './data'

/* ================= Dashboard UI primitives =================
   Tailwind + DaisyUI, styled to app.html's exact tokens (styles.css
   :root) via the dash-* colors and shadow-dash utilities in index.css —
   not approximated Tailwind defaults. */

export const Card = ({ title, className = '', children }) => (
  <section className={`rounded-card border border-dash-line bg-dash-bg px-[18px] py-4 shadow-dash ${className}`}>
    {title ? <h3 className="mb-3 font-display text-[18px] font-bold text-dash-ink">{title}</h3> : null}
    {children}
  </section>
)

export const Stat = ({ n, label, className = '' }) => (
  <div className={`rounded-card border border-dash-line bg-dash-bg px-[18px] py-4 shadow-dash ${className}`}>
    <div className="font-mono text-[25px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums text-dash-ink">{n}</div>
    <div className="mt-1 text-[13px] text-dash-muted">{label}</div>
  </div>
)

export const Empty = ({ msg, cta }) => (
  <div className="px-5 py-12 text-center text-dash-muted">
    <p className="text-sm">{msg}</p>
    {cta ? (
      <div className="mt-4">
        <Link className="btn btn-primary btn-sm rounded-btn" to={cta.to}>{cta.label}</Link>
      </div>
    ) : null}
  </div>
)

const PILL_TONE = {
  live: 'bg-dash-live-bg text-dash-live',
  ok: 'bg-dash-ok-soft text-dash-ok',
  warn: 'bg-dash-warn-soft text-dash-warn',
  hat: 'bg-signal-soft font-bold text-signal-dark',
  default: 'bg-dash-line-soft text-dash-muted',
}
export const Pill = ({ ok, warn, live, hat, children }) => {
  const tone = live ? PILL_TONE.live : ok ? PILL_TONE.ok : warn ? PILL_TONE.warn : hat ? PILL_TONE.hat : PILL_TONE.default
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[11px] py-1 text-xs font-medium leading-[1.5] ${tone}`}>
      {live ? <i className="h-1.5 w-1.5 rounded-full bg-dash-live not-italic" /> : null}
      {children}
    </span>
  )
}

export function Bar({ pct, className = '' }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-dash-bg-soft ${className}`}>
      <div className="h-full bg-signal transition-[width] duration-300" style={{ width: pct + '%' }} />
    </div>
  )
}

/* Purpose → icon-chip look, fed from our own design tokens rather than the
   prototype's hardcoded hex (see COMPONENTS.md's purposeMeta note). */
const PURPOSE_META = {
  competing: { ico: Trophy, label: 'Compete', chip: 'bg-signal-soft text-signal-dark' },
  learning: { ico: BookOpen, label: 'Learn', chip: 'bg-dash-ok-soft text-dash-ok' },
  learncompete: { ico: Wrench, label: 'Build', chip: 'bg-dash-warn-soft text-dash-warn' },
}
export const purposeMeta = (p) => PURPOSE_META[p] || PURPOSE_META.competing

export function StatusPill({ status }) {
  if (status === 'live') return <Pill live>Live</Pill>
  if (status === 'upcoming') return <Pill>Upcoming</Pill>
  if (status === 'past') return <Pill>Completed</Pill>
  if (status === 'inprogress') return <Pill hat>In Progress</Pill>
  return null
}

function daysLeftLabel(o) {
  if (!o.deadline) return ''
  const d = daysLeft(o.deadline)
  if (d < 0) return 'Closed'
  if (d === 0) return 'Closes today'
  return `Closes in ${d}d`
}

/* reads the same reachedFor()/journeyFor() the workspace stepper uses, so
   this % can never disagree with it */
export function progressPctFor(o, st) {
  const steps = journeyFor(o)
  const reached = toScreenStep(o, reachedFor(o, st))
  return steps.length ? Math.round((Math.min(reached, steps.length - 1) / (steps.length - 1)) * 100) : 0
}

/* One card component behind both "Recommended for you" and "Continue where
   you left off" — opts drive the only differences (destination, progress
   bar, CTA label). Clicking anywhere opens the destination; the bookmark is
   the one other control and never navigates. See COMPONENTS.md's
   initiativeCard entry — this must stay one component, not a pair. */
export function InitiativeCard({ o, st, sv, opts = {} }) {
  const meta = purposeMeta(o.purpose)
  const Ico = meta.ico
  const saved = isSaved(o.id, st)
  const dest = `/dashboard/${opts.dest === 'workspace' ? 'workspace' : 'initiative'}?id=${o.id}`
  const showProgress = !!opts.progress
  const pct = showProgress ? progressPctFor(o, st) : 0
  const ctaLabel = opts.cta || (opts.dest === 'workspace' ? 'Continue' : (o.purpose === 'learning' ? 'Enrol' : 'View'))
  const navigate = useNavigate()
  const open = () => { logRecentView(sv, st, o.id); navigate(dest) }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter') open() }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-card border border-dash-line bg-dash-bg shadow-dash transition-shadow hover:shadow-dash-lg"
    >
      <div className={`flex h-[84px] items-center px-4 ${meta.chip.split(' ')[0]}`}>
        <span className={`grid h-9 w-9 place-items-center rounded-full bg-dash-bg ${meta.chip.split(' ')[1]}`}>
          <Ico className="h-[17px] w-[17px]" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusPill status={showProgress && o.status !== 'past' ? 'inprogress' : o.status} />
          <span className="text-xs text-dash-faint">{o.mode || ''}</span>
        </div>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 font-display text-[15px] font-bold leading-snug text-dash-ink">{o.name}</div>
          <button
            type="button"
            title={saved ? 'Saved' : 'Save for later'}
            onClick={(e) => { e.stopPropagation(); toggleSaved(sv, st, o.id) }}
            className={`shrink-0 rounded-btn p-1.5 ${saved ? 'text-signal' : 'text-dash-faint hover:text-dash-muted'}`}
          >
            <Bookmark className="h-[15px] w-[15px]" fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="text-xs text-dash-muted">{o.org} · {o.region || ''}</div>
        <div className="flex flex-wrap gap-1.5">
          {(o.areas || []).slice(0, 3).map((a) => (
            <span key={a} className="rounded-full border border-dash-line px-2 py-0.5 text-[11px] text-dash-muted">{a}</span>
          ))}
        </div>
        {showProgress ? (
          <div className="mt-1">
            <Bar pct={pct} />
            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-dash-faint">
              <span>{opts.stepLabel || ''}</span><span>{pct}%</span>
            </div>
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-dash-muted">{o.prize ? o.prize + ' · ' : ''}{daysLeftLabel(o)}</span>
          <Link
            to={dest}
            onClick={(e) => { e.stopPropagation(); logRecentView(sv, st, o.id) }}
            className="btn btn-primary btn-sm rounded-btn"
          >
            {ctaLabel} <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
/* "Continue where you left off" — same card, workspace-bound, with progress */
export function ContinueCard({ o, st, sv, next }) {
  return <InitiativeCard o={o} st={st} sv={sv} opts={{ dest: 'workspace', progress: true, cta: 'Continue', stepLabel: next ? next.step : '' }} />
}

export const PageHead = ({ title, sub, children }) => (
  <div className="mb-[26px]">
    {children ? children : <h2 className="mb-1.5 font-display text-[26px] font-extrabold text-dash-ink">{title}</h2>}
    {sub ? <p className="text-sm text-dash-muted">{sub}</p> : null}
  </div>
)

export const Kv = ({ k, v, className = '' }) => (
  <div className={`flex items-baseline justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0 ${className}`}>
    <span className="text-dash-muted">{k}</span>
    <strong className="text-dash-ink">{v}</strong>
  </div>
)

export const Field = ({ label, hint, as, className = '', children, ...rest }) => {
  const Tag = as === 'select' ? 'select' : as === 'textarea' ? 'textarea' : 'input'
  const base = as === 'select'
    ? 'select select-bordered w-full rounded-btn'
    : as === 'textarea'
    ? 'textarea textarea-bordered w-full rounded-btn text-sm'
    : 'input input-bordered w-full rounded-btn text-sm'
  return (
    <div className={`mb-3 flex flex-col gap-1.5 ${className}`}>
      <label className="text-[12.5px] font-medium text-dash-muted">{label}</label>
      <Tag className={base} {...rest}>{children}</Tag>
      {hint ? <p className="text-xs text-dash-muted/70">{hint}</p> : null}
    </div>
  )
}

export const Tag = ({ children }) => (
  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-dash-muted">{children}</span>
)

/* One row for initiative/competition/learning lists — app.js's row(). */
export function InitRow({ o, cta = 'Open', primary, workspace, tag, meta, extra }) {
  const urgent = o.status !== 'past' && daysLeft(o.deadline) <= 7
  const stale = o.status === 'past'
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dash-line-soft py-3.5 last:border-0">
      <div className="min-w-[220px]">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <strong className="text-dash-ink">{o.name}</strong>
          {o.status === 'live' ? <Pill live>Live</Pill> : null}
          {tag ? <Pill>{tag}</Pill> : null}
        </div>
        <p className="text-sm text-dash-muted">{meta || `${o.org} · ${o.mode} · ${o.region}`}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm ${urgent ? 'font-medium text-dash-warn' : stale ? 'text-dash-faint' : 'text-dash-muted'}`}>
          {deadlineText(o)}
        </span>
        {extra || null}
        <Link
          className={`btn btn-sm rounded-btn ${primary ? 'btn-primary' : 'border border-dash-line bg-dash-bg text-dash-ink hover:bg-dash-bg-soft'}`}
          to={`/dashboard/${workspace ? 'workspace' : 'initiative'}?id=${o.id}`}
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}

/* Journey step selector strip */
export const StepStrip = ({ steps, cur }) => (
  <div className="flex flex-wrap gap-2">
    {steps.map((s, i) => (
      <span
        key={s}
        className={`rounded-full px-3 py-1 text-xs font-medium ${i < cur ? 'bg-dash-ok-soft text-dash-ok' : i === cur ? 'border border-dash-warn/30 bg-dash-warn-soft text-dash-warn' : 'border border-dash-line bg-transparent text-dash-muted'}`}
      >
        {i + 1}. {s}
      </span>
    ))}
  </div>
)
