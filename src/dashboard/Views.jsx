import { useState } from 'react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Card, PageHead, Pill, Empty, InitRow, InitiativeCard, ContinueCard } from './ui'
import {
  INITIATIVES, byId, RUBRIC, daysLeft, deadlineText,
  bagFor, modules, problemStatements, progressFor, openNow,
  nextStepFor, savedList, recentViews,
} from './data'

/* ================= HOME =================
   Matches app.html's homeMain() — a welcome banner, "Continue where you
   left off" (registered + not past) and "Recommended for you" as card
   grids, each with a "View all" that swaps only the main column
   (continuingMain/recommendedMain below), never a separate top-level page. */
function activeList(st) {
  return (st.registered || []).map(byId).filter((o) => o && o.status !== 'past')
}
/* Matched against the areas/region the person gave us; falls back to
   popularity when they've set neither, rather than showing nothing. */
function recommendedList(st) {
  const registeredIds = st.registered || []
  const areas = st.interests || []
  const region = st.region || ''
  let list = INITIATIVES.filter((o) => o.status !== 'past' && !registeredIds.includes(o.id))
  if (areas.length || region) {
    const matched = list.filter((o) => (o.areas || []).some((a) => areas.includes(a)) || o.region === region)
    if (matched.length) list = matched
  }
  return list.slice().sort((a, b) => {
    const liveA = a.status === 'live', liveB = b.status === 'live'
    if (liveA !== liveB) return liveA ? -1 : 1
    return daysLeft(a.deadline) - daysLeft(b.deadline)
  })
}

export function Home({ st, sv, go }) {
  const active = activeList(st)
  const recs = recommendedList(st)

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 rounded-card border border-dash-line bg-gradient-to-br from-signal-soft to-white p-6 shadow-dash">
        <div>
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-signal">Welcome back</div>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold text-dash-ink">{st.name || 'there'} 👋</h1>
          <p className="mt-2 text-sm text-dash-muted">Build your skills, complete initiatives, and grow your career.</p>
        </div>
        <span className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full bg-violet-soft text-brand-violet">
          <Sparkles className="h-8 w-8" />
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-dash-ink">Continue where you left off</h2>
        {active.length ? (
          <button onClick={() => go('continuing')} className="flex items-center gap-1 text-sm font-medium text-signal hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {active.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.slice(0, 3).map((o) => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
        </div>
      ) : (
        <Empty msg="It looks like there's nothing here right now. Start exploring, join an initiative or enrol in a course to get started." cta={{ to: '/initiatives', label: 'Explore initiatives' }} />
      )}

      <div className="mb-3 mt-8 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-dash-ink">Recommended for you</h2>
        {recs.length ? (
          <button onClick={() => go('recommended')} className="flex items-center gap-1 text-sm font-medium text-signal hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {recs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.slice(0, 3).map((o) => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
        </div>
      ) : (
        <Empty msg="Check back soon for personalised recommendations based on your interests." />
      )}
    </>
  )
}

/* "View all" destinations — same cards, same data, full list, main column
   only (sidebar/rail stay mounted). */
export function Continuing({ st, sv, go }) {
  const active = activeList(st)
  return (
    <>
      <button onClick={() => go('home')} className="btn btn-ghost btn-sm mb-3 inline-flex items-center gap-1.5 rounded-btn"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</button>
      <PageHead title="Continue where you left off" sub={`${active.length} initiative${active.length === 1 ? '' : 's'} you're actively working on.`} />
      {active.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((o) => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
        </div>
      ) : <Empty msg="Nothing in progress yet." />}
    </>
  )
}
export function Recommended({ st, sv, go }) {
  const recs = recommendedList(st)
  const basis = (st.interests || []).length || st.region
    ? 'Matched to ' + [...(st.interests || []).slice(0, 3), st.region].filter(Boolean).join(', ')
    : 'Popular right now'
  return (
    <>
      <button onClick={() => go('home')} className="btn btn-ghost btn-sm mb-3 inline-flex items-center gap-1.5 rounded-btn"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</button>
      <PageHead title="Recommended for you" sub={basis + '.'} />
      {recs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((o) => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
        </div>
      ) : <Empty msg="Nothing to recommend yet." />}
    </>
  )
}
export function Saved({ st, sv, go }) {
  const list = savedList(st).map(byId).filter(Boolean)
  return (
    <>
      <PageHead title="Saved initiatives" sub={`${list.length} saved`} />
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((o) => <InitiativeCard key={o.id} o={o} st={st} sv={sv} opts={{ cta: 'View' }} />)}
        </div>
      ) : (
        <Empty msg="Tap the bookmark on any initiative to keep it here." cta={{ to: '/initiatives', label: 'Browse initiatives' }} />
      )}
    </>
  )
}
export function Recent({ st, sv, go }) {
  const list = recentViews(st).map(byId).filter(Boolean)
  return (
    <>
      <PageHead title="Recently viewed" sub={`${list.length} viewed recently`} />
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((o) => <InitiativeCard key={o.id} o={o} st={st} sv={sv} opts={{ cta: 'View' }} />)}
        </div>
      ) : <Empty msg="Initiatives you open will show up here." />}
    </>
  )
}

function ofPurpose(st, k) { return (st.registered || []).map(byId).filter((o) => o && o.purpose === k) }
function SubmitBtn({ o, st, sv }) {
  if (o.status === 'past') return null
  const subs = st.submissions || []
  if (subs.includes(o.id)) return <Pill ok>Submitted</Pill>
  return (
    <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => sv({ submissions: [...subs, o.id] })}>
      Submit project
    </button>
  )
}
function TeamCard({ o, st, go }) {
  const t = (st.teams || {})[o.id]
  if (!t) {
    return (
      <div className="border-b border-dash-line-soft py-3 last:border-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="text-sm text-dash-ink">{o.name}</strong>
            <p className="mt-1.5 text-xs text-dash-muted">Competing solo — most winning entries are teams of 3–4.</p>
          </div>
          <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => go('workspace', o.id)}>Find a team</button>
        </div>
      </div>
    )
  }
  return (
    <div className="border-b border-dash-line-soft py-3 last:border-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <strong className="text-sm text-dash-ink">{t.name}</strong>
        <Pill ok={t.members.length >= 5}>{t.members.length} / 5</Pill>
      </div>
      <p className="mb-2 text-xs text-dash-muted">{o.name}</p>
      <p className="text-sm text-dash-muted">{t.members.map((m) => m.name || m).join(', ')}</p>
    </div>
  )
}

/* ================= COMPETING =================
   Matches app.html's competing() exactly — see app.html lines 748-804. */
export function Competing({ st, sv, go }) {
  const mine = ofPurpose(st, 'competing')
  const live = mine.filter((o) => o.status !== 'past')
  const done = mine.filter((o) => o.status === 'past')
  const subs = st.submissions || []

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">🏆 Compete</h2>
        <p className="text-sm text-dash-muted">Your hackathons — teams, deadlines and submissions.</p>
      </PageHead>

      <Card title="Registered">
        {mine.length
          ? mine.map((o) => <InitRow key={o.id} o={o} primary cta="Open workspace" workspace extra={<SubmitBtn o={o} st={st} sv={sv} />} />)
          : <Empty msg="No hackathons yet. There are live ones open right now." cta={{ to: '/initiatives?purpose=competing', label: 'Find a hackathon' }} />}
      </Card>

      {live.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Your teams">
            {live.map((o) => <TeamCard key={o.id} o={o} st={st} go={go} />)}
          </Card>
          <Card title="Next up">
            {live.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0">
                <span className="min-w-0 flex-1 truncate text-dash-ink">{o.name}</span>
                <span className={daysLeft(o.deadline) <= 7 ? 'font-medium text-dash-warn' : 'text-dash-muted'}>{deadlineText(o)}</span>
              </div>
            ))}
          </Card>
        </div>
      ) : null}

      {live.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Who you're up against">
            <p className="mb-4 text-sm text-dash-muted">Real registration numbers on the initiatives you're in.</p>
            {live.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-dash-ink">{o.name}</span>
                <span className="text-dash-muted">{(o.regs || 0).toLocaleString('en-IN')} registered{(st.teams || {})[o.id] ? '' : " · you're solo"}</span>
              </div>
            ))}
          </Card>
          <Card title="How you'll be judged">
            <p className="mb-4 text-sm text-dash-muted">Every submission is scored by an approved evaluator on these four, 1–5 each, with written feedback.</p>
            {RUBRIC.map((c) => (
              <div key={c} className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0">
                <span className="text-dash-ink">{c}</span>
                <span className="text-xs text-dash-faint">1 – 5</span>
              </div>
            ))}
          </Card>
        </div>
      ) : null}

      {done.length ? (
        <Card title="Results" className="mt-4">
          <p className="mb-4 text-sm text-dash-muted">Closed initiatives you took part in. Certificates issue automatically — nothing to request.</p>
          {done.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-dash-line-soft py-3 last:border-0">
              <div>
                <strong className="text-sm text-dash-ink">{o.name}</strong>
                <p className="mt-1.5 text-xs text-dash-muted">{o.org} · {subs.includes(o.id) ? 'submitted' : 'no submission'}</p>
              </div>
              <Pill ok={subs.includes(o.id)}>{subs.includes(o.id) ? 'Completion certificate' : 'Participation certificate'}</Pill>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm mt-4 rounded-btn" onClick={() => go('certs')}>See your certificates →</button>
        </Card>
      ) : null}

      <Card title="Live and upcoming" className="mt-4">
        {openNow('competing', st).slice(0, 4).map((o) => <InitRow key={o.id} o={o} cta="Register" />)}
        {!openNow('competing', st).length ? <p className="mt-2 text-sm text-dash-faint">You're registered for everything currently open.</p> : null}
      </Card>
    </>
  )
}

/* ================= LEARNING =================
   Matches app.html's learning() exactly — see app.html lines 806-866. */
function ModBar({ o, doneIdx, p }) {
  return (
    <div className="flex h-2 gap-[3px]">
      {modules(o).map((m) => {
        const doneM = doneIdx.includes(m.i)
        const now = !doneM && m.i === p.next.i && !p.finished
        return <span key={m.i} title={`${m.i + 1}. ${m.title} — ${m.kind} · ${m.mins} min`} className={`flex-1 rounded-sm ${doneM ? 'bg-signal' : now ? 'bg-signal/40' : 'bg-dash-line-soft'}`} />
      })}
    </div>
  )
}
function ModuleList({ o, doneIdx, p, go }) {
  return (
    <div className="mt-3 border-t border-dash-line-soft pt-2">
      {modules(o).map((m) => {
        const doneM = doneIdx.includes(m.i)
        const now = !doneM && m.i === p.next.i && !p.finished
        return (
          <button key={m.i} className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-dash-bg-soft" onClick={() => go('workspace', o.id)}>
            <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold ${doneM ? 'bg-status text-white' : now ? 'bg-signal text-white' : 'bg-dash-line-soft text-dash-muted'}`}>
              {doneM ? '✓' : m.i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13.5px] font-medium ${doneM ? 'text-dash-muted' : 'text-dash-ink'}`}>{m.title}</span>
              <span className="text-xs text-dash-faint">{m.kind} · {m.mins} min</span>
            </span>
            {now ? <Pill warn>Up next</Pill> : null}
          </button>
        )
      })}
    </div>
  )
}
export function Learning({ st, sv, go }) {
  const mine = ofPurpose(st, 'learning')
  const areas = [...new Set(mine.flatMap((o) => o.areas))]
  const newAreas = areas.filter((a) => !(st.skills || []).includes(a) && !(st.interests || []).includes(a))
  const [open, setOpen] = useState({})

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">📚 Learn</h2>
        <p className="text-sm text-dash-muted">Bootcamps, workshops and masterclasses you're enrolled in.</p>
      </PageHead>

      <Card title="In progress">
        {mine.length ? mine.map((o) => {
          const p = progressFor(o, st)
          const claimed = bagFor(st, 'claimed', o.id, false)
          const doneIdx = bagFor(st, 'lessons', o.id, []) || []
          const isOpen = !!open[o.id]
          return (
            <div key={o.id} className="border-b border-dash-line-soft py-3.5 last:border-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <strong className="text-dash-ink">{o.name}</strong>
                <span className="text-sm text-dash-muted">{p.done} of {p.total} modules</span>
              </div>
              <ModBar o={o} doneIdx={doneIdx} p={p} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-dash-muted">{o.org} · {deadlineText(o)}</p>
                <div className="flex items-center gap-2">
                  {p.finished ? (
                    claimed
                      ? <Pill ok>Certificate claimed</Pill>
                      : <button className="btn btn-primary btn-sm rounded-btn" onClick={() => go('workspace', o.id)}>Claim your certificate →</button>
                  ) : !p.done ? (
                    <button className="btn btn-primary btn-sm rounded-btn" onClick={() => go('workspace', o.id)}>Start</button>
                  ) : (
                    <button className="rounded-full bg-signal-soft px-3 py-1.5 text-xs font-semibold text-signal-dark hover:bg-signal hover:text-white" onClick={() => go('workspace', o.id)}>
                      Next — {p.next.title} <span className="opacity-70">({p.next.kind} · {p.next.mins} min)</span> →
                    </button>
                  )}
                  <button className="grid h-[30px] w-[30px] place-items-center rounded-md border border-dash-line-soft text-dash-muted hover:border-signal hover:text-signal" onClick={() => setOpen((o2) => ({ ...o2, [o.id]: !o2[o.id] }))} aria-expanded={isOpen} title={isOpen ? 'Hide' : 'Show'}>
                    {isOpen ? '▴' : '▾'}
                  </button>
                </div>
              </div>
              {isOpen ? <ModuleList o={o} doneIdx={doneIdx} p={p} go={go} /> : null}
            </div>
          )
        }) : <Empty msg="Nothing enrolled yet." cta={{ to: '/initiatives?purpose=learning', label: 'Browse bootcamps' }} />}
      </Card>

      {areas.length ? (
        <Card title="What you're picking up" className="mt-4">
          <p className="mb-4 text-sm text-dash-muted">The areas behind the programmes you're enrolled in. Sponsors and evaluators shortlist on what your profile says you can do.</p>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => <Pill key={a} ok={!newAreas.includes(a)}>{a}</Pill>)}
          </div>
          {newAreas.length ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-dash-line-soft pt-3">
              <p className="min-w-[240px] flex-1 text-sm text-dash-muted">{newAreas.length} of these {newAreas.length === 1 ? 'is' : 'are'} not on your profile yet.</p>
              <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => sv({ interests: [...new Set([...(st.interests || []), ...newAreas])] })}>Add to my profile</button>
            </div>
          ) : <p className="mt-3 text-xs text-dash-faint">All of these are already on your profile.</p>}
        </Card>
      ) : null}

      <Card title="Open for enrolment" className="mt-4">
        {openNow('learning', st).slice(0, 4).map((o) => <InitRow key={o.id} o={o} cta="Enrol" />)}
        {!openNow('learning', st).length ? <p className="mt-2 text-sm text-dash-faint">You're enrolled in everything currently open.</p> : null}
      </Card>
    </>
  )
}

/* ================= LEARN + COMPETE (Build) =================
   Matches app.html's learncompete() exactly — see app.html lines 870-921. */
export function LearnCompete({ st, sv, go }) {
  const mine = ofPurpose(st, 'learncompete')
  const gateOpen = (id) => !!(st.lcCapstone || {})[id]
  const pick = mine.find((o) => gateOpen(o.id) && !(st.chosenPS || {})[o.id])
  const pickList = pick ? problemStatements(pick) : []

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">🛠️ Build</h2>
        <p className="text-sm text-dash-muted">Learn the fundamentals, then a real problem statement unlocks — one flagship journey.</p>
      </PageHead>

      <Card title="Your programs">
        {mine.length ? mine.map((o) => {
          const open = gateOpen(o.id)
          const code = (st.chosenPS || {})[o.id]
          const ps = code && problemStatements(o).find((x) => x.code === code)
          const p = progressFor(o, st)
          const meta = !open
            ? `${o.org} · ${p.done} of ${p.total} modules${p.finished ? ' · capstone unlocks the compete phase' : ' · next up ' + p.next.title}`
            : ps ? <>{o.org} · <strong>{ps.code}</strong> — {ps.title}</> : <>{o.org} · <span className="text-dash-warn">no statement chosen yet</span></>
          return (
            <InitRow key={o.id} o={o} primary cta={open ? 'Open workspace' : 'Continue learning'} workspace meta={meta}
              extra={open ? <SubmitBtn o={o} st={st} sv={sv} /> : <Pill warn>Learn phase</Pill>} />
          )
        }) : <Empty msg="You have not joined a Learn and Compete program yet." cta={{ to: '/initiatives?purpose=learncompete', label: 'See open programs' }} />}
      </Card>

      {pick ? (
        <Card title={`Choose a problem statement — ${pick.name}`} className="mt-4">
          <p className="mb-4 text-sm text-dash-muted">{pickList.length} live statements from {pick.org}. Your submission is scored against the one you pick.</p>
          {pickList.map((s) => (
            <div key={s.code} className="flex flex-wrap items-start justify-between gap-4 border-b border-dash-line-soft py-3 last:border-0">
              <div className="min-w-[240px]">
                <div className="mb-1.5 flex items-center gap-2">
                  <strong className="text-sm text-dash-ink">{s.code}</strong>
                  <Pill>{s.area}</Pill>
                </div>
                <p className="text-sm text-dash-ink">{s.title}</p>
                <p className="mt-1.5 text-xs text-dash-muted">{s.desc}</p>
              </div>
              <button className="btn btn-ghost btn-sm rounded-btn border border-dash-line-soft" onClick={() => go('workspace', pick.id)}>Open workspace →</button>
            </div>
          ))}
        </Card>
      ) : null}

      <Card title="Open programs" className="mt-4">
        {openNow('learncompete', st).slice(0, 4).map((o) => <InitRow key={o.id} o={o} cta="Learn more" />)}
        {!openNow('learncompete', st).length ? <p className="mt-2 text-sm text-dash-faint">Nothing new open right now.</p> : null}
      </Card>

      <Card title="How it works" className="mt-4">
        <div className="flex flex-wrap gap-6">
          <div className="min-w-[150px] flex-1">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-dash-muted">1 · Learn</span>
            <p className="mt-1.5 text-sm text-dash-muted">Modules, then a capstone</p>
          </div>
          <div className="min-w-[150px] flex-1">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-dash-muted">2 · Compete</span>
            <p className="mt-1.5 text-sm text-dash-muted">Pick a statement, build, submit</p>
          </div>
          <div className="min-w-[150px] flex-1">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-dash-muted">3 · Evaluate</span>
            <p className="mt-1.5 text-sm text-dash-muted">Mentor-scored against a published rubric</p>
          </div>
        </div>
      </Card>
    </>
  )
}