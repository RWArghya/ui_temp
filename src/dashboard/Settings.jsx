import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { authStore } from '../store/auth'
import { S, seedDemoPatch } from './store'
import { REGIONS, AREAS, isProfilePublic, settingsFor } from './data'

/* ============================================================================
   Innovator Settings. New surface — nothing in prototype_v2 designs this
   (its Settings menu is just two prototype-utility buttons), so this is
   built to match the rest of the ported shell (proto.css classes) rather
   than translated from a reference file. Sections: Account & Security,
   Notifications, Privacy, Preferences, and a Danger Zone. Never touches
   src/pages/Profile.jsx or its data — this only reads/writes the shared
   `h2s` store (st/sv), the same one every other dashboard view uses.
   ============================================================================ */

function SectionCard({ id, title, sub, children }) {
  return (
    <section id={id} className="card card-pad scroll-mt-24">
      <h3>{title}</h3>
      {sub ? <p className="xs muted mt6">{sub}</p> : null}
      <div className="mt16">{children}</div>
    </section>
  )
}
function Row({ label, hint, children }) {
  return (
    <div className="row between gap16 wrap" style={{ padding: '12px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ minWidth: 220 }}>
        <strong className="small">{label}</strong>
        {hint ? <p className="xs muted mt4">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}
function Switch({ on, onClick, label }) {
  return <button type="button" className={`switch${on ? ' on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={onClick} />
}

const JUMP = [
  ['acct', 'Account & security'],
  ['notifs', 'Notifications'],
  ['privacy', 'Privacy'],
  ['prefs', 'Preferences'],
  ['danger', 'Danger zone'],
]

export default function Settings({ st, sv, go }) {
  const navigate = useNavigate()
  const settings = settingsFor(st)
  const account = authStore.read().account || {}

  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState(null) // { ok, text }

  const [region, setRegion] = useState(st.region || '')
  const [interests, setInterests] = useState(st.interests || [])
  const [landingView, setLandingView] = useState(st.landingView || 'home')
  const [prefsSaved, setPrefsSaved] = useState(false)

  const patchNotif = (key, val) => sv({ settings: { ...st.settings, notifications: { ...settings.notifications, [key]: val } } })
  const toggleDiscoverable = () => sv({ settings: { ...st.settings, discoverable: !settings.discoverable } })
  const toggleOpenToTeams = () => sv({ settings: { ...st.settings, openToTeams: !settings.openToTeams } })
  const toggleProfilePublic = () => sv({ profilePublic: !isProfilePublic(st) })

  const submitPwChange = (e) => {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "New password and confirmation don't match." }); return }
    const res = authStore.changePassword(curPw, newPw)
    setPwMsg({ ok: res.ok, text: res.ok ? 'Password updated.' : res.error })
    if (res.ok) { setCurPw(''); setNewPw(''); setConfirmPw('') }
  }

  const toggleInterest = (a) => setInterests((cur) => cur.includes(a) ? cur.filter(x => x !== a) : cur.length >= 8 ? cur : [...cur, a])
  const savePrefs = () => { sv({ region, interests, landingView }); setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 2200) }

  const out = () => { sv({}); authStore.clear(); navigate('/auth') }
  const doDelete = () => {
    if (!confirm('Delete your account? This removes all activity on this device and cannot be undone.')) return
    S.reset(); authStore.clear(); navigate('/auth')
  }

  return (
    <>
      <h1>Settings</h1>
      <p className="small muted mt6">Your account, notifications, privacy, and platform preferences.</p>

      <div className="row gap8 wrap mt16" style={{ marginBottom: 4 }}>
        {JUMP.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="pill pill-outline" style={{ cursor: 'pointer' }}>{label}</a>
        ))}
      </div>

      <div className="col gap16 mt16">
        {/* ---------------------------------------------------------- Account */}
        <SectionCard id="acct" title="Account & security">
          <Row label="Name" hint="Shown on your profile and to teams you join.">
            <span className="small">{st.profile?.name || st.name || account.name || '—'}</span>
          </Row>
          <Row label="Email" hint="Used to sign in and for account notifications.">
            <span className="small">{st.email || account.email || '—'}</span>
          </Row>
          <Row label="Phone" hint={account.mobile ? undefined : 'Not added yet.'}>
            <span className="small">{account.mobile || '—'}</span>
          </Row>
          <Row label="Connected accounts" hint="Add or change these from your Profile.">
            <span className="small muted">{st.profile?.links || st.links || 'None linked'}</span>
          </Row>

          <div className="mt16" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
            <span className="tag">Change password</span>
            <form className="grid g2f mt12" onSubmit={submitPwChange}>
              <div className="field"><label>Current password</label><input className="input" type="password" value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" /></div>
              <div></div>
              <div className="field"><label>New password</label><input className="input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" /></div>
              <div className="field"><label>Confirm new password</label><input className="input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" /></div>
              <div className="row gap12" style={{ gridColumn: '1 / -1' }}>
                <button className="btn btn-primary btn-sm" type="submit" disabled={!curPw || !newPw || !confirmPw}>Update password</button>
                {pwMsg ? <span className={`small ${pwMsg.ok ? '' : ''}`} style={{ color: pwMsg.ok ? 'var(--ok)' : 'var(--danger)' }}>{pwMsg.text}</span> : null}
              </div>
            </form>
            <p className="xs faint mt8">Demo account password is <code>demo1234</code> unless you've changed it before.</p>
          </div>

          <div className="mt16" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={out}>Sign out of this device</button>
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- Notifications */}
        <SectionCard id="notifs" title="Notifications" sub="Choose what lands in your bell, and where.">
          <Row label="Deadline reminders" hint="An initiative you registered for is closing soon.">
            <Switch on={settings.notifications.deadlines} onClick={() => patchNotif('deadlines', !settings.notifications.deadlines)} label="Deadline reminders" />
          </Row>
          <Row label="Application status" hint="Your mentor application moves to a new stage.">
            <Switch on={settings.notifications.applicationStatus} onClick={() => patchNotif('applicationStatus', !settings.notifications.applicationStatus)} label="Application status" />
          </Row>
          <Row label="Session bookings" hint="Someone books, reschedules, or cancels a mentor session.">
            <Switch on={settings.notifications.sessions} onClick={() => patchNotif('sessions', !settings.notifications.sessions)} label="Session bookings" />
          </Row>
          <Row label="Evaluation results" hint="A submission of yours has been scored.">
            <Switch on={settings.notifications.evaluations} onClick={() => patchNotif('evaluations', !settings.notifications.evaluations)} label="Evaluation results" />
          </Row>
          <Row label="Program updates" hint="Announcements from initiatives you're registered for.">
            <Switch on={settings.notifications.programUpdates} onClick={() => patchNotif('programUpdates', !settings.notifications.programUpdates)} label="Program updates" />
          </Row>
          <Row label="Delivery" hint="Where these notifications reach you.">
            <select className="select" style={{ width: 'auto' }} value={settings.notifications.channel} onChange={e => patchNotif('channel', e.target.value)}>
              <option value="inapp">In-app only</option>
              <option value="email">In-app + email</option>
            </select>
          </Row>
        </SectionCard>

        {/* ---------------------------------------------------------- Privacy */}
        <SectionCard id="privacy" title="Privacy" sub="Control who can find and see your profile.">
          <Row label="Public profile" hint="Off by default. On makes your profile viewable via its share link.">
            <Switch on={isProfilePublic(st)} onClick={toggleProfilePublic} label="Public profile" />
          </Row>
          <Row label="Discoverable in Talent Pool" hint="Lets sponsors browsing candidates for a program find you.">
            <Switch on={settings.discoverable} onClick={toggleDiscoverable} label="Discoverable in Talent Pool" />
          </Row>
          <Row label="Open to team invites" hint="Shows you as available when other participants are looking for teammates.">
            <Switch on={settings.openToTeams} onClick={toggleOpenToTeams} label="Open to team invites" />
          </Row>
        </SectionCard>

        {/* ---------------------------------------------------------- Preferences */}
        <SectionCard id="prefs" title="Preferences" sub="Drives your default landing view and recommendations.">
          <div className="field">
            <label>Landing view</label>
            <p className="xs muted mt2 mb6">Where you arrive after logging in or opening the platform.</p>
            <select className="select" value={landingView} onChange={e => setLandingView(e.target.value)}>
              <option value="home">🏠 Dashboard</option>
              <option value="learning">📚 Learn</option>
              <option value="competing">🏆 Compete</option>
              <option value="arena">🎮 Arena</option>
            </select>
          </div>
          <div className="field"><label>Region</label>
            <select className="select" value={region} onChange={e => setRegion(e.target.value)}>
              <option value="">Not set</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Interests <span className="faint">(up to 8)</span></label>
            <div className="row gap8 wrap mt8">
              {AREAS.map(a => (
                <span key={a} className={`chip${interests.includes(a) ? ' on' : ''}`} onClick={() => toggleInterest(a)}>{a}</span>
              ))}
            </div>
          </div>
          <div className="row gap12 mt16">
            <button className="btn btn-primary btn-sm" onClick={savePrefs}>Save preferences</button>
            {prefsSaved ? <span className="small" style={{ color: 'var(--ok)' }}>Saved.</span> : null}
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- Danger zone */}
        <SectionCard id="danger" title="Danger zone">
          <Row label="Reset demo activity" hint="Clears registrations, submissions, and progress on this device.">
            <button className="btn btn-outline btn-sm" onClick={() => { if (confirm('Reset all demo activity?')) S.reset() }}>Reset</button>
          </Row>
          <Row label="Load sample activity" hint="Fills a few registrations so the dashboard isn't empty.">
            <button className="btn btn-outline btn-sm" onClick={() => sv(seedDemoPatch(st))}>Load sample</button>
          </Row>
          <Row label="Delete account" hint="Permanently removes your account and activity from this device.">
            <button className="btn btn-danger btn-sm" onClick={doDelete}>Delete account</button>
          </Row>
        </SectionCard>
      </div>
    </>
  )
}
