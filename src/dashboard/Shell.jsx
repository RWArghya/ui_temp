import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { initials, mentorStatus, mentorRoleLabel, approvedChallenges, notesFor, unreadFor } from './data'

/* ============================================================================
   Sidebar, Topbar, NotificationBell.
   Side-foot (role switcher + settings + sign out) ported from the proto2
   branch's SidePersonaPill / SideFoot components.
   ============================================================================ */

const NAV_INNOVATOR = [
  { k: 'home', label: 'Dashboard', ico: 'Home' },
  { k: 'learning', label: 'Learn', ico: 'BookOpen' },
  { k: 'competing', label: 'Compete', ico: 'Trophy' },
  { k: 'learncompete', label: 'Build', ico: 'Wrench' },
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

/* Prototype-only "view as" personas.
   Innovator and Mentor are real modes; Sponsor and Enabler are stubs. */
const PERSONAS = [
  { k: 'innovator', ico: 'GraduationCap', label: 'Innovator', sub: 'learns and competes' },
  { k: 'sponsor',   ico: 'Building2',     label: 'Sponsor',   sub: 'pays, runs challenges' },
  { k: 'mentor',    ico: 'ClipboardCheck',label: 'Mentor',    sub: 'guides and evaluates' },
  { k: 'enabler',   ico: 'LayoutDashboard',label: 'Enabler',  sub: 'H2S success team' },
]

function usePopoverClose(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const t = setTimeout(() => document.addEventListener('click', away), 0)
    return () => { clearTimeout(t); document.removeEventListener('click', away) }
  }, [open])
}

/* ── Individual persona pill inside the flyout ribbon (exact proto2 branch) ── */
function PersonaPill({ persona, active, onSwitch, onSponsor, dark }) {
  const light = !dark
  const on = persona.k === active
  const disabled = persona.k === 'enabler'

  if (disabled) {
    return (
      <span
        title={persona.sub}
        className={`flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${
          light ? 'text-dash-faint' : 'text-white/25'
        }`}
      >
        <Icon name={persona.ico} size={14} className="shrink-0" />
        <span>{persona.label}</span>
      </span>
    )
  }

  return (
    <button
      type="button"
      title={persona.sub}
      onClick={() => (persona.k === 'sponsor' ? (onSponsor ? onSponsor() : onSwitch('sponsor')) : onSwitch(persona.k))}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
        on
          ? (light ? 'bg-ink-900 font-bold text-white shadow-sm' : 'bg-white font-bold text-ink-900 shadow-sm')
          : (light ? 'text-dash-muted hover:bg-dash-line-soft hover:text-dash-ink' : 'text-white/70 hover:bg-white/10 hover:text-white')
      }`}
    >
      <Icon name={persona.ico} size={14} className="shrink-0" />
      <span>{persona.label}</span>
    </button>
  )
}

/* ── SidePersonaPill — hover-activated "View as" pill (exact proto2 branch) ──
   A single compact button shows the active persona. Hovering opens
   a horizontal role ribbon outward to the right so the user can switch
   roles side-by-side (Innovator, Sponsor, Mentor, Enabler). */
function SidePersonaPill({ active, onSwitch, onSponsor, dark }) {
  const current = PERSONAS.find(p => p.k === active) || PERSONAS[0]
  const light = !dark

  return (
    <div className="group relative">
      {/* Trigger pill */}
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-btn px-3 py-[9px] text-sm transition-colors cursor-pointer ${
          light
            ? 'border border-dash-line bg-dash-bg text-dash-ink hover:border-signal/40 hover:bg-signal-soft hover:text-signal-dark'
            : 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/10'
        }`}
      >
        <Icon name={current.ico} size={14} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">
          <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${light ? 'text-dash-muted' : 'text-white/50'}`}>View as</span>
          <span className={`ml-1.5 text-[13px] font-semibold ${light ? 'text-dash-ink' : 'text-white'}`}>{current.label}</span>
        </span>
        <span className={`text-[11px] font-mono tracking-tighter ${light ? 'text-dash-muted' : 'text-white/40'}`}>››</span>
      </button>

      {/* Flyout horizontal ribbon — opens to the right on group-hover.
          Continuous hover hit-box with -ml-1 pl-3 py-2.5 so there is no
          gap glitch when moving cursor between trigger and ribbon. */}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 z-50 -ml-1 pl-3 py-2.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 shadow-dash-lg backdrop-blur-md ${
          light ? 'border-dash-line bg-dash-bg text-dash-ink' : 'border-white/10 bg-ink-900/95 text-white'
        }`}>
          <span className={`px-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] ${
            light ? 'text-dash-muted' : 'text-white/40'
          }`}>View as</span>
          {PERSONAS.map(p => (
            <PersonaPill
              key={p.k}
              persona={p}
              active={active}
              onSwitch={onSwitch}
              onSponsor={onSponsor}
              dark={dark}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── SideFoot — sidebar footer (role switcher only) ── */
function SideFoot({ role, dark, active, onSwitch, onSponsor }) {
  return (
    <div className={`mt-auto pt-3 ${dark ? '' : 'pb-3'}`}>
      <hr className={`mb-2 border-t ${dark ? 'border-white/10' : 'border-dash-line-soft'}`} />
      {role ? (
        <p className="mb-2 px-3 text-xs font-medium text-brand-violet">{role}</p>
      ) : null}

      {/* Persona / role switcher */}
      {onSwitch ? (
        <div className="mb-1">
          <SidePersonaPill active={active} onSwitch={onSwitch} onSponsor={onSponsor} dark={dark} />
        </div>
      ) : null}
    </div>
  )
}

function NavLink({ n, active, onClick }) {
  if (n.disabled) {
    return (
      <span className="side-link disabled" title="Coming soon">
        <Icon name={n.ico} size={18} /><span>{n.label}</span>
        <span className="pill pill-outline xs side-link-soon">Soon</span>
      </span>
    )
  }
  return (
    <a className={`side-link${active ? ' active' : ''}${n.soft ? ' soft' : ''}`} onClick={onClick}>
      <Icon name={n.ico} size={18} /><span>{n.label}</span>
    </a>
  )
}

export function Sidebar({ mode = 'innovator', active = 'home', st, show, onSignOut, switchPersona }) {
  const nav = mode === 'mentor' ? navMentor(st) : NAV_INNOVATOR
  const dark = mode === 'mentor'
  const navigate = useNavigate()
  const ms = mentorStatus(st)
  const roleLabel = ms !== 'none' ? mentorRoleLabel(st) : null

  return (
    <aside className="app-sidebar">
      <a className="brand" onClick={() => show('home')}>
        <span className="brand-mark">H2S</span>
        <span className="brand-name">Hack2skill</span>
      </a>
      <nav className="side-nav">
        {nav.map(n => (
          <NavLink key={n.k} n={n} active={n.k === active} onClick={() => show(n.k)} />
        ))}
        {mode === 'innovator' ? (
          <>
            <div className="divider side-nav-divider" />
            {NAV_INNOVATOR_UTILITY.map(n => <NavLink key={n.k} n={n} active={n.k === active} onClick={() => show(n.k)} />)}
          </>
        ) : null}
      </nav>
      <SideFoot
        role={dark ? roleLabel : null}
        active={mode === 'mentor' ? 'mentor' : 'innovator'}
        dark={dark}
        onSwitch={(k) => {
          if (switchPersona) switchPersona(k)
          else show(k === 'mentor' ? 'mentor' : 'home')
        }}
        onSponsor={() => navigate('/sponsor')}
      />
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
                  <span className="xs faint nowrap">{n.at ? new Date(n.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
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

export function Topbar({
  st,
  sv,
  who,
  view,
  onBack,
  backLabel,
  currentTitle,
  currentSubtitle,
  onProfile,
  onActivity,
  onSettings,
  onSignOut,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  usePopoverClose(menuOpen, setMenuOpen, menuRef)

  return (
    <header className="app-topbar">
      <div className="topbar-nav-start">
        {onBack ? (
          <button
            type="button"
            id="btn-topbar-back"
            onClick={onBack}
            className="btn-topbar-back"
            title={`Back to ${backLabel || 'Dashboard'}`}
            aria-label={`Back to ${backLabel || 'Dashboard'}`}
          >
            <Icon name="ArrowLeft" size={17} />
          </button>
        ) : null}

        <div className="topbar-breadcrumbs">
          {onBack && backLabel ? (
            <>
              <button
                type="button"
                onClick={onBack}
                className="text-dash-muted hover:text-dash-ink hover:underline font-medium truncate cursor-pointer transition-colors bg-transparent border-0 p-0 text-[14px]"
              >
                {backLabel}
              </button>
              <span className="text-dash-faint select-none">/</span>
            </>
          ) : null}
          {currentSubtitle ? (
            <span className="flex flex-col min-w-0 leading-tight">
              <span className="font-semibold text-dash-ink truncate text-[14.5px]">
                {currentTitle || (onBack ? '' : 'Innovator Dashboard')}
              </span>
              <span className="text-dash-muted truncate text-[11.5px] font-normal">
                {currentSubtitle}
              </span>
            </span>
          ) : (
            <span className="font-semibold text-dash-ink truncate text-[14.5px]">
              {currentTitle || (onBack ? '' : 'Innovator Dashboard')}
            </span>
          )}
        </div>
      </div>

      <div className="grow" />
      <div className="topbar-actions flex items-center gap-3">
        <NotificationBell st={st} sv={sv} who={who} />

        {/* Profile Avatar Trigger & Dropdown Menu */}
        <div className="relative flex items-center" ref={menuRef}>
          <button
            id="btn-topbar-profile"
            type="button"
            className="avatar-link cursor-pointer border-0 bg-transparent p-0 flex items-center justify-center focus:outline-none"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            title="Profile menu"
          >
            <Avatar st={st} />
          </button>

          {menuOpen && (
            <div
              id="topbar-profile-dropdown"
              className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-[2px] border border-paper-line bg-white py-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100 font-sans"
            >
              <button
                id="menu-item-my-profile"
                type="button"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-900 hover:bg-paper font-medium cursor-pointer transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false)
                  onProfile?.()
                }}
              >
                <Icon name="User" size={15} className="text-graphite-dim shrink-0" />
                <span>My Profile</span>
              </button>

              <button
                id="menu-item-my-activity"
                type="button"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-900 hover:bg-paper font-medium cursor-pointer transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false)
                  onActivity?.()
                }}
              >
                <Icon name="Activity" size={15} className="text-graphite-dim shrink-0" />
                <span>My Activity</span>
              </button>

              <button
                id="menu-item-settings"
                type="button"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-900 hover:bg-paper font-medium cursor-pointer transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false)
                  onSettings?.()
                }}
              >
                <Icon name="Settings" size={15} className="text-graphite-dim shrink-0" />
                <span>Settings</span>
              </button>

              <div className="border-t border-paper-line my-1" />

              <button
                id="menu-item-logout"
                type="button"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-red-600 hover:bg-red-50 font-medium cursor-pointer transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false)
                  onSignOut?.()
                }}
              >
                <Icon name="LogOut" size={15} className="text-red-500 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
