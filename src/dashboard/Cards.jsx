import { Link, useSearchParams } from 'react-router-dom'
import Icon from './Icon'
import { daysLeft, isSaved, toggleSavedPatch, PROFILE_STEPS, profileScore } from './data'

/* ============================================================================
   Initiative presentation. Two shapes, one data model:
     InitiativeCard — browse shape (Recommended, Learn, Compete, Build, Saved, Recent)
     InitiativeRow  — work-list shape (Continue, My Activity); `compact` drops
                      the progress column for browse lists on phones
   Colour only ever means something: blue = act/progress, green = live,
   amber = closing soon. Category is an icon + a word, never a hue.
   ============================================================================ */

const STATUS = {
  live: ['st-live', 'Live'],
  upcoming: ['', 'Upcoming'],
  past: ['', 'Completed'],
  inprogress: ['st-prog', 'In Progress'],
}
export function StatusText({ status }) {
  const [cls, label] = STATUS[status] || ['', status]
  return <span className={`st ${cls}`}>{label}</span>
}

const PURPOSE = { competing: ['Compete', 'Trophy'], learning: ['Learn', 'BookOpen'], learncompete: ['Build', 'Wrench'] }

function daysLeftLabel(deadline) {
  if (!deadline) return ''
  const d = daysLeft(deadline)
  if (d < 0) return 'Closed'
  if (d === 0) return 'Closes today'
  return `Closes in ${d}d`
}

/* everything both shapes derive from an initiative */
function useInitiative(o, dest) {
  const [sp] = useSearchParams()
  const from = sp.get('view') || 'home'
  const left = o.deadline ? daysLeft(o.deadline) : null
  return {
    href: `/dashboard/${dest}?id=${o.id}&from=${from}`,
    category: PURPOSE[o.purpose] || PURPOSE.competing,
    org: [o.org, o.region, o.mode].filter(Boolean).join(' · '),
    dlLabel: daysLeftLabel(o.deadline),
    closingSoon: left !== null && left >= 0 && left <= 7,
  }
}

function SaveButton({ o, st, sv }) {
  const saved = isSaved(o.id, st)
  return (
    <button
      type="button"
      className={`save-btn${saved ? ' is-saved' : ''}`}
      title={saved ? 'Saved' : 'Save for later'}
      aria-label={saved ? 'Saved' : 'Save for later'}
      aria-pressed={saved}
      onClick={() => sv(toggleSavedPatch(o.id, st))}
    >
      <Icon name="Bookmark" size={16} />
    </button>
  )
}

/* The action link stretches over the whole card (::after in proto.css), so the
   card is one link; the bookmark sits above it. */
export function InitiativeCard({ o, st, sv }) {
  const { href, category, org, dlLabel, closingSoon } = useInitiative(o, 'initiative')
  return (
    <div className="init-card">
      <div className="init-top">
        <span className="init-tag"><Icon name={category[1]} size={14} />{category[0]}</span>
        <StatusText status={o.status} />
        <SaveButton o={o} st={st} sv={sv} />
      </div>
      <div className="init-name">{o.name}</div>
      <div className="init-org">{org}</div>
      <div className="init-foot">
        {/* prize over deadline: two lines, so neither is ever cut */}
        <span className="init-when">
          {o.prize ? <span className="init-prize">{o.prize}</span> : null}
          <span className={`init-dl${closingSoon ? ' is-soon' : ''}`}>{dlLabel}</span>
        </span>
        <Link className="btn btn-outline btn-sm init-stretch" to={href} aria-label={`View ${o.name}`}>View</Link>
      </div>
    </div>
  )
}

/* Continue rows go to the workspace. Kept shallow on purpose: icon, title +
   org, "Next <step>", the deadline, one primary action — the exact shape
   asked for, not a progress bar buried in another column. */
export function InitiativeRow({ o, st, sv, next, compact }) {
  const { href, category, org, dlLabel, closingSoon } = useInitiative(o, compact ? 'initiative' : 'workspace')
  const action = compact ? 'View' : 'Continue'

  if (compact) {
    return (
      <div className="init-row is-compact">
        <span className="init-tile" aria-hidden="true"><Icon name={category[1]} size={17} /></span>
        <div className="init-main">
          <div className="init-name">{o.name}</div>
          <div className="init-meta"><b>{category[0]}</b> · {org}</div>
        </div>
        <div className="init-status">
          {o.status ? <StatusText status={o.status} /> : null}
          <span className={`init-dl${closingSoon ? ' is-soon' : ''}`}>{o.prize ? `${o.prize} · ` : ''}{dlLabel}</span>
        </div>
        <div className="init-actions">
          <Link className="btn btn-sm btn-outline init-stretch" to={href} aria-label={`${action} ${o.name}`}>{action}</Link>
          <SaveButton o={o} st={st} sv={sv} />
        </div>
      </div>
    )
  }

  return (
    <div className="init-row">
      <span className="init-tile" aria-hidden="true"><Icon name={category[1]} size={17} /></span>
      <div className="init-main">
        <div className="init-title-line">
          <span className="init-name">{o.name}</span>
          <span className="init-org">{org}</span>
        </div>
        {next?.step ? <div className="init-next"><span className="init-next-label">Next</span>{next.step}</div> : null}
      </div>
      <div className="init-row-end">
        <span className={`init-dl${closingSoon ? ' is-soon' : ''}`}>{dlLabel}</span>
        <Link className="btn btn-primary btn-sm init-stretch" to={href} aria-label={`${action} ${o.name}`}>{action}</Link>
      </div>
    </div>
  )
}

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
