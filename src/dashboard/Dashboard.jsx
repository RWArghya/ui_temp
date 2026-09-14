import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useH2S, seedDemoPatch } from './store'
import { authStore } from '../store/auth'
import './proto.css'
import {
  VIEWS, initials, mentorStatus, mentorRoleLabel,
  approvedChallenges, notesFor, unreadFor, profileScore,
} from './data'
import { Sidebar, Topbar } from './Shell'
import { ProfileProgressCard } from './Cards'
import { Home, Continuing, Recommended, Saved, Recent } from './HomeViews'
import { Competing, Learning, LearnCompete } from './PurposeViews'
import Arena from './Arena'
import ProfilePage from '../pages/Profile'
import { Certs, PublicPreview } from './Profile'
import { MentorGate } from './Mentor'
import Workspace from './Workspace'
import Evaluate from './Evaluate'
import Settings from './Settings'

const VIEW_COMPONENTS = {
  home: Home, continuing: Continuing, recommended: Recommended, saved: Saved, recent: Recent,
  competing: Competing, learning: Learning, learncompete: LearnCompete,
  arena: Arena, profile: ProfilePage, certs: Certs, publicpreview: PublicPreview, mentor: MentorGate,
  settings: Settings,
}
/* "View all" destinations and the Home nav item together decide whether the
   sidebar's "Dashboard" row reads active — see app.html's `activeKey`. */
const HOME_GROUP = new Set(['home', 'continuing', 'recommended'])

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

/* sub-view shell (workspace/evaluate) — app.html has no equivalent full-bleed
   page, but workspace.html/initiative.html mount the same Sidebar/Topbar as
   app.html, just with no rail — so this keeps that chrome, only dropping
   the right column. */
function SubShell({ st, sv, go, children }) {
  const navigate = useNavigate()
  const out = () => { sv({}); authStore.clear(); navigate('/auth') }
  return (
    <div className="dash-root">
      <div className="shell">
        <Sidebar mode="innovator" active="home" st={st}
          show={(v) => go(v)}
          onLoadSample={() => sv(seedDemoPatch(st))}
          onReset={() => { if (confirm('Reset all demo activity?')) sv({}) }}
          onSignOut={out}
          switchPersona={(p) => go(p === 'mentor' ? 'mentor' : 'home')}
        />
        <div className="shell-col">
          <Topbar
            st={st}
            sv={sv}
            who="innovator"
            onProfile={() => go('profile')}
            onSettings={() => go('settings')}
            onSignOut={out}
          />
          <div className="shell-body">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Shell({ st, sv, view, mode, show, go, reset, mentorTab, setMentorTab, switchPersona }) {
  const navigate = useNavigate()
  const msup = mode === 'mentor'
  const out = () => { reset(); authStore.clear(); navigate('/auth') }
  const loadSample = () => sv(seedDemoPatch(st))
  const doReset = () => { if (confirm('Reset all demo activity?')) reset() }
  /* homeRail() in app.html: below 100% profile completion the rail is only
     the profile card, on every view — there's no separate XP/"Getting
     started" rail in the prototype. At 100% it's removed entirely (not
     display:none) and `.shell:not(.has-rail) .grid.g3` in proto.css
     reflows the freed width into the main column. */
  const { pct } = profileScore(st)
  const hasRail = pct < 100
  const activeKey = view === 'continuing' || view === 'recommended' ? 'home' : view
  /* Mentor's own tab state (queue/teams/sessions/challenges/impact — an
     existing feature richer than prototype_v2's own mentor surfaces, which
     are out of this milestone's scope per CLAUDE.md) maps onto shell.js's
     NAV_MENTOR keys just for which row lights up and what a click does. */
  const MENTOR_KEY_TO_TAB = { mentor: 'queue', m_challenges: 'challenges', m_queue: 'queue', m_teams: 'teams', m_sessions: 'sessions', m_impact: 'impact' }
  const mentorActiveKey = mentorTab === 'challenges' ? 'm_challenges' : mentorTab === 'teams' ? 'm_teams' : mentorTab === 'sessions' ? 'm_sessions' : mentorTab === 'impact' ? 'm_impact' : 'm_queue'

  return (
    <div className="dash-root">
      <div className={`shell${hasRail ? ' has-rail' : ''}${msup ? ' mode-mentor' : ''}`}>
        <Sidebar
          mode={msup ? 'mentor' : 'innovator'}
          active={msup ? mentorActiveKey : activeKey}
          st={st}
          show={msup ? (v) => setMentorTab(MENTOR_KEY_TO_TAB[v] || 'queue') : show}
          onLoadSample={loadSample} onReset={doReset} onSignOut={out} switchPersona={switchPersona}
        />
        <div className="shell-col">
          <Topbar
            st={st}
            sv={sv}
            who={mode}
            view={view}
            onProfile={() => show('profile')}
            onSettings={() => show('settings')}
            onSignOut={out}
          />
          <div className="shell-body">
            <div className="shell-main-wrap">
              <div id="main">
                {(() => {
                  const C = VIEW_COMPONENTS[view] || Home
                  return <C st={st} sv={sv} go={go} mentorTab={mentorTab} setMentorTab={setMentorTab} />
                })()}
              </div>
              {hasRail ? (
                <aside className="app-rail">
                  <ProfileProgressCard st={st} />
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* The old "Getting started" XP journey rail lived here — removed. The
   prototype has no such rail; every view's right column is just the profile
   card (ProfileProgressCard, from ./Cards), gone entirely at 100%. */
