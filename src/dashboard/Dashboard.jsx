import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Home as HomeIcon, BookOpen, Trophy, Wrench, Gamepad2, Bookmark, Clock, Sparkles,
  Settings, LogOut, Bell, ArrowRight, Check, Compass, Users,
} from 'lucide-react'
import { useH2S, seedDemoPatch } from './store'
import { authStore } from '../store/auth'
import {
  VIEWS, initials, mentorStatus, mentorRoleLabel,
  mentorSteps, mentorNext,
  approvedChallenges, notesFor, unreadFor,
  PROFILE_STEPS, profileScore, savedList, recentViews,
} from './data'
import { Home, Competing, Learning, LearnCompete, Continuing, Recommended, Saved, Recent } from './Views'
import Arena from './Arena'
import ProfilePage from '../pages/Profile'
import { Certs, PublicPreview } from './Profile'
import { MentorGate, mentorQueueCount, mentorTeamsCount } from './Mentor'
import Workspace from './Workspace'
import Evaluate from './Evaluate'
import SupportBot from './SupportBot'

const VIEW_COMPONENTS = {
  home: Home, competing: Competing, learning: Learning, learncompete: LearnCompete,
  continuing: Continuing, recommended: Recommended, saved: Saved, recent: Recent,
  arena: Arena, profile: ProfilePage, certs: Certs, publicpreview: PublicPreview, mentor: MentorGate,
}

/* Prototype-only "view as" personas. Innovator and Mentor are real modes;
   Sponsor points to the marketing sponsor placeholder; Enabler is H2S's
   internal staff tool and has no page in this app — shown inert. */
const PERSONAS = [
  { k: 'innovator', ico: HomeIcon, label: 'Innovator', sub: 'learns and competes' },
  { k: 'sponsor',   ico: Users,    label: 'Sponsor',   sub: 'pays, runs challenges' },
  { k: 'mentor',    ico: Compass,  label: 'Mentor',    sub: 'guides and evaluates' },
  { k: 'enabler',   ico: Settings, label: 'Enabler',   sub: 'H2S success team — not in this prototype' },
]

/* Reusable component for an individual persona/role item inside the ribbon */
function PersonaPill({ persona, active, onSwitch, onSponsor, dark }) {
  const light = !dark
  const on = persona.k === active
  const disabled = persona.k === 'enabler'
  const PIco = persona.ico

  if (disabled) {
    return (
      <span
        title={persona.sub}
        className={`flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${
          light ? 'text-dash-faint' : 'text-white/25'
        }`}
      >
        <PIco className="h-3.5 w-3.5 shrink-0" />
        <span>{persona.label}</span>
      </span>
    )
  }

  return (
    <button
      type="button"
      title={persona.sub}
      onClick={() => (persona.k === 'sponsor' ? onSponsor() : onSwitch(persona.k))}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
        on
          ? (light ? 'bg-ink-900 font-bold text-white shadow-sm' : 'bg-white font-bold text-ink-900 shadow-sm')
          : (light ? 'text-dash-muted hover:bg-dash-line-soft hover:text-dash-ink' : 'text-white/70 hover:bg-white/10 hover:text-white')
      }`}
    >
      <PIco className="h-3.5 w-3.5 shrink-0" />
      <span>{persona.label}</span>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────
   SidePersonaPill — hover-activated "View as" pill.
   A single compact button shows the active persona. Hovering opens
   a horizontal role ribbon outward to the right so the user can switch
   roles side-by-side (Innovator, Sponsor, Mentor, Enabler). */
function SidePersonaPill({ active, onSwitch, onSponsor, dark }) {
  const current = PERSONAS.find(p => p.k === active) || PERSONAS[0]
  const Ico = current.ico
  const light = !dark

  return (
    <div className="group relative">
      {/* Trigger pill */}
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-btn px-3 py-[9px] text-sm transition-colors ${
          light
            ? 'border border-dash-line bg-dash-bg text-dash-ink hover:border-signal/40 hover:bg-signal-soft hover:text-signal-dark'
            : 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/10'
        }`}
      >
        <Ico className="h-[14px] w-[14px] shrink-0" />
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
          light ? 'border-dash-line bg-white/95 text-dash-ink' : 'border-white/10 bg-ink-900/95 text-white'
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


/* Notification bell — reads st.notes the same shape app.js's notify()/S.save writes.
   No producer is wired yet in this prototype (no Enabler/approval pipeline), so a
   fresh account legitimately sees the empty state, matching the reference. */
function NotificationBell({ st, sv, who }) {
  const [open, setOpen] = useState(false)
  const list = notesFor(st, who)
  const unread = unreadFor(st, who)
  const markRead = () => sv({ notes: (st.notes || []).map(n => (n.to === who ? { ...n, read: true } : n)) })
  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        className="relative rounded-btn px-2.5 py-1.5 text-[17px] leading-none text-dash-muted hover:bg-dash-line-soft"
        onClick={() => { setOpen(o => !o); if (!open) markRead() }}
      >
        <Bell className="h-[17px] w-[17px]" />
        {unread ? (
          <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-dash-live px-0.5 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[330px] max-w-[calc(100vw-32px)] overflow-hidden rounded-card border border-dash-line bg-white shadow-dash-lg">
          <div className="border-b border-dash-line-soft px-3.5 py-3">
            <strong className="text-[13.5px] text-dash-ink">Notifications</strong>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {list.length ? (
              list.map(n => (
                <div key={n.id} className={`border-b border-dash-line-soft px-3.5 py-3 last:border-0 ${!n.read ? 'bg-signal-soft' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="text-[13px] text-dash-ink">{n.title}</strong>
                  </div>
                  <p className="mt-1 text-xs text-dash-muted">{n.body}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-7 text-center">
                <p className="text-sm text-dash-muted">Nothing yet.</p>
                <p className="mt-1.5 text-xs text-dash-faint">
                  Actions by other people — an approval, a score, a stage change — land here.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function Dashboard({ defaultView }) {
  const { st, sv, reset } = useH2S()
  const navigate = useNavigate()
  const location = useLocation()
  const [sp] = useSearchParams()
  const logged = useMemo(() => authStore.read(), [])

  useEffect(() => {
    if (!logged.onboarded) navigate('/onboarding', { replace: true })
  }, [logged.onboarded])

  function go(view, id) {
    if (id) { navigate('/dashboard/workspace?id=' + id); return }
    if (view === 'profile') { navigate('/profile'); return }
    if (view === 'home') { navigate('/dashboard'); return }
    navigate('/dashboard?view=' + view)
  }

  const sub = location.pathname.replace('/dashboard', '').replace(/^\//, '')
  if (sub === 'workspace' || sub === 'initiative') return <SubShell st={st} sv={sv} go={go}><Workspace st={st} sv={sv} go={go} /></SubShell>
  if (sub === 'evaluate') return <SubShell st={st} sv={sv} go={go}><Evaluate st={st} sv={sv} go={go} /></SubShell>

  return <DashMain sp={sp} st={st} sv={sv} go={go} reset={reset} defaultView={defaultView} />
}

/* owns view/mode state so the sub-path early return above never
   changes the hook count of this component across renders */
function DashMain({ sp, st, sv, go, reset, defaultView }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isProfileRoute = location.pathname === '/profile'
  const requested = isProfileRoute ? 'profile' : sp.get('view') || defaultView
  const valid = requested && VIEW_COMPONENTS[requested] ? requested : null
  const [view, setView] = useState(valid || (st.primary && VIEW_COMPONENTS[st.primary] ? st.primary : 'home'))
  const [mode, setMode] = useState(view === 'mentor' ? 'mentor' : 'innovator')
  const [mentorTab, setMentorTabState] = useState(sp.get('tab') || 'queue')

  useEffect(() => {
    if (location.pathname === '/profile') {
      setView('profile')
    } else if (valid) {
      setView(valid)
    } else if (location.pathname === '/dashboard' && !sp.get('view')) {
      setView(st.primary && VIEW_COMPONENTS[st.primary] ? st.primary : 'home')
    }
  }, [location.pathname, valid, sp, st.primary])

  const show = (v) => {
    if (v === 'profile') {
      setView('profile')
      navigate('/profile')
      return
    }
    const m = v === 'mentor' ? 'mentor' : 'innovator'
    setMode(m)
    setView(v)
    if (v === 'home' && m === 'innovator') navigate('/dashboard')
    else navigate('/dashboard?view=' + v)
  }
  const setMentorTab = (t) => {
    setMentorTabState(t)
    setMode('mentor'); setView('mentor')
    navigate('/dashboard?view=mentor&tab=' + t)
  }
  const switchPersona = (p) => show(p === 'mentor' ? 'mentor' : 'home')

  return (
    <Shell st={st} sv={sv} view={view} mode={mode} show={show} go={go} reset={reset}
      mentorTab={mentorTab} setMentorTab={setMentorTab} switchPersona={switchPersona} />
  )
}

/* ================= top bar ================= */
function AppBar({ st, sv, mode, view, onLogo, onProfile, burger, onBurger }) {
  return (
    <header className="sticky top-0 z-40 border-b border-dash-line-soft bg-white/[.88] backdrop-blur-md">
      <div className="flex h-[66px] items-center gap-5 px-3 sm:px-6">
        {burger ? <button className="btn btn-ghost btn-sm lg:hidden" aria-label="Menu" onClick={onBurger}>☰</button> : null}
        <button onClick={onLogo} className="flex shrink-0 items-center gap-[9px]">
          <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-ramp font-display text-xs font-bold tracking-[-0.02em] text-white">H2S</span>
          <span className="font-display text-[17px] font-bold tracking-[-0.03em] text-dash-ink">Hack2skill</span>
        </button>
        <div className="flex-1" />
        <NotificationBell st={st} sv={sv} who={mode} />
        <button onClick={onProfile} className="ml-1.5" title="Your profile">
          <span className={`grid h-[34px] w-[34px] place-items-center rounded-full text-[13px] font-bold transition-all ${
            view === 'profile' ? 'ring-2 ring-signal ring-offset-2 bg-signal text-white' : 'bg-ink-900 text-white hover:opacity-90'
          }`}>
            {initials(st.profile?.name || st.name)}
          </span>
        </button>
      </div>
    </header>
  )
}

/* sub-view shell (workspace/evaluate) — no sidebar/rail */
function SubShell({ st, sv, go, children }) {
  const navigate = useNavigate()
  const out = () => { sv({}); authStore.clear(); navigate('/auth') }
  return (
    <div className="dash-root min-h-screen bg-dash-bg text-dash-ink">
      <AppBar st={st} sv={sv} mode="innovator" onLogo={() => go('home')} onProfile={() => go('profile')} />
      <div className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      <ResetLink sv={sv} out={out} />
      <SupportBot st={st} sv={sv} />
    </div>
  )
}
function ResetLink({ sv, out }) {
  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-10 text-xs text-dash-faint">
      Prototype ·{' '}
      <button className="text-signal hover:underline" onClick={() => { if (confirm('Reset all demo activity?')) sv({}) }}>reset</button>
      {' · '}
      <button className="text-signal hover:underline" onClick={out}>sign out</button>
    </div>
  )
}

function Shell({ st, sv, view, mode, show, go, reset, mentorTab, setMentorTab, switchPersona }) {
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const msup = mode === 'mentor'
  const hasRail = view !== 'profile' && (msup || profileScore(st).pct < 100)
  const goNav = (v) => { show(v); setNavOpen(false) }
  const out = () => { reset(); authStore.clear(); navigate('/auth') }
  const loadSample = () => sv(seedDemoPatch(st))
  const doReset = () => { if (confirm('Reset all demo activity?')) reset() }
  const onSponsor = () => navigate('/sponsor')
  return (
    <div className="dash-root min-h-screen bg-dash-bg text-dash-ink">
      <AppBar st={st} sv={sv} mode={mode} view={view}
        onLogo={() => goNav(msup ? 'mentor' : 'home')}
        onProfile={() => goNav('profile')}
        burger onBurger={() => setNavOpen(true)}
      />
      {navOpen ? <div className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" onClick={() => setNavOpen(false)} /> : null}
      <div className={`relative grid min-h-[calc(100vh-66px)] grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)] ${hasRail ? 'xl:grid-cols-[264px_minmax(0,1fr)_320px]' : ''}`}>
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-dash-line-soft transition-transform duration-200 lg:sticky lg:top-[66px] lg:z-30 lg:h-[calc(100vh-66px)] lg:w-auto lg:translate-x-0 ${msup ? 'bg-ink-900 lg:border-ink-line' : 'bg-dash-bg-soft'} ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="flex h-full flex-col px-3.5 py-5">
            {msup
              ? <MentorSidebar st={st} view={view} mentorTab={mentorTab} setMentorTab={setMentorTab} show={goNav} onSwitch={switchPersona} onSponsor={onSponsor} onSignOut={out} />
              : <InnovatorSidebar st={st} view={view} mode={mode} show={goNav} onLoadSample={loadSample} onReset={doReset} onSignOut={out} onSwitch={switchPersona} onSponsor={onSponsor} />}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <div className="w-full max-w-[1080px]">
            {(() => {
              const C = VIEW_COMPONENTS[view] || Home
              return <C st={st} sv={sv} go={go} mentorTab={mentorTab} setMentorTab={setMentorTab} />
            })()}
          </div>
        </main>

        {hasRail ? (
          <aside className="lg:col-start-2 xl:col-start-3 xl:row-start-1">
            <div className="max-w-[1080px] space-y-4 px-4 pb-[60px] sm:px-6 lg:px-9 xl:sticky xl:top-[66px] xl:max-h-[calc(100vh-66px)] xl:overflow-y-auto xl:px-7 xl:py-8">
              <Rail st={st} mode={mode} show={show} go={go} />
            </div>
          </aside>
        ) : null}
      </div>
      <SupportBot st={st} sv={sv} mode={mode} />
    </div>
  )
}

/* ================= sidebar ================= */
function SideItem({ ico, label, count, hot, dim, onClick, active, tone = 'light' }) {
  const light = tone === 'light'
  const cls = active
    ? (light ? 'bg-signal font-bold! text-white shadow-dash' : 'bg-white font-bold! text-ink-900')
    : dim
      ? (light ? 'text-dash-faint pointer-events-none' : 'text-white/30 pointer-events-none')
      : (light ? 'text-dash-muted hover:bg-white hover:text-dash-ink' : 'text-white/70 hover:bg-white/[0.07] hover:text-white')
  const IcoTag = typeof ico === 'string' ? null : ico
  return (
    <li>
      <button className={`flex w-full items-center gap-2.5 rounded-btn px-3 py-[9px] text-sm font-medium ${cls}`} onClick={onClick} disabled={dim}>
        <span className="grid w-[18px] shrink-0 place-items-center text-center text-[15px]">
          {IcoTag ? <IcoTag className="h-[15px] w-[15px]" /> : ico}
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        {count != null ? (
          <span className={`rounded-full px-1.5 text-[11px] font-bold ${hot ? 'bg-red-500 text-white' : light ? 'bg-dash-line-soft text-dash-muted' : 'bg-white/10 text-white/70'}`}>
            {count}
          </span>
        ) : null}
      </button>
    </li>
  )
}
/* .side-group carries margin-bottom:22px in the prototype; as a flat list the
   equivalent is space above each group label. */
function GroupTag({ children }) {
  return <li className="px-3 pb-2 pt-[22px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-dash-muted first:pt-0">{children}</li>
}

/* Sidebar footer — Settings dropdown, persona switcher pill, sign out.
   No profile link — the AppBar avatar is the only profile entry point. */
function SideFoot({ role, dark, active, onLoadSample, onReset, onSignOut, onSwitch, onSponsor }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
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

      {/* Settings + sign out row */}
      <div className={`flex items-center gap-1 ${dark ? '' : ''}`}>
        {!dark ? (
          <div className="relative flex-1">
            <button
              className="flex w-full items-center gap-2 rounded-btn px-3 py-[9px] text-sm text-dash-muted hover:bg-white hover:text-dash-ink"
              onClick={() => setSettingsOpen(o => !o)}
            >
              <Settings className="h-[15px] w-[15px] shrink-0" />
              <span className="flex-1 truncate text-left">Settings</span>
            </button>
            {settingsOpen ? (
              <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 overflow-hidden rounded-card border border-dash-line bg-white shadow-dash-lg">
                <div className="border-b border-dash-line-soft px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-dash-muted">Prototype</div>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-dash-ink hover:bg-dash-bg-soft"
                  onClick={() => { setSettingsOpen(false); onLoadSample() }}
                >
                  <Sparkles className="h-[14px] w-[14px] shrink-0 text-signal" />
                  <span>Load sample</span>
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-dash-warn hover:bg-dash-bg-soft"
                  onClick={() => { setSettingsOpen(false); onReset() }}
                >
                  <LogOut className="h-[14px] w-[14px] shrink-0" />
                  <span>Reset data</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          className={`flex items-center gap-2 rounded-btn px-3 py-[9px] text-sm ${dark ? 'text-white/60 hover:bg-white/[0.07] hover:text-white' : 'text-dash-muted hover:bg-white hover:text-dash-ink'} ${!dark ? 'flex-1' : 'w-full'}`}
          onClick={onSignOut}
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" />
          <span className="truncate text-left">Sign out</span>
        </button>
      </div>
    </div>
  )
}


const VIEW_ICO = { learning: BookOpen, competing: Trophy, learncompete: Wrench }
function InnovatorSidebar({ st, view, show, mode, onLoadSample, onReset, onSignOut, onSwitch, onSponsor }) {
  return (
    <>
      <ul className="w-full flex-1 space-y-0.5 overflow-y-auto">
        <SideItem ico={HomeIcon} label="Dashboard" active={view === 'home' || view === 'continuing' || view === 'recommended'} onClick={() => show('home')} />
        {Object.keys(VIEWS).map(k => (
          <SideItem key={k} ico={VIEW_ICO[k]} label={VIEWS[k].label} active={view === k} onClick={() => show(k)} />
        ))}
        <SideItem ico={Gamepad2} label="Arena" active={view === 'arena'} onClick={() => show('arena')} />
        <div className="my-2.5 border-t border-dash-line-soft" />
        <SideItem ico={Bookmark} label="Saved" count={savedList(st).length || null} active={view === 'saved'} onClick={() => show('saved')} />
        <SideItem ico={Clock} label="Recent" count={recentViews(st).length || null} active={view === 'recent'} onClick={() => show('recent')} />
      </ul>
      <SideFoot active={mode} onSwitch={onSwitch} onSponsor={onSponsor} onLoadSample={onLoadSample} onReset={onReset} onSignOut={onSignOut} />
    </>
  )
}

/* Navy mentor sidebar. Structure mirrors app.html's paintNav(): before approval
   there's just the application status and matching challenges; approved-but-
   unmapped nudges "My challenges" as the one live door; approved-and-mapped
   surfaces the real work queues plus Impact. */
function MentorSidebar({ st, view, mentorTab, setMentorTab, show, onSwitch, onSponsor, onSignOut }) {
  const ms = mentorStatus(st)
  const mapped = approvedChallenges(st).length
  const queue = ms === 'approved' ? mentorQueueCount(st) : 0
  const teams = ms === 'approved' ? mentorTeamsCount(st) : 0
  const item = (tab, ico, label, opts = {}) => (
    <SideItem key={opts.listKey || tab} tone="dark" ico={ico} label={label} active={view === 'mentor' && mentorTab === tab}
      onClick={() => setMentorTab(tab)} count={opts.count} hot={opts.hot} dim={opts.dim} />
  )
  return (
    <>
      <ul className="w-full flex-1 space-y-0.5 overflow-y-auto">
        {ms !== 'approved' ? (
          <>
            {item('queue', '🧭', 'Your mentor path')}
            {item('challenges', '📋', 'Challenges matching you')}
          </>
        ) : !mapped ? (
          <>
            {item('queue', '🧭', 'Mentor home')}
            <GroupTag>Your work</GroupTag>
            {item('challenges', '📋', 'My challenges', { count: '!', hot: true })}
            {item('queue', '⚖️', 'Evaluation queue', { dim: true, listKey: 'queue-dim' })}
            {item('sessions', '🗓️', 'Booked sessions', { dim: true, listKey: 'sessions-dim' })}
            {item('teams', '👥', 'Teams & office hours', { dim: true, listKey: 'teams-dim' })}
          </>
        ) : (
          <>
            {item('queue', '🧭', 'Mentor home', { listKey: 'home' })}
            <GroupTag>Your work</GroupTag>
            {item('queue', '⚖️', 'Evaluation queue', { count: queue || '', hot: queue > 0 })}
            {item('sessions', '🗓️', 'Booked sessions')}
            {item('teams', '👥', 'Teams & office hours', { count: teams || '' })}
            {item('challenges', '📋', 'My challenges', { count: mapped })}
            <GroupTag>Your record</GroupTag>
            {item('impact', '📈', 'Impact')}
          </>
        )}
      </ul>
      <SideFoot role={ms !== 'none' ? mentorRoleLabel(st) : null} dark active="mentor" onSwitch={onSwitch} onSponsor={onSponsor} onSignOut={onSignOut} />
    </>
  )
}

/* ================= journey rail =================
   One unified card mirroring journey.js's journeyRail(): a checklist that
   leads while the path is incomplete, then collapses to a one-line receipt
   once it's done and hands the primary spot to "what's live right now". */
function Bar({ pct, className = '' }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-dash-bg-soft ${className}`}>
      <div className="h-full bg-signal transition-[width] duration-[400ms]" style={{ width: pct + '%' }} />
    </div>
  )
}
/* styles.css .check / .check .box / .check.done .ctext / .jx-chip —
   rows carry a hairline divider, a done step strikes its label through and
   goes muted, an unchecked box is a bordered outline rather than a fill, and
   the XP chip is pushed to the right edge by margin-left:auto. */
function CheckRow({ s, showXp, onGo }) {
  const navigate = useNavigate()
  const clickable = !!(s.go || s.href)
  const handle = () => { if (s.go) onGo(s.go); else if (s.href) navigate('/' + s.href) }
  return (
    <div
      className={`flex items-start gap-3 border-b border-dash-line-soft py-2.5 last:border-b-0 ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? handle : undefined}
    >
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px] text-[11px] text-white ${s.done ? 'border-dash-ok bg-dash-ok' : 'border-dash-line bg-transparent'}`}>
        {s.done ? '✓' : ''}
      </span>
      <span className={`min-w-0 flex-1 text-[13px] leading-[1.35] ${s.done ? 'text-dash-muted line-through' : 'text-dash-ink'}`}>
        {s.label}
        {s.waiting && !s.done ? <span className="ml-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-dash-warn">in review now</span> : null}
      </span>
      {showXp && s.xp ? (
        <span className={`ml-auto shrink-0 self-start rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.02em] ${s.done ? 'bg-dash-ok-soft text-dash-ok' : 'bg-dash-bg-soft text-dash-muted'}`}>
          +{s.xp}
        </span>
      ) : null}
    </div>
  )
}
function RailNextRows({ nxt, go }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <strong className="text-[13px] text-dash-ink">{nxt.title}</strong>
        <span className="text-[11px] text-dash-muted">{nxt.sub}</span>
      </div>
      {nxt.rows.map(r => (
        <button key={r.name} className="flex w-full items-center gap-3 py-2 text-left" onClick={() => go(r.href.split('?')[0], (r.href.match(/id=(\S+)/) || [])[1])}>
          <span className={`w-9 shrink-0 text-xs font-bold tabular-nums ${r.urgent ? 'text-dash-warn' : 'text-dash-faint'}`}>{r.when}</span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[13px] text-dash-ink">{r.name}</strong>
            <span className="text-xs text-dash-muted">{r.step}{r.hint ? ' · ' + r.hint : ''}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
function JourneyRail({ opts, go }) {
  const { steps, xp: showXp, title, blurb, levelLabel, badges, next, emptyNext } = opts
  const doneN = steps.filter(s => s.done).length
  const nextUp = steps.find(s => !s.done)
  const earned = steps.filter(s => s.done).reduce((n, s) => n + (s.xp || 0), 0)
  const total = steps.reduce((n, s) => n + (s.xp || 0), 0)
  const pct = showXp ? (total ? Math.round((earned / total) * 100) : 0) : (steps.length ? Math.round((doneN / steps.length) * 100) : 0)
  const complete = !nextUp
  const [openDetails, setOpenDetails] = useState(false)

  const stepList = <div className="mt-3">{steps.map(s => <CheckRow key={s.label} s={s} showXp={showXp} onGo={opts.onGo} />)}</div>
  /* journey.js's .jx-badges block — a "Badges" tag label above the pills. */
  const badgeRow = showXp && badges?.length ? (
    <div className="mt-4">
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-dash-muted">Badges</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {badges.map(b => (
          <span key={b.label} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-dash-line-soft px-[11px] py-1 text-xs font-medium leading-[1.5] text-dash-muted">
            <span>{b.ico}</span>{b.label}
          </span>
        ))}
      </div>
    </div>
  ) : null

  const pathBlock = complete ? (
    <div>
      <button className="flex w-full items-center gap-2 text-left text-[13px] font-medium text-dash-muted" onClick={() => setOpenDetails(o => !o)}>
        <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-dash-ok text-[11px] font-bold text-white">✓</span>
        <span className="flex-1">{title} complete · {doneN}/{steps.length}</span>
        <span className={`text-dash-faint transition-transform ${openDetails ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {openDetails ? <>{stepList}{badgeRow}</> : null}
    </div>
  ) : (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-[15px] font-bold text-dash-ink">{title}</h3>
        <span className="text-xs text-dash-faint">{doneN}/{steps.length}</span>
      </div>
      <p className="mt-1.5 text-xs text-dash-muted">{blurb}</p>
      <div className="mt-3">
        {showXp ? (
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <strong className="text-[13px] text-dash-ink">{earned} / {total} XP</strong>
            <span className="text-xs text-dash-muted">{pct}%</span>
          </div>
        ) : null}
        <Bar pct={pct} />
        {levelLabel ? <p className="mt-2 text-xs text-dash-faint">{levelLabel}</p> : null}
      </div>
      {stepList}
      <p className="mt-3 text-xs text-dash-faint">Next — {nextUp.label}{showXp && nextUp.xp ? ` · +${nextUp.xp} XP` : ''}</p>
      {badgeRow || (showXp ? <p className="mt-3 border-t border-dash-line-soft pt-2.5 text-xs text-dash-faint">Badges unlock as you tick steps off.</p> : null)}
    </div>
  )

  const workBlock = next ? <RailNextRows nxt={next} go={go} /> : complete ? null : <p className="mt-3 text-xs text-dash-faint">{emptyNext || 'Nothing live yet.'}</p>

  return (
    <div className="rounded-card border border-dash-line-soft bg-white p-5 shadow-dash">
      {complete ? <>{workBlock}{workBlock ? <hr className="my-3.5 border-dash-line-soft" /> : null}{pathBlock}</> : <>{pathBlock}{workBlock}</>}
    </div>
  )
}

/* ================= profile-completion card =================
   One canonical checklist for the whole app — exactly one "done" signal per
   row (a circular check, or, mutually exclusive, a "Next" button in that
   same slot). Never add a second signal (leading checkbox, strikethrough, a
   "Completed" badge) — that was a real bug in the reviewed design. See
   COMPONENTS.md's ProfileChecklist entry. */
function ProfileChecklist({ st, show }) {
  return (
    <div className="mt-4">
      {PROFILE_STEPS.map((s) => {
        const v = st[s.key]
        const ok = s.test ? s.test(v) : !!(v && String(v).trim())
        return (
          <div key={s.key} className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2 last:border-0">
            <span className="text-[13px] text-dash-ink">{s.label}</span>
            {ok ? (
              <span aria-label="Completed" className="grid h-5 w-5 place-items-center rounded-full bg-dash-ok text-white">
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <button
                type="button"
                onClick={() => show('profile')}
                className="btn btn-outline btn-sm rounded-btn inline-flex items-center gap-1 border-dash-line px-2.5 py-1 text-xs text-dash-ink"
              >
                Next <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
/* Rail's home widget: ring + CTA + the checklist above. `homeRail()` in the
   prototype hides this entirely at 100% completion rather than collapsing
   it — return null here, not a hidden div, so the grid it leaves behind can
   reflow to use the freed width. */
function ProfileProgressCard({ st, show }) {
  const { pct } = profileScore(st)
  if (pct >= 100) return null
  const done = PROFILE_STEPS.filter((s) => {
    const v = st[s.key]
    return s.test ? s.test(v) : !!(v && String(v).trim())
  }).length
  return (
    <div className="rounded-card border border-dash-line-soft bg-white p-5 shadow-dash">
      <h3 className="font-display text-[15px] font-bold text-dash-ink">Your progress</h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-signal text-[13px] font-bold text-dash-ink">{pct}%</div>
        <div>
          <div className="text-[13px] font-medium text-dash-ink">Profile completion</div>
          <div className="text-xs text-dash-muted">{done} of {PROFILE_STEPS.length} steps</div>
        </div>
      </div>
      <button type="button" onClick={() => show('profile')} className="btn btn-primary btn-sm btn-block mt-3 rounded-btn inline-flex items-center justify-center gap-1">
        Complete profile <ArrowRight className="h-3 w-3" />
      </button>
      <ProfileChecklist st={st} show={show} />
    </div>
  )
}

function Rail({ st, mode, show, go }) {
  if (mode === 'mentor') {
    return (
      <JourneyRail
        go={go}
        opts={{
          title: 'Your mentor path',
          blurb: 'Registration is open to anyone — approval and mapping are ours to do.',
          steps: mentorSteps(st),
          next: mentorNext(st),
          emptyNext: 'Nothing routed to you yet — that starts once a challenge is mapped.',
          onGo: show,
        }}
      />
    )
  }
  /* Innovator rail is the profile-completion card only, below 100% — no
     "Getting started" XP widget here (that read never disagreed with the
     reference: app.html's own homeRail() calls ProfileProgressCard, full
     stop, for every innovator view). */
  return <ProfileProgressCard st={st} show={show} />
}
