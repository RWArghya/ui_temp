import { useState } from 'react'
import { Card, Stat, PageHead, Pill, Empty, Field, Kv } from './ui'
import { S } from './store'
import {
  initials, profileScore, levelFor, badgesFor, xpFor, creditsFor, hats,
  achievements, selfCerts, projects, publications, education, isProfilePublic,
  PROFILE_STEPS, byId,
} from './data'

function patch(partial) { return { profile: Object.assign({}, S.read().profile || {}, partial) } }

/* ---- shared small bits ---- */
const TabBar = ({ tabs, cur, set }) => (
  <div className="tabs tabs-bordered mt-4 overflow-x-auto">
    {tabs.map(([t, l]) => (
      <button key={t} className={'tab tab-sm ' + (cur === t ? 'tab-active' : '')} onClick={() => set(t)}>{l}</button>
    ))}
  </div>
)

/* ---- header card (shared by profile + public preview) ---- */
function IdentityHeader({ st, publicOnly }) {
  const p = st.profile || {}
  const ps = profileScore(st)
  const xp = xpFor(st, selfCerts(st).length)
  const lvl = levelFor(xp)
  const cav = hats(st)
  return (
    <Card>
      <div className="flex flex-wrap gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-signal-soft text-xl font-bold text-signal-dark">{initials(p.name || st.name)}</div>
        <div className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mb-1.5">{p.name || st.name || 'Your name'}</h2>
            {cav.map(h => h.primary ? <Pill key={h.key}>{h.label}</Pill> : <Pill key={h.key} hat>{h.label}</Pill>)}
          </div>
          <p className="mt-1 text-sm text-dash-muted">{p.headline || 'Add a one-line headline'}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-dash-muted">
            <span>{p.region || 'Region unset'}</span>
            {p.org ? <span>{p.org}</span> : null}
            {p.links ? (p.links.github || p.links.linkedin) ? <span>{p.links.github ? 'GitHub' : 'LinkedIn'}</span> : null : null}
          </div>
        </div>
        {!publicOnly ? (
          <div className="ml-auto">
            <div className="flex flex-wrap justify-end gap-2">
              <Stat n={lvl.level} label="Level" />
              <Stat n={xp} label="XP" />
              <Stat n={creditsFor(st, selfCerts(st).length)} label="Credits" />
            </div>
            <div className="ml-auto mt-2 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-dash-line-soft"><div className="h-full bg-ramp" style={{ width: ps.pct + '%' }} /></div>
            <p className="mt-1 text-right text-xs text-dash-faint">Profile {ps.pct}% complete</p>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

/* ---- overview tab ---- */
const pList = (arr, label, empty) => (
  <Card title={label}>
    {arr.length ? arr.map((x, i) => <p key={i} className="py-1.5 text-sm text-dash-ink">{x}</p>)
      : <p className="mt-4 text-sm text-dash-muted">{empty}</p>}
  </Card>
)

function Overview({ st, sv }) {
  const p = st.profile || {}
  const ps = profileScore(st)
  const badges = badgesFor(st, selfCerts(st).length)
  const skills = (p.skills || [])
  const interests = (p.interests || [])
  return (
    <>
      <Card title="Profile strength">
        <div className="flex flex-wrap gap-4">
          <div style={{ width: 120 }}>
            <div className="text-4xl font-extrabold text-dash-ink">{ps.pct}<span className="text-xs font-normal text-dash-faint">%</span></div>
            <p className="mt-1 text-sm text-dash-muted">A fuller profile gets you matched to more teams, sponsors and mentoring.</p>
          </div>
          <div className="min-w-0 flex-1">
            {PROFILE_STEPS.map(s => {
              const v = p[s.key]
              const ok = s.test ? s.test(v) : !!(v && String(v).trim())
              return (
                <div key={s.key} className="flex items-baseline justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0">
                  <span className={ok ? 'text-dash-ok' : 'text-dash-muted'}>{ok ? '✓' : '○'} {s.label}</span>
                  <strong className="text-dash-ink">{ok ? '+ ' + s.w : '—'}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {pList(skills, 'Skills', 'Add skills to be found by teams and sponsors.')}
        {pList(interests, 'Interests', 'Pick at least 3 to shape what you see.')}
      </div>
      <Card title="Badges" className="mt-4">
        {badges.length ? <div className="flex flex-wrap gap-3">{badges.map(b => <Pill key={b.label} hat>{b.ico} {b.label}</Pill>)}</div>
          : <p className="text-sm text-dash-muted">Complete profile steps and make your first moves to earn badges.</p>}
      </Card>
    </>
  )
}

/* ---- editable tabs ---- */
function EditFields({ label, values, setValues, save, empty }) {
  const [adding, setAdding] = useState(false)
  const [d, setD] = useState({})
  return (
    <Card title={label}>
      {values.map((v, i) => <p key={i} className="py-1.5 text-sm text-dash-ink">{v}</p>)}
      {values.length ? null : <p className="text-sm text-dash-muted">{empty}</p>}
      {adding ? (
        <Field label="Line" value={d.v || ''} onChange={e => setD({ ...d, v: e.target.value })} />
      ) : null}
      <div className="flex gap-2">
        {adding ? (
          <>
            <button className="btn btn-primary btn-sm rounded-btn" onClick={() => { if (!d.v) return; save(values.concat(d.v)); setAdding(false); setD({}) }}>Save</button>
            <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => setAdding(false)}>Cancel</button>
          </>
        ) : <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => setAdding(true)}>+ Add</button>}
      </div>
    </Card>
  )
}

function ProjectsTab({ st, sv }) {
  const list = projects(st)
  const [adding, setAdding] = useState(false)
  const [d, setD] = useState({})
  return (
    <Card title="Projects">
      {list.map(pr => (
        <div key={pr.id} className="flex items-baseline justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0">
          <span><strong className="text-dash-ink">{pr.title}</strong><span className="text-dash-muted"> · {pr.role || 'member'}</span></span>
          <span className="text-dash-muted">/ {pr.credits} credits</span>
        </div>
      ))}
      {adding ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Title" value={d.title || ''} onChange={e => setD({ ...d, title: e.target.value })} />
          <Field label="Role" placeholder="tech lead, designer…" value={d.role || ''} onChange={e => setD({ ...d, role: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm rounded-btn" onClick={() => {
              if (!d.title) return
              const arr = projects(st).concat({ id: Date.now(), title: d.title, role: d.role })
              sv({ projects: arr })
              setAdding(false); setD({})
            }}>Save project</button>
            <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : <button className="btn btn-ghost btn-sm mt-4 rounded-btn border border-dash-line-soft" onClick={() => setAdding(true)}>+ Add project</button>}
    </Card>
  )
}

function EducationTab({ st, sv }) {
  return <EditFields label="Education" values={education(st)} save={v => sv({ education: v })} empty="Add your college, course and graduating year. Sponsors browse this." />
}
function PublicationsTab({ st, sv }) {
  return <EditFields label="Publications" values={publications(st)} save={v => sv({ publications: v })} empty="Link papers, patents or write-ups you've had out there." />
}

function AchievementsTab({ st, sv }) {
  const list = achievements(st)
  return (
    <Card title="Achievements">
      {list.length ? list.map((a, i) => (
        <div key={i} className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0">
          <span className="min-w-0">{a.ico} <strong className="text-dash-ink">{a.title}</strong>{a.org ? <span className="text-dash-muted"> · {a.org}</span> : null}</span>
          <span>{a.shared ? <Pill ok>shared</Pill> : <Pill>private</Pill>}</span>
        </div>
      )) : <p className="text-sm text-dash-muted">Certificates appear here as you earn them. Add community achievements too.</p>}
    </Card>
  )
}

/* settings / privacy tab */
function SettingsTab({ st, sv }) {
  const ppublic = isProfilePublic(st)
  return (
    <>
      <Card title="Sharing & visibility">
        <div className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2 text-sm">
          <span className="text-dash-ink">Make this profile public</span>
          <input type="checkbox" className="toggle toggle-primary" checked={ppublic} onChange={e => sv({ profilePublic: e.target.checked })} />
        </div>
        <p className="mt-2 text-xs text-dash-faint">External verifiers and sponsors can view your public page at <b className="text-dash-ink">h2s.in/{st.slug || 'you'}</b>.</p>
      </Card>
      <Card title="Danger zone" className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><strong className="text-sm text-dash-ink">Start fresh</strong><p className="mt-1 text-xs text-dash-muted">Reset all dashboard activity and demo data. You keep your account.</p></div>
          <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => { if (confirm('Reset all dashboard activity?')) S.reset() }}>Reset demo data</button>
        </div>
      </Card>
    </>
  )
}

export default function Profile({ st, sv, go }) {
  const [tab, setTab] = useState('overview')
  const tabs = [
    ['overview', 'Overview'], ['projects', 'Projects'], ['education', 'Education'],
    ['publications', 'Publications'], ['achievements', 'Achievements'], ['settings', 'Settings'],
  ]
  let body
  if (tab === 'overview') body = <Overview st={st} sv={sv} />
  else if (tab === 'projects') body = <ProjectsTab st={st} sv={sv} />
  else if (tab === 'education') body = <EducationTab st={st} sv={sv} />
  else if (tab === 'publications') body = <PublicationsTab st={st} sv={sv} />
  else if (tab === 'achievements') body = <AchievementsTab st={st} sv={sv} />
  else body = <SettingsTab st={st} sv={sv} />
  return (
    <>
      <PageHead title="Profile" sub="How the world sees you on H2S — your hats, skills and accumulated credits." />
      <IdentityHeader st={st} />
      <TabBar tabs={tabs} cur={tab} set={setTab} />
      <div className="mt-4">{body}</div>
    </>
  )
}

/* ================= certificates ================= */
export function Certs({ st, sv }) {
  const list = selfCerts(st)
  const reg = st.registered || []
  const done = (st.submissions || []).filter(id => byId(id) && byId(id).purpose === 'competing')
  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">Certificates</h2>
        <p className="text-sm text-dash-muted">Earned with a passing submission, or minted yourself as verifiable shareable creds.</p>
      </PageHead>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat n={list.length} label="Self-minted" />
        <Stat n={done.length} label="Earned by submission" />
        <Stat n={list.length + done.length} label="Total" />
      </div>
      {done.length ? (
        <Card title="Earned">
          {done.map(id => { const o = byId(id); return <Kv key={id} k={o.name} v="Share ✓" /> })}
        </Card>
      ) : null}
      {reg.some(id => { const o = byId(id); return o && (o.purpose === 'competing' || o.purpose === 'learncompete') }) ? (
        <Card title="In progress" className="mt-4">
          <p className="text-sm text-dash-muted">Finish a submission on a registered initiative and it lands here automatically.</p>
        </Card>
      ) : null}
      <Card title="Your shareable credentials" className="mt-4">
        {list.length ? list.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0">
            <span className="min-w-0"><strong className="text-dash-ink">{c.title}</strong>{c.org ? <span className="text-dash-muted"> · {c.org}</span> : null}</span>
            <a className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" href={'#'} onClick={e => e.preventDefault()}>Share</a>
          </div>
        )) : <Empty msg="Nothing to show yet. Mint your first credential when you've earned a moment worth proving." />}
      </Card>
    </>
  )
}

/* ================= public preview ================= */
export function PublicPreview({ st, sv, back }) {
  const p = st.profile || {}
  const badge = badgesFor(st, selfCerts(st).length)
  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">Public profile</h2>
        <p className="text-sm text-dash-muted">This is what anyone at <b className="text-dash-ink">h2s.in/{st.slug || 'you'}</b> sees when your profile is public.</p>
      </PageHead>
      <IdentityHeader st={st} publicOnly />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {pList((p.skills || []), 'Skills', 'No skills yet')}
        {pList((p.interests || []), 'Interests', 'No interests yet')}
      </div>
      <Card title="Badges" className="mt-4">
        <div className="flex flex-wrap gap-3">{badge.map(b => <Pill key={b.label} hat>{b.ico} {b.label}</Pill>)}</div>
      </Card>
    </>
  )
}