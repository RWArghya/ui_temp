import { useState } from 'react'
import { Card, Stat, PageHead, Pill, Empty, Field, Kv } from './ui'
import { S } from './store'
import {
  mentorStatus, mentorRoleLabel, approvedChallenges, mentorChallenges,
  suggestedChallenges, assignmentsFor, SELF_KEY, byId, openTeams, daysLeft,
  RUBRIC, INITIATIVES, REGIONS,
} from './data'

const AREAS = ['AI / GenAI', 'Agentic AI', 'Data Science', 'Cybersecurity', 'FinTech', 'Sustainability', 'Cloud', 'Product', 'Space', 'IoT', 'Web3', 'Blockchain']

/* ================= application flow (intro → form → pending → approved) ================= */
function MentorIntro({ st, sv }) {
  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">🧭 Mentor</h2>
        <p className="text-sm text-dash-muted">Guide the next generation of builders — and get scored on how well you do it.</p>
      </PageHead>
      <Card title="Why mentor on H2S">
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <div><div className="text-2xl font-extrabold text-dash-ink">200+</div><p className="mt-1 text-sm text-dash-muted">teams looking for a steer this season</p></div>
          <div><div className="text-2xl font-extrabold text-dash-ink">14</div><p className="mt-1 text-sm text-dash-muted">challenges across AI, fintech, space and more</p></div>
          <div><div className="text-2xl font-extrabold text-dash-ink">2 roles</div><p className="mt-1 text-sm text-dash-muted">mentor teams, or score submissions — or both</p></div>
        </div>
        <p className="mt-4 max-w-[520px] text-sm text-dash-muted">
          Approvals are done by the H2S team. If your application is accepted you'll be assigned challenges you can act on.
          Your queue, active teams and score impact all live here.
        </p>
        <button className="btn btn-primary mt-4 rounded-btn" onClick={() => sv({ mentorApp: { status: 'info' } })}>Apply to mentor</button>
      </Card>
    </>
  )
}

function MentorForm({ st, sv }) {
  const [d, setD] = useState(st.mentorApp && st.mentorApp.status === 'info' ? st.mentorApp : {})
  const roles = [['mentor', 'Mentor'], ['evaluator', 'Evaluator']]
  const [err, setErr] = useState('')
  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">Apply to mentor</h2>
        <p className="text-sm text-dash-muted">A short form — we're matching you to live challenges, not collecting a CV.</p>
      </PageHead>
      <Card title="Who you are and where you can help">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" value={d.name || ''} onChange={e => setD({ ...d, name: e.target.value })} />
          <Field label="Current role" placeholder="SDE-2, researcher, founder…" value={d.role || ''} onChange={e => setD({ ...d, role: e.target.value })} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company / institution" placeholder="where you work or study" value={d.org || ''} onChange={e => setD({ ...d, org: e.target.value })} />
          <Field label="Region" as="select" value={d.region || ''} onChange={e => setD({ ...d, region: e.target.value })}>
            <option value="">Select…</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </Field>
        </div>
        <div className="max-w-xs">
          <Field label="How many teams can you take on?" inputMode="numeric" placeholder="3" value={d.cap || ''} onChange={e => setD({ ...d, cap: e.target.value.replace(/\D/g, '') })} />
        </div>
        <div className="mb-3 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium text-dash-muted">Role</label>
          <div className="flex flex-wrap gap-4">
            {roles.map(([k, l]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-dash-ink">
                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={(d.roles || []).includes(k)} onChange={() => {
                  const r = (d.roles || []).includes(k) ? (d.roles || []).filter(x => x !== k) : [...(d.roles || []), k]
                  setD({ ...d, roles: r })
                }} /> {l}
              </label>
            ))}
          </div>
        </div>
        <Field label="Areas you can mentor or judge" hint="Pick any you're confident in — you'll only be assigned these."
          as="select" multiple onChange={e => setD({ ...d, areas: [...e.target.options].filter(o => o.selected).map(o => o.value) })}>
          {AREAS.map(a => <option key={a} value={a} selected={(d.areas || []).includes(a)}>{a}</option>)}
        </Field>
        <Field textarea label="A couple of lines on how you'd help a team" placeholder="What you'd focus on in the first session…" value={d.bio || ''} onChange={e => setD({ ...d, bio: e.target.value })} />
        {err ? <p className="text-xs text-dash-live">{err}</p> : null}
        <div className="mt-4 flex gap-3">
          <button className="btn btn-primary rounded-btn" onClick={() => {
            if (!d.name || !d.role || !d.region || !(d.roles || []).length || !(d.areas || []).length) { setErr('Name, role, region, a role and at least one area are required.'); return }
            sv({ mentorApp: { ...d, status: 'pending', at: new Date().toISOString() } })
          }}>Submit application</button>
          <button className="btn btn-ghost rounded-btn border border-dash-line-soft" onClick={() => sv({ mentorApp: {} })}>Cancel</button>
        </div>
      </Card>
    </>
  )
}

function MentorPending({ st, sv }) {
  return (
    <>
      <PageHead title="Application sent" />
      <Card title="In review">
        <div className="flex flex-wrap items-center gap-3">
          <Pill warn>Pending H2S review</Pill>
          <span className="text-sm text-dash-muted">Usually a couple of days.</span>
        </div>
        <p className="mt-4 text-sm text-dash-muted">For demo purposes, approve it now to see the mentor console.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn btn-primary rounded-btn" onClick={() => {
            const areas = (st.mentorApp.areas || []).slice()
            const map = {}
            suggestedChallenges(areas).slice(0, 3).forEach((o, i) => map[o.id] = 'approved')
            sv({ mentorApp: { ...st.mentorApp, status: 'approved' }, mentorChallenges: Object.assign({}, st.mentorChallenges || {}, map) })
          }}>Approve (demo)</button>
        </div>
      </Card>
    </>
  )
}

export function MentorGate({ st, sv, mentorTab, setMentorTab }) {
  const ms = mentorStatus(st)
  if (ms === 'none') return <MentorIntro st={st} sv={sv} />
  if (ms === 'info') return <MentorForm st={st} sv={sv} />
  if (ms === 'pending') return <MentorPending st={st} sv={sv} />
  if (ms === 'rejected') return <Empty msg="Your application wasn't approved this time. You can reapply next season." />
  return <MentorConsole st={st} sv={sv} tab={mentorTab} setTab={setMentorTab} />
}

/* ================= mentor console ================= */
const scoreKey = (q, team) => (q.id + '::' + team)

function ResultCard({ q, score, st, sv }) {
  const [tab, setTab] = useState(score ? 'result' : 'score')
  const [r, setR] = useState({})
  const total = RUBRIC.reduce((n, k) => n + (Number(r[k]) || 0), 0)
  return (
    <Card title={q.team}>
      <Pill>{q.brief}</Pill>
      <p className="mt-2 text-xs text-dash-faint">{q.via} · due {daysLeft(q.due) > 0 ? 'in ' + daysLeft(q.due) + 'd' : 'overdue'}</p>
      <div className="tabs tabs-bordered mt-4">
        <button className={'tab tab-sm ' + (tab === 'result' ? 'tab-active' : '')} onClick={() => setTab('result')}>Result</button>
        {!score ? <button className={'tab tab-sm ' + (tab === 'score' ? 'tab-active' : '')} onClick={() => setTab('score')}>Score</button> : null}
      </div>
      {tab === 'result' ? (
        score ? (
          <div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-dash-line-soft"><div className="h-full bg-ramp" style={{ width: score.total * 20 + '%' }} /></div>
            <p className="mt-2 text-xs text-dash-faint">{score.total} / 50 · submitted {new Date(score.at).toLocaleDateString()}</p>
            {RUBRIC.map(k => <Kv key={k} k={k} v={score[k] + ' / 10'} />)}
            {score.note ? <p className="mt-2 text-sm text-dash-muted">{score.note}</p> : null}
          </div>
        ) : <p className="mt-3 text-sm text-dash-muted">Not scored yet.</p>
      ) : (
        <div className="mt-4">
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            {RUBRIC.map(k => (
              <div key={k} className="flex flex-col">
                <label className="text-sm text-dash-ink">{k}</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={10} step={1} className="range range-primary range-xs flex-1" value={r[k] || 0} onChange={e => setR({ ...r, [k]: Number(e.target.value) })} />
                  <span className="w-6 text-right text-xs text-dash-muted">{r[k] || 0}</span>
                </div>
              </div>
            ))}
          </div>
          <Field textarea label="Note to the team" placeholder="What they did well and where to push…" value={r.note || ''} onChange={e => setR({ ...r, note: e.target.value })} />
          <button className="btn btn-primary btn-sm mt-4 rounded-btn" onClick={() => {
            if (!RUBRIC.every(k => Number(r[k]) > 0)) return
            const total = RUBRIC.reduce((n, k) => n + (Number(r[k]) || 0), 0)
            const scores = Object.assign({}, st.scores || {})
            scores[scoreKey(q, q.team)] = { team: q.team, total: total, ...RUBRIC.reduce((o, k) => (o[k] = Number(r[k]), o), {}), note: r.note || '', at: new Date().toISOString() }
            sv({ scores })
            setTab('result')
          }}>Submit score</button>
        </div>
      )}
    </Card>
  )
}

export function mentorQueueCount(st) {
  const areas = ((st.mentorApp || {}).areas) || []
  const approved = approvedChallenges(st)
  const assignments = assignmentsFor(approved, areas)
  return assignments.filter(q => !st.scores || !st.scores[scoreKey(q, q.team)]).length
}
export function mentorTeamsCount(st) {
  return assignmentsFor(approvedChallenges(st), ((st.mentorApp || {}).areas) || []).length
}

function MentorConsole({ st, sv, tab: tabProp, setTab: setTabProp }) {
  const [tabState, setTabState] = useState('queue')
  const tab = tabProp || tabState
  const setTab = setTabProp || setTabState
  const areas = ((st.mentorApp || {}).areas) || []
  const approved = approvedChallenges(st)
  const assignments = assignmentsFor(approved, areas)
  const scored = Object.keys(st.scores || {}).length
  const queue = assignments.filter(q => !st.scores || !st.scores[scoreKey(q, q.team)])
  const impact = {
    teams: assignments.length, scored, approval: approved.length,
    avg: scored ? (Object.values(st.scores).reduce((n, s) => n + s.total, 0) / scored / 5).toFixed(1) : 0,
  }
  let body
  if (tab === 'queue') {
    body = queue.length ? (
      <div className="grid gap-4 md:grid-cols-2">{queue.map(q => <ResultCard key={scoreKey(q, q.team)} q={q} st={st} sv={sv} />)}</div>
    ) : <Empty msg="Nothing waiting on your score right now." />
  } else if (tab === 'challenges') {
    const list = approved.length ? approved.map(id => byId(id)).filter(Boolean) : suggestedChallenges(areas).slice(0, 3)
    body = (
      <Card title="Your challenges">
        {list.map(o => {
          const status = mentorChallenges(st)[o.id]
          return (
            <div key={o.id} className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0">
              <span className="min-w-0"><strong className="text-dash-ink">{o.name}</strong><span className="text-dash-muted"> · {o.areas.join(', ')}</span></span>
              <span>{status === 'approved' ? <Pill ok>Assigned</Pill> : <Pill>Suggested</Pill>}</span>
            </div>
          )
        })}
      </Card>
    )
  } else if (tab === 'teams') {
    body = (
      <Card title="Active teams">
        {approved.length ? approved.map(id => byId(id)).filter(Boolean).map(o => (
          <div key={o.id}>
            <strong className="mt-3 block text-sm text-dash-ink">{o.name}</strong>
            {openTeams(o.id).map(t => <div className="flex items-center justify-between gap-3 py-2 text-sm" key={t.name}>
              <span className="min-w-0 flex-1 truncate text-dash-ink">{t.name} — {t.members.join(', ')}</span>
              <span className="text-xs text-dash-faint">{t.wants}</span>
            </div>)}
          </div>
        )) : <Empty msg="No team assignments yet." />}
      </Card>
    )
  } else if (tab === 'sessions') {
    body = <Card title="Sessions"><p className="mt-4 text-sm text-dash-muted">Office-hours and group-session scheduling appear here once you have teams.</p></Card>
  } else {
    body = (
      <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat n={impact.teams} label="Teams on your plate" />
          <Stat n={impact.scored} label="Scores submitted" />
          <Stat n={impact.approval} label="Challenges assigned" />
          <Stat n={impact.avg + ' ★'} label="Average rating you give" />
        </div>
        <Card title="How you're doing" className="mt-4">
          <p className="text-sm text-dash-muted">Your feedback is averaged into each team's final result. Score generously and specifically — that's the whole craft.</p>
        </Card>
      </>
    )
  }
  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">🧭 {mentorRoleLabel(st)} Console</h2>
        <p className="text-sm text-dash-muted">Your queue, teams, sessions and the impact your scoring has.</p>
      </PageHead>
      {body}
    </>
  )
}