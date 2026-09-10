import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, PageHead, Pill, Empty, Tag, Kv, Field, StepStrip } from './ui'
import { S } from './store'
import {
  byId, modules, openTeams, problemStatements, submissionArtifact, journeyFor,
  reachedFor, nextStepFor, bagFor, creditsFor, selfCerts, daysLeft, SELF_KEY,
  mentoringOn, toScreenStep,
} from './data'

const stepFor = (o, st) => toScreenStep(o, reachedFor(o, st))

function Steps({ o, st }) {
  return <StepStrip steps={journeyFor(o)} cur={stepFor(o, st)} />
}

/* ---- certificate claim (learning capstone end) ---- */
function ClaimCert({ o, st, sv }) {
  const claimed = bagFor(st, 'claimed', o.id, false)
  return (
    <Card title="Capstone — certificate">
      <p className="text-sm text-dash-muted">Finish the modules and claim your certificate. It lands on your profile as verifiable and shareable.</p>
      {claimed
        ? <Pill ok>Certificate claimed</Pill>
        : <button className="btn btn-primary rounded-btn" onClick={() => sv({ claimed: Object.assign({}, st.claimed || {}, { [o.id]: true }) })}>Claim certificate</button>}
    </Card>
  )
}

/* ---- learning workspace ---- */
function LearningWS({ o, st, sv }) {
  const done = bagFor(st, 'lessons', o.id, []) || []
  const ms = modules(o)
  return (
    <>
      <Steps o={o} st={st} />
      <Card title="Modules" className="mt-4">
        {ms.map(m => {
          const isDone = done.includes(m.i)
          return (
            <div className="flex items-center gap-3 border-b border-dash-line-soft py-3 last:border-0" key={m.i}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded text-xs font-bold text-white ${isDone ? 'bg-dash-ok-soft0' : 'bg-signal'}`}>
                {isDone ? '✓' : m.i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block text-[13.5px] text-dash-ink">{m.title}</strong>
                <div className="text-sm text-dash-muted">{m.kind} · {m.mins} min</div>
              </div>
              {!isDone && done.includes(m.i - 1) ? (
                <button className="btn btn-primary btn-sm rounded-btn" onClick={() => sv({ lessons: Object.assign({}, st.lessons || {}, { [o.id]: done.concat(m.i) }) })}>Done</button>
              ) : null}
              {isDone ? (
                <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => sv({ lessons: Object.assign({}, st.lessons || {}, { [o.id]: done.filter(x => x !== m.i) }) })}>Undo</button>
              ) : null}
            </div>
          )
        })}
      </Card>
      {done.length === ms.length ? <div className="mt-4"><ClaimCert o={o} st={st} sv={sv} /></div> : null}
    </>
  )
}

/* ---- team picker (competing) ---- */
function TeamStep({ o, st, sv }) {
  const teams = openTeams(o.id)
  const chosen = bagFor(st, 'teams', o.id, null)
  return (
    <Card title="Join a team">
      <p className="text-sm text-dash-muted">These teams have open slots on {o.name}.</p>
      {chosen ? (
        <Pill ok>You're in — {chosen}</Pill>
      ) : teams.map(t => (
        <div className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-3 last:border-0" key={t.name}>
          <div className="min-w-0">
            <strong className="text-dash-ink">{t.name}</strong>
            <p className="mt-0.5 text-sm text-dash-muted">{t.members.join(', ')} · wants {t.wants}</p>
          </div>
          <button className="btn btn-primary btn-sm rounded-btn" onClick={() => sv({ teams: Object.assign({}, st.teams || {}, { [o.id]: t.name }) })}>Join</button>
        </div>
      ))}
    </Card>
  )
}

/* ---- statement picker (learncompete build phase) ---- */
function StatementStep({ o, st, sv }) {
  const ps = problemStatements(o)
  const chosen = bagFor(st, 'chosenPS', o.id, null)
  return (
    <Card title="Pick a problem statement">
      {chosen ? <Pill ok>Registered — {chosen}</Pill> : ps.map(p => (
        <div className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-3 last:border-0" key={p.code}>
          <div className="min-w-0">
            <strong className="text-dash-ink">{p.code} · {p.title}</strong>
            <p className="mt-0.5 text-sm text-dash-muted">{p.area} — {p.desc}</p>
          </div>
          <button className="btn btn-primary btn-sm rounded-btn" onClick={() => sv({ chosenPS: Object.assign({}, st.chosenPS || {}, { [o.id]: p.code }) })}>Choose</button>
        </div>
      ))}
    </Card>
  )
}

/* ---- build/submit ---- */
function BuildSubmit({ o, st, sv }) {
  const sub = bagFor(st, 'submission', o.id, null)
  const team = bagFor(st, 'teams', o.id, null) || 'solo'
  const art = sub || submissionArtifact(o.id, team, o)
  const scored = !!(st.scores || {})[SELF_KEY(o.id)]
  return (
    <Card title="Submit">
      {sub ? (
        <>
          <Pill ok>Submitted</Pill>
          <div className="mt-3"><Kv k="Artifact" v={art.title} /></div>
          <Kv k="Repo" v={<a className="text-signal hover:underline" href={art.repo} target="_blank" rel="noopener">{art.repo}</a>} />
          {art.demo ? <Kv k="Demo" v={<a className="text-signal hover:underline" href={art.demo} target="_blank" rel="noopener">watch</a>} /> : null}
          <Kv k="Last note" v={art.notes} />
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Repo" defaultValue={art.repo} />
          <Field label="Demo URL (optional)" defaultValue={art.demo} />
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm text-dash-muted">Notes for evaluators</label>
            <textarea className="textarea textarea-bordered textarea-md w-full" defaultValue={art.notes} rows={3} />
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {sub && !scored ? <Link className="btn btn-primary rounded-btn" to={'/dashboard/evaluate?id=' + o.id}>Evaluation →</Link> : null}
        {!sub ? <button className="btn btn-primary rounded-btn" onClick={() => sv({ submissions: ((st.submissions || []).includes(o.id) ? st.submissions : (st.submissions || []).concat(o.id)), submission: Object.assign({}, st.submission || {}, { [o.id]: art }) })}>Submit</button> : null}
        <span className="text-sm text-dash-muted">{o.status === 'past' ? 'Competition finished' : 'Closed ' + daysLeft(o.deadline) + (daysLeft(o.deadline) >= 0 ? 'd left' : '')}</span>
      </div>
    </Card>
  )
}

/* ---- learncompete: mentor connect toggle ---- */
function MentorToggle({ o, st, sv }) {
  const on = mentoringOn(o) || bagFor(st, 'mentorConnect', o.id, false)
  return (
    <Card title="Mentor Connect">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <strong className="block text-sm text-dash-ink">Ask for a mentor on this track</strong>
          <p className="text-xs text-dash-muted">An approved mentor reviews your approach once you have a repo to share.</p>
        </div>
        <input type="checkbox" className="toggle toggle-primary" checked={on} onChange={() => sv({ mentorConnect: Object.assign({}, st.mentorConnect || {}, { [o.id]: !on }) })} />
      </div>
    </Card>
  )
}

/* ---- workspace coordinator ---- */
export default function Workspace({ st, sv, go }) {
  const [sp] = useSearchParams()
  const id = sp.get('id')
  const o = byId(id)
  if (!o) return <Empty msg="That initiative wasn't found." />
  const reg = (st.registered || []).includes(o.id)
  const ns = nextStepFor(o, st)
  const cur = stepFor(o, st)

  if (!reg) {
    return (
      <>
        <PageHead title={o.name} sub={o.org + ' · ' + o.mode + ' · ' + o.prize} />
        <Card title="About">
          <p className="text-sm text-dash-ink">{o.blurb}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill live>{o.status}</Pill>{o.areas.map(a => <Pill key={a}>{a}</Pill>)}
          </div>
          <div className="mt-4 flex gap-4">
            <button className="btn btn-primary rounded-btn" onClick={() => {
              const cur = S.read()
              const reg = (cur.registered || []).concat(o.id)
              const intents = (cur.intents || []).includes(o.purpose) ? cur.intents : (cur.intents || []).concat(o.purpose)
              if (o.purpose !== 'learning') intents.push('competing')
              sv({ registered: reg, intents: [...new Set(intents)] })
            }}>Register</button>
            <button className="btn btn-ghost rounded-btn border border-dash-line-soft" onClick={() => go('home')}>Back</button>
          </div>
        </Card>
      </>
    )
  }

  const isCompete = o.purpose === 'competing'
  return (
    <>
      <PageHead>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mb-1.5">{o.name}</h2>
          <Pill ok>Registered</Pill>
        </div>
        <p className="text-sm text-dash-muted">{o.org} · {o.mode} · {o.prize}</p>
      </PageHead>
      <Steps o={o} st={st} />
      {ns && cur < journeyFor(o).length ? (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Tag>Next step</Tag>
              <strong className="mt-1 block text-dash-ink">{ns.step}</strong>
              <span className="text-sm text-dash-muted">{ns.hint}</span>
            </div>
            <Pill warn>{journeyFor(o)[cur]}</Pill>
          </div>
        </Card>
      ) : null}

      {o.purpose === 'learning'
        ? <div className="mt-4"><LearningWS o={o} st={st} sv={sv} /></div>
        : isCompete
          ? <>
              {cur >= 1 ? <div className="mt-4"><TeamStep o={o} st={st} sv={sv} /></div> : null}
              {cur >= 3 ? <div className="mt-4"><BuildSubmit o={o} st={st} sv={sv} /></div> : null}
            </>
          : <>
              <div className="mt-4"><LearningWS o={o} st={st} sv={sv} />
                {cur >= 3 ? <div className="mt-4"><StatementStep o={o} st={st} sv={sv} /></div> : null}
                {cur >= 5 ? <div className="mt-4"><BuildSubmit o={o} st={st} sv={sv} /></div> : null}
                {mentoringOn(o) || o.mentoring ? <div className="mt-4"><MentorToggle o={o} st={st} sv={sv} /></div> : null}
              </div>
            </>
      }
      {isCompete && bagFor(st, 'submission', o.id, null) ? <div className="mt-4"><Link className="btn btn-primary rounded-btn" to={'/dashboard/evaluate?id=' + o.id}>Open evaluation</Link></div> : null}
    </>
  )
}