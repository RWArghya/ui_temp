import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, PageHead, Pill, Empty, Tag, Kv, Field } from './ui'
import Icon from './Icon'
import { S } from './store'
import {
  byId, modules, openTeams, problemStatements, submissionArtifact, journeyFor,
  reachedFor, nextStepFor, bagFor, creditsFor, selfCerts, daysLeft, deadlineText, SELF_KEY,
  mentoringOn, toScreenStep, recordRecentPatch,
  moduleSectionsDone, moduleQuizState, moduleReady,
} from './data'

const stepFor = (o, st) => toScreenStep(o, reachedFor(o, st))

/* Unified Google-Grade Chevron Stepper:
   Used identically across Compete, Learn, and Build initiatives.
   Consistent with arg/proto2 design language, typography, and tokens. */
function ChevronSteps({ steps, cur }) {
  const clip = (i, len) => {
    if (len <= 1) return 'none'
    const notch = 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%, 10px 50%)'
    const first = 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%)'
    const last = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10px 50%)'
    if (i === 0) return first
    if (i === len - 1) return last
    return notch
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-dash-line-soft rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {steps.map((s, i) => {
        const done = i < cur
        const active = i === cur
        const isFirst = i === 0
        const isLast = i === steps.length - 1

        return (
          <div
            key={s}
            className={`flex items-center gap-2 h-9 text-[12.5px] font-semibold tracking-tight transition-all select-none ${
              isFirst ? 'pl-3.5 pr-5' : isLast ? 'pl-5 pr-4' : 'pl-5 pr-5'
            } ${
              done
                ? 'bg-dash-ok-soft text-dash-ok hover:brightness-95'
                : active
                  ? 'bg-signal text-white shadow-sm font-bold'
                  : 'bg-dash-line-soft text-dash-muted hover:brightness-95'
            }`}
            style={{ clipPath: clip(i, steps.length) }}
            title={`Step ${i + 1}: ${s}`}
          >
            {done ? (
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-dash-ok text-white text-[10px] font-bold">
                ✓
              </span>
            ) : active ? (
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white text-signal text-[11px] font-bold shadow-xs">
                {i + 1}
              </span>
            ) : (
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-paper-line text-graphite text-[11px] font-semibold">
                {i + 1}
              </span>
            )}
            <span className="whitespace-nowrap">{s}</span>
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
        : <button className="btn btn-primary rounded-[4px] mt-3" onClick={() => sv({ claimed: Object.assign({}, st.claimed || {}, { [o.id]: true }) })}>Claim certificate</button>}
    </Card>
  )
}

/* ---- Learn module detail — opening a module allows working through sections,
   watching videos, checking resources, passing a quiz, and completing the module. ---- */
function statusFor(m, st, o, done) {
  if (done.includes(m.i)) return 'completed'
  const unlocked = m.i === 0 || done.includes(m.i - 1)
  if (!unlocked) return 'locked'
  return moduleSectionsDone(st, o, m).length > 0 ? 'in-progress' : 'available'
}
const STATUS_LABEL = { completed: 'Completed', 'in-progress': 'In progress', available: 'Available', locked: 'Locked' }

function Bullets({ items }) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map(c => (
        <div key={c} className="flex gap-2">
          <span className="text-dash-faint">•</span>
          <span>{c}</span>
        </div>
      ))}
    </div>
  )
}

function SectionBody({ m, s }) {
  if (s.title === 'Key concepts') {
    return <Bullets items={m.concepts} />
  }
  if (s.title === 'Applied example' && m.kind === 'Lab') {
    return (
      <>
        <p>Wire the concept into a minimal working example:</p>
        <pre className="mt-2 overflow-x-auto rounded-[4px] bg-dash-ink p-3 text-xs text-white"><code>{`const context = retrieve(query);\n\nconst response = generate({\n  query,\n  context,\n});`}</code></pre>
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

/* Mock video controls with playback timer */
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
    <div className="max-w-lg overflow-hidden rounded-[4px] border border-dash-line-soft">
      <button className="flex aspect-video w-full items-center justify-center bg-dash-ink/90 cursor-pointer" onClick={() => setPlaying(p => !p)}>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-2xl text-white transition-transform hover:scale-110">
          {playing ? '⏸' : '▶'}
        </span>
      </button>
      <div className="flex items-center gap-2 bg-dash-ink px-3 py-2 text-xs text-white/80">
        <span>{fmt(t)} / {fmt(total)}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-signal transition-[width]" style={{ width: (t / total * 100) + '%' }} />
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
      <div className="mt-3 rounded-[4px] border border-dash-line-soft p-4 text-center">
        <strong className="text-dash-ink text-base">Quiz completed</strong>
        <p className="mt-1 text-sm text-dash-muted">{score} / {m.quiz.questions.length} correct</p>
        <button className="btn btn-primary btn-sm mt-3 rounded-[4px]" onClick={onDone}>Continue</button>
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
          <label key={i} className={`flex items-center gap-2 rounded-[4px] border px-3 py-2 text-sm cursor-pointer transition-colors ${reveal && i === q.correct ? 'border-dash-ok bg-dash-ok-soft' : reveal && i === pick ? 'border-dash-live bg-dash-live-bg' : 'border-dash-line-soft hover:bg-dash-surface'}`}>
            <input type="radio" name={'quiz-' + o.id + m.i + qi} checked={pick === i} disabled={reveal} onChange={() => setPick(i)} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {!reveal ? (
        <button className="btn btn-primary btn-sm mt-3 rounded-[4px]" disabled={pick === null} onClick={submit}>Submit</button>
      ) : (
        <div className="mt-3">
          <p className={`text-sm font-medium ${pick === q.correct ? 'text-dash-ok' : 'text-dash-live'}`}>{pick === q.correct ? '✓ Correct' : '✗ Incorrect'}</p>
          <button className="btn btn-primary btn-sm mt-2 rounded-[4px]" onClick={next}>{qi + 1 === m.quiz.questions.length ? 'See results' : 'Next question'}</button>
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
      <button className="btn btn-ghost btn-sm rounded-[4px]" onClick={onBack}>
        <Icon name="ArrowLeft" size={14} /> Back to all modules
      </button>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-[4px] bg-signal text-xs font-bold text-white">{m.i + 1}</span>
            <strong className="text-dash-ink text-base">{m.title}</strong>
          </div>
          <p className="mt-1 text-sm text-dash-muted">{m.kind} · {m.mins} min</p>
        </div>
        <Pill ok={alreadyComplete} warn={!alreadyComplete}>{alreadyComplete ? 'Completed' : STATUS_LABEL[statusFor(m, st, o, done)]}</Pill>
      </div>

      {alreadyComplete ? (
        <div className="mt-4 rounded-[4px] border border-dash-ok-soft bg-dash-ok-soft p-5 text-center">
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
              <button key={t} className={`px-3 py-2 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-signal text-dash-ink font-semibold' : 'text-dash-muted hover:text-dash-ink'}`} onClick={() => setTab(t)}>
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
                <button className="btn btn-ghost btn-sm rounded-[4px] border border-dash-line-soft" disabled={viewIdx === 0} onClick={() => setViewIdx(m.sections[viewIdx - 1].i)}>
                  <Icon name="ArrowLeft" size={13} /> Previous
                </button>
                {secDone.includes(view.i)
                  ? <Pill ok>Section completed</Pill>
                  : <button className="btn btn-primary btn-sm rounded-[4px]" onClick={completeSection}>Mark section complete →</button>}
              </div>
            </div>
          ) : null}

          {tab === 'resources' ? (
            <div className="mt-3 flex flex-col gap-2">
              {m.resources.map(r => (
                <div key={r.name} className="flex items-center justify-between gap-3 rounded-[4px] border border-dash-line-soft p-3">
                  <div>
                    <strong className="text-sm text-dash-ink">{r.name}</strong>
                    <p className="text-xs text-dash-muted">{r.type}{r.size ? ' · ' + r.size : ''} · {r.desc}</p>
                  </div>
                  {r.url
                    ? <a className="btn btn-ghost btn-sm rounded-[4px] border border-dash-line-soft" href={r.url} target="_blank" rel="noopener">{r.type === 'GitHub' ? 'View Repo' : 'Open'}</a>
                    : <span className="btn btn-ghost btn-sm rounded-[4px] border border-dash-line-soft opacity-60">Download</span>}
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'quiz' && m.quiz ? <Quiz m={m} st={st} o={o} sv={sv} onDone={() => setTab('content')} /> : null}

          {!alreadyComplete ? (
            <div className="mt-5 border-t border-dash-line-soft pt-4">
              {ready ? (
                <button className="btn btn-primary rounded-[4px]" onClick={markComplete}>Complete module</button>
              ) : !sectionsOk ? (
                <p className="text-sm text-dash-muted">Finish every section to continue.</p>
              ) : (
                <p className="text-sm text-dash-muted">Complete the quiz to finish this module.</p>
              )}
            </div>
          ) : hasNext ? (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-dash-line-soft pt-4">
              <button className="btn btn-primary rounded-[4px]" onClick={onNext}>Continue to next module{nextTitle ? ': ' + nextTitle : ''} →</button>
              <button className="btn btn-ghost rounded-[4px] border border-dash-line-soft" onClick={onBack}>Back to all modules</button>
            </div>
          ) : null}
        </div>

        <aside>
          <Tag>Module contents</Tag>
          <div className="mt-2 flex flex-col gap-0.5">
            {m.sections.map(s => (
              <button
                key={s.i}
                className={`flex items-center justify-between gap-2 rounded-[4px] px-2.5 py-2 text-left cursor-pointer transition-colors ${viewIdx === s.i ? 'border border-signal bg-signal-soft' : 'hover:bg-dash-surface'}`}
                onClick={() => setViewIdx(s.i)}
              >
                <span>
                  <span className={`block text-sm ${secDone.includes(s.i) ? 'text-dash-muted' : 'text-dash-ink font-medium'}`}>{s.i + 1}. {s.title}</span>
                  <span className="text-xs text-dash-faint">{s.mins} min</span>
                </span>
                {secDone.includes(s.i) ? <span className="shrink-0 text-dash-ok font-bold">✓</span> : null}
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
            <button key={k} className={`px-3 py-2 text-sm font-medium transition-colors ${tab === k ? 'border-b-2 border-signal text-dash-ink font-semibold' : 'text-dash-muted hover:text-dash-ink'}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        {!rows.length ? (
          <div className="pt-4"><Empty msg={EMPTY_MSG[tab]} /></div>
        ) : rows.map(m => {
          const status = statusFor(m, st, o, done)
          const clickable = status !== 'locked'
          const pct = status === 'in-progress' ? Math.round((moduleSectionsDone(st, o, m).length / m.sections.length) * 100) : null
          return (
            <div
              key={m.i}
              className={`flex items-center gap-3 border-b border-dash-line-soft py-3 last:border-0 ${clickable ? 'cursor-pointer hover:bg-dash-surface/50' : ''}`}
              onClick={() => clickable && setOpen(m.i)}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-[4px] text-xs font-bold text-white ${status === 'completed' ? 'bg-dash-ok' : clickable ? 'bg-signal' : 'bg-dash-faint'}`}>
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
              {status === 'available' ? <button className="btn btn-primary btn-sm rounded-[4px]" onClick={(e) => { e.stopPropagation(); setOpen(m.i) }}>Start</button> : null}
              {status === 'in-progress' ? <button className="btn btn-primary btn-sm rounded-[4px]" onClick={(e) => { e.stopPropagation(); setOpen(m.i) }}>Continue</button> : null}
              {clickable ? <span className="text-dash-faint">›</span> : null}
            </div>
          )
        })}
      </Card>
      {done.length === ms.length && ms.length ? <div className="mt-4"><ClaimCert o={o} st={st} sv={sv} /></div> : null}
    </>
  )
}

/* ---- pre-registration preview ---- */
function InitiativePreview({ o }) {
  const ms = o.purpose === 'learning' ? modules(o) : []
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
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[4px] bg-dash-line-soft text-xs font-bold text-dash-muted">{m.i + 1}</span>
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

/* ---- team picker (competing & build) ---- */
function TeamStep({ o, st, sv }) {
  const teams = openTeams(o.id)
  const chosen = bagFor(st, 'teams', o.id, null)
  return (
    <Card title="Join a team">
      <p className="text-sm text-dash-muted">These teams have open slots on {o.name}.</p>
      {chosen ? (
        <div className="mt-3"><Pill ok>You're in — {chosen}</Pill></div>
      ) : teams.map(t => (
        <div className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-3 last:border-0" key={t.name}>
          <div className="min-w-0">
            <strong className="text-dash-ink">{t.name}</strong>
            <p className="mt-0.5 text-sm text-dash-muted">{t.members.join(', ')} · wants {t.wants}</p>
          </div>
          <button className="btn btn-primary btn-sm rounded-[4px]" onClick={() => sv({ teams: Object.assign({}, st.teams || {}, { [o.id]: t.name }) })}>Join</button>
        </div>
      ))}
    </Card>
  )
}

/* ---- statement picker (Build track) ---- */
function StatementStep({ o, st, sv }) {
  const ps = problemStatements(o)
  const chosen = bagFor(st, 'chosenPS', o.id, null)
  const [picking, setPicking] = useState(false)
  const selected = ps.find(p => p.code === chosen) || ps[0]

  if (chosen && !picking && selected) {
    return (
      <Card title="Active Problem Statement">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dash-line-soft pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-signal px-2 py-0.5 rounded-[4px] bg-signal-soft border border-signal/20">{selected.code}</span>
            <strong className="text-base text-dash-ink">{selected.title}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Pill ok>Selected</Pill>
            <button className="btn btn-ghost btn-xs rounded-[4px] text-dash-muted hover:text-dash-ink" onClick={() => setPicking(true)}>
              Switch statement
            </button>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm text-dash-ink">{selected.desc}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Pill>{selected.area}</Pill>
            <span className="text-xs text-dash-muted">
              Deliverables: Working functional prototype, documented repo, and demo video
            </span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Problem Statements — Pick Your Challenge">
      <p className="text-sm text-dash-muted mb-3">
        Choose a live problem statement to focus your prototype build on.
      </p>
      {ps.map(p => (
        <div className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-3 last:border-0" key={p.code}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-signal px-1.5 py-0.5 rounded-[4px] bg-signal-soft">{p.code}</span>
              <strong className="text-sm text-dash-ink">{p.title}</strong>
              <Pill>{p.area}</Pill>
            </div>
            <p className="text-xs text-dash-muted">{p.desc}</p>
          </div>
          <button
            className={`btn btn-sm rounded-[4px] shrink-0 ${p.code === chosen ? 'btn-outline border-dash-ok text-dash-ok' : 'btn-primary'}`}
            onClick={() => {
              sv({ chosenPS: Object.assign({}, st.chosenPS || {}, { [o.id]: p.code }) })
              setPicking(false)
            }}
          >
            {p.code === chosen ? 'Selected ✓' : 'Choose'}
          </button>
        </div>
      ))}
      {chosen && picking ? (
        <button className="btn btn-ghost btn-sm mt-3 rounded-[4px]" onClick={() => setPicking(false)}>
          Cancel
        </button>
      ) : null}
    </Card>
  )
}

/* ---- Build workspace: starter kit, APIs, docs, and mentoring ---- */
function BuildWorkspace({ o, st, sv }) {
  return (
    <Card title="Build Guidelines & Developer Workspace" className="mt-4">
      <p className="text-sm text-dash-muted">
        Access starter repositories, problem-specific guidelines, and developer resources to build your working prototype.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[4px] border border-dash-line-soft bg-dash-surface/50 p-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📦</span>
            <strong className="text-sm text-dash-ink">Starter Repository</strong>
          </div>
          <p className="mt-1 text-xs text-dash-muted">
            Pre-configured scaffold with sample dataset, inference pipeline boilerplate, and Docker deployment config.
          </p>
          <a
            href="https://github.com/hack2skill/examples"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-signal hover:underline"
          >
            Clone starter template <Icon name="ArrowRight" size={12} />
          </a>
        </div>

        <div className="rounded-[4px] border border-dash-line-soft bg-dash-surface/50 p-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📑</span>
            <strong className="text-sm text-dash-ink">APIs & Guidelines</strong>
          </div>
          <p className="mt-1 text-xs text-dash-muted">
            Evaluation rubric, API documentation, testing payloads, and technical architecture references.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-dash-muted">
            Rubric: Functionality (40%), Innovation (30%), Code Quality (30%)
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-dash-line-soft">
        <MentorToggle o={o} st={st} sv={sv} />
      </div>
    </Card>
  )
}

/* ---- build/submit ---- */
function BuildSubmit({ o, st, sv }) {
  const sub = bagFor(st, 'submission', o.id, null)
  const team = bagFor(st, 'teams', o.id, null) || 'solo'
  const seed = sub || submissionArtifact(o.id, team, o)
  const scored = !!(st.scores || {})[SELF_KEY(o.id)]

  const [repo, setRepo] = useState(seed.repo || '')
  const [demo, setDemo] = useState(seed.demo || '')
  const [notes, setNotes] = useState(seed.notes || '')
  const [file, setFile] = useState(seed.file || null)
  const [fileErr, setFileErr] = useState('')

  const MAX_FILE_BYTES = 2 * 1024 * 1024
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
    const art = { title: seed.title || (o.name + ' Submission'), repo: repo || seed.repo, demo: demo || seed.demo, notes: notes || seed.notes, file }
    sv({
      submissions: (st.submissions || []).includes(o.id) ? st.submissions : (st.submissions || []).concat(o.id),
      submission: Object.assign({}, st.submission || {}, { [o.id]: art }),
    })
  }

  return (
    <Card title="Submit Project">
      {sub ? (
        <>
          <div className="flex items-center gap-2">
            <Pill ok>Submitted</Pill>
            <span className="text-xs text-dash-muted">Your project artifact has been registered for evaluation.</span>
          </div>
          <div className="mt-3"><Kv k="Artifact" v={sub.title} /></div>
          <Kv k="Repo" v={<a className="text-signal hover:underline" href={sub.repo} target="_blank" rel="noopener noreferrer">{sub.repo}</a>} />
          {sub.demo ? <Kv k="Demo" v={<a className="text-signal hover:underline" href={sub.demo} target="_blank" rel="noopener noreferrer">Watch demo video ↗</a>} /> : null}
          {sub.file ? <Kv k="Attachment" v={<a className="text-signal hover:underline" href={sub.file.dataUrl} download={sub.file.name}>{sub.file.name} ({sub.file.sizeKB} KB)</a>} /> : null}
          <Kv k="Notes" v={sub.notes} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!scored ? <Link className="btn btn-primary rounded-[4px]" to={'/dashboard/evaluate?id=' + o.id}>Open evaluation →</Link> : null}
          </div>
        </>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); doSubmit(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full box-border">
            <Field
              label="Repository URL"
              placeholder="https://github.com/organization/repository"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              required
            />
            <Field
              label="Demo URL (optional)"
              placeholder="https://youtu.be/... or https://demo.app"
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[12px] font-semibold tracking-tight text-dash-ink">
              Notes for evaluators
            </label>
            <textarea
              className="textarea textarea-bordered w-full rounded-[4px] text-sm box-border p-3 border border-dash-line focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal bg-white"
              placeholder="Provide an overview of your architecture, technical decisions, and setup instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[12px] font-semibold tracking-tight text-dash-ink">
              Attach a file (optional) <span className="text-xs font-normal text-dash-muted">— deck, report, design export, up to 2MB</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                className="file-input file-input-bordered file-input-sm h-10 text-sm rounded-[4px] border border-dash-line w-full max-w-sm box-border bg-white"
                onChange={onFile}
              />
              {file ? (
                <div className="flex items-center gap-2 text-xs text-dash-ok bg-dash-ok-soft px-2.5 py-1.5 rounded-[4px]">
                  <span>✓ {file.name}</span>
                  <span className="text-dash-muted">({file.sizeKB} KB)</span>
                  <button type="button" onClick={() => setFile(null)} className="text-dash-muted hover:text-dash-live ml-1 font-bold">×</button>
                </div>
              ) : null}
            </div>
            {fileErr ? <p className="text-xs text-dash-live mt-0.5">{fileErr}</p> : null}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-dash-line-soft">
            <div className="flex items-center gap-3">
              <button type="submit" className="btn btn-primary h-10 px-6 rounded-[4px] font-semibold text-sm">
                Submit project
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs text-dash-muted hover:text-dash-ink rounded-[4px]"
                onClick={() => {
                  const s = submissionArtifact(o.id, team, o)
                  setRepo(s.repo)
                  setDemo(s.demo)
                  setNotes(s.notes)
                }}
              >
                Pre-fill sample data
              </button>
            </div>
            <span className="text-xs font-medium text-dash-muted">
              {deadlineText(o)}
            </span>
          </div>
        </form>
      )}
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
  const from = sp.get('from')
  const o = byId(id)

  const backTarget = from || (o?.purpose ? o.purpose : 'home')
  const BACK_LABELS = {
    home: 'Dashboard',
    learning: 'Learn',
    competing: 'Compete',
    learncompete: 'Build',
    activity: 'My Activity',
    saved: 'Saved',
    recent: 'Recent',
    continuing: 'Dashboard',
    recommended: 'Recommended for you',
  }
  const backLabel = BACK_LABELS[backTarget] || 'Dashboard'
  const handleBack = () => go(backTarget)

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
          <div className="mt-4 flex gap-3">
            <button className="btn btn-primary rounded-[4px]" onClick={() => {
              const cur = S.read()
              const reg = (cur.registered || []).concat(o.id)
              const intents = (cur.intents || []).includes(o.purpose) ? cur.intents : (cur.intents || []).concat(o.purpose)
              if (o.purpose !== 'learning') intents.push('competing')
              sv({ registered: reg, intents: [...new Set(intents)] })
            }}>Register</button>
            <button className="btn btn-ghost rounded-[4px] border border-dash-line-soft" onClick={handleBack}>Back</button>
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
      <ChevronSteps steps={journeyFor(o)} cur={cur} />
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

      {o.purpose === 'learning' ? (
        <div className="mt-4"><LearningWS o={o} st={st} sv={sv} /></div>
      ) : isCompete ? (
        <>
          <div className="mt-4"><TeamStep o={o} st={st} sv={sv} /></div>
          <div className="mt-4"><BuildSubmit o={o} st={st} sv={sv} /></div>
        </>
      ) : (
        /* learncompete: Build Track - fully populated! */
        <>
          <div className="mt-4"><StatementStep o={o} st={st} sv={sv} /></div>
          <BuildWorkspace o={o} st={st} sv={sv} />
          <div className="mt-4"><TeamStep o={o} st={st} sv={sv} /></div>
          <div className="mt-4"><BuildSubmit o={o} st={st} sv={sv} /></div>
        </>
      )}
      {bagFor(st, 'submission', o.id, null) ? (
        <div className="mt-4">
          <Link className="btn btn-primary rounded-[4px]" to={'/dashboard/evaluate?id=' + o.id + (from ? '&from=' + from : '')}>
            Open evaluation
          </Link>
        </div>
      ) : null}
    </>
  )
}