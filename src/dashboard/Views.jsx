import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Card, PageHead, Pill, Empty, InitiativeCard, ContinueCard } from './ui'
import {
  INITIATIVES, byId, RUBRIC, daysLeft,
  problemStatements, openNow,
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
   Matches app.html's competing() — registered items as ContinueCard grids,
   open/upcoming as InitiativeCard grids (same cards as dashboard). */
export function Competing({ st, sv, go }) {
  const mine = ofPurpose(st, 'competing')
  const live = mine.filter((o) => o.status !== 'past')
  const done = mine.filter((o) => o.status === 'past')
  const subs = st.submissions || []
  const openHackathons = openNow('competing', st)

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">🏆 Compete</h2>
        <p className="text-sm text-dash-muted">Your hackathons — teams, deadlines and submissions.</p>
      </PageHead>

      {/* Registered — ContinueCard grid (same as dashboard "Continue where you left off") */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-dash-ink">Registered</h3>
      </div>
      {mine.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((o) => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
        </div>
      ) : (
        <Empty msg="No hackathons yet. There are live ones open right now." cta={{ to: '/initiatives?purpose=competing', label: 'Find a hackathon' }} />
      )}

      {live.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card title="Your teams">
            {live.map((o) => <TeamCard key={o.id} o={o} st={st} go={go} />)}
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
        <Card title="Results" className="mt-6">
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

      {/* Live & upcoming — InitiativeCard grid (same as dashboard "Recommended for you") */}
      {openHackathons.length ? (
        <>
          <div className="mb-3 mt-8 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-dash-ink">Live &amp; upcoming</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openHackathons.map((o) => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
          </div>
        </>
      ) : mine.length ? (
        <p className="mt-6 text-sm text-dash-faint">You're registered for everything currently open.</p>
      ) : null}
    </>
  )
}

/* ================= LEARNING =================
   Uses ContinueCard grids (same as dashboard) for enrolled bootcamps. */
export function Learning({ st, sv, go }) {
  const mine = ofPurpose(st, 'learning')
  const areas = [...new Set(mine.flatMap((o) => o.areas))]
  const newAreas = areas.filter((a) => !(st.skills || []).includes(a) && !(st.interests || []).includes(a))
  const openBootcamps = openNow('learning', st)

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">📚 Learn</h2>
        <p className="text-sm text-dash-muted">Bootcamps, workshops and masterclasses you're enrolled in.</p>
      </PageHead>

      {/* Enrolled — ContinueCard grid (same as dashboard "Continue where you left off") */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-dash-ink">In progress</h3>
      </div>
      {mine.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((o) => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
        </div>
      ) : (
        <Empty msg="Nothing enrolled yet." cta={{ to: '/initiatives?purpose=learning', label: 'Browse bootcamps' }} />
      )}

      {areas.length ? (
        <Card title="What you're picking up" className="mt-6">
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

      {/* Open for enrolment — InitiativeCard grid (same as dashboard "Recommended for you") */}
      {openBootcamps.length ? (
        <>
          <div className="mb-3 mt-8 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-dash-ink">Open for enrolment</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openBootcamps.map((o) => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
          </div>
        </>
      ) : mine.length ? (
        <p className="mt-6 text-sm text-dash-faint">You're enrolled in everything currently open.</p>
      ) : null}
    </>
  )
}

/* ================= LEARN + COMPETE (Build) =================
   Your programs as ContinueCard grids, open programs as InitiativeCard grids. */
export function LearnCompete({ st, sv, go }) {
  const mine = ofPurpose(st, 'learncompete')
  const gateOpen = (id) => !!(st.lcCapstone || {})[id]
  const pick = mine.find((o) => gateOpen(o.id) && !(st.chosenPS || {})[o.id])
  const pickList = pick ? problemStatements(pick) : []
  const openPrograms = openNow('learncompete', st)

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">🛠️ Build</h2>
        <p className="text-sm text-dash-muted">Learn the fundamentals, then a real problem statement unlocks — one flagship journey.</p>
      </PageHead>

      {/* Enrolled programs — ContinueCard grid */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-dash-ink">Your programs</h3>
      </div>
      {mine.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((o) => {
            const isOpen = gateOpen(o.id)
            const next = nextStepFor(o, st)
            return (
              <InitiativeCard key={o.id} o={o} st={st} sv={sv}
                opts={{ dest: 'workspace', progress: true,
                  cta: isOpen ? 'Open workspace' : 'Continue learning',
                  stepLabel: isOpen ? '🔓 Compete phase unlocked' : (next ? next.step : '') }} />
            )
          })}
        </div>
      ) : (
        <Empty msg="You have not joined a Learn and Compete program yet." cta={{ to: '/initiatives?purpose=learncompete', label: 'See open programs' }} />
      )}

      {pick ? (
        <Card title={`Choose a problem statement — ${pick.name}`} className="mt-6">
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

      {/* Open programs — InitiativeCard grid */}
      {openPrograms.length ? (
        <>
          <div className="mb-3 mt-8 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-dash-ink">Open programs</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openPrograms.map((o) => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
          </div>
        </>
      ) : mine.length ? (
        <p className="mt-6 text-sm text-dash-faint">Nothing new open right now.</p>
      ) : null}

      <Card title="How it works" className="mt-8">
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