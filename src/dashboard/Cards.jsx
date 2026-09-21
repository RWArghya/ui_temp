import { Link, useSearchParams } from 'react-router-dom'
import Icon from './Icon'
import { daysLeft, isSaved, toggleSavedPatch, progressPctFor, PROFILE_STEPS, profileScore } from './data'

/* ============================================================================
   Ported from prototype_v2/shell.js — statusPill, purposeMeta, initiativeCard
   /continueCard, ProfileProgressCard. Same class names as
   proto.css (.init-card, .check-list-row, .pring…), so visual fidelity comes
   from the CSS itself, not a re-derivation of it.
   ============================================================================ */

export function StatusPill({ status }) {
  const map = {
    live: ['pill-live', true, 'Live'],
    upcoming: ['pill-upcoming', false, 'Upcoming'],
    past: ['pill-done', false, 'Completed'],
    inprogress: ['pill-progress', false, 'In Progress'],
  }
  const [cls, dot, label] = map[status] || ['pill', false, status]
  return <span className={`pill ${cls}`}>{dot ? <span className="pill-dot" /> : null}{label}</span>
}

const PURPOSE_LABEL = { competing: 'Compete', learning: 'Learn', learncompete: 'Build' }

function daysLeftLabel(deadline) {
  if (!deadline) return ''
  const d = daysLeft(deadline)
  if (d < 0) return 'Closed'
  if (d === 0) return 'Closes today'
  return `Closes in ${d}d`
}

/* The one card behind both "Recommended for you" and "Continue where you
   left off" — continueCard (below) is a thin preset, not a separate
   component. The action link stretches over the whole card (::after in
   proto.css), so the card is one link; the bookmark sits above it.
   Kept deliberately shallow — purpose + status, name, org line, then the
   one number that matters (progress or deadline) — everything else lives
   on the initiative page, not the card. */
export function InitiativeCard({ o, st, sv, dest, progress, stepLabel }) {
  const [sp] = useSearchParams()
  const currentView = sp.get('view') || 'home'
  const saved = isSaved(o.id, st)
  const href = `/dashboard/${dest === 'workspace' ? 'workspace' : 'initiative'}?id=${o.id}&from=${currentView}`
  const showProgress = !!progress
  const pct = showProgress ? progressPctFor(o, st) : 0
  const actionTitle = dest === 'workspace' ? 'Continue' : 'View'
  /* on a Continue card "In Progress" repeats the progress bar — only Live is news */
  const status = showProgress ? (o.status === 'live' ? 'live' : null) : o.status

  return (
    <div className={`init-card p-${o.purpose}`}>
      <button
        type="button"
        className={`btn-icon btn-ghost save-btn${saved ? ' is-saved' : ''}`}
        title={saved ? 'Saved' : 'Save for later'}
        aria-label={saved ? 'Saved' : 'Save for later'}
        aria-pressed={saved}
        onClick={() => sv(toggleSavedPatch(o.id, st))}
      >
        <Icon name="Bookmark" size={15} />
      </button>

      <div className="init-top">
        <span className="init-tag">{PURPOSE_LABEL[o.purpose] || PURPOSE_LABEL.competing}</span>
        {status ? <StatusPill status={status} /> : null}
      </div>

      <div className="init-name">{o.name}</div>
      <div className="init-org">{[o.org, o.region, o.mode].filter(Boolean).join(' · ')}</div>

      <div className="init-bottom-section">
        {showProgress ? (
          <div className="init-progress-block">
            <div className="pbar"><i style={{ width: pct + '%' }} /></div>
            <div className="row between gap4 mt4">
              <span className="xs muted truncate">{stepLabel || ''}</span>
              <span className="xs medium shrink-0">{pct}%</span>
            </div>
          </div>
        ) : null}

        <div className="init-foot">
          {/* the deadline never truncates — only a long prize string does */}
          <span className="init-when">
            {o.prize && !showProgress ? <span className="truncate">{o.prize} ·</span> : null}
            <span>{daysLeftLabel(o.deadline)}</span>
          </span>
          <Link className="init-act" to={href} aria-label={`${actionTitle} ${o.name}`}>
            {actionTitle}
          </Link>
        </div>
      </div>
    </div>
  )
}
/* continue-card — "Continue where you left off": same card, workspace-bound, with progress */
export const ContinueCard = ({ o, st, sv, next }) => (
  <InitiativeCard o={o} st={st} sv={sv} dest="workspace" progress cta="Continue" stepLabel={next ? next.step : ''} />
)

/* Profile completion — the right-rail card (Shell mounts it via app-rail,
   removed entirely at 100%). A ring for the headline number, then every
   step as one row: done steps are a plain line with a check, the steps
   still to do are their own bordered, clickable row with a chevron —
   the two states read apart at a glance, no legend needed. */
export function ProfileProgressCard({ st }) {
  const { pct, missing } = profileScore(st)
  if (pct >= 100) return null
  const missingKeys = new Set(missing.map(s => s.key))
  const stepHref = (s) => `/profile?focus=${s.key}`

  return (
    <div className="card card-pad profile-card">
      <div className="profile-card-head">
        <div className="pring" style={{ '--pct': pct }}><div className="pring-inner">{pct}%</div></div>
        <div className="col">
          <h3>Complete your profile</h3>
          <span className="xs muted">{missing.length} of {PROFILE_STEPS.length} steps left</span>
        </div>
      </div>
      <ul className="profile-steps">
        {PROFILE_STEPS.map(s => {
          const done = !missingKeys.has(s.key)
          return done ? (
            <li key={s.key} className="profile-step is-done">
              <span className="check-list-status"><Icon name="Check" size={12} /></span>
              <span>{s.label}</span>
            </li>
          ) : (
            <li key={s.key} className="profile-step">
              <Link to={stepHref(s)} className="profile-step-link">
                <span className="profile-step-dot" aria-hidden="true" />
                <span className="grow">{s.label}</span>
                <Icon name="ChevronRight" size={16} className="profile-step-chev" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
