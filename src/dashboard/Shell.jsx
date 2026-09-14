import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { initials, mentorStatus, mentorRoleLabel, approvedChallenges, notesFor, unreadFor } from './data'

/* ============================================================================
   Ported from prototype_v2/shell.js — Sidebar, Topbar, NotificationBell,
   the persona/settings popovers. Same class names, same markup shape, same
   behaviour (`togglePersonaMenu`/`toggleSettingsMenu`/`toggleBell` become
   local `useState` here, which is the only thing that changes in a port —
   see COMPONENTS.md). Rendered inside a `.dash-root` wrapper so proto.css's
   scoped rules apply.
   ============================================================================ */

const NAV_INNOVATOR = [
  { k: 'home', label: 'Dashboard', ico: 'Home' },
  { k: 'learning', label: 'Learn', ico: 'BookOpen' },
  { k: 'competing', label: 'Compete', ico: 'Trophy' },
  { k: 'learncompete', label: 'Build', ico: 'Wrench' },
  /* prototype_v2's own NAV_INNOVATOR marks Arena disabled/"Soon" — it's a
     stub there. This app already has a working Arena/PromptWars page, so
     it stays enabled here rather than hiding a real feature to match a stub. */
  { k: 'arena', label: 'Arena', ico: 'Gamepad2' },
]
const NAV_INNOVATOR_UTILITY = [
  { k: 'saved', label: 'Saved', ico: 'Bookmark' },
  { k: 'recent', label: 'Recent', ico: 'Clock' },
]
function navMentor(st) {
  const status = mentorStatus(st)
  const mapped = approvedChallenges(st).length > 0
  const out = [{ k: 'mentor', label: 'Mentor home', ico: 'Home' }]
  if (status === 'approved') out.push({ k: 'm_challenges', label: 'My challenges', ico: 'Flag' })
  const dim = status !== 'approved' || !mapped
  out.push(
    { k: 'm_queue', label: 'Evaluation queue', ico: 'ClipboardCheck', soft: dim },
    { k: 'm_teams', label: 'Teams & office hours', ico: 'Users', soft: dim },
    { k: 'm_sessions', label: 'Booked sessions', ico: 'Calendar', soft: dim },
    { k: 'm_impact', label: 'Impact', ico: 'TrendingUp', soft: dim },
  )
  return out
}

const PERSONAS = [
  { k: 'innovator', ico: 'GraduationCap', label: 'Innovator', sub: 'learns and competes' },
  { k: 'sponsor', ico: 'Building2', label: 'Sponsor', sub: 'pays, runs challenges' },
  { k: 'mentor', ico: 'ClipboardCheck', label: 'Mentor', sub: 'guides and evaluates' },
  { k: 'enabler', ico: 'LayoutDashboard', label: 'Enabler', sub: 'H2S success team' },
]

function usePopoverClose(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const t = setTimeout(() => document.addEventListener('click', away), 0)
    return () => { clearTimeout(t); document.removeEventListener('click', away) }
  }, [open])
}

function NavLink({ n, active, onClick }) {
  if (n.disabled) {
    return (
      <span className="side-link disabled" title="Coming soon">
        <Icon name={n.ico} size={18} /><span>{n.label}</span>
        <span className="pill pill-outline xs" style={{ marginLeft: 'auto' }}>Soon</span>
      </span>
    )
  }
  return (
    <a className={`side-link${active ? ' active' : ''}${n.soft ? ' soft' : ''}`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <Icon name={n.ico} size={18} /><span>{n.label}</span>
    </a>
  )
}

export function Sidebar({ mode = 'innovator', active = 'home', st, show, onSignOut, switchPersona }) {
  const nav = mode === 'mentor' ? navMentor(st) : NAV_INNOVATOR
  const persona = PERSONAS.find(p => p.k === (mode === 'mentor' ? 'mentor' : 'innovator'))
  const [personaOpen, setPersonaOpen] = useState(false)
  const personaRef = useRef(null)
  usePopoverClose(personaOpen, setPersonaOpen, personaRef)

  return (
    <aside className="app-sidebar">
      <a className="brand" onClick={() => show('home')} style={{ cursor: 'pointer' }}>
        <span className="brand-mark">H2S</span>
        <span className="brand-name">Hack2skill</span>
      </a>
      <nav className="side-nav">
        {nav.map(n => (
          <NavLink key={n.k} n={n} active={n.k === active} onClick={() => show(n.k)} />
        ))}
        {mode === 'innovator' ? (
          <>
            <div className="divider" style={{ margin: '8px 4px' }} />
            {NAV_INNOVATOR_UTILITY.map(n => <NavLink key={n.k} n={n} active={n.k === active} onClick={() => show(n.k)} />)}
          </>
        ) : null}
      </nav>
      <div className="side-spacer" />
      <div className="side-foot">
        <div style={{ position: 'relative' }} ref={personaRef}>
          <button className="persona-pill-btn" onClick={() => setPersonaOpen(o => !o)}>
            <Icon name={persona.ico} size={16} /><span>{persona.label}</span>
            <span style={{ marginLeft: 'auto', display: 'flex' }}><Icon name="ChevronUp" size={15} /></span>
          </button>
          {personaOpen ? (
            <div className="persona-menu">
              <div className="tag-line">View as — prototype only</div>
              {PERSONAS.map(p => (
                <a
                  key={p.k}
                  className={(mode === 'mentor' ? 'mentor' : 'innovator') === p.k ? 'on' : ''}
                  style={{ cursor: p.k === 'innovator' || p.k === 'mentor' ? 'pointer' : 'not-allowed', opacity: p.k === 'innovator' || p.k === 'mentor' ? 1 : 0.5 }}
                  onClick={() => { if (p.k === 'innovator' || p.k === 'mentor') { switchPersona(p.k); setPersonaOpen(false) } }}
                >
                  <Icon name={p.ico} size={16} /><span>{p.label}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className="divider" style={{ margin: '2px 4px' }} />
        {/* Now a real page (Settings.jsx) — Account/Notifications/Privacy/
           Preferences/Danger-zone — not the two-item prototype-utility
           popover this used to open. Those two utilities moved into the
           page's own Danger zone section rather than disappearing. */}
        <a className={`side-link${active === 'settings' ? ' active' : ''}`} onClick={() => show('settings')} style={{ cursor: 'pointer' }}>
          <Icon name="Settings" size={18} /><span>Settings</span>
        </a>
        <a className="side-link" onClick={onSignOut} style={{ cursor: 'pointer' }}>
          <Icon name="LogOut" size={18} /><span>Log out</span>
        </a>
      </div>
    </aside>
  )
}

function Avatar({ st }) {
  return <span className="avatar">{initials(st.profile?.name || st.name)}</span>
}

export function NotificationBell({ st, sv, who }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  usePopoverClose(open, setOpen, ref)
  const list = notesFor(st, who)
  const unread = unreadFor(st, who)
  const markRead = () => sv({ notes: (st.notes || []).map(n => (n.to === who ? { ...n, read: true } : n)) })
  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={() => { setOpen(o => !o); if (!open) markRead() }}>
        <Icon name="Bell" size={17} />
        {unread ? <span className="bell-dot">{unread > 9 ? '9+' : unread}</span> : null}
      </button>
      {open ? (
        <div className="bell-panel">
          <div className="bell-head">
            <strong className="small">Notifications</strong>
            {list.length ? <button className="btn btn-quiet btn-sm" onClick={() => { markRead(); setOpen(false) }}>Mark all read</button> : null}
          </div>
          <div className="bell-list">
            {list.length ? list.map(n => (
              <div key={n.id} className={`bell-item ${!n.read ? 'unread' : ''}`}>
                <div className="row between gap8">
                  <strong className="small">{n.title}</strong>
                  <span className="xs faint" style={{ whiteSpace: 'nowrap' }}>{n.at ? new Date(n.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                </div>
                <p className="xs muted mt4">{n.body}</p>
              </div>
            )) : (
              <div className="bell-empty">
                <p className="small muted">Nothing yet.</p>
                <p className="xs faint mt8">Actions by other people — an approval, a score, a stage change — land here.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function Topbar({ st, sv, who, onProfile }) {
  return (
    <header className="app-topbar">
      <div className="grow" />
      <div className="topbar-actions">
        <NotificationBell st={st} sv={sv} who={who} />
        <a className="avatar-link" onClick={onProfile} title="Profile" style={{ cursor: 'pointer' }}>
          <Avatar st={st} />
        </a>
      </div>
    </header>
  )
}
