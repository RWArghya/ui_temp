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
  competing: { label: 'Compete', fg: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  learning: { label: 'Learn', fg: '#0f9c7a', bg: '#ecfdf5', border: '#a7f3d0' },
  learncompete: { label: 'Build', fg: '#d9820a', bg: '#fffbeb', border: '#fde68a' },
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
export function InitiativeCard({ o, st, sv, dest, progress, stepLabel }) {
  const navigate = useNavigate()
  const meta = purposeMeta(o.purpose)
  const saved = isSaved(o.id, st)
  const href = `/dashboard/${dest === 'workspace' ? 'workspace' : 'initiative'}?id=${o.id}`
  const showProgress = !!progress
  const pct = showProgress ? progressPctFor(o, st) : 0
  const actionTitle = dest === 'workspace' ? 'Continue' : 'View'

  return (
    <div
      className="init-card"
      onClick={() => navigate(href)}
      style={{ borderTop: `3px solid ${meta.fg}` }}
    >
      <div className="init-body">
        {/* Main upper content — expands to fill space so bottom section aligns */}
        <div className="init-main-content">
          <div className="row between gap8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusPill status={showProgress && o.status !== 'past' ? 'inprogress' : o.status} />
              <span
                className="pill font-semibold"
                style={{
                  color: meta.fg,
                  backgroundColor: meta.bg,
                  borderColor: meta.border,
                  fontSize: '11px',
                  padding: '2px 8px',
                }}
              >
                {meta.label}
              </span>
            </div>
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
        </div>

        {/* Lower section pinned to the bottom: progress bar sits at the exact same level across cards */}
        <div className="init-bottom-section">
          {showProgress ? (
            <div className="init-progress-block" style={{ marginBottom: '10px' }}>
              <div className="pbar">
                <i style={{ width: pct + '%', background: meta.fg }} />
              </div>
              <div className="row between gap4 mt4">
                <span className="xs faint truncate">{stepLabel || ''}</span>
                <span className="xs faint font-semibold shrink-0">{pct}%</span>
              </div>
            </div>
          ) : null}

          <div className="init-foot">
            <span className="xs muted">{o.prize ? o.prize + ' · ' : ''}{daysLeftLabel(o.deadline)}</span>
            <Link
              className="init-arrow-btn"
              to={href}
              onClick={(e) => e.stopPropagation()}
              title={actionTitle}
              aria-label={actionTitle}
              style={{ background: meta.fg }}
            >
              <Icon name="ArrowRight" size={13} />
            </Link>
          </div>
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
      <Link className="btn btn-primary btn-block btn-sm" style={{ boxSizing: 'border-box' }} to="/profile">Complete profile <Icon name="ArrowRight" size={13} /></Link>
      <div className="mt16"><ProfileChecklist st={st} /></div>
    </div>
  )
}
