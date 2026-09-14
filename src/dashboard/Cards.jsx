import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { daysLeft, isSaved, toggleSavedPatch, progressPctFor, PROFILE_STEPS, profileScore } from './data'

/* ============================================================================
   Ported from prototype_v2/shell.js — statusPill, purposeMeta, initiativeCard
   /continueCard, ProfileChecklist/ProfileProgressCard. Same class names as
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

const PURPOSE_META = {
  competing: { cover: 'c-competing', ico: 'Trophy', fg: '#3557d6' },
  learning: { cover: 'c-learning', ico: 'BookOpen', fg: '#0f9c7a' },
  learncompete: { cover: 'c-learncompete', ico: 'Wrench', fg: '#d9820a' },
}
const purposeMeta = p => PURPOSE_META[p] || PURPOSE_META.competing

function daysLeftLabel(deadline) {
  if (!deadline) return ''
  const d = daysLeft(deadline)
  if (d < 0) return 'Closed'
  if (d === 0) return 'Closes today'
  return `Closes in ${d}d`
}

/* The one card behind both "Recommended for you" and "Continue where you
   left off" — continueCard (below) is a thin preset, not a separate
   component. Clicking anywhere opens the destination; the bookmark is the
   one other control and never navigates (stopPropagation). */
export function InitiativeCard({ o, st, sv, dest, progress, cta, stepLabel }) {
  const navigate = useNavigate()
  const meta = purposeMeta(o.purpose)
  const saved = isSaved(o.id, st)
  const href = `/dashboard/${dest === 'workspace' ? 'workspace' : 'initiative'}?id=${o.id}`
  const showProgress = !!progress
  const pct = showProgress ? progressPctFor(o, st) : 0
  const ctaLabel = cta || (dest === 'workspace' ? 'Continue' : (o.purpose === 'learning' ? 'Enrol' : 'View'))

  return (
    <div className="init-card" onClick={() => navigate(href)}>
      <div className={`init-cover ${meta.cover}`}>
        <span className="icon-chip round" style={{ color: meta.fg }}><Icon name={meta.ico} size={17} /></span>
      </div>
      <div className="init-body">
        <div className="row between gap8">
          <StatusPill status={showProgress && o.status !== 'past' ? 'inprogress' : o.status} />
          <span className="xs faint">{o.mode || ''}</span>
        </div>
        <div className="row gap8" style={{ alignItems: 'flex-start' }}>
          <div className="init-name grow">{o.name}</div>
          <button
            className={`btn-icon btn-ghost save-btn${saved ? ' is-saved' : ''}`}
            title={saved ? 'Saved' : 'Save for later'}
            onClick={(e) => { e.stopPropagation(); sv(toggleSavedPatch(o.id, st)) }}
          >
            <Icon name="Bookmark" size={15} />
          </button>
        </div>
        <div className="init-org">{o.org} · {o.region || ''}</div>
        <div className="init-meta">
          {(o.areas || []).slice(0, 3).map(a => <span key={a} className="pill pill-outline">{a}</span>)}
        </div>
        {showProgress ? (
          <>
            <div className="pbar mt10"><i style={{ width: pct + '%' }} /></div>
            <div className="row between gap4 mt6"><span className="xs faint">{stepLabel || ''}</span><span className="xs faint">{pct}%</span></div>
          </>
        ) : null}
        <div className="init-foot">
          <span className="xs muted">{o.prize ? o.prize + ' · ' : ''}{daysLeftLabel(o.deadline)}</span>
          <Link className="btn btn-primary btn-sm" to={href} onClick={(e) => e.stopPropagation()}>{ctaLabel} <Icon name="ArrowRight" size={13} /></Link>
        </div>
      </div>
    </div>
  )
}
/* continue-card — "Continue where you left off": same card, workspace-bound, with progress */
export const ContinueCard = ({ o, st, sv, next }) => (
  <InitiativeCard o={o} st={st} sv={sv} dest="workspace" progress cta="Continue" stepLabel={next ? next.step : ''} />
)

/* One canonical checklist — one "done" signal per row (a circular check), or
   (mutually exclusive) a "Next" button in that same slot. Never both. */
export function ProfileChecklist({ st }) {
  return (
    <>
      {PROFILE_STEPS.map(s => {
        const prof = st.profile && typeof st.profile === 'object' && !Array.isArray(st.profile) ? st.profile : st
        const v = prof[s.key]
        const ok = s.test ? s.test(v) : !!(v && String(v).trim())
        return (
          <div key={s.key} className="check-list-row">
            <span className="check-list-label">{s.label}</span>
            {ok
              ? <span className="check-list-status" aria-label="Completed"><Icon name="Check" size={12} /></span>
              : <Link className="check-list-action" to={`/profile?focus=${s.key}`} aria-label={`Complete ${s.label}`} title={`Complete ${s.label}`}><Icon name="ArrowRight" size={12} /></Link>}
          </div>
        )
      })}
    </>
  )
}
/* homeRail() in app.html hides this entirely at 100% — returning null (not
   display:none) so the surrounding .grid.g3 reflows into the freed column,
   per proto.css's `.shell:not(.has-rail) .grid.g3` rule. */
export function ProfileProgressCard({ st }) {
  const { pct, missing } = profileScore(st)
  if (pct >= 100) return null
  return (
    <div className="card card-pad">
      <div className="row between"><h3>Your progress</h3></div>
      <div className="row gap16" style={{ marginTop: '14px', marginBottom: '18px' }}>
        <div className="pring" style={{ '--pct': pct }}><div className="pring-inner">{pct}%</div></div>
        <div className="col">
          <span className="medium small">Profile completion</span>
          <span className="xs muted">{PROFILE_STEPS.length - missing.length} of {PROFILE_STEPS.length} steps</span>
        </div>
      </div>
      <Link className="btn btn-primary btn-block btn-sm" to="/profile">Complete profile <Icon name="ArrowRight" size={13} /></Link>
      <div className="mt16"><ProfileChecklist st={st} /></div>
    </div>
  )
}
