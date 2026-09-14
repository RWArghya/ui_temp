import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, PageHead, Pill, Empty, Tag, Kv, Field, StepStrip } from './ui'
import { S } from './store'
import {
  byId, modules, openTeams, problemStatements, submissionArtifact, journeyFor,
  reachedFor, nextStepFor, bagFor, creditsFor, selfCerts, daysLeft, deadlineText, SELF_KEY,
  mentoringOn, toScreenStep, recordRecentPatch,
  moduleSectionsDone, moduleQuizState, moduleReady,
} from './data'

const stepFor = (o, st) => toScreenStep(o, reachedFor(o, st))

function Steps({ o, st }) {
  return <StepStrip steps={journeyFor(o)} cur={stepFor(o, st)} />
}

/* Learn-only visual: same steps/cur as StepStrip (journeyFor/stepFor,
   untouched), just chevron-shaped instead of pills. Kept out of ui.jsx's
   shared StepStrip so Compete/Build's stepper — same component, other
   purposes — isn't touched at all. */
function ChevronSteps({ steps, cur }) {
  const clip = (i) => {
    const notch = 'polygon(0% 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 0% 100%, 14px 50%)'
    const first = 'polygon(0% 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 0% 100%)'
    const last = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 14px 50%)'
    if (i === 0) return first
    if (i === steps.length - 1) return last
    return notch
  }
  return (
    <div className="flex flex-wrap">
      {steps.map((s, i) => {
        const done = i < cur, active = i === cur
        return (
          <div
            key={s}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-xs font-semibold ${i > 0 ? '-ml-3.5' : ''} ${
              done ? 'bg-dash-ok text-white' : active ? 'bg-signal text-white' : 'bg-dash-line-soft text-dash-muted'
            }`}
            style={{ clipPath: clip(i) }}
          >
            {done ? '✓' : i + 1}. {s}
          </div>
        )
      })}
    </div>
  )
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

/* ---- Learn module detail — opening a module used to just expand a static
   "watch it elsewhere" note with a Done button. Now: pick a section, work
   through it, optionally pass a quiz, and only then can the module be
   marked complete — completion happens here, not from the list row. */
function statusFor(m, st, o, done) {
  if (done.includes(m.i)) return 'completed'
  const unlocked = m.i === 0 || done.includes(m.i - 1)
  if (!unlocked) return 'locked'
  return moduleSectionsDone(st, o, m).length > 0 ? 'in-progress' : 'available'
}
const STATUS_LABEL = { completed: 'Completed', 'in-progress': 'In progress', available: 'Available', locked: 'Locked' }

/* Realistic-enough body copy per section, keyed off the module's title/kind
   so it reads as populated rather than a lorem placeholder, without
   hand-writing unique prose for every generated module. */
/* proto.css resets ul{list-style:none} (ported from the prototype, which
   never uses native list markers either) — it's scoped to .dash-root
   with higher specificity than Tailwind's .list-disc, so that utility
   silently loses. Rendering the bullet as content sidesteps the fight
   and matches how every list elsewhere in this shell already works. */
function Bullets({ items }) {
  return <div className="flex flex-col gap-1.5">{items.map(c => <div key={c} className="flex gap-2"><span className="text-dash-faint">•</span><span>{c}</span></div>)}</div>
}
function SectionBody({ m, s }) {
  if (s.title === 'Key concepts') {
    return <Bullets items={m.concepts} />
  }
  if (s.title === 'Applied example' && m.kind === 'Lab') {
    return (
      <>
        <p>Wire the concept into a minimal working example:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-dash-ink p-3 text-xs text-white"><code>{`const context = retrieve(query);\n\nconst response = generate({\n  query,\n  context,\n});`}</code></pre>
      </>
    )
  }
  if (s.title === 'Applied example') {
    return <p>Suppose an assistant is asked a question outside its training data — {m.title.toLowerCase()} is what keeps the answer honest instead of confidently wrong.</p>
  }
  if (s.title === 'Recap') {
    return <Bullets items={[...m.concepts, 'Move on once this feels solid — the next module builds on it directly.']} />
  }
  return <p>{m.title} covers what the rest of this course assumes you already know. This section sets up the vocabulary and mental model the later ones reuse.</p>
}

/* Mock video controls — no real file, but a real play/pause + ticking
   clock so "video module" doesn't mean a static gray box. */
function VideoPlayer({ mins }) {
  const total = mins * 60
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setT(x => Math.min(total, x + 1)), 1000)
    return () => clearInterval(id)
  }, [playing, total])
  const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
  return (
    <div className="max-w-lg overflow-hidden rounded-lg border border-dash-line-soft">
      <button className="flex aspect-video w-full items-center justify-center bg-dash-ink/90" onClick={() => setPlaying(p => !p)}>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-2xl text-white">{playing ? '❚❚' : '▶'}</span>
      </button>
      <div className="flex items-center gap-2 bg-dash-ink px-3 py-2 text-xs text-white/80">
        <span>{fmt(t)} / {fmt(total)}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-signal" style={{ width: (t / total * 100) + '%' }} />
        </div>
      </div>
    </div>
  )
}

function Quiz({ m, st, o, sv, onDone }) {
  const state = moduleQuizState(st, o, m)
  const qi = state.answers.length
  const [pick, setPick] = useState(null)
  const [reveal, setReveal] = useState(false)

  if (qi >= m.quiz.questions.length) {
    const score = state.answers.filter(Boolean).length
    return (
      <div className="mt-3 rounded-lg border border-dash-line-soft p-4 text-center">
        <strong className="text-dash-ink">Quiz completed</strong>
        <p className="mt-1 text-sm text-dash-muted">{score} / {m.quiz.questions.length} correct</p>
        <button className="btn btn-primary btn-sm mt-3 rounded-btn" onClick={onDone}>Continue</button>
      </div>
    )
  }

  const q = m.quiz.questions[qi]
  const submit = () => {
    if (pick === null) return
    setReveal(true)
  }
  const next = () => {
    sv({ moduleQuiz: Object.assign({}, st.moduleQuiz, { [o.id + '::' + m.i]: { answers: state.answers.concat(pick === q.correct) } }) })
    setPick(null); setReveal(false)
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-dash-muted">
        <span>Question {qi + 1} of {m.quiz.questions.length}</span>
        {qi > 0 ? <span>Score: {state.answers.filter(Boolean).length} / {qi}</span> : null}
      </div>
      <p className="mt-1 text-sm font-medium text-dash-ink">{q.q}</p>
      <div className="mt-2 flex flex-col gap-2">
        {q.options.map((opt, i) => (
          <label key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${reveal && i === q.correct ? 'border-dash-ok bg-dash-ok-soft' : reveal && i === pick ? 'border-dash-live bg-dash-live-bg' : 'border-dash-line-soft'}`}>
            <input type="radio" name={'quiz-' + o.id + m.i + qi} checked={pick === i} disabled={reveal} onChange={() => setPick(i)} />
            {opt}
          </label>
        ))}
      </div>
      {!reveal ? (
        <button className="btn btn-primary btn-sm mt-3 rounded-btn" disabled={pick === null} onClick={submit}>Submit</button>
      ) : (
        <div className="mt-3">
          <p className={`text-sm font-medium ${pick === q.correct ? 'text-dash-ok' : 'text-dash-live'}`}>{pick === q.correct ? '✓ Correct' : '✗ Incorrect'}</p>
          <button className="btn btn-primary btn-sm mt-2 rounded-btn" onClick={next}>{qi + 1 === m.quiz.questions.length ? 'See results' : 'Next question'}</button>
        </div>
      )}
    </div>
  )
}

function ModuleDetail({ o, m, st, sv, onBack, onNext, hasNext, nextTitle }) {
  const secDone = moduleSectionsDone(st, o, m)
  const firstIncomplete = m.sections.find(s => !secDone.includes(s.i)) || m.sections[m.sections.length - 1]
  const [viewIdx, setViewIdx] = useState(firstIncomplete.i)
  const view = m.sections[viewIdx]
  const [tab, setTab] = useState('content')
  const done = bagFor(st, 'lessons', o.id, []) || []
  const alreadyComplete = done.includes(m.i)
  const sectionsOk = secDone.length >= m.sections.length
  const ready = moduleReady(st, o, m)

  const completeSection = () => {
    if (secDone.includes(view.i)) return
    sv({ moduleSections: Object.assign({}, st.moduleSections, { [o.id + '::' + m.i]: secDone.concat(view.i) }) })
    const nxt = m.sections[viewIdx + 1]
    if (nxt) setViewIdx(nxt.i)
  }
  const markComplete = () => sv({ lessons: Object.assign({}, st.lessons || {}, { [o.id]: done.concat(m.i) }) })

  const tabs = ['content', ...(m.resources.length ? ['resources'] : []), ...(m.quiz ? ['quiz'] : [])]
  const tabLabel = { content: 'Content', resources: 'Resources', quiz: 'Quiz' }

  return (
    <Card className="mt-4">
      <button className="btn btn-ghost btn-sm rounded-btn" onClick={onBack}>← Back to all modules</button>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded bg-signal text-xs font-bold text-white">{m.i + 1}</span>
            <strong className="text-dash-ink">{m.title}</strong>
          </div>
          <p className="mt-1 text-sm text-dash-muted">{m.kind} · {m.mins} min</p>
        </div>
        <Pill ok={alreadyComplete} warn={!alreadyComplete}>{alreadyComplete ? 'Completed' : STATUS_LABEL[statusFor(m, st, o, done)]}</Pill>
      </div>

      {alreadyComplete ? (
        <div className="mt-4 rounded-lg border border-dash-ok-soft bg-dash-ok-soft p-5 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-dash-ok text-lg text-white">✓</div>
          <strong className="mt-2 block text-dash-ink">Module Completed!</strong>
          <p className="mt-1 text-sm text-dash-muted">You've completed "{m.title}".</p>
          <div className="mx-auto mt-3 inline-flex flex-col items-start gap-1 text-left text-sm text-dash-ink">
            <span>✓ {m.sections.length} / {m.sections.length} sections completed</span>
            {m.quiz ? <span>✓ Quiz passed</span> : null}
          </div>
          {hasNext ? <p className="mt-3 text-sm text-dash-muted">Next module unlocked — <strong className="text-dash-ink">{nextTitle}</strong></p> : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between text-xs text-dash-muted">
            <span>{secDone.length} / {m.sections.length} sections completed</span>
            <span>{Math.round(secDone.length / m.sections.length * 100)}%</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-dash-line-soft">
            <div className="h-full rounded-full bg-signal transition-[width]" style={{ width: (secDone.length / m.sections.length * 100) + '%' }} />
          </div>

          <div className="flex gap-1 border-b border-dash-line-soft">
            {tabs.map(t => (
              <button key={t} className={`rounded-t-btn px-3 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-signal text-dash-ink' : 'text-dash-muted'}`} onClick={() => setTab(t)}>
                {tabLabel[t]}
              </button>
            ))}
          </div>

          {tab === 'content' ? (
            <div className="mt-3">
              {m.kind === 'Video' || m.kind === 'Live session' ? <VideoPlayer mins={m.mins} /> : null}
              {m.kind === 'Live session' ? <p className="mt-2 text-xs text-dash-faint">Live sessions are scheduled per cohort — no real calendar behind this yet.</p> : null}
              {(m.kind === 'Video' || m.kind === 'Live session') ? null : m.kind === 'Lab' ? (
                <p className="text-sm text-dash-muted">Objective: build a working, minimal version of what this module covers. Follow the section below, then mark it complete.</p>
              ) : null}

              <div className="mt-4">
                <h4 className="font-display text-base font-bold text-dash-ink">{view.title}</h4>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-dash-ink"><SectionBody m={m} s={view} /></div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" disabled={viewIdx === 0} onClick={() => setViewIdx(m.sections[viewIdx - 1].i)}>← Previous</button>
                {secDone.includes(view.i)
                  ? <Pill ok>Section completed</Pill>
                  : <button className="btn btn-primary btn-sm rounded-btn" onClick={completeSection}>Mark section complete →</button>}
              </div>
            </div>
          ) : null}

          {tab === 'resources' ? (
            <div className="mt-3 flex flex-col gap-2">
              {m.resources.map(r => (
                <div key={r.name} className="flex items-center justify-between gap-3 rounded-lg border border-dash-line-soft p-3">
                  <div>
                    <strong className="text-sm text-dash-ink">{r.name}</strong>
                    <p className="text-xs text-dash-muted">{r.type}{r.size ? ' · ' + r.size : ''} · {r.desc}</p>
                  </div>
                  {r.url
                    ? <a className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" href={r.url} target="_blank" rel="noopener">{r.type === 'GitHub' ? 'View' : 'Open'}</a>
                    : <span className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft opacity-60">Download</span>}
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'quiz' && m.quiz ? <Quiz m={m} st={st} o={o} sv={sv} onDone={() => setTab('content')} /> : null}

          {!alreadyComplete ? (
            <div className="mt-5 border-t border-dash-line-soft pt-4">
              {ready ? (
                <button className="btn btn-primary rounded-btn" onClick={markComplete}>Complete module</button>
              ) : !sectionsOk ? (
                <p className="text-sm text-dash-muted">Finish every section to continue.</p>
              ) : (
                <p className="text-sm text-dash-muted">Complete the quiz to finish this module.</p>
              )}
            </div>
          ) : hasNext ? (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-dash-line-soft pt-4">
              <button className="btn btn-primary rounded-btn" onClick={onNext}>Continue to next module{nextTitle ? ': ' + nextTitle : ''} →</button>
              <button className="btn btn-ghost rounded-btn border border-dash-line-soft" onClick={onBack}>Back to all modules</button>
            </div>
          ) : null}
        </div>

        <aside>
          <Tag>Module contents</Tag>
          <div className="mt-2 flex flex-col gap-0.5">
            {m.sections.map(s => (
              <button
                key={s.i}
                className={`flex items-center justify-between gap-2 rounded-btn px-2.5 py-2 text-left ${viewIdx === s.i ? 'border border-signal bg-signal-soft' : ''}`}
                onClick={() => setViewIdx(s.i)}
              >
                <span>
                  <span className={`block text-sm ${secDone.includes(s.i) ? 'text-dash-muted' : 'text-dash-ink'}`}>{s.i + 1}. {s.title}</span>
                  <span className="text-xs text-dash-faint">{s.mins} min</span>
                </span>
                {secDone.includes(s.i) ? <span className="shrink-0 text-dash-ok">✓</span> : null}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </Card>
  )
}

/* ---- learning workspace ---- */
function LearningWS({ o, st, sv }) {
  const done = bagFor(st, 'lessons', o.id, []) || []
  const ms = modules(o)
  const [open, setOpen] = useState(null)
  const [tab, setTab] = useState('all')
  const openModule = ms.find(m => m.i === open)

  if (openModule) {
    const nextM = ms.find(m => m.i === open + 1)
    return (
      <ModuleDetail
        o={o} m={openModule} st={st} sv={sv}
        onBack={() => setOpen(null)}
        onNext={() => setOpen(nextM ? nextM.i : null)}
        hasNext={!!nextM}
        nextTitle={nextM?.title}
      />
    )
  }

  const TABS = [['all', 'All modules'], ['inprogress', 'In progress'], ['completed', 'Completed'], ['locked', 'Locked']]
  const rows = ms.filter(m => {
    const s = statusFor(m, st, o, done)
    if (tab === 'completed') return s === 'completed'
    if (tab === 'inprogress') return s === 'in-progress'
    if (tab === 'locked') return s === 'locked'
    return true
  })
  const EMPTY_MSG = { completed: "You haven't completed a module yet.", inprogress: 'Nothing in progress right now.', locked: 'Nothing locked right now.', all: 'No learning modules available yet.' }

  return (
    <>
      {/* Steps is already rendered once by the Workspace coordinator above
         this component — it used to be rendered here too, doubling the
         step strip on every Learn/Build page. */}
      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-[18px] font-bold text-dash-ink">Learning modules</h3>
          <span className="text-xs text-dash-muted">{done.length}/{ms.length} completed</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-dash-line-soft">
          <div className="h-full rounded-full bg-dash-ok transition-[width]" style={{ width: (ms.length ? done.length / ms.length * 100 : 0) + '%' }} />
        </div>

        <div className="mt-4 flex gap-1 border-b border-dash-line-soft">
          {TABS.map(([k, label]) => (
            <button key={k} className={`rounded-t-btn px-3 py-2 text-sm font-medium ${tab === k ? 'border-b-2 border-signal text-dash-ink' : 'text-dash-muted'}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        {!rows.length ? (
          <div className="pt-4"><Empty msg={EMPTY_MSG[tab]} /></div>
        ) : rows.map(m => {
          /* Modules unlock in order, but module 0 has no "module -1" to
             follow — done.includes(m.i - 1) is done.includes(-1) for it,
             which is never true. That left the FIRST module permanently
             locked, which blocked every module after it too, since each
             depends on the one before. `m.i === 0` opens the chain. */
          const status = statusFor(m, st, o, done)
          const clickable = status !== 'locked'
          const pct = status === 'in-progress' ? Math.round((moduleSectionsDone(st, o, m).length / m.sections.length) * 100) : null
          return (
            <div
              key={m.i}
              className={`flex items-center gap-3 border-b border-dash-line-soft py-3 last:border-0 ${clickable ? 'cursor-pointer' : ''}`}
              onClick={() => clickable && setOpen(m.i)}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded text-xs font-bold text-white ${status === 'completed' ? 'bg-dash-ok' : clickable ? 'bg-signal' : 'bg-dash-faint'}`}>
                {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : m.i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <strong className={`block text-[13.5px] ${clickable ? 'text-dash-ink' : 'text-dash-faint'}`}>{m.title}</strong>
                <div className="text-sm text-dash-muted">
                  {m.kind} · {m.mins} min
                  {status === 'locked' && m.i > 0 ? ` · Complete module ${m.i} first` : ''}
                  {status === 'in-progress' ? ` · ${pct}% complete` : ''}
                </div>
              </div>
              <Pill ok={status === 'completed'} warn={status === 'in-progress'}>{STATUS_LABEL[status]}</Pill>
              {status === 'available' ? <button className="btn btn-primary btn-sm rounded-btn" onClick={(e) => { e.stopPropagation(); setOpen(m.i) }}>Start</button> : null}
              {status === 'in-progress' ? <button className="btn btn-primary btn-sm rounded-btn" onClick={(e) => { e.stopPropagation(); setOpen(m.i) }}>Continue</button> : null}
              {clickable ? <span className="text-dash-faint">›</span> : null}
            </div>
          )
        })}
      </Card>
      {done.length === ms.length && ms.length ? <div className="mt-4"><ClaimCert o={o} st={st} sv={sv} /></div> : null}
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
      {o.purpose === 'learning' || o.purpose === 'learncompete' ? <ChevronSteps steps={journeyFor(o)} cur={cur} /> : <Steps o={o} st={st} />}
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