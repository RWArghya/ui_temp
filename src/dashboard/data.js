/* ============================================================
   H2S Dashboard — data & pure logic.
   Port of data.js + journey.js + the app.js helper layer
   (PromptWars, roles, profile/XP, mentor workflow).
   Everything here is a pure function of `st` (the h2s state
   object) so React can drive rendering and all pages agree.
   ============================================================ */

/* ---- deterministic seeded randomness ---- */
export function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function rng(seed) {
  let x = seed || 1
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296 }
}
const pickFrom = (r, arr) => arr[Math.floor(r() * arr.length)]

/* The prototype computes every deadline and PromptWars drop number against the
   real clock (`new Date()`), so a frozen date here made this dashboard disagree
   with app.html on both — "Closes in 4 days" where the prototype says "Closed",
   and drop 17 where the prototype is on 18. Same clock, same answers. */
export const TODAY = new Date()

/* ---- the OPEN innovator purposes ---- */
export const VIEWS = {
  learning:     { label: 'Learn',   hat: 'Learner',    ico: '📚', blurb: 'Bootcamps, workshops, masterclasses' },
  competing:    { label: 'Compete', hat: 'Competitor', ico: '🏆', blurb: 'Join hackathons, build, submit, win' },
  learncompete: { label: 'Build',   hat: 'Builder',    ico: '🛠️', blurb: 'Learn the fundamentals, then compete on a real problem statement' },
}
export const MENTOR_VIEW = { label: 'Mentor', hat: 'Mentor', ico: '🧭', blurb: 'Guide teams, judge submissions', gated: true }
export const ALL_VIEWS = Object.assign({}, VIEWS, { mentor: MENTOR_VIEW })

export const RUBRIC = ['Problem fit', 'Technical execution', 'Innovation', 'Presentation']

/* ---- initiatives ---- */
export const REGIONS = ['India — North', 'India — South', 'India — West', 'India — East',
  'APAC', 'Middle East & Africa', 'Europe', 'Americas']

export const INITIATIVES = [
  { id: 'icc-global', name: 'ICC Global Cricket Hackathon', org: 'International Cricket Council',
    purpose: 'competing', status: 'live', region: 'India — West', mode: 'Hybrid',
    areas: ['AI / GenAI', 'Data Science'], prize: '₹25L', deadline: '2026-08-28', regs: 14820, pop: 98,
    blurb: 'Build the next generation of fan-engagement and match-analytics products for global cricket.' },
  { id: 'ntpc-energy', name: 'NTPC Energy Innovation Challenge', org: 'NTPC Limited',
    purpose: 'learncompete', status: 'upcoming', region: 'India — North', mode: 'Hybrid',
    areas: ['Sustainability', 'Data Science'], prize: '₹10L + pilot', deadline: '2026-09-02', regs: 2140, pop: 74,
    blurb: 'Six live problem statements from India’s largest power utility — winners get a paid pilot.' },
  { id: 'genai-academy', name: 'Gen AI Academy — Cohort 12', org: 'Hack2skill × Google Cloud',
    purpose: 'learning', status: 'live', region: 'India — North', mode: 'Virtual',
    areas: ['AI / GenAI', 'Agentic AI'], prize: 'Free · Certified', deadline: '2026-08-30', regs: 31400, pop: 99,
    blurb: 'Eight-module GenAI track with live sessions, labs and a Google Cloud certification path.' },
  { id: 'electhon', name: 'Electhon 2026', org: 'Ministry of Power',
    purpose: 'competing', status: 'upcoming', region: 'India — West', mode: 'In-person',
    areas: ['Sustainability', 'IoT'], prize: '₹8L', deadline: '2026-09-12', regs: 1890, pop: 58,
    blurb: '36-hour in-person build sprint on grid resilience and smart metering.' },
  { id: 'police-hack', name: 'Police Hackathon 2026', org: 'Ministry of Home Affairs',
    purpose: 'competing', status: 'live', region: 'India — North', mode: 'Hybrid',
    areas: ['Cybersecurity', 'AI / GenAI'], prize: '₹15L', deadline: '2026-09-05', regs: 7240, pop: 82,
    blurb: 'Public-safety technology challenge — forensics, cyber-crime triage and citizen services.' },
  { id: 'dishathon', name: 'Dishathon', org: 'Hack2skill Community',
    purpose: 'competing', status: 'live', region: 'India — South', mode: 'Virtual',
    areas: ['FinTech', 'Product'], prize: '₹3L', deadline: '2026-09-05', regs: 3110, pop: 49,
    blurb: 'Community-run weekend hackathon. Teams of 2–4, any stack, one weekend.' },
  { id: 'isro-bhuvan', name: 'ISRO Bhuvan Geospatial Challenge', org: 'ISRO',
    purpose: 'learncompete', status: 'upcoming', region: 'India — South', mode: 'Hybrid',
    areas: ['Space', 'Data Science'], prize: '₹12L + incubation', deadline: '2026-09-25', regs: 1620, pop: 77,
    blurb: 'Open satellite datasets, real agricultural and disaster-response problem statements.' },
  { id: 'npci-upi', name: 'NPCI UPI Fraud Detection Challenge', org: 'NPCI',
    purpose: 'learncompete', status: 'live', region: 'India — West', mode: 'Virtual',
    areas: ['FinTech', 'Cybersecurity', 'Data Science'], prize: '₹20L', deadline: '2026-09-15', regs: 6050, pop: 88,
    blurb: 'Anonymised transaction data at national scale. Cut false positives without missing fraud.' },
  { id: 'agentic-bootcamp', name: 'Agentic AI Bootcamp', org: 'Hack2skill',
    purpose: 'learning', status: 'live', region: 'APAC', mode: 'Virtual',
    areas: ['Agentic AI', 'AI / GenAI'], prize: 'Free · Certified', deadline: '2026-09-08', regs: 18700, pop: 94,
    blurb: 'Six weeks, hands-on. Build and ship three working agents with mentor review.' },
  { id: 'mena-fintech', name: 'MENA FinTech Innovation Sprint', org: 'Regional banking consortium',
    purpose: 'learncompete', status: 'upcoming', region: 'Middle East & Africa', mode: 'Hybrid',
    areas: ['FinTech', 'Blockchain'], prize: '$25K', deadline: '2026-10-12', regs: 610, pop: 44,
    blurb: 'Cross-border payments and Islamic-finance-compliant lending products.' },
  { id: 'inspire-26', name: 'Inspire Hackathon 2026', org: 'Hack2skill',
    purpose: 'competing', status: 'past', region: 'India — North', mode: 'Virtual',
    areas: ['AI / GenAI'], prize: '₹5L', deadline: '2026-05-18', regs: 12400, pop: 70,
    blurb: 'Flagship community hackathon. Results announced, certificates issued.' },
  { id: 'code-future', name: 'Code for Future', org: 'Hack2skill × EU partners',
    purpose: 'competing', status: 'past', region: 'Europe', mode: 'Hybrid',
    areas: ['Sustainability', 'Web3'], prize: '€15K', deadline: '2026-04-22', regs: 3900, pop: 48,
    blurb: 'Climate-tech build challenge across seven European campuses.' },
  { id: 'vistara-ideathon', name: 'Vistara Aviation Ideathon', org: 'Vistara',
    purpose: 'learncompete', status: 'past', region: 'India — North', mode: 'Virtual',
    areas: ['Product', 'Data Science'], prize: '₹6L', deadline: '2026-03-30', regs: 2050, pop: 41,
    blurb: 'Passenger-experience and ground-ops efficiency ideas. Two ideas went to pilot.' },
  { id: 'lat-am-web3', name: 'LATAM Web3 Builders Challenge', org: 'Hack2skill × regional partners',
    purpose: 'competing', status: 'upcoming', region: 'Americas', mode: 'Virtual',
    areas: ['Web3', 'Blockchain'], prize: '$20K', deadline: '2026-10-20', regs: 780, pop: 46,
    blurb: 'Open-track Web3 hackathon for builders across Latin America.' },
]

export function byId(id) { return INITIATIVES.find(x => x.id === id) }

export function daysLeft(iso) {
  return Math.ceil((new Date(iso) - TODAY) / 86400000)
}
export function deadlineText(o, st) {
  if (o.status === 'past') return 'Ended ' + new Date(o.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const d = daysLeft(o.deadline)
  if (d < 0) return 'Closed'
  if (d === 0) return 'Closes today'
  if (d === 1) return 'Closes tomorrow'
  return `Closes in ${d} days`
}

/* ---- deterministic generators ---- */
const TEAM_NAMES = ['PitchPerfect', 'NightOwls', 'DataDagger', 'StackOverflowers', 'ByteMe', 'KernelPanic',
  'NullPointer', 'TensorTitans', 'EdgeCase', 'RootAccess', 'AsyncAwaits', 'ForkBomb']
const PEOPLE = ['Riya Kapoor', 'Manav Prasad', 'Jaya Deshmukh', 'Kabir Nair', 'Ishita Rao', 'Vikram Shetty',
  'Ananya Bose', 'Rohit Menon', 'Sana Qureshi', 'Dhruv Malhotra']
const WANTED = ['a backend dev', 'a designer', 'an ML engineer', 'a frontend dev', 'anyone keen', 'a pitch lead']

export function openTeams(initiativeId) {
  const r = rng(hashStr(initiativeId))
  const names = [...TEAM_NAMES], people = [...PEOPLE]
  return [0, 1, 2].map(() => {
    const name = names.splice(Math.floor(r() * names.length), 1)[0]
    const size = 2 + Math.floor(r() * 3)
    const members = []
    for (let i = 0; i < size; i++) members.push(people.splice(Math.floor(r() * people.length), 1)[0])
    return { name, members, cap: 5, wants: pickFrom(r, WANTED) }
  })
}

const PS_BANK = {
  'AI / GenAI': [
    ['Grounded answers over messy internal documents', 'Return citations a user can verify, under 2s on a 50GB corpus.'],
    ['Suppressing unsupported claims in summaries', 'Detect and hold back anything the source text does not support.']],
  'Agentic AI': [
    ['Safe tool use under partial failure', 'Recover cleanly when a downstream API times out mid-task.'],
    ['Coherence across long-horizon tasks', 'Keep an agent on-plan across 200+ steps without context blowup.']],
  'Data Science': [
    ['Demand forecasting at district granularity', 'Beat the current baseline by 15% MAPE using open data only.'],
    ['Anomaly detection at transaction scale', 'Cut false positives by 40% without lowering recall.']],
  'Cybersecurity': [
    ['Phishing triage for a 10,000-seat organisation', 'Rank user-reported mail so analysts see the real ones first.'],
    ['Lateral movement from logs alone', 'No endpoint agent available. Detect it from logs only.']],
  'Sustainability': [
    ['Predictive grid load balancing', 'Forecast demand spikes 24h ahead from load and weather history.'],
    ['Scope-3 emissions across an inconsistent supplier tree', 'Attribute emissions where suppliers report differently.']],
  'FinTech': [
    ['Fraud scoring on real-time payment rails', 'Score in under 80ms at 5,000 transactions per second.'],
    ['Credit assessment with thin files', 'Score borrowers with no formal credit history — explainably.']],
  'Space': [
    ['Geospatial crop-health scoring', 'Score field health from open satellite imagery, district level.'],
    ['Earlier conjunction screening', 'Flag likely orbital conjunctions sooner using public TLE data.']],
  'IoT': [['Predictive maintenance on legacy machines', 'Retrofit sensing without touching the existing PLC.']],
  'Cloud': [['Cost attribution in a shared cluster', 'Attribute spend per team across a multi-tenant estate.']],
  'Product': [['Diagnosing onboarding drop-off', 'Find where users abandon setup, and prove the fix works.']],
  'Web3': [['Gasless onboarding for first-time wallets', 'Get a user to their first transaction without them holding gas.']],
  'Blockchain': [['Cross-chain settlement assurance', 'Prove settlement finality across two chains without a trusted relayer.']],
  'AR / VR': [['Occlusion that survives cheap hardware', 'Believable occlusion on mid-range phones at 30fps.']],
  'HealthTech': [['Triage from unstructured intake notes', 'Prioritise cases from free-text notes without losing edge cases.']],
  'Robotics': [['Grasping unseen objects', 'Pick items the model has never been trained on, from clutter.']],
}
export function problemStatements(o) {
  if (o.statements && o.statements.length) return o.statements
  const r = rng(hashStr(o.id + 'ps'))
  const pool = o.areas.flatMap(a => (PS_BANK[a] || []).map(x => [a, ...x]))
  const take = Math.min(pool.length, 3 + Math.floor(r() * 3))
  const out = []
  const left = [...pool]
  for (let i = 0; i < take; i++) {
    const [area, title, desc] = left.splice(Math.floor(r() * left.length), 1)[0]
    out.push({ code: 'PS-' + (100 + hashStr(o.id + title) % 200), area, title, desc })
  }
  return out.sort((a, b) => a.code.localeCompare(b.code))
}

const MODULE_BANK = {
  'AI / GenAI': ['Foundations — models, tokens, prompting', 'Retrieval and grounding', 'Evaluation and guardrails'],
  'Agentic AI': ['Tool use and function calling', 'Planning across long horizons', 'Failure recovery'],
  'Data Science': ['Framing the problem', 'Feature engineering', 'Model validation'],
  'Cloud': ['Provisioning and IaC', 'Observability', 'Cost control'],
  'Cybersecurity': ['Threat modelling', 'Detection engineering', 'Incident response'],
  'FinTech': ['Payment rails', 'Risk and fraud', 'Regulatory basics'],
  'Product': ['Discovery interviews', 'Prioritisation', 'Measuring impact'],
  'Sustainability': ['Carbon accounting', 'Systems thinking', 'Reporting standards'],
}
const MODULE_KIND = ['Video', 'Lab', 'Reading', 'Live session']
export function modules(o) {
  const r = rng(hashStr(o.id + 'mod'))
  const pool = o.areas.flatMap(a => MODULE_BANK[a] || [])
  const base = pool.length ? pool : ['Getting started', 'Core concepts', 'Applied practice']
  const list = [...base, 'Capstone project']
  return list.map((title, i) => ({
    i, title,
    kind: i === list.length - 1 ? 'Project' : MODULE_KIND[Math.floor(r() * MODULE_KIND.length)],
    mins: 15 + Math.floor(r() * 50),
  }))
}

const ART_VERB = ['Realtime', 'Adaptive', 'Federated', 'Explainable', 'Lightweight', 'Offline-first']
const ART_NOUN = ['pipeline', 'scoring engine', 'dashboard', 'agent', 'classifier', 'toolkit']
export function submissionArtifact(key, team, o) {
  const r = rng(hashStr(key + 'art'))
  const slug = team.toLowerCase().replace(/[^a-z0-9]/g, '')
  return {
    title: pickFrom(r, ART_VERB) + ' ' + (o.areas[0] || 'AI') + ' ' + pickFrom(r, ART_NOUN),
    repo: 'https://github.com/' + slug + '/' + o.id,
    demo: r() > 0.35 ? 'https://youtu.be/' + slug.slice(0, 6) + Math.floor(r() * 900 + 100) : '',
    notes: pickFrom(r, [
      'Working end to end on the sample dataset. Latency is the weak point.',
      'Prototype covers the happy path; error handling is stubbed.',
      'We rebuilt the approach twice — the current one is simpler and faster.',
      'Solid model work, presentation is rough. Demo video explains it best.',
    ]),
  }
}

/* ---- journey ---- */
export const JOURNEY = {
  learning:     ['Enrolled', 'Modules', 'Capstone', 'Certificate'],
  competing:    ['Registered', 'Team', 'Build', 'Submit', 'Results'],
  learncompete: ['Enrolled', 'Modules', 'Capstone', 'Registered', 'Statement', 'Build', 'Submit', 'Evaluation'],
}
export function journeyFor(o) {
  const base = JOURNEY[(o || {}).purpose] || ['Registered', 'Work', 'Done']
  if (!mentoringOn(o)) return base
  const i = base.indexOf('Build')
  return i < 0 ? base.concat(['Mentoring']) : base.slice(0, i).concat(['Mentoring'], base.slice(i))
}
const mentorStepIdx = o => journeyFor(o).indexOf('Mentoring')
export const toLogicalStep = (o, i) => { const m = mentorStepIdx(o); return m >= 0 && i > m ? i - 1 : i }
export const toScreenStep = (o, i) => { const m = mentorStepIdx(o); return m >= 0 && i >= m ? i + 1 : i }

/* the areas actually behind a purpose's registered programmes, deduped */
export function openNow(purpose, st) {
  const reg = (st.registered || [])
  return INITIATIVES.filter((o) => o.purpose === purpose && o.status !== 'past' && !reg.includes(o.id))
}

export function bagFor(st, key, id, def) {
  return ((st || {})[key] || {})[id] !== undefined ? ((st || {})[key] || {})[id] : def
}
export function reachedFor(o, st) {
  st = st || {}
  const done = bagFor(st, 'lessons', o.id, []) || []
  const m = modules(o)
  const sub = bagFor(st, 'submission', o.id, null)
  const team = bagFor(st, 'teams', o.id, null)
  const ps = bagFor(st, 'chosenPS', o.id, null)
  const evaluated = !!((st.scores || {})[o.id + '::self'])
  switch (o.purpose) {
    case 'learning':
      return done.length === 0 ? 1 : done.length < m.length ? 1 : !bagFor(st, 'claimed', o.id, false) ? 2 : 3
    case 'competing':
      return !team ? 1 : !sub ? 2 : (o.status === 'past' || evaluated) ? 4 : 3
    case 'learncompete': {
      if (!bagFor(st, 'lcCapstone', o.id, false)) {
        return done.length === 0 ? 1 : done.length < m.length ? 1 : 2
      }
      return 3 + (!ps ? 1 : !sub ? 2 : (o.status === 'past' || evaluated) ? 4 : 3)
    }
  }
  return 1
}
/* Real progress, from the same lesson state the workspace writes — Learn's
   bar and the journey rail beside it must never print two different numbers
   for the same programme. */
export function progressFor(o, st) {
  const done = (bagFor(st, 'lessons', o.id, []) || []).length
  const list = modules(o)
  const total = list.length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, next: list[Math.min(done, total - 1)], finished: done >= total }
}

export function nextStepFor(o, st) {
  st = st || {}
  const steps = journeyFor(o)
  const i = Math.min(toScreenStep(o, reachedFor(o, st)), steps.length - 1)
  const done = (bagFor(st, 'lessons', o.id, []) || []).length
  const total = modules(o).length
  const label = steps[i]
  let hint = ''
  if (label === 'Modules') hint = done + ' of ' + total + ' done'
  else if (label === 'Team') hint = 'no team yet'
  else if (label === 'Capstone') hint = o.purpose === 'learncompete' ? 'unlocks the compete phase' : 'claim your certificate'
  else if (label === 'Statement') hint = 'pick a problem statement'
  else if (label === 'Build') hint = 'nothing submitted yet'
  else if (label === 'Submit') hint = 'nothing submitted yet'
  else if (label === 'Results') hint = 'waiting on results'
  else if (label === 'Evaluation') hint = 'waiting on evaluation'
  else if (label === 'Certificate') hint = 'ready to claim'
  return { step: label, hint, idx: i, total: steps.length }
}

/* ---- PromptWars ---- */
const PW_ANCHOR = new Date('2026-01-07T00:00:00Z')
const PW_THEMES = ['Ship a one-prompt web app', 'Rebuild a landing page from a screenshot',
  'Agentic to-do that books its own calendar', 'Voice-first expense tracker',
  'Turn a CSV into a dashboard', 'Chrome extension in under 50 prompts',
  'Recreate a game from memory', 'Prompt your way to a working API']
const PW_CITIES = ['Bengaluru', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai']
export const PW_CREDITS_PER_DROP = 50
export const PW_STORE = [
  { id: 'stickers', label: 'Sticker pack', cost: 100 },
  { id: 'tee', label: 'Arena tee', cost: 300 },
  { id: 'keycaps', label: 'Mechanical keycaps', cost: 600 },
  { id: 'kit', label: 'Full arena kit', cost: 1000 },
]

export function pwDropIndex(when) {
  const days = Math.floor(((when || TODAY) - PW_ANCHOR) / 86400000)
  return Math.max(0, Math.floor(days / 14))
}
export function pwDrop(i) {
  const start = new Date(PW_ANCHOR.getTime() + i * 14 * 86400000)
  const close = new Date(start.getTime() + 13 * 86400000)
  const no = i + 1
  return { id: 'pw-' + no, no, theme: PW_THEMES[i % PW_THEMES.length],
    city: PW_CITIES[i % PW_CITIES.length], opens: start.toISOString().slice(0, 10),
    closes: close.toISOString().slice(0, 10) }
}
export const pwCurrent = st => pwDrop(pwDropIndex())
export const pwNext = st => pwDrop(pwDropIndex() + 1)
export const daysUntil = iso => Math.ceil((new Date(iso + 'T00:00:00Z') - TODAY) / 86400000)

const PW_STATE = st => (st || {}).pw || {}
export const pwEntries = st => PW_STATE(st).entries || []
export const pwLedger = st => PW_STATE(st).ledger || []
export const pwSubs = st => PW_STATE(st).subs || {}
export const pwSub = (dropId, st) => pwSubs(st)[dropId] || null
export const pwCredits = st => pwLedger(st).reduce((n, e) => n + e.delta, 0)
export function pwStreak(st) {
  const ids = pwEntries(st)
  let n = 0
  for (let i = pwDropIndex(); i >= 0; i--) { if (ids.indexOf(pwDrop(i).id) === -1) break; n++ }
  return n
}
const PW_RUBRIC = ['Idea', 'Completeness', 'Economy']
export function pwScore(dropId, sub) {
  const r = rng(hashStr(dropId + (sub.repo || '') + sub.prompts))
  const idea = 58 + Math.floor(r() * 38)
  const done = (sub.url ? 70 : 55) + Math.floor(r() * 26)
  const econ = Math.max(35, Math.min(97, 104 - Math.round(Number(sub.prompts || 60) * 0.8)))
  const total = Math.round((idea + done + econ) / 3)
  return { idea, done, econ, total }
}
export function pwFeedback(sc, sub) {
  const bits = []
  bits.push(sc.econ >= 75 ? 'Strong scope control for ' + sub.prompts + ' prompts.'
    : 'It took ' + sub.prompts + ' prompts to get here — tightening the first few would lift economy most.')
  bits.push(sub.url ? 'A live URL meant the evaluator could actually use it, which carried completeness.'
    : 'No live URL, so completeness was judged from the repo alone — deploying it is the cheapest points on the board.')
  bits.push(sc.idea >= 80 ? 'The idea reads as yours rather than the brief restated.'
    : 'The idea sits close to the brief; a sharper angle is what separates the top ten.')
  return bits.join(' ')
}
export function pwLeaderboard(dropId, st) {
  st = st || {}
  const r = rng(hashStr(dropId + 'board'))
  const rivals = PEOPLE.map(name => ({ name, credits: 60 + Math.floor(r() * 260), you: false }))
  const mine = pwCredits(st)
  const board = rivals.concat(mine > 0 ? [{ name: st.name || 'You', credits: mine, you: true }] : [])
  board.sort((a, b) => b.credits - a.credits || a.name.localeCompare(b.name))
  return board.map((x, i) => Object.assign({ rank: i + 1 }, x))
}
export function pwRank(st) {
  const row = pwLeaderboard(pwCurrent(st).id, st).find(x => x.you)
  return row ? row.rank : null
}
export function pwBoard(scope, st) {
  st = st || {}
  if (scope === 'drop') return pwLeaderboard(pwCurrent(st).id, st)
  const seedKey = scope === 'alltime' ? 'alltime' : 'city:' + scope
  const r = rng(hashStr(seedKey))
  const pool = scope === 'alltime' ? PEOPLE : PEOPLE.slice(0, 6)
  const rivals = pool.map(name => ({ name, credits: (scope === 'alltime' ? 320 : 180) + Math.floor(r() * 900), you: false }))
  const mine = pwCredits(st)
  const board = rivals.concat(mine > 0 ? [{ name: st.name || 'You', credits: mine, you: true }] : [])
  board.sort((a, b) => b.credits - a.credits || a.name.localeCompare(b.name))
  return board.map((x, i) => Object.assign({ rank: i + 1 }, x))
}

/* ---- mentor / evaluator ---- */
export const MENTOR_STAGES = ['pending', 'info', 'approved', 'rejected']
export function mentorStatus(st) { return (st.mentorApp && st.mentorApp.status) || 'none' }
export function mentorRoleLabel(st) {
  const r = ((st || {}).mentorApp || {}).roles || []
  if (r.length === 2) return 'Mentor & Evaluator'
  if (r[0] === 'evaluator') return 'Evaluator'
  return 'Mentor'
}
export const mentorChallenges = st => (st || {}).mentorChallenges || {}
export const approvedChallenges = st =>
  Object.entries(mentorChallenges(st)).filter(([, v]) => v === 'approved').map(([k]) => k)

export function suggestedChallenges(areas) {
  areas = areas || []
  return INITIATIVES.filter(o => o.status !== 'past' && o.areas.some(a => areas.includes(a)))
}
export const SELF_KEY = id => id + '::self'
export function assignmentsFor(initiativeIds, areas) {
  areas = areas || []
  return (initiativeIds || []).map(byId).filter(Boolean).flatMap(o => {
    const r = rng(hashStr(o.id + 'eval'))
    const n = 1 + Math.floor(r() * 2)
    const via = o.areas.find(a => areas.includes(a)) || o.areas[0]
    return openTeams(o.id).slice(0, n).map(t => ({
      key: o.id + '::' + t.name, id: o.id, team: t.name, due: o.deadline, via,
      brief: o.purpose === 'learncompete' ? 'PS-' + (100 + hashStr(t.name) % 200) + ' · ' + via : via + ' track · round 2',
    }))
  }).sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 8)
}

/* ---- hats / roles ---- */
export function hats(st) {
  st = st || {}
  const out = (st.intents || []).map(k => ({ key: k, label: (VIEWS[k] || {}).hat, primary: k === st.primary }))
  if (mentorStatus(st) === 'approved') out.push({ key: 'mentor', label: mentorRoleLabel(st), accent: true })
  return out
}

/* ---- profile scoring / XP ---- */
export const PROFILE_STEPS = [
  { key: 'name', label: 'Add your name', w: 15 },
  { key: 'headline', label: 'Add a headline', w: 10 },
  { key: 'region', label: 'Set your region', w: 10 },
  { key: 'org', label: 'Add your college or company', w: 10 },
  { key: 'interests', label: 'Pick at least 3 interests', w: 20, test: v => (v || []).length >= 3 },
  { key: 'skills', label: 'Add your skills', w: 15, test: v => (v || []).length >= 1 },
  { key: 'resume', label: 'Upload your resume', w: 10 },
  { key: 'links', label: 'Link GitHub or LinkedIn', w: 10 },
]
export function profileScore(st) {
  st = st || {}
  const prof = st.profile && typeof st.profile === 'object' && !Array.isArray(st.profile) ? st.profile : st
  let done = 0
  const missing = []
  for (const s of PROFILE_STEPS) {
    const v = prof[s.key]
    const ok = s.test ? s.test(v) : !!(v && String(v).trim())
    if (ok) done += s.w; else missing.push(s)
  }
  return { pct: done, missing }
}
export function initials(name) {
  return (name || 'You').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export const XP_WEIGHTS = { registered: 20, submission: 60, certificate: 120, mentorApproved: 150, hat: 40, profile: 40 }
export function xpFor(st, certCount) {
  st = st || {}; certCount = certCount || 0
  const reg = (st.registered || []).length
  const sub = (st.submissions || []).length
  const mentor = mentorStatus(st) === 'approved' ? 1 : 0
  return reg * XP_WEIGHTS.registered + sub * XP_WEIGHTS.submission + certCount * XP_WEIGHTS.certificate
    + mentor * XP_WEIGHTS.mentorApproved + hats(st).length * XP_WEIGHTS.hat + (profileScore(st).pct === 100 ? XP_WEIGHTS.profile : 0)
}
const LEVEL_STEPS = [0, 120, 280, 480, 760, 1100, 1550, 2100, 2800, 3600, 4600]
export function levelFor(xp) {
  let lvl = 1
  for (let i = 0; i < LEVEL_STEPS.length; i++) { if (xp >= LEVEL_STEPS[i]) lvl = i + 1 }
  const floor = LEVEL_STEPS[lvl - 1] !== undefined ? LEVEL_STEPS[lvl - 1] : LEVEL_STEPS[LEVEL_STEPS.length - 1]
  const next = LEVEL_STEPS[lvl] !== undefined ? LEVEL_STEPS[lvl] : (floor + 1000)
  return { level: lvl, floor, next, pct: Math.max(0, Math.min(100, Math.round(((xp - floor) / (next - floor)) * 100))) }
}
export function badgesFor(st, certCount) {
  st = st || {}; certCount = certCount || 0
  const b = []
  if (profileScore(st).pct === 100) b.push({ ico: '⭐', label: 'Profile complete' })
  if ((st.submissions || []).length >= 1) b.push({ ico: '🚀', label: 'First submission' })
  if ((st.registered || []).length >= 3) b.push({ ico: '🧭', label: 'Explorer' })
  if (mentorStatus(st) === 'approved') b.push({ ico: '🎓', label: 'Mentor debut' })
  if (certCount >= 1) b.push({ ico: '🏅', label: 'First certificate' })
  return b
}
export const achievements = st => (st || {}).achievements || []
export const selfCerts = st => (st || {}).selfCerts || []
export const projects = st => (st || {}).projects || []
export const publications = st => (st || {}).publications || []
export const education = st => (st || {}).education || []
export const CREDIT_WEIGHTS = { certificate: 40, submission: 15, achievementShared: 5 }
export function creditsFor(st, certCount) {
  st = st || {}; certCount = certCount || 0
  return certCount * CREDIT_WEIGHTS.certificate + (st.submissions || []).length * CREDIT_WEIGHTS.submission
    + achievements(st).filter(a => a.shared).length * CREDIT_WEIGHTS.achievementShared
}
export const isProfilePublic = st => !!(st || {}).profilePublic

/* ---- landing views ---- */
export function landingViews(st) {
  st = st || {}
  const out = [{ k: 'home', label: 'My Dashboard', ico: '🏠', blurb: "Everything you're doing, in one place" }]
  ;(st.intents || []).forEach(k => VIEWS[k] && out.push({ k, label: VIEWS[k].label, ico: VIEWS[k].ico, blurb: VIEWS[k].blurb }))
  out.push({ k: 'arena', label: 'Arena', ico: '🎮', blurb: 'PromptWars — the vibe coding arena' })
  if (mentorStatus(st) === 'approved') out.push({ k: 'mentor', label: 'Mentor', ico: '🧭', blurb: 'Your queue, teams and challenges' })
  return out
}
export const landingKey = st => {
  st = st || {}
  const keys = landingViews(st).map(v => v.k)
  return keys.includes(st.primary) ? st.primary : 'home'
}

/* ---- Mentor Connect (light port used by journey) ---- */
export function mentoringOn(o) { return !!(o && o.mentoring && (((o.features || {}).mentorConnect) || {}).enabled) }

/* ---- rail step builders ---- */
export function innovatorSteps(st, certCount) {
  const reg = (st.registered || []).length
  const sub = (st.submissions || []).length
  return [
    { label: 'Account created', done: true, xp: 0 },
    { label: 'Profile completed', done: profileScore(st).pct === 100, xp: XP_WEIGHTS.profile, go: 'profile', badge: '⭐ Profile complete' },
    { label: 'Registered for your first initiative', done: reg >= 1, xp: XP_WEIGHTS.registered, href: 'initiatives' },
    { label: 'Made your first submission', done: sub >= 1, xp: XP_WEIGHTS.submission, badge: '🚀 First submission' },
    { label: 'Earned your first certificate', done: certCount >= 1, xp: XP_WEIGHTS.certificate, badge: '🏅 First certificate' },
  ]
}
export function mentorSteps(st) {
  const ms = mentorStatus(st)
  const mapped = approvedChallenges(st).length
  const scored = Object.keys(st.scores || {}).length
  return [
    { label: 'Account created', done: true },
    { label: 'Registered as a mentor', done: ms !== 'none', go: 'mentor' },
    { label: 'Approved by the H2S team', done: ms === 'approved', waiting: ms === 'pending' || ms === 'info' },
    { label: 'Mapped to a challenge', done: mapped >= 1 },
    { label: 'Scored your first submission', done: scored >= 1 },
  ]
}

export function innovatorNext(st) {
  const live = (st.registered || []).map(byId).filter(o => o && o.status !== 'past')
  if (!live.length) return null
  return {
    title: "What's next",
    sub: live.length + ' live initiative' + (live.length === 1 ? '' : 's'),
    rows: live.slice().sort((a, b) => daysLeft(a.deadline) - daysLeft(b.deadline)).slice(0, 3).map(o => {
      const n = nextStepFor(o, st)
      const d = daysLeft(o.deadline)
      return { name: o.name, step: n.step, hint: n.hint, when: d < 0 ? 'closed' : d + 'd', urgent: d >= 0 && d <= 3, href: 'workspace?id=' + o.id }
    }),
  }
}
/* ---- notifications (bell) ---- */
export function notesFor(st, who) {
  return ((st || {}).notes || []).filter(n => n.to === who).slice().reverse()
}
export function unreadFor(st, who) {
  return notesFor(st, who).filter(n => !n.read).length
}

/* ---- saved / recently viewed initiatives (dashboard sidebar utility group) ---- */
export const savedList = st => (st || {}).saved || []
export const isSaved = (id, st) => savedList(st).includes(id)
export function toggleSaved(sv, st, id) {
  const l = savedList(st).slice()
  const i = l.indexOf(id)
  if (i === -1) l.unshift(id); else l.splice(i, 1)
  sv({ saved: l })
  return i === -1
}
export const recentViews = st => (st || {}).recentViews || []
export function logRecentView(sv, st, id) {
  const l = recentViews(st).filter(x => x !== id)
  l.unshift(id)
  sv({ recentViews: l.slice(0, 12) })
}

export function mentorNext(st) {
  const areas = ((st.mentorApp || {}).areas) || []
  const rows = assignmentsFor(approvedChallenges(st), areas).filter(q => !((st.scores || {})[q.key]))
  if (!rows.length) return null
  return {
    title: 'What closes first',
    sub: rows.length + ' waiting on your score',
    rows: rows.slice(0, 3).map(q => {
      const o = byId(q.id) || {}
      const d = daysLeft(q.due)
      return { name: q.team, step: o.name || '', hint: '', when: d < 0 ? 'overdue' : d + 'd', urgent: d < 0 || d <= 3, href: 'mentor?id=' + q.id }
    }),
  }
}
