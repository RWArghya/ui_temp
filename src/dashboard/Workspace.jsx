import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, PageHead, Pill, Empty, Tag, Kv, Field, StepStrip } from './ui'
import { S } from './store'
import {
  byId, modules, openTeams, problemStatements, submissionArtifact, journeyFor,
  reachedFor, nextStepFor, bagFor, creditsFor, selfCerts, daysLeft, deadlineText, SELF_KEY,
  mentoringOn, toScreenStep, recordRecentPatch,
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

/* A module row used to be a label and a "Done" checkbox with nothing to
   actually open — you were asked to self-report finishing a video you had
   no way to reach. Clicking the row now expands a content panel keyed by
   `kind` so there's something to look at before marking it done. This is a
   prototype, so "Video"/"Lab" don't stream real files — the panel says so
   outright rather than pretending a player is doing something it isn't. */
function ModuleContent({ m }) {
  if (m.kind === 'Video' || m.kind === 'Live session') {
    return (
      <div className="mt-3">
        <div className="flex aspect-video max-w-md items-center justify-center rounded-lg bg-dash-ink/90">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-2xl text-white">▶</span>
        </div>
        <p className="mt-2 text-xs text-dash-faint">
          {m.kind === 'Live session'
            ? 'Live sessions are scheduled per cohort — this prototype has no real calendar behind it yet.'
            : "Prototype only — no video is actually hosted here. Watch elsewhere if you have the material, then mark it done."}
        </p>
      </div>
    )
  }
  if (m.kind === 'Lab') {
    return (
      <div className="mt-3 rounded-lg border border-dash-line-soft bg-dash-bg-soft p-3">
        <p className="text-sm text-dash-ink">Hands-on lab — work through it in your own environment, then mark it done.</p>
        <p className="mt-1 text-xs text-dash-faint">Prototype only — no real lab environment is provisioned here yet.</p>
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-lg border border-dash-line-soft bg-dash-bg-soft p-3">
      <p className="text-sm text-dash-ink">Capstone project — apply what the earlier modules covered, then mark it done to unlock your certificate.</p>
    </div>
  )
}
/* ---- learning workspace ---- */
function LearningWS({ o, st, sv }) {
  const done = bagFor(st, 'lessons', o.id, []) || []
  const ms = modules(o)
  const [open, setOpen] = useState(null)
  return (
    <>
      {/* Steps is already rendered once by the Workspace coordinator above
         this component — it used to be rendered here too, doubling the
         step strip on every Learn/Build page. */}
      <Card title="Modules" className="mt-4">
        {ms.map(m => {
          const isDone = done.includes(m.i)
          /* Modules unlock in order, but module 0 has no "module -1" to
             follow — done.includes(m.i - 1) is done.includes(-1) for it,
             which is never true. That left the FIRST module permanently
             without a "Done" button, which blocked every module after it
             too, since each depends on the one before. `m.i === 0` opens
             the chain at the start. */
          const unlocked = m.i === 0 || done.includes(m.i - 1)
          const isOpen = open === m.i
          /* The row's own toggle and the Done/Undo action are two separate
             clickable controls, not one nested inside the other — a
             <button> inside a <button> is invalid HTML and browsers
             silently reparent/break it (a documented gotcha from
             prototype_v2/CLAUDE.md). The row is a div with its own
             onClick; Done/Undo is a real sibling <button>. */
          return (
            <div className="border-b border-dash-line-soft py-3 last:border-0" key={m.i}>
              <div
                className={`flex items-center gap-3 ${unlocked ? 'cursor-pointer' : ''}`}
                onClick={() => unlocked && setOpen(isOpen ? null : m.i)}
                role={unlocked ? 'button' : undefined}
                tabIndex={unlocked ? 0 : undefined}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded text-xs font-bold text-white ${isDone ? 'bg-dash-ok-soft0' : unlocked ? 'bg-signal' : 'bg-dash-faint'}`}>
                  {isDone ? '✓' : m.i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className={`block text-[13.5px] ${unlocked ? 'text-dash-ink' : 'text-dash-faint'}`}>{m.title}</strong>
                  <div className="text-sm text-dash-muted">{m.kind} · {m.mins} min{!unlocked ? ' · locked until the module above is done' : ''}</div>
                </div>
                {unlocked ? <span className="text-dash-faint">{isOpen ? '▴' : '▾'}</span> : null}
                {!isDone && unlocked ? (
                  <button
                    className="btn btn-primary btn-sm rounded-btn"
                    onClick={(e) => { e.stopPropagation(); sv({ lessons: Object.assign({}, st.lessons || {}, { [o.id]: done.concat(m.i) }) }) }}
                  >Done</button>
                ) : null}
                {isDone ? (
                  <button
                    className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft"
                    onClick={(e) => { e.stopPropagation(); sv({ lessons: Object.assign({}, st.lessons || {}, { [o.id]: done.filter(x => x !== m.i) }) }) }}
                  >Undo</button>
                ) : null}
              </div>
              {isOpen ? <ModuleContent m={m} /> : null}
            </div>
          )
        })}
      </Card>
      {done.length === ms.length ? <div className="mt-4"><ClaimCert o={o} st={st} sv={sv} /></div> : null}
    </>
  )
}

/* ---- pre-registration preview — was just a one-line blurb + Register
   button, with none of the real detail (deadline, registration count,
   syllabus, problem statements, open teams) the data layer already has.
   Read-only versions of the same lists the registered workspace shows, so
   what's promised here matches what actually happens after Register. ---- */
function InitiativePreview({ o }) {
  const ms = o.purpose !== 'competing' ? modules(o) : []
  const ps = o.purpose !== 'learning' ? problemStatements(o) : []
  const teams = o.purpose !== 'learning' ? openTeams(o.id) : []
  return (
    <>
      <Card title="Key facts" className="mt-4">
        <Kv k="Deadline" v={deadlineText(o)} />
        <Kv k="Region" v={o.region} />
        <Kv k="Format" v={o.mode} />
        <Kv k="Registered so far" v={(o.regs || 0).toLocaleString('en-IN')} />
      </Card>

      {ms.length ? (
        <Card title="What you'll learn" className="mt-4">
          <p className="mb-2 text-sm text-dash-muted">{ms.length} modules, self-paced.</p>
          {ms.map(m => (
            <div key={m.i} className="flex items-center gap-3 border-b border-dash-line-soft py-2.5 last:border-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-dash-line-soft text-xs font-bold text-dash-muted">{m.i + 1}</span>
              <div className="min-w-0 flex-1">
                <strong className="block text-[13.5px] text-dash-ink">{m.title}</strong>
                <div className="text-xs text-dash-muted">{m.kind} · {m.mins} min</div>
              </div>
            </div>
          ))}
        </Card>
      ) : null}

      {ps.length ? (
        <Card title="Problem statements" className="mt-4">
          <p className="mb-2 text-sm text-dash-muted">{ps.length} live statements — you'll pick one after registering.</p>
          {ps.map(p => (
            <div key={p.code} className="border-b border-dash-line-soft py-2.5 last:border-0">
              <div className="flex items-center gap-2"><strong className="text-sm text-dash-ink">{p.code}</strong><Pill>{p.area}</Pill></div>
              <p className="mt-1 text-sm text-dash-ink">{p.title}</p>
              <p className="mt-0.5 text-xs text-dash-muted">{p.desc}</p>
            </div>
          ))}
        </Card>
      ) : null}

      {teams.length ? (
        <Card title="Teams looking for members" className="mt-4">
          {teams.map(t => (
            <div key={t.name} className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2.5 last:border-0">
              <div className="min-w-0">
                <strong className="text-sm text-dash-ink">{t.name}</strong>
                <p className="mt-0.5 text-xs text-dash-muted">{t.members.join(', ')} · wants {t.wants}</p>
              </div>
              <span className="text-xs text-dash-muted">{t.members.length} / {t.cap}</span>
            </div>
          ))}
          <p className="mt-2 text-xs text-dash-faint">Register to join one of these, or start your own.</p>
        </Card>
      ) : null}
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
  const seed = sub || submissionArtifact(o.id, team, o)
  const scored = !!(st.scores || {})[SELF_KEY(o.id)]
  /* Controlled fields, seeded from the deterministic demo artifact so a
     fresh form isn't empty. Previously these were uncontrolled
     defaultValue inputs — Submit ignored anything typed and always saved
     the seeded values, so editing the form did nothing. */
  const [repo, setRepo] = useState(seed.repo)
  const [demo, setDemo] = useState(seed.demo)
  const [notes, setNotes] = useState(seed.notes)
  const [file, setFile] = useState(seed.file || null)
  const [fileErr, setFileErr] = useState('')

  const MAX_FILE_BYTES = 2 * 1024 * 1024 // localStorage-safe cap
  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_FILE_BYTES) { setFileErr('That file is over 2MB — pick something smaller, or link it instead.'); return }
    setFileErr('')
    const reader = new FileReader()
    reader.onload = () => setFile({ name: f.name, sizeKB: Math.round(f.size / 1024), dataUrl: reader.result })
    reader.readAsDataURL(f)
  }

  const doSubmit = () => {
    const art = { title: seed.title, repo, demo, notes, file }
    sv({
      submissions: (st.submissions || []).includes(o.id) ? st.submissions : (st.submissions || []).concat(o.id),
      submission: Object.assign({}, st.submission || {}, { [o.id]: art }),
    })
  }

  return (
    <Card title="Submit">
      {sub ? (
        <>
          <Pill ok>Submitted</Pill>
          <div className="mt-3"><Kv k="Artifact" v={sub.title} /></div>
          <Kv k="Repo" v={<a className="text-signal hover:underline" href={sub.repo} target="_blank" rel="noopener">{sub.repo}</a>} />
          {sub.demo ? <Kv k="Demo" v={<a className="text-signal hover:underline" href={sub.demo} target="_blank" rel="noopener">watch</a>} /> : null}
          {sub.file ? <Kv k="Attachment" v={<a className="text-signal hover:underline" href={sub.file.dataUrl} download={sub.file.name}>{sub.file.name} ({sub.file.sizeKB} KB)</a>} /> : null}
          <Kv k="Last note" v={sub.notes} />
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
          <Field label="Demo URL (optional)" value={demo} onChange={(e) => setDemo(e.target.value)} />
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm text-dash-muted">Notes for evaluators</label>
            <textarea className="textarea textarea-bordered textarea-md w-full" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm text-dash-muted">Attach a file (optional) — deck, report, design export, up to 2MB</label>
            <input type="file" className="file-input file-input-bordered w-full max-w-sm text-sm" onChange={onFile} />
            {file ? <p className="text-xs text-dash-ok">{file.name} · {file.sizeKB} KB attached</p> : null}
            {fileErr ? <p className="text-xs text-dash-live">{fileErr}</p> : null}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {sub && !scored ? <Link className="btn btn-primary rounded-btn" to={'/dashboard/evaluate?id=' + o.id}>Evaluation →</Link> : null}
        {!sub ? <button className="btn btn-primary rounded-btn" onClick={doSubmit}>Submit</button> : null}
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

  /* Records the view for "Recently viewed" — covers both /initiative and
     /workspace since both render this component. Runs before the early
     return below so the hook count stays stable across renders (a
     conditional useEffect after an early return would violate the rules of
     hooks once `id` starts pointing at different initiatives). sv() isn't
     called in the deps, only `id`, so this fires once per initiative
     opened, not on every unrelated state change. */
  const svRef = useRef(sv)
  svRef.current = sv
  useEffect(() => {
    if (!id || !byId(id)) return
    svRef.current(recordRecentPatch(id, S.read()))
  }, [id])

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
        <InitiativePreview o={o} />
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
              {/* reachedFor('competing') only ever returns 2 while `!sub` —
                  it only reaches 3 once a submission already exists. Gating
                  this card on cur >= 3 meant the Submit form could never
                  appear: nothing could produce a submission to unlock it.
                  "Build" (journey label index 2) has no UI of its own — it's
                  folded into this same card, so the real unlock point is 2,
                  matching reachedFor's own `!sub ? 2` value. */}
              {cur >= 2 ? <div className="mt-4"><BuildSubmit o={o} st={st} sv={sv} /></div> : null}
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