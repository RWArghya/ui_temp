/* Shared prototype state. localStorage only — no backend, no build step.
   Lets the intent picked at onboarding actually drive the dashboard. */

/* Deterministic seeded randomness. Lives here because data.js AND programs.js both
   need it, and not every page loads data.js. */
function hashStr(s){
  let h = 2166136261;
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed){
  let x = seed || 1;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
const pickFrom = (r, arr) => arr[Math.floor(r() * arr.length)];

/* The OPEN innovator purposes — the only things somebody can choose for themselves.
   Verb-parallel naming: each one is what you came here to DO. */
const VIEWS = {
  learning:   { label:'Learn',   hat:'Learner',    ico:'BookOpen', blurb:'Bootcamps, workshops, masterclasses' },
  competing:  { label:'Compete', hat:'Competitor', ico:'Trophy',   blurb:'Join hackathons, build, submit, win' },
  learncompete:{ label:'Build',  hat:'Builder',    ico:'Wrench',   blurb:'Learn the fundamentals, then compete on a real problem statement' }
};
/* Product Evangelism, Innovation Challenge and Hiring Challenge are deprecated from
   the design — not just hidden. Build absorbs Innovation Challenge's
   statement → build → submit → evaluation shape, gated behind a learning phase first.
   See workspace.html for the journey and data.js for the seed-data consolidation. */

/* Mentor is deliberately NOT in VIEWS. It isn't an intent an innovator picks at signup —
   anyone can register for it, but an Enabler approves it and maps it per-challenge, so it
   can never sit in the same list as the open purposes without implying you can just take it.
   Same shape as a VIEW so the dashboard renders it identically once it HAS been granted. */
const MENTOR_VIEW = { label:'Mentor', hat:'Mentor', ico:'ClipboardCheck', blurb:'Guide teams, judge submissions', gated:true };

/* Every view the dashboard can render — open purposes plus the gated mentor one.
   Use this (not VIEWS) when you mean "does this key name a real view?". */
const ALL_VIEWS = Object.assign({}, VIEWS, { mentor: MENTOR_VIEW });

/* Some browsers refuse localStorage on file:// URLs. Rather than let the whole app die
   on a double-click, fall back to an in-memory store — state then lasts for the tab
   instead of across reloads, which is degraded but usable. */
let _mem = null;
function _store(){
  if (_mem) return _mem;
  try { localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return localStorage; }
  catch(e){ _mem = { _v:{}, getItem(k){ return this._v[k] ?? null; },
                     setItem(k,v){ this._v[k] = String(v); }, removeItem(k){ delete this._v[k]; } };
            return _mem; }
}
const S = {
  read(){ try { return JSON.parse(_store().getItem('h2s') || '{}'); } catch(e){ return {}; } },
  save(patch){ try { _store().setItem('h2s', JSON.stringify(Object.assign(S.read(), patch))); } catch(e){} },
  reset(){ try { _store().removeItem('h2s'); } catch(e){} },
  /* true when we're running degraded, so a page can warn instead of silently losing data */
  volatile(){ return !!_mem; }
};

/* profile completion — the "guide the user" signal. Weighted, not a checkbox count. */
/* Order matches how a person actually fills this in — the same sequence
   onboarding.html's own form uses (name, headline, org, region), then the
   two chip pickers, then the two "add later" links. Display order for the
   checklist reads through this array, so this list is the one place that
   decides it. */
const PROFILE_STEPS = [
  { key:'name',      label:'Add your name',                w:15 },
  { key:'headline',  label:'Add a headline',               w:10 },
  { key:'org',       label:'Add your college or company',  w:10 },
  { key:'region',    label:'Set your region',              w:10 },
  { key:'interests', label:'Pick at least 3 interests',    w:20, test:v => (v||[]).length >= 3 },
  { key:'skills',    label:'Add your skills',              w:15, test:v => (v||[]).length >= 1 },
  { key:'resume',    label:'Upload your resume',           w:10 },
  { key:'links',     label:'Link GitHub or LinkedIn',      w:10 }
];

function profileScore(st){
  st = st || S.read();
  let done = 0;
  const missing = [];
  for (const s of PROFILE_STEPS){
    const v = st[s.key];
    const ok = s.test ? s.test(v) : !!(v && String(v).trim());
    if (ok) done += s.w; else missing.push(s);
  }
  return { pct: done, missing };
}

function initials(name){
  return (name || 'You').trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase();
}

/* ---- the four people this platform serves ----
   Prototype-only switcher. Real users land in exactly one of these. */
const PERSONAS = [
  { k:'innovator', ico:'GraduationCap', label:'Innovator', href:'app.html',
    sub:'learns and competes' },
  { k:'sponsor',   ico:'Building2', label:'Sponsor',   href:'customer.html',
    sub:'pays, runs challenges' },
  { k:'mentor',    ico:'ClipboardCheck', label:'Mentor',    href:'app.html?view=mentor',
    sub:'guides and evaluates' },
  { k:'enabler',   ico:'LayoutDashboard', label:'Enabler',  href:'enabler.html',
    sub:'H2S success team' }
];
/* personaBar/mountPersonaBar/mountBell/paintBell/toggleBell (v1's DOM painting for
   these) are replaced by shell.js's mountPersonaMenu()/mountBell() — new markup,
   same notify()/notesFor() data underneath. See shell.js. */

/* ---------------------------------------------------------------
   Notifications. Emitted BY the actions that already exist, never
   authored separately — a notification nobody's action produced is
   a fake feed. Every one is addressed to a persona other than the
   one who acted, which is what makes the system feel connected.
   --------------------------------------------------------------- */
function notify(to, o){
  const list = S.read().notes || [];
  const note = Object.assign({
    id: 'n' + Date.now() + Math.floor(Math.random() * 999),
    to, read:false, at:new Date().toISOString()
  }, o);
  /* don't stack the identical thing twice — re-approving shouldn't spam the bell */
  if (list.some(n => n.to === to && n.title === note.title && n.body === note.body && !n.read)) return;
  list.push(note);
  S.save({ notes:list.slice(-40) });
}
const notesFor  = who => (S.read().notes || []).filter(n => n.to === who).reverse();
const unreadFor = who => notesFor(who).filter(n => !n.read).length;
function markRead(who){
  S.save({ notes:(S.read().notes || []).map(n => n.to === who ? Object.assign({}, n, {read:true}) : n) });
}
function timeAgo(iso){
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  return h < 24 ? h + 'h ago' : Math.floor(h / 24) + 'd ago';
}

/* Bell markup lives in shell.js (mountBell/paintBell/toggleBell) — new classes,
   same notesFor()/unreadFor()/markRead() data read above. */

/* ===================================================================
   P4 / P5 / P6 — the gates.

   P2 put a timeline, team rules and a submission spec onto the published
   initiative. Until now nothing read them: registration was open forever,
   any team size locked, and the submit form asked for repo + notes no
   matter what the sponsor required.

   These are the readers. One implementation each, so the initiative page,
   the workspace, the mentor console and the Enabler cannot disagree about
   whether registration is open or a submission is late.
   =================================================================== */
const TODAY = () => new Date().toISOString().slice(0,10);

/* ---- P5: is registration open, and if not, why not ---- */
function regWindow(o){
  const open = o.regOpen || '', close = o.regClose || '', now = TODAY();
  if (!open && !close) return { state:'open', why:'Registration is open.', legacy:true };
  if (open && now < open)
    return { state:'early', why:'Registration opens ' + open + '.', opensIn:days(now, open) };
  if (close && now > close)
    return { state:'closed', why:'Registration closed ' + close + '.', closedFor:days(close, now) };
  return { state:'open', why:close ? 'Registration closes ' + close + '.' : 'Registration is open.',
           closesIn: close ? days(now, close) : null };
}
const days = (a,b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const regOpenNow = o => regWindow(o).state === 'open';

/* ---- P5: may THIS person enter ---- */
function eligibility(o, st){
  st = st || S.read();
  const r = o.rules || null;
  if (!r) return { ok:true, reasons:[] };
  const reasons = [];
  if (r.employeeOnly){
    /* the sponsor's own domain is the check the design promised */
    const dom = String(o.org || '').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,12);
    const mail = String(st.email || '').toLowerCase();
    if (!dom || mail.indexOf(dom) === -1)
      reasons.push('This program is open to ' + o.org + ' employees only, verified by email domain.');
  }
  return { ok:!reasons.length, reasons };
}

/* ---- P5: is this roster allowed to lock ---- */
function teamCheck(o, team){
  const r = o.rules || { teamMin:1, teamMax:99, soloAllowed:true };
  const n = ((team || {}).members || []).length;
  const out = [];
  if (!r.soloAllowed && n < 2) out.push('Solo entries are not allowed here — you need at least one teammate.');
  if (n < (+r.teamMin || 1)) out.push('Teams need at least ' + r.teamMin + ' members. You have ' + n + '.');
  if (n > (+r.teamMax || 99)) out.push('Teams can have at most ' + r.teamMax + '. You have ' + n + '.');
  return { ok:!out.length, problems:out, size:n,
           min:+r.teamMin || 1, max:+r.teamMax || 99, solo:!!r.soloAllowed };
}

/* ---- P6: what a submission must contain, and is it still open ---- */
const SUBMIT_FIELDS = {
  repo:  ['repo',  'Source repository', 'https://github.com/…', 'url'],
  demo:  ['demo',  'Working demo URL',  'https://…',            'url'],
  deck:  ['deck',  'Pitch deck link',   'Link to a deck — Drive, Figma, anywhere we can open', 'url'],
  video: ['video', 'Demo video link',   'YouTube, Loom or Drive', 'url'],
  doc:   ['doc',   'Technical write-up','Link to a doc',        'url']
};
function submitSpec(o){
  const sm = o.submission || null;
  /* seeded initiatives never had a sponsor to specify this — repo + demo is the
     historical shape, kept so the demo data still behaves */
  const keys = sm ? Object.keys(SUBMIT_FIELDS).filter(k => sm[k]) : ['repo','demo'];
  return { keys, fields:keys.map(k => SUBMIT_FIELDS[k]), note:(sm || {}).note || '' };
}
/* ===================================================================
   EVALUATION ENGINES and MENTOR CATEGORIES.

   These live in app.js, not programs.js, because the participant's
   workspace, the public initiative page and the mentor console all need
   them and none of those three loads programs.js. A capability table
   that only the sponsor's pages can see is a capability table that
   disagrees with itself.
   =================================================================== */
/* What each engine tier can actually measure. The tiers are not price
   labels on the same product — they check different things, which is
   the only honest reason to have tiers at all. */
const AI_TIERS = {
  basic: {
    label:'Basic engine', mins:'2–4 min', price:'Included',
    cats:['code','alignment'],
    blurb:'Static analysis and problem-statement alignment. No execution.'
  },
  premium: {
    label:'Premium engine', mins:'12–18 min', price:'Add-on',
    cats:['code','security','performance','alignment'],
    blurb:'Runs the demo. Adds dependency and secret scanning, a latency '
        + 'benchmark, and an originality check across the cohort.'
  }
};
/* An engine category is only real if the sponsor asked for the artefact it
   reads. A deck-only ideathon cannot be scored on code quality, and a number
   invented for it would be worse than no number. */
const AI_CATS = {
  code:        { label:'Code quality',       needs:['repo'],
                 blurb:'Structure, tests, readability, dependency hygiene.' },
  security:    { label:'Security',           needs:['repo'],
                 blurb:'Known-vulnerable dependencies, secrets in source, unsafe defaults.' },
  performance: { label:'Performance',        needs:['repo','demo'],
                 blurb:'Cold start, p95 latency and resource ceiling on a reference box.' },
  alignment:   { label:'Problem alignment',  needs:[],
                 blurb:'Does the build answer the statement it was submitted against.' }
};
/* the categories a tier can score for THIS submission spec */
function aiCatsFor(tier, submission){
  const t = AI_TIERS[tier]; if (!t) return [];
  const sm = submission || {};
  return t.cats.filter(c => (AI_CATS[c].needs || []).every(k => sm[k]));
}
/* the categories a tier wanted but cannot get, and what would unlock them */
function aiCatsMissing(tier, submission){
  const t = AI_TIERS[tier]; if (!t) return [];
  const sm = submission || {};
  return t.cats.filter(c => !(AI_CATS[c].needs || []).every(k => sm[k]))
    .map(c => ({ cat:c, label:AI_CATS[c].label,
                 needs:(AI_CATS[c].needs || []).filter(k => !sm[k]) }));
}

/* Mentor categories. A base taxonomy the sponsor trims — a program that
   offers "one slot from each category" has to know what the categories are
   before a participant can be asked to cover them. */
const MENTOR_CATS = [
  { id:'tech',    name:'Technical',        blurb:'Architecture, code review, debugging, infra.' },
  { id:'product', name:'Product & design', blurb:'Scoping, UX, what to cut, how to demo it.' },
  { id:'biz',     name:'Business & GTM',   blurb:'Who pays, pricing, the go-to-market story.' },
  { id:'domain',  name:'Domain expert',    blurb:'Someone who lives the problem you picked.' }
];
const mentorCatName = id => (MENTOR_CATS.find(c => c.id === id) || {}).name || id;

/* the default eval shape for a round: a human jury, which is what every
   existing seeded round already means */
const ROUND_EVAL = { engine:'none', human:true, aiWeight:0, autoAdvance:0 };
function roundEval(r){
  const e = Object.assign({}, ROUND_EVAL, (r || {}).eval || {});
  /* an engine-only round with no human is legal; a round with neither is not */
  if (e.engine === 'none') { e.human = true; e.aiWeight = 0; }
  if (!e.human && e.engine !== 'none') e.aiWeight = 100;
  return e;
}
function roundEvalLabel(r){
  const e = roundEval(r);
  if (e.engine === 'none') return 'Assigned evaluator';
  const t = AI_TIERS[e.engine] || {};
  return e.human ? t.label + ' + human review' : t.label + ' · automated';
}



/* ===================================================================
   THE AI EVALUATION ENGINE.

   A submission lands and, minutes later, a score exists. That is a
   different product from a human jury, and pretending otherwise is how
   platforms ship dishonest numbers, so three rules shape this:

     1. The engine writes into `scores` like any other evaluator. It is
        not a parallel system — ranked(), roundState() and the shortlist
        gate read it unchanged. An engine is a reviewer that is fast.
     2. It only scores what it can actually read. No repo means no code
        and no security category — those disappear rather than return an
        invented number, and the sponsor is told which ones vanished.
     3. Its score is attributed and reversible. Every engine score says
        which tier produced it, and a human override records who
        disagreed and why. A machine score nobody can challenge is not
        an evaluation, it is a verdict.

   Latency is real in the product (2–4 min basic, 12–18 premium) and
   compressed to seconds here so the state is watchable in a demo.
   =================================================================== */
const AI_PHASES = [
  [0,    'queued',    'Queued — waiting for a runner'],
  [2500, 'fetching',  'Fetching the repository and demo'],
  [6000, 'analysing', 'Static analysis and dependency scan'],
  [10000,'running',   'Executing the demo against the reference box'],
  [14000,'scoring',   'Scoring against the problem statement'],
  [17000,'done',      'Complete']
];
const aiAll   = st => ((st || S.read()).ai || {});
const aiRun   = (st, k) => aiAll(st)[k] || null;
const aiKey   = (entryKey, tier) => entryKey + '::' + tier;
function putAiRun(k, patch){
  const st = S.read(); const all = st.ai || {};
  all[k] = Object.assign({}, all[k] || {}, patch);
  S.save({ ai:all });
}
/* progress is DERIVED from elapsed time, not stepped by a timer — a demo that
   is reloaded mid-run must not lose its place or restart from queued */
function aiPhase(run){
  if (!run) return null;
  if (run.forced) return AI_PHASES[AI_PHASES.length - 1];
  const ms = Date.now() - (run.startedAt || 0);
  let hit = AI_PHASES[0];
  AI_PHASES.forEach(p => { if (ms >= p[0]) hit = p; });
  return hit;
}
const aiDone = run => !!run && aiPhase(run)[1] === 'done';
const aiPct  = run => !run ? 0 : Math.min(100, Math.round((Date.now() - (run.startedAt||0)) / 17000 * 100));

/* queue a run. Idempotent — asking twice does not restart a run in flight. */
function queueAi(entryKey, tier, why){
  const k = aiKey(entryKey, tier);
  if (aiRun(S.read(), k)) return k;
  putAiRun(k, { entry:entryKey, tier, startedAt:Date.now(), why:why || 'entered the round' });
  return k;
}
/* skip the wait — the demo cannot ask somebody to sit for 17 seconds twice */
function forceAi(entryKey, tier){
  const k = aiKey(entryKey, tier);
  if (!aiRun(S.read(), k)) queueAi(entryKey, tier, 'run on demand');
  putAiRun(k, { forced:true });
  return k;
}

const AI_FINDINGS = {
  code: [
    [4.5,'Clear module boundaries, 71% test coverage, no circular imports.'],
    [3.5,'Readable, but the core pipeline is one 400-line function and untested.'],
    [2.5,'No tests, three copies of the same helper, dependencies unpinned.']
  ],
  security: [
    [4.5,'No known-vulnerable dependencies. Secrets read from the environment.'],
    [3.0,'Two dependencies with published advisories. Debug endpoint left open.'],
    [2.0,'An API key is committed in source history. Uploads are not validated.']
  ],
  performance: [
    [4.5,'p95 142ms on the reference module, cold start 0.8s, well inside budget.'],
    [3.2,'p95 610ms — over the stated 8ms claim by two orders of magnitude.'],
    [2.4,'Demo timed out twice under concurrent load; memory grows unbounded.']
  ],
  alignment: [
    [4.7,'Answers the statement directly and states its limits honestly.'],
    [3.4,'Solves a neighbouring problem — the stated constraint is not addressed.'],
    [2.6,'Reads as a generic submission retrofitted to the statement.']
  ]
};
const AI_FLAGS = [
  'Repository is public and reachable.',
  'Demo URL responded on first attempt.',
  'No overlap found with other submissions in this cohort.',
  'Model weights declared, licence compatible.',
  'Commit history starts before the kickoff date — check prior work rules.',
  'Two files match a public template verbatim.'
];

/* the deterministic result. Same entry + same tier = same numbers, forever. */
function aiResult(o, entryKey, tier){
  const cats = aiCatsFor(tier, o.submission);
  const r = rng(hashStr(entryKey + tier + 'engine'));
  const rubric = {}, notes = {};
  cats.forEach(c => {
    const band = AI_FINDINGS[c][Math.floor(r() * AI_FINDINGS[c].length)];
    /* nudge by ±0.3 so two entries in the same band do not tie */
    const v = Math.max(1, Math.min(5, +(band[0] + (r() - 0.5) * 0.6).toFixed(1)));
    rubric[AI_CATS[c].label] = v; notes[AI_CATS[c].label] = band[1];
  });
  const flags = AI_FLAGS.filter(() => r() < 0.34).slice(0,3);
  const conf = tier === 'premium' ? 0.78 + r() * 0.18 : 0.55 + r() * 0.22;
  return { cats, rubric, notes, flags, confidence:+conf.toFixed(2), tier,
           missing: aiCatsMissing(tier, o.submission) };
}
const aiAvg = res => {
  const v = Object.values(res.rubric || {});
  return v.length ? +(v.reduce((a,b) => a + b, 0) / v.length).toFixed(2) : null;
};

/* Commit finished runs into `scores`. Called from render, so a page that is
   open watches the score appear; a page opened later just finds it there. */
function ensureAiScores(o, idx, st){
  st = st || S.read();
  const e = roundEval(roundsFor(o)[idx] || {});
  if (e.engine === 'none') return false;
  let wrote = false;
  roundEntries(o, idx, st).forEach(row => {
    const k = aiKey(row.key, e.engine);
    const run = aiRun(st, k);
    if (!run || !aiDone(run)) return;
    const have = (st.scores || {})[row.key];
    /* There is ONE score slot per entry, shared by every round it survives into.
       So committing has to know which round it is committing for, or simply
       opening round 1 again would re-score with round 1's engine and silently
       destroy the round 2 review that came after it. A score from a later round
       always wins; a score from THIS round is left alone. */
    if (have && typeof have.round === 'number' && have.round > idx) return;
    if (have && have.round === idx && have.aiTier === e.engine) return;
    if (have && !have.ai && have.round === idx) return;   // a human got there first
    const res = aiResult(o, row.key, e.engine);
    putScore(row.key, { rubric:res.rubric, note:'Engine assessment — see the report.',
      conflict:false, ai:true, aiTier:e.engine, aiConf:res.confidence, round:idx,
      reviewed:false, overrode:false, reviewedBy:null, reviewedAt:null, why:'',
      by:AI_TIERS[e.engine].label,
      at:new Date().toISOString().slice(0,10) });
    wrote = true;
  });
  return wrote;
}
/* an engine round auto-queues everything in it, so nobody has to press start */
function autoQueueRound(o, idx, st){
  const e = roundEval(roundsFor(o)[idx] || {});
  if (e.engine === 'none') return;
  roundEntries(o, idx, st || S.read()).forEach(row => queueAi(row.key, e.engine, 'entered round ' + (idx+1)));
}

/* ===================================================================
   MENTOR CONNECT.

   Booking, scoped to one program. The mechanic the sponsor asked for is
   coverage: a participant should get one session from EACH category the
   program offers, so the categories are the unit, not the mentors.

   One principle is load-bearing: a mentor's session notes never reach
   the jury. The moment a note can move a score, mentoring becomes
   surveillance and teams stop being honest in the room.
   =================================================================== */
const mentoringOn = o => !!(o && o.mentoring && (((o.features||{}).mentorConnect)||{}).enabled);
const mentoringOf = o => Object.assign({ cats:[], sessionMins:30, perCat:1,
                                         policy:'encouraged', from:'', to:'' }, (o||{}).mentoring || {});

const M_ROLES = {
  tech:    ['Principal engineer','Staff ML engineer','Head of platform','Embedded systems lead'],
  product: ['Group PM','Design director','Head of product','Principal designer'],
  biz:     ['VP growth','Founder & CEO','Head of partnerships','Investment principal'],
  domain:  ['Chief radiologist','Grid operations lead','Payments risk head','Space systems scientist']
};
/* orgs are paired to the category — a "Chief radiologist at Google" is the kind
   of detail that makes a reader stop trusting everything else on the page */
const M_ORGS = {
  tech:    ['Samsung R&D','Google','Zoho','Flipkart Labs','Bosch India','Freshworks'],
  product: ['Razorpay','Swiggy','Zoho','Atlassian','Postman'],
  biz:     ['Sequoia India','Blume Ventures','Accel','Titan Capital','Nasscom'],
  domain:  ['Apollo Hospitals','Power Grid Corporation','NPCI','ISRO alumni','Ola Electric']
};

/* WHICH SEATS THE LOGGED-IN MENTOR HOLDS.

   A program's mentor roster is generated, but the person using the mentor console
   has to actually BE somebody in it or nothing connects: they publish availability
   nobody can book, and a booking made on the participant side lands on a stranger.
   So picking a category in the mentor console CLAIMS the first seat in it. The
   roster then carries their name, `mine:true`, and their own availability drives
   the slots — one loop, bookable on one side and visible on the other. */
const myMentorCats = (o, st) => (((st || S.read()).mentorCatMap || {})[(o||{}).id]) || [];
function iAmMentorOn(o, st){
  st = st || S.read();
  return typeof mentorChallenges === 'function'
    && mentorChallenges(st)[o.id] === 'approved'
    && (((st.mentorApp || {}).roles) || []).includes('mentor');
}
const mySeatIds = (o, st) => !iAmMentorOn(o, st) ? []
  : myMentorCats(o, st).map(c => c + '-0');
const isMySeat = (o, id, st) => mySeatIds(o, st).indexOf(id) !== -1;

/* The window a mentor personally offers, inside the program's window. Defaults to
   the whole of it — a mentor who has not narrowed anything is available for all of
   it, which is the assumption a participant already makes. */
function mentorAvail(o, st){
  st = st || S.read();
  const cfg = mentoringOf(o);
  const a = ((st.mentorAvail || {})[o.id]) || {};
  return { from: a.from || cfg.from || '', to: a.to || cfg.to || '',
           /* a modest default: three days, two times. Offering every weekday at four
              times is forty hours of office hours nobody signed up for. */
           days: a.days || [1,3,5],
           times: a.times || ['11:30','15:00'],
           note: a.note || '', paused: !!a.paused };
}
function putMentorAvail(o, patch){
  const st = S.read(); const all = st.mentorAvail || {};
  all[o.id] = Object.assign({}, mentorAvail(o, st), all[o.id] || {}, patch);
  S.save({ mentorAvail:all });
}
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SLOT_TIMES = ['09:00','10:00','11:30','14:00','15:00','16:30','18:00','19:30'];

/* two mentors per offered category, deterministic per initiative */
function programMentors(o, st){
  st = st || S.read();
  const cfg = mentoringOf(o);
  const r = rng(hashStr(o.id + 'mentors'));
  const people = (typeof PEOPLE !== 'undefined' ? [...PEOPLE] : ['Riya Kapoor','Kabir Nair'])
    .concat(['Neha Iyer','Arjun Balan','Farah Sheikh','Tanmay Ghosh','Lakshmi Menon','Osei Boateng']);
  const out = [];
  (cfg.cats || []).forEach(cat => {
    for (let i = 0; i < 2; i++){
      const name = people.splice(Math.floor(r() * people.length), 1)[0] || 'Mentor ' + i;
      const seat = cat + '-' + i;
      /* `mine` says this seat's hours and bookings belong to the logged-in mentor.
         It deliberately does NOT rename the seat: in a single-account prototype the
         participant and the mentor are the same person, and showing your own name
         back to you as "your mentor" reads as a bug. The console says which SEAT you
         cover; the roster keeps its persona. */
      const mine = isMySeat(o, seat, st);
      out.push({ id:seat, cat, mine, name,
        role: pickFrom(r, M_ROLES[cat] || M_ROLES.tech),
        org:  pickFrom(r, M_ORGS[cat] || M_ORGS.tech),
        years: 6 + Math.floor(r() * 16),
        /* a second category some mentors genuinely cover — coverage still counts
           the category they were booked under, never both */
        also: r() < 0.3 ? pickFrom(r, (cfg.cats || []).filter(c => c !== cat)) : null,
        bio: 'Has shipped this problem end to end and will tell you what broke.' });
    }
  });
  return out;
}
const mentorById = (o, id, st) => programMentors(o, st).find(m => m.id === id) || null;
const myMentorSeats = (o, st) => programMentors(o, st).filter(m => m.mine);

/* slots inside the program's mentoring window only — never before kickoff,
   never after submissions close */
function mentorSlots(o, m, st){
  st = st || S.read();
  const cfg = mentoringOf(o);
  if (!cfg.from || !cfg.to) return [];
  const out = [];
  const key = (day, t) => o.id + '::' + m.id + '::' + day + 'T' + t;

  /* a seat the logged-in mentor holds runs on THEIR stated availability, not on a
     seeded pattern — otherwise the console lets them set hours that change nothing */
  if (m.mine){
    const av = mentorAvail(o, st);
    if (av.paused) return [];
    const from = new Date(av.from || cfg.from), to = new Date(av.to || cfg.to);
    for (let d = new Date(from); d <= to && out.length < 40; d.setDate(d.getDate() + 1)){
      if (av.days.indexOf(d.getDay()) === -1) continue;
      const day = d.toISOString().slice(0,10);
      av.times.forEach(t => out.push({ key:key(day, t), day, time:t, mins:cfg.sessionMins }));
    }
    return out;
  }
  const r = rng(hashStr(o.id + m.id + 'slots'));
  const from = new Date(cfg.from), to = new Date(cfg.to);
  for (let d = new Date(from); d <= to && out.length < 12; d.setDate(d.getDate() + 1)){
    if (r() < 0.45) continue;                          // not every day
    const day = d.toISOString().slice(0,10);
    ['10:00','11:30','15:00','16:30','18:00']
      .filter(() => r() < 0.5)
      .slice(0,3)
      .forEach(t => out.push({ key:key(day, t), day, time:t, mins:cfg.sessionMins }));
  }
  return out;
}

/* every booking against a seat this person holds, newest last, with the seat resolved */
function mySessions(o, st){
  st = st || S.read();
  const seats = mySeatIds(o, st);
  if (!seats.length) return [];
  const av = mentorAvail(o, st);
  return bookingsFor(o, st)
    .filter(b => seats.indexOf(b.mentor) !== -1)
    .map(b => {
      const when = b.day + 'T' + b.time;
      const inWindow = (!av.from || b.day >= av.from) && (!av.to || b.day <= av.to)
                    && av.days.indexOf(new Date(b.day + 'T00:00:00Z').getUTCDay()) !== -1
                    && av.times.indexOf(b.time) !== -1;
      return Object.assign({}, b, { when, past: b.day < TODAY(),
                                    today: b.day === TODAY(), orphaned: !inWindow });
    });
}

const bookingsAll = st => ((st || S.read()).bookings || {});
function putBooking(k, v){
  const st = S.read(); const all = st.bookings || {};
  if (v === null) delete all[k]; else all[k] = v;
  S.save({ bookings:all });
}
const bookingsFor = (o, st) => Object.entries(bookingsAll(st))
  .filter(([k]) => k.split('::')[0] === o.id)
  .map(([k,v]) => Object.assign({ key:k }, v))
  .sort((a,b) => (a.day + a.time).localeCompare(b.day + b.time));

/* the coverage mechanic: one booking per offered category */
function coverageFor(o, st){
  const cfg = mentoringOf(o);
  const mine = bookingsFor(o, st);
  const cats = (cfg.cats || []).map(id => {
    const got = mine.filter(b => b.cat === id);
    return { id, name:mentorCatName(id), booked:got.length,
             need:+cfg.perCat || 1, met:got.length >= (+cfg.perCat || 1), sessions:got };
  });
  return { cats, met:cats.filter(c => c.met).length, total:cats.length,
           policy:cfg.policy, required:cfg.policy === 'required',
           complete: cats.length > 0 && cats.every(c => c.met) };
}
/* when the sponsor made mentoring a condition of submitting, this is the reason */
function mentoringBlock(o, st){
  if (!mentoringOn(o)) return null;
  const c = coverageFor(o, st);
  if (!c.required || c.complete) return null;
  const short = c.cats.filter(x => !x.met).map(x => x.name);
  return 'Book a mentor session in ' + short.join(', ')
       + ' before you submit — ' + o.org + ' made one session per category a condition.';
}

/* ===================================================================
   OPERATIONS — the corner case the happy path forgets.

   A deadline is a gate, and a gate that cannot be opened by a human is
   an outage waiting to become a support ticket. The platform went down
   for four hours on submission day; forty teams could not hand in. The
   design is not wrong, so we do not edit the design — we record an
   OPERATIONAL OVERRIDE next to it, owned by the Enabler:

     extendTo   move the close date for EVERYONE (blanket relief)
     grants     open a window for NAMED entries only (targeted relief)

   Three rules hold this honest:
     1. It lives with the Enabler, not the sponsor. A sponsor moving
        their own signed deadline breaks the contract; the platform
        operator granting relief for its own incident does not.
     2. A reason is mandatory and permanent. Nothing here is silent.
     3. Late is never hidden. An override changes whether a team CAN
        submit, never whether the jury knows when they did — an entry
        after the DESIGNED deadline still carries late:true, plus the
        reason it was accepted anyway.

   It is deliberately NOT stored in design.timeline, so signoffDrift()
   stays quiet: an incident is not the sponsor changing their mind, and
   nobody should have to re-sign a brief at 11pm to let teams in.
   =================================================================== */
const opsBag = (st, id) => (((st || S.read()).ops || {})[id]) || {};
function putOps(id, patch){
  const st = S.read(); const all = st.ops || {};
  all[id] = Object.assign({}, all[id] || {}, patch);
  S.save({ ops:all });
}
/* the date submissions actually close on — designed, unless moved */
function effectiveClose(o, st){
  const designed = o.deadline || '';
  const to = opsBag(st, o.id).extendTo || '';
  return (to && to > designed) ? to : designed;
}
const isExtended = (o, st) => effectiveClose(o, st) > (o.deadline || '');

/* the grant covering one entry, if there is a live one */
function graceFor(o, key, st){
  const g = (opsBag(st, o.id).grants || {})[key];
  if (!g) return null;
  return Object.assign({}, g, { expired: !!(g.until && g.until < TODAY()) });
}

function submitWindow(o, st){
  const designed = o.deadline || '', close = effectiveClose(o, st), now = TODAY();
  const ext = close > designed ? close : null;
  if (!close) return { state:'open', why:'', extendedTo:null };
  if (now > close) return { state:'closed', extendedTo:ext,
                            why:'Submissions closed ' + close + '.', lateBy:days(close, now) };
  return { state:'open', extendedTo:ext,
           why:'Submissions close ' + close + '.', closesIn:days(now, close) };
}
const submitOpenNow = (o, st) => submitWindow(o, st).state === 'open';

/* THE gate every submit path asks. One answer, and it always says why. */
function submitAllowed(o, key, st){
  st = st || S.read();
  const w = submitWindow(o, st);
  if (w.state === 'open')
    return { ok:true, replace:true, via:w.extendedTo ? 'extension' : 'window', window:w };
  const g = graceFor(o, key, st);
  if (g && !g.expired)
    return { ok:true, replace:!!g.replace, via:'grant', grant:g, window:w,
             why:'An exception is open for you until ' + g.until + '.' };
  return { ok:false, replace:false, via:null, window:w, grant:g,
           why: g && g.expired ? 'Your exception expired on ' + g.until + '.' : w.why };
}
/* why an entry was accepted after the designed deadline — for the jury */
function lateReason(o, key, st){
  const g = (opsBag(st, o.id).grants || {})[key];
  if (g) return 'exception granted';
  if (isExtended(o, st)) return 'window extended to ' + effectiveClose(o, st);
  return 'no override on file';
}

/* Everyone who could hand something in: the seeded teams plus you.
   The console needs the teams that did NOT submit — those are exactly
   the ones an exception is for, and entriesFor() only knows submitters. */
function intakeRoster(o, st){
  st = st || S.read();
  const subs = entriesFor(o, st);
  const seen = new Set(subs.map(e => e.key));
  const rows = subs.map(e => Object.assign({}, e, { submitted:true }));
  if (typeof openTeams === 'function'){
    openTeams(o.id).forEach(t => {
      const key = o.id + '::' + t.name;
      if (!seen.has(key)) rows.push({ key, team:t.name, submitted:false, self:false, brief:'' });
    });
  }
  if (typeof SELF_KEY === 'function' && !seen.has(SELF_KEY(o.id))){
    const t = (st.teams || {})[o.id];
    rows.push({ key:SELF_KEY(o.id), team:t ? t.name : (st.name || 'You') + ' (solo)',
                submitted:false, self:true, brief:'' });
  }
  return rows.map(r => Object.assign(r, { grant:graceFor(o, r.key, st) }));
}

/* ===================================================================
   P7–P12 — from a locked submission to a closed program.

   The whole tail of the lifecycle, and it is mostly DERIVED:

     P7  submissions lock at the deadline; late ones are marked, not hidden
     P8  every round scores what the previous round shortlisted
     P9  the last round is demo day — slots, not just scores
     P10 winners are declared from the final shortlist, then published
     P11 each program TYPE converts differently — a pilot, an owner, an offer
     P12 close-out: prizes paid, certificates issued, case study, archive

   Only four things are stored: the shortlist per round, the declared
   winners, the demo-day slots and the close-out ticks. Everything else
   (who is in a round, whether a round is complete, whether the program
   can close) is computed, so it cannot go stale.
   =================================================================== */

/* one bag per initiative */
const judgeBag = (st, id) => (((st || S.read()).judging || {})[id]) || {};
function putJudge(id, patch){
  const st = S.read(); const all = st.judging || {};
  all[id] = Object.assign({}, all[id] || {}, patch);
  S.save({ judging:all });
}

/* Every entry in this initiative: the logged-in innovator's real submission
   plus the seeded ones, in one shape so a round can be scored uniformly. */
function entriesFor(o, st){
  st = st || S.read();
  const rows = (typeof assignmentsFor === 'function' ? assignmentsFor([o.id]) : [])
    .map(q => ({ key:q.key, team:q.team, brief:q.brief, self:false, at:null }));
  const own = ((st.submission || {})[o.id]) || null;
  if (own){
    const t = (st.teams || {})[o.id];
    rows.unshift({ key:SELF_KEY(o.id), team:t ? t.name : (st.name || 'You') + ' (solo)',
                   brief:own.title || 'Submitted on the platform', self:true, at:own.at,
                   /* P7: a submission after the deadline is recorded as late rather
                      than silently accepted or silently dropped. Late is measured
                      against the DESIGNED deadline even when an override let it in,
                      and carries the reason it was accepted — so an operational
                      decision is visible to the jury instead of erasing the fact. */
                   late: !!(o.deadline && own.at && own.at > o.deadline),
                   lateVia: (o.deadline && own.at && own.at > o.deadline)
                     ? lateReason(o, SELF_KEY(o.id), st) : null });
  }
  return rows.map(r => Object.assign(r, { score:scoreFor(r.key) }));
}

/* the rounds the sponsor designed, or one implicit round for seeded initiatives */
function roundsFor(o){
  const rs = (o.rounds && o.rounds.length) ? o.rounds : [{ name:'Jury evaluation', jury:2,
    criteria:RUBRIC.map((r,i) => ({ label:r, weight:i === 0 ? 40 : i === 1 ? 30 : i === 2 ? 20 : 10 })) }];
  return rs.map((r,i) => Object.assign({}, r, { idx:i, final:i === rs.length - 1 }));
}

/* Who is IN round n: everyone for round 0, the previous round's shortlist after. */
function roundEntries(o, idx, st){
  const all = entriesFor(o, st);
  if (idx === 0) return all;
  const prev = (judgeBag(st, o.id).shortlist || {})[idx - 1] || [];
  return all.filter(e => prev.includes(e.key));
}

/* A round is complete when everything in it has a score. That is what closes
   the Enabler's "Evaluation complete" gate — no separate flag to forget. */
function roundState(o, idx, st){
  const rows = roundEntries(o, idx, st);
  const ev   = roundEval(roundsFor(o)[idx] || {});
  /* An engine score is a score. But on a round the sponsor designed as
     "engine screens, human decides", an unreviewed engine score is NOT the
     round being done — otherwise the shortlist gate opens on a machine's
     say-so and the human review the sponsor paid for never happens. */
  const needsReview = ev.engine !== 'none' && ev.human;
  const ok = e => e.score && !e.score.conflict
                  && (!needsReview || !e.score.ai || e.score.reviewed);
  const scored = rows.filter(ok).length;
  const short  = (judgeBag(st, o.id).shortlist || {})[idx] || [];
  const engined = ev.engine === 'none' ? 0
    : rows.filter(e => aiDone(aiRun(st, aiKey(e.key, ev.engine)))).length;
  return { rows, scored, total:rows.length, ev, engined, needsReview,
           complete: rows.length > 0 && scored === rows.length,
           shortlist: short, advanced: short.length > 0 };
}
const roundAvg = e => e.score && !e.score.conflict ? +scoreAvg(e.score) : null;

/* ranked by average, for shortlisting and for the leaderboard */
function ranked(o, idx, st){
  return roundEntries(o, idx, st)
    .map(e => Object.assign({}, e, { avg:roundAvg(e) }))
    .sort((a,b) => (b.avg === null ? -1 : b.avg) - (a.avg === null ? -1 : a.avg));
}

/* P10 — winners are stored, because a jury decides them; placement is not
   simply "top of the list" and pretending otherwise would be a lie. */
const winnersOf = (st, id) => judgeBag(st, id).winners || [];
const resultsPublished = (st, id) => !!judgeBag(st, id).publishedAt;

/* P11 — each program type converts into something different. This is the
   fifth beat every type's own stages[] already named, and nothing implemented. */
const CONVERSION = {
  innovation:  { label:'Pilot conversations', states:['Shortlisted','In diligence','Pilot agreed','Declined'],
                 verb:'Move to pilot' },
  internal:    { label:'Idea owners',        states:['Shortlisted','Owner assigned','In roadmap','Declined'],
                 verb:'Assign an owner' },
  evangelism:  { label:'Integrations',       states:['Shortlisted','Building','Shipped','Declined'],
                 verb:'Track integration' },
  startup:     { label:'Term sheets',        states:['Shortlisted','In diligence','Term sheet','Declined'],
                 verb:'Open diligence' },
  recruitment: { label:'Candidates',         states:['Shortlisted','Interviewing','Offer made','Declined'],
                 verb:'Move to interview' },
  student:     { label:'Internship offers',  states:['Shortlisted','Interviewing','Offer made','Declined'],
                 verb:'Move to interview' }
};
const conversionFor = pid => CONVERSION[typeof baseType === 'function' ? baseType(pid) : pid]
  || { label:'Outcomes', states:['Shortlisted','In progress','Converted','Declined'], verb:'Progress' };
const convStates = (st, id) => judgeBag(st, id).conversion || {};

/* P12 — close-out. Derived where it can be, ticked where a human must confirm. */
function closeout(o, st){
  st = st || S.read();
  const bag = judgeBag(st, o.id);
  const rs = roundsFor(o);
  const finalIdx = rs.length - 1;
  const done = bag.closeout || {};
  const items = [
    ['All rounds scored', roundState(o, finalIdx, st).complete, 'derived'],
    ['Winners declared',  winnersOf(st, o.id).length > 0,        'derived'],
    ['Results published', resultsPublished(st, o.id),            'derived'],
    ['Prizes disbursed',  !!done.prizes,     'tick'],
    ['Certificates issued', !!done.certs,    'tick'],
    ['Case study written',  !!done.caseStudy,'tick'],
    ['Outcomes recorded',   Object.keys(convStates(st, o.id)).length > 0, 'derived']
  ];
  return { items, ready:items.every(x => x[1]), archived:!!bag.archivedAt };
}

/* Rubric scores live in one place so the mentor who writes them and the innovator
   who reads them can never disagree. Keyed "<initiativeId>::<team>". */
const RUBRIC = ['Problem fit','Technical execution','Innovation','Presentation'];
const allScores = () => S.read().scores || {};
const scoreFor  = key => allScores()[key] || null;
/* merges, so a review can patch {reviewed:true} onto an engine score without
   having to re-send the rubric it is reviewing */
function putScore(key, obj){
  const m = allScores(); m[key] = Object.assign({}, m[key] || {}, obj); S.save({ scores:m });
}
/* divide by the criteria THIS score actually has, not by the length of the
   default rubric — a two-category engine round was scoring out of 4 and
   halving everybody */
const scoreAvg = s => s && s.rubric && Object.keys(s.rubric).length
  ? (Object.values(s.rubric).reduce((a,b) => a + b, 0) / Object.keys(s.rubric).length).toFixed(1) : null;

/* mentor's per-challenge mapping: requested by the mentor, approved by an Enabler */
const mentorChallenges = st => (st || S.read()).mentorChallenges || {};
const approvedChallenges = st =>
  Object.entries(mentorChallenges(st)).filter(([,v]) => v === 'approved').map(([k]) => k);

/* ---- mentor / evaluator application ----
   One accessor so the dashboard, the sidebar lock and the admin queue can never disagree. */
const MENTOR_STAGES = ['pending','info','approved','rejected'];
function mentorStatus(st){
  st = st || S.read();
  return (st.mentorApp && st.mentorApp.status) || 'none';
}
function mentorRoleLabel(st){
  const r = ((st || S.read()).mentorApp || {}).roles || [];
  if (r.length === 2) return 'Mentor & Evaluator';
  if (r[0] === 'evaluator') return 'Evaluator';
  return 'Mentor';
}

/* hats accumulate from engagement/approval — never from mere eligibility (spec B2.4) */
function hats(st){
  st = st || S.read();
  const out = (st.intents || []).map(k => ({
    key:k, label:VIEWS[k].hat, primary: k === st.primary
  }));
  if (mentorStatus(st) === 'approved') out.push({ key:'mentor', label:mentorRoleLabel(st), accent:true });
  /* NO sponsor hat. It used to appear the moment `sponsorTicket` existed — i.e. the moment
     somebody submitted an enquiry FORM — which put a granted-role badge next to a "Become a
     Sponsor" button in the same header, each contradicting the other. Compare the mentor line
     above: that one waits for an actual approval. And a sponsor isn't a hat a person wears
     anyway; it's an organisation account with its own workspace. The enquiry is still shown,
     as a status line on the profile, which is what an enquiry is. */
  return out;
}

/* ---- one face for the account ----------------------------------------------------
   A photo, if the person uploaded one (stored as a downscaled data URL — see setAvatar in
   app.html), otherwise their initials. Everything that shows "who you are" goes through
   these two, so the header, the sidebar block and the profile page can't end up disagreeing
   about whether there's a picture. */
function avatarInto(el, st){
  if (!el) return;
  st = st || S.read();
  if (st.avatar){ el.classList.add('has-img'); el.innerHTML = `<img src="${st.avatar}" alt="">`; }
  else { el.classList.remove('has-img'); el.textContent = initials(st.name); }
}
function avatarHTML(st, cls){
  st = st || S.read();
  cls = cls || '';
  return st.avatar
    ? `<span class="avatar ${cls} has-img"><img src="${st.avatar}" alt=""></span>`
    : `<span class="avatar ${cls}">${initials(st.name)}</span>`;
}

/* The public pages' header, in its two states. Signed OUT it sells: log in, join, sponsor.
   Signed IN it stops selling — "Become a Sponsor" is a role you take on from Profile → Roles,
   and "My Dashboard" is a button back to a place whose own sidebar already has that row, so
   both are noise over somebody who is already a member. What's left is their face, which is
   the one thing the header should say to a signed-in person. */
function authAreaHTML(st){
  st = st || S.read();
  return st.onboarded
    ? `<a href="app.html" title="Your dashboard" class="hdr-me">${avatarHTML(st)}</a>`
    : `<a class="btn btn-quiet btn-sm" href="auth.html?mode=login">Log in</a>
       <a class="btn btn-primary btn-sm" href="auth.html?mode=signup">Join free</a>
       <a class="btn btn-outline btn-sm" href="sponsor.html">Become a Sponsor</a>`;
}

/* Where you land after logging in. 'home' means the dashboard that shows everything;
   anything else is a view key. Read through here so the login picker, the profile control
   and app.html's router all agree on what counts as a valid landing. */
function landingViews(st){
  st = st || S.read();
  const out = [{ k:'home', label:'My Dashboard', ico:'Home', blurb:'Everything you\'re doing, in one place' }];
  (st.intents || []).forEach(k => VIEWS[k] &&
    out.push({ k, label:VIEWS[k].label, ico:VIEWS[k].ico, blurb:VIEWS[k].blurb }));
  out.push({ k:'arena', label:'Arena', ico:'Gamepad2', blurb:'PromptWars — the vibe coding arena' });
  if (mentorStatus(st) === 'approved')
    out.push({ k:'mentor', label:'Mentor', ico:'ClipboardCheck', blurb:'Your queue, teams and challenges' });
  return out;
}
const landingKey = st => {
  st = st || S.read();
  const keys = landingViews(st).map(v => v.k);
  return keys.includes(st.primary) ? st.primary : 'home';
};

const pillsFor = list => list.map(h =>
  `<span class="pill pill-hat${h.primary ? ' primary-hat' : ''}${h.accent ? ' accent' : ''}">${h.label}</span>`
).join('');

/* Full set — for the profile page, where someone has actually come to see their roles. */
function hatsHTML(st){ return pillsFor(hats(st)); }

/* Header set — only hats somebody GRANTED you (Mentor, Sponsor). The open views
   every user already has are restated by the sidebar, so a pill for them is noise.
   Most users see nothing here, which is the point. */
function earnedHatsHTML(st){ return pillsFor(hats(st).filter(h => h.accent)); }

/* ---------------------------------------------------------------
   Profile v2 — XP, Level, badges, self-added achievements.
   XP/Level/badges are DERIVED, same discipline as hats() — no separate
   counter that can drift from what actually happened. certCount is
   passed in by the caller because "how many past initiatives" needs
   the initiative dataset (data.js), which not every page loads —
   keeping that dependency out of this file on purpose (see hats()
   above, and profileScore(), for the same pattern already in use).
   Weights are placeholders — the v2 handover explicitly defers real
   weighting to a later pass; this pass is the UX representation.
   --------------------------------------------------------------- */
const XP_WEIGHTS = { registered:20, submission:60, certificate:120, mentorApproved:150, hat:40,
                     profile:40 };
/* XP and badges are an INNOVATOR concept only. The mentor and sponsor rails show the same
   checklist without points: a mentor's path is mostly things H2S does to them (approve, map),
   and a sponsor is a buyer, not a player — scoring either would be noise at best.
   `mentorApproved` stays because it predates this and reflects the profile truth that one
   account accumulates roles; it shows on the profile, never as a mentor-view scoreboard.
   The innovator rail (journey.js) scores its steps from these same weights, so a step's
   "+40 XP" chip and the XP total on the profile can never disagree. Add a weight here and
   the step that awards it picks it up automatically — never hardcode a number in a step. */
function xpFor(st, certCount){
  st = st || S.read(); certCount = certCount || 0;
  const reg = (st.registered || []).length;
  const sub = (st.submissions || []).length;
  const mentor = mentorStatus(st) === 'approved' ? 1 : 0;
  return reg * XP_WEIGHTS.registered + sub * XP_WEIGHTS.submission
       + certCount * XP_WEIGHTS.certificate + mentor * XP_WEIGHTS.mentorApproved
       + hats(st).length * XP_WEIGHTS.hat
       + (profileScore(st).pct === 100 ? XP_WEIGHTS.profile : 0);
}
const LEVEL_STEPS = [0,120,280,480,760,1100,1550,2100,2800,3600,4600];
function levelFor(xp){
  let lvl = 1;
  for (let i = 0; i < LEVEL_STEPS.length; i++){ if (xp >= LEVEL_STEPS[i]) lvl = i + 1; }
  const floor = LEVEL_STEPS[lvl - 1] !== undefined ? LEVEL_STEPS[lvl - 1] : LEVEL_STEPS[LEVEL_STEPS.length - 1];
  const next  = LEVEL_STEPS[lvl]     !== undefined ? LEVEL_STEPS[lvl]     : (floor + 1000);
  return { level:lvl, floor:floor, next:next,
           pct: Math.max(0, Math.min(100, Math.round(((xp - floor) / (next - floor)) * 100))) };
}
function badgesFor(st, certCount){
  st = st || S.read(); certCount = certCount || 0;
  const b = [];
  if (profileScore(st).pct === 100)       b.push({ ico:'⭐', label:'Profile complete' });
  if ((st.submissions || []).length >= 1) b.push({ ico:'🚀', label:'First submission' });
  if ((st.registered  || []).length >= 3) b.push({ ico:'🧭', label:'Explorer' });
  if (mentorStatus(st) === 'approved')    b.push({ ico:'🎓', label:'Mentor debut' });
  if (certCount >= 1)                     b.push({ ico:'🏅', label:'First certificate' });
  return b;
}

/* Self-added achievements — the ONLY editable list in this group. Kept structurally
   and visually separate from H2S-issued certificates (see certs view / profile Certificates
   tab) so an unverified claim can never be mistaken for a platform-issued one.
   `shared` defaults false — opt-in per entry onto the shareable profile link. */
const achievements = st => (st || S.read()).achievements || [];
function addAchievement(title){
  if (!title || !title.trim()) return;
  const list = achievements();
  list.push({ id:'a' + Date.now(), title:title.trim(), shared:false });
  S.save({ achievements:list });
}
function toggleAchievementShare(id){
  S.save({ achievements: achievements().map(a =>
    a.id === id ? Object.assign({}, a, { shared: !a.shared }) : a) });
}
function removeAchievement(id){
  S.save({ achievements: achievements().filter(a => a.id !== id) });
}

/* Other certificates added by participants — a SEPARATE list from achievements, and a
   separate list from H2S Verified Certificates. Three different trust levels, three
   different buckets: verified (derived, read-only), participant-added certificates
   (self-typed, but specifically a certificate claim), and achievements (awards, not
   certificates). Never merge these — that's the whole point of keeping them apart. */
const selfCerts = st => (st || S.read()).selfCerts || [];
function addSelfCert(title, org){
  if (!title || !title.trim()) return;
  const list = selfCerts();
  list.push({ id:'sc' + Date.now(), title:title.trim(), org:(org || '').trim() || 'Self-reported', shared:false });
  S.save({ selfCerts:list });
}
function toggleSelfCertShare(id){
  S.save({ selfCerts: selfCerts().map(c =>
    c.id === id ? Object.assign({}, c, { shared: !c.shared }) : c) });
}
function removeSelfCert(id){
  S.save({ selfCerts: selfCerts().filter(c => c.id !== id) });
}

/* Projects, Publications, Education — same self-added pattern as achievements/selfCerts:
   a plain list, opt-in "shared" flag, nothing derived, nothing verified. Grouped together
   under the Projects tab (Projects + Publications + Achievements) per the reorganized
   layout; Education stays its own tab. */
const projects = st => (st || S.read()).projects || [];
function addProject(title, link){
  if (!title || !title.trim()) return;
  const list = projects();
  list.push({ id:'p' + Date.now(), title:title.trim(), link:(link || '').trim(), shared:false });
  S.save({ projects:list });
}
function toggleProjectShare(id){
  S.save({ projects: projects().map(p => p.id === id ? Object.assign({}, p, { shared: !p.shared }) : p) });
}
function removeProject(id){ S.save({ projects: projects().filter(p => p.id !== id) }); }

const publications = st => (st || S.read()).publications || [];
function addPublication(title, link){
  if (!title || !title.trim()) return;
  const list = publications();
  list.push({ id:'pub' + Date.now(), title:title.trim(), link:(link || '').trim(), shared:false });
  S.save({ publications:list });
}
function togglePublicationShare(id){
  S.save({ publications: publications().map(p => p.id === id ? Object.assign({}, p, { shared: !p.shared }) : p) });
}
function removePublication(id){ S.save({ publications: publications().filter(p => p.id !== id) }); }

const education = st => (st || S.read()).education || [];
function addEducation(title, org){
  if (!title || !title.trim()) return;
  const list = education();
  list.push({ id:'ed' + Date.now(), title:title.trim(), org:(org || '').trim() });
  S.save({ education:list });
}
function removeEducation(id){ S.save({ education: education().filter(e => e.id !== id) }); }

/* Credit points — a separate currency from XP, on purpose. XP/Level is a progress
   measure; credits are a flat, cumulative count. Deliberately not wired to any
   redemption flow — what credits can be spent on isn't defined anywhere yet, so this
   stays an honest "here's your balance" rather than a fake "Redeem" button. */
const CREDIT_WEIGHTS = { certificate:40, submission:15, achievementShared:5 };
function creditsFor(st, certCount){
  st = st || S.read(); certCount = certCount || 0;
  const sub = (st.submissions || []).length;
  const sharedAch = achievements(st).filter(a => a.shared).length;
  return certCount * CREDIT_WEIGHTS.certificate + sub * CREDIT_WEIGHTS.submission
       + sharedAch * CREDIT_WEIGHTS.achievementShared;
}

/* ---- profile privacy ---- */
/* Private by default. The share link never fully dies either way — Private just
   means a visitor sees the banner, avatar and name and nothing else, same as a
   locked social profile. Public reveals everything except email/phone, which stay
   hidden in the public view regardless of this flag. */
const isProfilePublic = st => !!(st || S.read()).profilePublic;
function toggleProfilePublic(){ S.save({ profilePublic: !isProfilePublic() }); }

/* ---- AI Evaluation ----
   Standalone, decoupled from every initiative — no initiativeId anywhere here on
   purpose (see evaluate.html). Deterministic like everything else generated in this
   app: seeded off whatever the person pasted in, via the same hashStr/rng already
   used for teams, problem statements and roles — not a second random source. */
const CODE_CRITERIA = ['Code quality','Structure','Documentation','Completeness'];
const PROTO_CRITERIA = ['Usability','Functionality','Design polish','Performance'];
function scoreCriteria(seed, criteria){
  return criteria.map((c,i) => [c, hashStr(seed + c) % ((i + 2) * 83) % 100]);
}
function buildAiReport(evalMode, repo, proto){
  const code = evalMode !== 'proto' ? scoreCriteria(repo || 'repo', CODE_CRITERIA) : null;
  const protoScores = evalMode !== 'code' ? scoreCriteria(proto || 'proto', PROTO_CRITERIA) : null;
  const all = [...(code || []), ...(protoScores || [])];
  const overall = Math.round(all.reduce((a,[,v]) => a + v, 0) / all.length);
  return { id:'ai' + Date.now(), evalMode, repo, proto, code, protoScores, overall, at:new Date().toISOString().slice(0,10) };
}
const aiEvaluations = st => (st || S.read()).aiEvals || [];
function addAiEvaluation(report){
  const list = aiEvaluations(); list.unshift(report);
  S.save({ aiEvals:list.slice(0,20) });
}
/* ---- the roles this account actually holds ----
   The single source for role switching, replacing grantedViews() and the pair of dashed
   "Switch to …" rows that each knew about half the picture. Three shapes, and the difference
   matters at the point of clicking:

     kind:'mode'    — same page, the sidebar recolours and the rail changes (innovator ↔ mentor)
     kind:'pending' — a role being decided; shown with its status rather than hidden, because
                      waiting is a state, not an absence
     kind:'page'    — a real navigation into another account's workspace, marked as such

   Nothing appears here that the person doesn't hold: mentor waits for approval, sponsor waits
   for a created workspace, and Enabler — H2S's own staff tooling — never appears at all. */
function rolesFor(st){
  st = st || S.read();
  const ms  = mentorStatus(st);
  const out = [{ k:'innovator', ico:'GraduationCap', label:'Innovator', sub:'learns and competes', kind:'mode' }];
  if (ms === 'approved')
    out.push({ k:'mentor', ico:'ClipboardCheck', label:mentorRoleLabel(st), sub:'guides and evaluates', kind:'mode' });
  else if (ms === 'pending' || ms === 'info')
    out.push({ k:'mentor', ico:'ClipboardCheck', label:mentorRoleLabel(st), sub:'your application', kind:'pending',
               status: ms === 'info' ? 'Info needed' : 'In review' });
  /* A workspace door only when there's a workspace behind it. An enquiry ticket used to be
     enough, which sent people to a registration page dressed as a role they'd been granted. */
  if (st.customer && st.customer.created)
    out.push({ k:'sponsor', ico:'Building2', label:st.customer.org || 'Your organisation',
               sub:'organisation workspace', kind:'page', href:'customer.html' });
  return out;
}

/* ---------------------------------------------------------------
   v2 additions — Saved initiatives, Recently viewed, Activity log.
   None of this existed in v1. Each is a small derived-from-actions bag,
   same shape as `notes` above: appended by the action that already
   happens (registering, viewing an event, saving one for later), never
   authored separately. This is what backs the reference layout's
   Saved / Recent sidebar items and the Home rail's two feed cards.
   --------------------------------------------------------------- */
const savedList = st => (st || S.read()).saved || [];
const isSaved = (id, st) => savedList(st).includes(id);
function toggleSaved(id){
  const st = S.read(); const l = savedList(st).slice();
  const i = l.indexOf(id);
  if (i === -1) l.unshift(id); else l.splice(i, 1);
  S.save({ saved:l });
  return i === -1;   // true if it just got saved
}

const recentViews = st => (st || S.read()).recentViews || [];
function logRecentView(id){
  const st = S.read();
  const l = recentViews(st).filter(x => x !== id);
  l.unshift(id);
  S.save({ recentViews:l.slice(0, 12) });
}

const activityList = st => (st || S.read()).activity || [];
function logActivity(text){
  const st = S.read();
  const l = activityList(st);
  l.push({ text, at:new Date().toISOString() });
  S.save({ activity:l.slice(-30) });
}
