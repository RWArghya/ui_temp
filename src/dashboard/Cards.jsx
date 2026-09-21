import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from './Icon'
import { daysLeft, isSaved, toggleSavedPatch, progressPctFor, PROFILE_STEPS, profileScore } from './data'

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

/* Continue rows go to the workspace and show progress; a Continue row's status
   is only shown when Live ("In Progress" would repeat the progress bar). */
export function InitiativeRow({ o, st, sv, next, compact }) {
  const { href, category, org, dlLabel, closingSoon } = useInitiative(o, compact ? 'initiative' : 'workspace')
  const action = compact ? 'View' : 'Continue'
  const pct = compact ? 0 : progressPctFor(o, st)
  const status = compact ? o.status : (o.status === 'live' ? 'live' : null)
  return (
    <div className={`init-row${compact ? ' is-compact' : ''}`}>
      <span className="init-tile" aria-hidden="true"><Icon name={category[1]} size={17} /></span>
      <div className="init-main">
        <div className="init-name">{o.name}</div>
        <div className="init-meta"><b>{category[0]}</b> · {org}</div>
      </div>
      {compact ? null : (
        <div className="init-prog">
          <div className="pbar"><i style={{ width: pct + '%' }} /></div>
          <div className="init-prog-l"><span>{next ? next.step : ''}</span><b>{pct}%</b></div>
        </div>
      )}
      <div className="init-status">
        {status ? <StatusText status={status} /> : null}
        <span className={`init-dl${closingSoon ? ' is-soon' : ''}`}>{compact && o.prize ? `${o.prize} · ` : ''}{dlLabel}</span>
      </div>
      <div className="init-actions">
        <Link className={`btn btn-sm init-stretch ${compact ? 'btn-outline' : 'btn-go'}`} to={href} aria-label={`${action} ${o.name}`}>{action}</Link>
        <SaveButton o={o} st={st} sv={sv} />
      </div>
    </div>
  )
}

/* Profile completion. The meter is the 8 steps, each as wide as its weight, so
   the filled part is the percentage and the hollow segments are what is left.
   "N steps left" opens a popover (no layout shift): missing steps by payoff,
   plus one "Done:" line. With a single step left there is nothing to open, so
   its name is shown inline. The button goes straight to the best next step. */
export function ProfileProgress({ st }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const away = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() } }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])

  const { pct, missing } = profileScore(st)
  if (pct >= 100) return null
  const todo = [...missing].sort((a, b) => b.w - a.w)
  const next = todo[0]
  const one = todo.length === 1
  const missingKeys = new Set(missing.map(s => s.key))
  const stepHref = (s) => `/profile?focus=${s.key}`
  const meter = (
    <span className="pz-meter" aria-hidden="true">
      {PROFILE_STEPS.map(s => {
        const done = !missingKeys.has(s.key)
        return <i key={s.key} className={done ? 'on' : ''} style={{ flex: s.w }} title={`${s.label} — ${done ? 'done' : '+' + s.w + '%'}`} />
      })}
    </span>
  )

  return (
    <div className="pz-wrap" ref={wrapRef}>
      <div className="pz">
        {one ? (
          <div className="pz-main is-static">
            <span className="pz-t"><b>Profile {pct}%</b><span>1 step left:</span><Link to={stepHref(next)}>{next.label}</Link></span>
            {meter}
          </div>
        ) : (
          <button type="button" ref={btnRef} className="pz-main" aria-expanded={open} aria-controls="profile-steps" onClick={() => setOpen(o => !o)}>
            <span className="pz-t"><b>Profile {pct}%</b><span>{todo.length} steps left</span><Icon name="ChevronDown" size={14} /></span>
            {meter}
          </button>
        )}
        <Link className="btn btn-primary btn-sm" to={stepHref(next)} title={`Next: ${next.label}`}>Complete profile</Link>
      </div>
      {open && !one ? (
        <div className="pz-pop" id="profile-steps" role="region" aria-label="Profile steps">
          <div className="pz-pop-h">Still to do</div>
          <ul>
            {todo.map(s => (
              <li key={s.key}><Link to={stepHref(s)}><span>{s.label}</span><b>+{s.w}%</b><Icon name="ArrowRight" size={13} /></Link></li>
            ))}
          </ul>
          <p className="pz-done"><b>Done:</b>{PROFILE_STEPS.filter(s => !missingKeys.has(s.key)).map(s => s.label).join(' · ')}</p>
        </div>
      ) : null}
    </div>
  )
}
