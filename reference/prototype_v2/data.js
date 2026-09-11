/* One dataset, shared by every page that lists or opens an initiative
   (app.html's Learn/Compete/Build tabs, initiative.html).
   Region + purpose + area tags are the metadata B4.2/B4.3 depend on. */

const REGIONS = ['India — North','India — South','India — West','India — East',
                 'APAC','Middle East & Africa','Europe','Americas'];

const INITIATIVES = [
  { id:'icc-global', name:'ICC Global Cricket Hackathon', org:'International Cricket Council',
    purpose:'competing', status:'live', region:'India — West', mode:'Hybrid',
    areas:['AI / GenAI','Data Science'], prize:'₹25L', deadline:'2026-08-28', regs:14820, pop:98,
    blurb:'Build the next generation of fan-engagement and match-analytics products for global cricket.' },

  { id:'ntpc-energy', name:'NTPC Energy Innovation Challenge', org:'NTPC Limited',
    purpose:'learncompete', status:'upcoming', region:'India — North', mode:'Hybrid',
    areas:['Sustainability','Data Science'], prize:'₹10L + pilot', deadline:'2026-09-02', regs:2140, pop:74,
    blurb:'Six live problem statements from India’s largest power utility — winners get a paid pilot.' },

  { id:'genai-academy', name:'Gen AI Academy — Cohort 12', org:'Hack2skill × Google Cloud',
    purpose:'learning', status:'live', region:'India — North', mode:'Virtual',
    areas:['AI / GenAI','Agentic AI'], prize:'Free · Certified', deadline:'2026-08-30', regs:31400, pop:99,
    blurb:'Eight-module GenAI track with live sessions, labs and a Google Cloud certification path.' },

  { id:'electhon', name:'Electhon 2026', org:'Ministry of Power',
    purpose:'competing', status:'upcoming', region:'India — West', mode:'In-person',
    areas:['Sustainability','IoT'], prize:'₹8L', deadline:'2026-09-12', regs:1890, pop:58,
    blurb:'36-hour in-person build sprint on grid resilience and smart metering.' },

  { id:'police-hack', name:'Police Hackathon 2026', org:'Ministry of Home Affairs',
    purpose:'competing', status:'live', region:'India — North', mode:'Hybrid',
    areas:['Cybersecurity','AI / GenAI'], prize:'₹15L', deadline:'2026-09-05', regs:7240, pop:82,
    blurb:'Public-safety technology challenge — forensics, cyber-crime triage and citizen services.' },

  { id:'dishathon', name:'Dishathon', org:'Hack2skill Community',
    purpose:'competing', status:'live', region:'India — South', mode:'Virtual',
    areas:['FinTech','Product'], prize:'₹3L', deadline:'2026-09-05', regs:3110, pop:49,
    blurb:'Community-run weekend hackathon. Teams of 2–4, any stack, one weekend.' },

  { id:'isro-bhuvan', name:'ISRO Bhuvan Geospatial Challenge', org:'ISRO',
    purpose:'learncompete', status:'upcoming', region:'India — South', mode:'Hybrid',
    areas:['Space','Data Science'], prize:'₹12L + incubation', deadline:'2026-09-25', regs:1620, pop:77,
    blurb:'Open satellite datasets, real agricultural and disaster-response problem statements.' },

  { id:'npci-upi', name:'NPCI UPI Fraud Detection Challenge', org:'NPCI',
    purpose:'learncompete', status:'live', region:'India — West', mode:'Virtual',
    areas:['FinTech','Cybersecurity','Data Science'], prize:'₹20L', deadline:'2026-09-15', regs:6050, pop:88,
    blurb:'Anonymised transaction data at national scale. Cut false positives without missing fraud.' },

  { id:'agentic-bootcamp', name:'Agentic AI Bootcamp', org:'Hack2skill',
    purpose:'learning', status:'live', region:'APAC', mode:'Virtual',
    areas:['Agentic AI','AI / GenAI'], prize:'Free · Certified', deadline:'2026-09-08', regs:18700, pop:94,
    blurb:'Six weeks, hands-on. Build and ship three working agents with mentor review.' },

  { id:'mena-fintech', name:'MENA FinTech Innovation Sprint', org:'Regional banking consortium',
    purpose:'learncompete', status:'upcoming', region:'Middle East & Africa', mode:'Hybrid',
    areas:['FinTech','Blockchain'], prize:'$25K', deadline:'2026-10-12', regs:610, pop:44,
    blurb:'Cross-border payments and Islamic-finance-compliant lending products.' },

  { id:'inspire-26', name:'Inspire Hackathon 2026', org:'Hack2skill',
    purpose:'competing', status:'past', region:'India — North', mode:'Virtual',
    areas:['AI / GenAI'], prize:'₹5L', deadline:'2026-05-18', regs:12400, pop:70,
    blurb:'Flagship community hackathon. Results announced, certificates issued.' },

  { id:'code-future', name:'Code for Future', org:'Hack2skill × EU partners',
    purpose:'competing', status:'past', region:'Europe', mode:'Hybrid',
    areas:['Sustainability','Web3'], prize:'€15K', deadline:'2026-04-22', regs:3900, pop:48,
    blurb:'Climate-tech build challenge across seven European campuses.' },

  { id:'vistara-ideathon', name:'Vistara Aviation Ideathon', org:'Vistara',
    purpose:'learncompete', status:'past', region:'India — North', mode:'Virtual',
    areas:['Product','Data Science'], prize:'₹6L', deadline:'2026-03-30', regs:2050, pop:41,
    blurb:'Passenger-experience and ground-ops efficiency ideas. Two ideas went to pilot.' },

  { id:'lat-am-web3', name:'LATAM Web3 Builders Challenge', org:'Hack2skill × regional partners',
    purpose:'competing', status:'upcoming', region:'Americas', mode:'Virtual',
    areas:['Web3','Blockchain'], prize:'$20K', deadline:'2026-10-20', regs:780, pop:46,
    blurb:'Open-track Web3 hackathon for builders across Latin America.' }
];

/* Initiatives the Enabler published from a sponsor program are real initiatives —
   they belong in the same array so the listing, the workspace and the mentor queue
   all see them without a single special case.
   It runs once at load AND stays callable, because a page that publishes or seeds
   after load (enabler.html, demo.js) needs byId() to see the new initiative
   immediately — otherwise assignmentsFor() silently returns nothing. */
function mergePublished(){
  try {
    (S.read().published || []).forEach(p => {
      const at = INITIATIVES.findIndex(x => x.id === p.id);
      /* REPLACE on a matching id, don't skip. A published record is the live one —
         when the demo enriches a seeded initiative (adding Mentor Connect, say) the
         static seed must give way, or the page renders the version without it. */
      if (at > -1) INITIATIVES[at] = Object.assign({}, INITIATIVES[at], p);
      else INITIATIVES.push(p);
    });
  } catch(e){ /* app.js not loaded on this page — nothing to merge */ }
}
mergePublished();

const STATUS_LABEL = { live:'Live', upcoming:'Upcoming', past:'Past' };

function daysLeft(iso){
  const d = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return d;
}
function deadlineText(o){
  if (o.status === 'past') return 'Ended ' + new Date(o.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  /* an extension has to reach every place the deadline is spoken, or a listing
     says "Closed" while the submit form is open — the participant believes the label */
  const close = (typeof effectiveClose === 'function') ? effectiveClose(o) : o.deadline;
  const d = daysLeft(close);
  if (d < 0) return 'Closed';
  if (d === 0) return 'Closes today';
  if (d === 1) return 'Closes tomorrow';
  return `Closes in ${d} days`;
}
function byId(id){ return INITIATIVES.find(x => x.id === id); }

/* ---------------------------------------------------------------
   Deterministic generators. Teams and evaluator assignments must be
   identical on the dashboard and on the event page, and must not
   reshuffle on reload — so they're seeded off the initiative id
   rather than stored or randomised.
   --------------------------------------------------------------- */
/* hashStr / rng / pickFrom moved to app.js — programs.js needs them too and not
   every page loads data.js */


const TEAM_NAMES = ['PitchPerfect','NightOwls','DataDagger','StackOverflowers','ByteMe','KernelPanic',
                    'NullPointer','TensorTitans','EdgeCase','RootAccess','AsyncAwaits','ForkBomb'];
const PEOPLE = ['Riya Kapoor','Manav Prasad','Jaya Deshmukh','Kabir Nair','Ishita Rao','Vikram Shetty',
                'Ananya Bose','Rohit Menon','Sana Qureshi','Dhruv Malhotra'];
const WANTED = ['a backend dev','a designer','an ML engineer','a frontend dev','anyone keen','a pitch lead'];

/* 3 open teams per initiative, stable across reloads and across pages */
function openTeams(initiativeId){
  const r = rng(hashStr(initiativeId));
  const names = [...TEAM_NAMES], people = [...PEOPLE];
  return [0,1,2].map(() => {
    const name = names.splice(Math.floor(r() * names.length), 1)[0];
    const size = 2 + Math.floor(r() * 3);                 // 2–4 already on board
    const members = [];
    for (let i = 0; i < size; i++) members.push(people.splice(Math.floor(r() * people.length), 1)[0]);
    return { name, members, cap:5, wants: pickFrom(r, WANTED) };
  });
}

/* Problem statements are drawn from the initiative's own interest areas, so an
   energy challenge never offers a Web3 brief. */
const PS_BANK = {
  'AI / GenAI': [
    ['Grounded answers over messy internal documents','Return citations a user can verify, under 2s on a 50GB corpus.'],
    ['Suppressing unsupported claims in summaries','Detect and hold back anything the source text does not support.']],
  'Agentic AI': [
    ['Safe tool use under partial failure','Recover cleanly when a downstream API times out mid-task.'],
    ['Coherence across long-horizon tasks','Keep an agent on-plan across 200+ steps without context blowup.']],
  'Data Science': [
    ['Demand forecasting at district granularity','Beat the current baseline by 15% MAPE using open data only.'],
    ['Anomaly detection at transaction scale','Cut false positives by 40% without lowering recall.']],
  'Cybersecurity': [
    ['Phishing triage for a 10,000-seat organisation','Rank user-reported mail so analysts see the real ones first.'],
    ['Lateral movement from logs alone','No endpoint agent available. Detect it from logs only.']],
  'Sustainability': [
    ['Predictive grid load balancing','Forecast demand spikes 24h ahead from load and weather history.'],
    ['Scope-3 emissions across an inconsistent supplier tree','Attribute emissions where suppliers report differently.']],
  'FinTech': [
    ['Fraud scoring on real-time payment rails','Score in under 80ms at 5,000 transactions per second.'],
    ['Credit assessment with thin files','Score borrowers with no formal credit history — explainably.']],
  'Space': [
    ['Geospatial crop-health scoring','Score field health from open satellite imagery, district level.'],
    ['Earlier conjunction screening','Flag likely orbital conjunctions sooner using public TLE data.']],
  'IoT': [
    ['Predictive maintenance on legacy machines','Retrofit sensing without touching the existing PLC.']],
  'Cloud': [
    ['Cost attribution in a shared cluster','Attribute spend per team across a multi-tenant estate.']],
  'Product': [
    ['Diagnosing onboarding drop-off','Find where users abandon setup, and prove the fix works.']],
  'Web3': [
    ['Gasless onboarding for first-time wallets','Get a user to their first transaction without them holding gas.']],
  'Blockchain': [
    ['Cross-chain settlement assurance','Prove settlement finality across two chains without a trusted relayer.']],
  'AR / VR': [
    ['Occlusion that survives cheap hardware','Believable occlusion on mid-range phones at 30fps.']],
  'HealthTech': [
    ['Triage from unstructured intake notes','Prioritise cases from free-text notes without losing edge cases.']],
  'Robotics': [
    ['Grasping unseen objects','Pick items the model has never been trained on, from clutter.']]
};

function problemStatements(o){
  /* A sponsor who authored their statements in P2 gets THEIRS. The bank below is
     the fallback for seeded initiatives that never had a sponsor to write them —
     it exists to populate the demo, not to speak for a customer. */
  if (o.statements && o.statements.length) return o.statements;
  const r = rng(hashStr(o.id + 'ps'));
  const pool = o.areas.flatMap(a => (PS_BANK[a] || []).map(x => [a, ...x]));
  const take = Math.min(pool.length, 3 + Math.floor(r() * 3));
  const out = [];
  const left = [...pool];
  for (let i = 0; i < take; i++){
    const [area, title, desc] = left.splice(Math.floor(r() * left.length), 1)[0];
    out.push({ code:'PS-' + (100 + hashStr(o.id + title) % 200), area, title, desc });
  }
  return out.sort((a,b) => a.code.localeCompare(b.code));
}

/* Roles come from the same tag set, and the COUNT is parsed from the initiative's
   own "8 open roles" label — the listing and the microsite must not disagree. */
const ROLE_BANK = {
  'AI / GenAI':['ML Engineer','Applied Scientist','GenAI Platform Engineer'],
  'Agentic AI':['Agent Systems Engineer'],
  'Data Science':['Data Scientist','Analytics Engineer'],
  'Cloud':['Platform Engineer','Site Reliability Engineer'],
  'Cybersecurity':['Security Engineer','Detection Engineer'],
  'IoT':['Embedded Systems Engineer','Firmware Engineer'],
  'FinTech':['Backend Engineer, Payments'],
  'Product':['Product Manager','Technical Program Manager'],
  'UI/UX':['Product Designer','Design Systems Engineer'],
  'Sustainability':['Sustainability Data Analyst'],
  'Robotics':['Robotics Engineer'],
  'Space':['Geospatial Engineer'],
  'Web3':['Protocol Engineer'], 'Blockchain':['Smart Contract Engineer'],
  'AR / VR':['XR Engineer'], 'HealthTech':['Clinical Data Engineer']
};
const LEVELS = [['Intern','6 months'],['0–2 yrs','Full-time'],['2–5 yrs','Full-time'],['5+ yrs','Full-time']];

function openRoles(o){
  const declared = parseInt((o.prize || '').match(/^(\d+)\s+open roles/) ? RegExp.$1 : 0, 10);
  const r = rng(hashStr(o.id + 'roles'));
  const titles = o.areas.flatMap(a => ROLE_BANK[a] || []);
  const n = declared || 3;
  const cities = { 'India — South':'Bengaluru', 'India — North':'Noida', 'India — West':'Mumbai',
                   'India — East':'Kolkata', 'APAC':'Singapore', 'Europe':'Berlin',
                   'Americas':'Austin', 'Middle East & Africa':'Dubai' };
  // every row is a unique title × level pair, so repeats differ by seniority rather
  // than a bolted-on "II" — which produced nonsense like "Engineer II · Intern"
  const base = titles.length ? titles : ['Software Engineer'];
  const combos = [];
  base.forEach(t => LEVELS.forEach(([level, type]) => combos.push({ title:t, level, type })));
  for (let i = combos.length - 1; i > 0; i--){          // deterministic shuffle
    const j = Math.floor(r() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }
  const loc = o.mode === 'Virtual' ? 'Remote' : (cities[o.region] || 'Bengaluru');
  return combos.slice(0, n)
    .sort((a,b) => a.title.localeCompare(b.title) || LEVELS.findIndex(l => l[0] === a.level) - LEVELS.findIndex(l => l[0] === b.level))
    .map((cmb, i) => ({ id: o.id + '-r' + i, title:cmb.title, level:cmb.level, type:cmb.type, loc }));
}

/* ---------------------------------------------------------------
   The work itself. Each purpose needs a surface where you actually
   do the thing — modules, tasks, a submission, an assessment.
   All deterministic from the initiative id, like everything else.
   --------------------------------------------------------------- */
const MODULE_BANK = {
  'AI / GenAI':['Foundations — models, tokens, prompting','Retrieval and grounding','Evaluation and guardrails'],
  'Agentic AI':['Tool use and function calling','Planning across long horizons','Failure recovery'],
  'Data Science':['Framing the problem','Feature engineering','Model validation'],
  'Cloud':['Provisioning and IaC','Observability','Cost control'],
  'Cybersecurity':['Threat modelling','Detection engineering','Incident response'],
  'FinTech':['Payment rails','Risk and fraud','Regulatory basics'],
  'Product':['Discovery interviews','Prioritisation','Measuring impact'],
  'Sustainability':['Carbon accounting','Systems thinking','Reporting standards']
};
const MODULE_KIND = ['Video','Lab','Reading','Live session'];

function modules(o){
  const r = rng(hashStr(o.id + 'mod'));
  const pool = o.areas.flatMap(a => MODULE_BANK[a] || []);
  const base = pool.length ? pool : ['Getting started','Core concepts','Applied practice'];
  const list = [...base, 'Capstone project'];
  return list.map((title, i) => ({
    i, title,
    kind: i === list.length - 1 ? 'Project' : MODULE_KIND[Math.floor(r() * MODULE_KIND.length)],
    mins: 15 + Math.floor(r() * 50)
  }));
}

function evangelismTasks(o){
  return [
    { t:'Set up the SDK and run the starter', mins:20 },
    { t:'Build one working integration', mins:120 },
    { t:'Publish it publicly', mins:30 },
    { t:'Write structured feedback on what broke', mins:25 },
    { t:'Present in the community showcase', mins:45 }
  ].map((x,i) => Object.assign({ i }, x));
}

/* short skill check for hiring challenges — 3 questions drawn from the initiative's areas */
const QUIZ_BANK = {
  'AI / GenAI':[['What most reduces hallucination in a RAG system?',
    ['A larger model','Grounding answers in retrieved sources','A higher temperature','More few-shot examples'],1]],
  'Data Science':[['A model has 99% accuracy on a 1%-positive dataset. What does that suggest?',
    ['Excellent performance','It may predict the majority class every time','Overfitting to noise','Nothing'],1]],
  'Cloud':[['What does infrastructure-as-code primarily buy you?',
    ['Lower bills','Reproducible environments','Faster CPUs','Fewer services'],1]],
  'Cybersecurity':[['Why is least privilege effective?',
    ['It speeds up auth','It limits blast radius of a compromise','It encrypts data','It hides services'],1]],
  'FinTech':[['Why is idempotency critical in payments?',
    ['It speeds settlement','It prevents duplicate charges on retry','It lowers fees','It is a legal requirement'],1]],
  'IoT':[['Why prefer edge inference over cloud for some sensors?',
    ['Cheaper hardware','Lower latency and less bandwidth','Better accuracy','Simpler code'],1]],
  'Product':[['A feature ships and usage is flat. Best first move?',
    ['Build more features','Check whether users can find it','Redesign the UI','Raise the price'],1]],
  'UI/UX':[['What does a focus ring exist for?',
    ['Decoration','Keyboard users to see where they are','Brand consistency','Hover feedback'],1]]
};
function quiz(o){
  const pool = o.areas.flatMap(a => QUIZ_BANK[a] || []);
  const generic = [['What matters most in a 48-hour build?',
    ['Feature count','A working demo of one thing','Perfect code','A long deck'],1]];
  const src = pool.length ? pool : generic;
  const r = rng(hashStr(o.id + 'quiz'));
  const out = [];
  const left = [...src, ...generic];
  for (let i = 0; i < Math.min(3, left.length); i++){
    const [q, opts, ans] = left.splice(Math.floor(r() * left.length), 1)[0];
    out.push({ i, q, opts, ans });
  }
  return out;
}

/* Every queued submission needs something to actually look at — a mentor scoring a
   bare team name is scoring nothing. Deterministic per assignment key. */
const ART_VERB = ['Realtime','Adaptive','Federated','Explainable','Lightweight','Offline-first'];
const ART_NOUN = ['pipeline','scoring engine','dashboard','agent','classifier','toolkit'];
function submissionArtifact(key, team, o){
  const r = rng(hashStr(key + 'art'));
  const slug = team.toLowerCase().replace(/[^a-z0-9]/g,'');
  return {
    title: pickFrom(r, ART_VERB) + ' ' + (o.areas[0] || 'AI') + ' ' + pickFrom(r, ART_NOUN),
    repo:  'https://github.com/' + slug + '/' + o.id,
    demo:  r() > 0.35 ? 'https://youtu.be/' + slug.slice(0,6) + Math.floor(r()*900+100) : '',
    notes: pickFrom(r, [
      'Working end to end on the sample dataset. Latency is the weak point.',
      'Prototype covers the happy path; error handling is stubbed.',
      'We rebuilt the approach twice — the current one is simpler and faster.',
      'Solid model work, presentation is rough. Demo video explains it best.'
    ])
  };
}

/* one key shape both sides agree on, so a mentor's score lands on the innovator's submission */
const SELF_KEY = id => id + '::self';

/* the journey each purpose actually runs through — drives the stepper.
   Product Evangelism, Innovation Challenge and Hiring Challenge are deprecated —
   Build absorbs Innovation Challenge's statement→evaluation shape,
   gated behind a learning phase first. */
const JOURNEY = {
  learning:     ['Enrolled','Modules','Capstone','Certificate'],
  competing:    ['Registered','Team','Build','Submit','Results'],
  learncompete: ['Enrolled','Modules','Capstone','Registered','Statement','Build','Submit','Evaluation']
};

/* Mentor Connect adds a step to the journey — but only for a program that
   enabled it, so the rail is the shape of THIS program rather than the shape of
   the platform. It goes in front of Build, because mentor hours are for while
   you are building, not after.

   Everything downstream (building(), reachedFor()) still thinks in the base
   journey's indices, so the two helpers below translate between what is on
   screen and what the logic means. Renumbering the dispatch instead would have
   meant editing every step branch to insert one card. */
function journeyFor(o){
  const base = JOURNEY[(o || {}).purpose] || ['Registered','Work','Done'];
  if (typeof mentoringOn !== 'function' || !mentoringOn(o)) return base;
  const i = base.indexOf('Build');
  return i < 0 ? base.concat(['Mentoring'])
               : base.slice(0, i).concat(['Mentoring'], base.slice(i));
}
const mentorStepIdx = o => journeyFor(o).indexOf('Mentoring');
/* screen index -> the index the step logic expects */
const toLogicalStep = (o, i) => { const m = mentorStepIdx(o); return m >= 0 && i > m ? i - 1 : i; };
/* logic index -> where it sits on screen */
const toScreenStep  = (o, i) => { const m = mentorStepIdx(o); return m >= 0 && i >= m ? i + 1 : i; };

/* Expertise no longer assigns work directly — it SUGGESTS challenges the mentor can
   request. An Enabler approves the mapping, and only approved challenges produce work. */
function suggestedChallenges(areas){
  areas = areas || [];
  return INITIATIVES.filter(o => o.status !== 'past' && o.areas.some(a => areas.includes(a)));
}

/* Evaluator queue: submissions from the challenges a mentor is APPROVED on. */
function assignmentsFor(initiativeIds, areas){
  areas = areas || [];
  return (initiativeIds || [])
    .map(byId).filter(Boolean)
    .flatMap(o => {
      const r = rng(hashStr(o.id + 'eval'));
      const n = 1 + Math.floor(r() * 2);                  // 1–2 submissions per initiative
      // name the area that actually earned the match, not o.areas[0] — otherwise
      // an AI reviewer sees "Sustainability track" and thinks the routing is broken
      const via = o.areas.find(a => areas.includes(a)) || o.areas[0];
      return openTeams(o.id).slice(0, n).map(t => ({
        key: o.id + '::' + t.name,
        id: o.id, team: t.name, due: o.deadline, via,
        brief: o.purpose === 'learncompete'
          ? 'PS-' + (100 + hashStr(t.name) % 200) + ' · ' + via
          : via + ' track · round 2'
      }));
    })
    .sort((a,b) => new Date(a.due) - new Date(b.due))
    .slice(0, 8);
}

/* ============================================================================
   PromptWars — the vibe-coding arena.

   Real programme (promptwars.in): "India's first end to end vibe coding
   challenge", for people who use an LLM as their primary dev environment.
   Solo only. Two ways in — biweekly VIRTUAL drops you climb a leaderboard in,
   and one-day IN-PERSON city sprints with a cash pool for the top 3 per city.
   Online participation earns Prompt Credits, redeemable for merch.

   It doesn't fit the initiative model at all — no team, no registration window,
   no certificate — which is why it gets its own shape here rather than being
   forced into INITIATIVES.

   Cadence is generated from a fixed anchor so every page agrees on which drop
   is next, and rivals are seeded off the drop id so the board never reshuffles
   on reload. Same determinism rule as openTeams() above.
   ============================================================================ */
const PW_ANCHOR   = new Date('2026-01-07T00:00:00Z');   // drop 1; every 14 days after
const PW_THEMES   = ['Ship a one-prompt web app','Rebuild a landing page from a screenshot',
                     'Agentic to-do that books its own calendar','Voice-first expense tracker',
                     'Turn a CSV into a dashboard','Chrome extension in under 50 prompts',
                     'Recreate a game from memory','Prompt your way to a working API'];
const PW_CITIES   = ['Bengaluru','Delhi NCR','Hyderabad','Pune','Chennai','Mumbai'];
const PW_CREDITS_PER_DROP = 50;

/* Which drop number is running now, counting from the anchor. */
function pwDropIndex(when){
  const days = Math.floor(((when || new Date()) - PW_ANCHOR) / 86400000);
  return Math.max(0, Math.floor(days / 14));
}
function pwDrop(i){
  const start = new Date(PW_ANCHOR.getTime() + i * 14 * 86400000);
  const close = new Date(start.getTime() + 13 * 86400000);
  const no    = i + 1;
  const sp    = pwSponsored()[no] || null;
  return {
    id:'pw-' + no,
    no: no,
    theme: sp ? sp.theme : PW_THEMES[i % PW_THEMES.length],
    city:  PW_CITIES[i % PW_CITIES.length],
    sponsor: sp,                                  // {org, theme, pool} once published
    opens: start.toISOString().slice(0,10),
    closes: close.toISOString().slice(0,10)
  };
}
const pwCurrent = () => pwDrop(pwDropIndex());
const pwNext    = () => pwDrop(pwDropIndex() + 1);

/* ---- sponsored drops ------------------------------------------------------
   A sponsor books a fortnight; an Enabler publishes it. Same bridge the platform
   already uses for program → initiative, one object down. An unsponsored drop
   keeps its house theme, so the calendar never has a hole in it. */
const pwSponsored = () => S.read().pwSponsored || {};      // { [dropNo]: {org, theme, pool} }
const pwRequests  = () => S.read().pwRequests  || [];      // sponsor asks, awaiting an Enabler

/* ---- your side of it — derived from state, never invented ---- */
const PW_STATE  = st => (st || S.read()).pw || {};
const pwEntries = st => PW_STATE(st).entries || [];
const pwLedger  = st => PW_STATE(st).ledger  || [];
const pwSubs    = st => PW_STATE(st).subs    || {};
const pwSub     = (dropId, st) => pwSubs(st)[dropId] || null;

/* Balance is the ledger, not a counter kept beside it — one number, one source. */
const pwCredits = st => pwLedger(st).reduce((n,e) => n + e.delta, 0);

/* Consecutive drops entered, counting back from the live one. The loop's own metric:
   in a fortnightly format, turning up again is the behaviour worth measuring. */
function pwStreak(st){
  const ids = pwEntries(st);
  let n = 0;
  for (let i = pwDropIndex(); i >= 0; i--){
    if (ids.indexOf(pwDrop(i).id) === -1) break;
    n++;
  }
  return n;
}
function pwPost(delta, reason, dropId){
  const cur = S.read().pw || {};
  const led = (cur.ledger || []).concat([{
    delta, reason, dropId: dropId || null, at: new Date().toISOString()
  }]);
  S.save({ pw: Object.assign({}, cur, { ledger:led }) });
}
function pwEnter(dropId){
  const cur = S.read().pw || {};
  const list = cur.entries || [];
  if (list.indexOf(dropId) !== -1) return;
  list.push(dropId);
  S.save({ pw: Object.assign({}, cur, { entries:list }) });
  pwPost(PW_CREDITS_PER_DROP, 'Entered ' + dropId.replace('pw-','drop '), dropId);
}

/* ---- scoring ---------------------------------------------------------------
   Solo entries from everyone, every fortnight, is exactly the volume human
   judging can't absorb — so the arena scores on the platform's AI evaluator
   rather than a jury. Deterministic per submission so a score never changes
   under the person who earned it.

   Economy is the format's own dimension: vibe coding is judged on how few
   prompts it took, not only on what came out. */
const PW_RUBRIC = ['Idea', 'Completeness', 'Economy'];
function pwScore(dropId, sub){
  const r = rng(hashStr(dropId + (sub.repo || '') + sub.prompts));
  const idea = 58 + Math.floor(r() * 38);
  const done = (sub.url ? 70 : 55) + Math.floor(r() * 26);
  /* fewer prompts scores higher, flattening out past ~80 */
  const econ = Math.max(35, Math.min(97, 104 - Math.round(Number(sub.prompts || 60) * 0.8)));
  const total = Math.round((idea + done + econ) / 3);
  return { idea, done, econ, total };
}
function pwFeedback(sc, sub){
  const bits = [];
  bits.push(sc.econ >= 75
    ? 'Strong scope control for ' + sub.prompts + ' prompts.'
    : 'It took ' + sub.prompts + ' prompts to get here — tightening the first few would lift economy most.');
  bits.push(sub.url
    ? 'A live URL meant the evaluator could actually use it, which carried completeness.'
    : 'No live URL, so completeness was judged from the repo alone — deploying it is the cheapest points on the board.');
  bits.push(sc.idea >= 80
    ? 'The idea reads as yours rather than the brief restated.'
    : 'The idea sits close to the brief; a sharper angle is what separates the top ten.');
  return bits.join(' ');
}
function pwSubmit(dropId, sub){
  const cur = S.read().pw || {};
  const sc  = pwScore(dropId, sub);
  const rec = Object.assign({}, sub, {
    score: sc, feedback: pwFeedback(sc, sub), at: new Date().toISOString()
  });
  const subs = Object.assign({}, cur.subs || {}); subs[dropId] = rec;
  S.save({ pw: Object.assign({}, cur, { subs:subs }) });
  /* placement pays more than entry — entry keeps the loop turning, finishing well
     is what's worth chasing */
  const bonus = sc.total >= 85 ? 100 : sc.total >= 70 ? 75 : 40;
  pwPost(bonus, 'Scored ' + sc.total + ' on ' + dropId.replace('pw-','drop '), dropId);
  return rec;
}

/* ---- swag store ------------------------------------------------------------
   A balance that only ever grows stops meaning anything by drop five. The store
   is the sink that keeps the number worth watching. */
const PW_STORE = [
  { id:'stickers', label:'Sticker pack',        cost:100 },
  { id:'tee',      label:'Arena tee',           cost:300 },
  { id:'keycaps',  label:'Mechanical keycaps',  cost:600 },
  { id:'kit',      label:'Full arena kit',      cost:1000 }
];
const pwOwned = st => (PW_STATE(st).owned || []);
function pwRedeem(itemId){
  const item = PW_STORE.find(x => x.id === itemId);
  if (!item || pwCredits() < item.cost) return false;
  const cur = S.read().pw || {};
  S.save({ pw: Object.assign({}, cur, { owned:(cur.owned || []).concat([itemId]) }) });
  pwPost(-item.cost, 'Redeemed ' + item.label);
  return true;
}

/* Leaderboard for a drop: seeded rivals, with the real user spliced in on their
   own credits so their rank is a consequence of what they actually did. */
function pwLeaderboard(dropId, st){
  st = st || S.read();
  const r = rng(hashStr(dropId + 'board'));
  const rivals = PEOPLE.map(name => ({
    name, credits: 60 + Math.floor(r() * 260), you:false
  }));
  const mine = pwCredits(st);
  const board = rivals.concat(mine > 0
    ? [{ name: st.name || 'You', credits: mine, you:true }] : []);
  board.sort((a,b) => b.credits - a.credits || a.name.localeCompare(b.name));
  return board.map((x,i) => Object.assign({ rank:i + 1 }, x));
}
function pwRank(st){
  const row = pwLeaderboard(pwCurrent().id, st).find(x => x.you);
  return row ? row.rank : null;
}

/* Three boards, because they reward different things: this drop is winnable by
   anyone who turns up, all-time rewards persistence, city makes the in-person
   sprints feel local. */
function pwBoard(scope, st){
  st = st || S.read();
  if (scope === 'drop') return pwLeaderboard(pwCurrent().id, st);
  const seedKey = scope === 'alltime' ? 'alltime' : 'city:' + scope;
  const r = rng(hashStr(seedKey));
  const pool = scope === 'alltime' ? PEOPLE : PEOPLE.slice(0, 6);
  const rivals = pool.map(name => ({
    name, credits: (scope === 'alltime' ? 320 : 180) + Math.floor(r() * 900), you:false
  }));
  const mine = pwCredits(st);
  const board = rivals.concat(mine > 0 ? [{ name: st.name || 'You', credits:mine, you:true }] : []);
  board.sort((a,b) => b.credits - a.credits || a.name.localeCompare(b.name));
  return board.map((x,i) => Object.assign({ rank:i + 1 }, x));
}

/* ============================================================================
   Where is someone inside an initiative?

   This logic used to live in workspace.html, closed over that page's `o` and its
   bag() helpers — which meant the only place that knew what step you were on was
   the page you were already looking at. The journey rail needs the same answer
   for initiatives you're NOT currently in, so it's hoisted here as a pure
   function and workspace.html delegates to it.
   ============================================================================ */
function bagFor(st, key, id, def){
  return ((st || S.read())[key] || {})[id] !== undefined
    ? ((st || S.read())[key] || {})[id] : def;
}
function reachedFor(o, st){
  st = st || S.read();
  const done = bagFor(st, 'lessons', o.id, []) || [];
  const m    = modules(o);
  const sub  = bagFor(st, 'submission', o.id, null);
  const team = bagFor(st, 'teams', o.id, null);
  const ps   = bagFor(st, 'chosenPS', o.id, null);
  /* the gate on the final step is "has it been evaluated", not "is the initiative
     over" — a score that exists is feedback the innovator is entitled to read */
  const evaluated = !!((st.scores || {})[o.id + '::self']);
  switch (o.purpose){
    case 'learning':
      return done.length === 0 ? 1
           : done.length < m.length ? 1
           : !bagFor(st, 'claimed', o.id, false) ? 2 : 3;
    case 'competing':
      return !team ? 1 : !sub ? 2 : (o.status === 'past' || evaluated) ? 4 : 3;
    case 'learncompete': {
      if (!bagFor(st, 'lcCapstone', o.id, false)){
        return done.length === 0 ? 1 : done.length < m.length ? 1 : 2;
      }
      return 3 + (!ps ? 1 : !sub ? 2 : (o.status === 'past' || evaluated) ? 4 : 3);
    }
  }
  return 1;
}
/* The step's name, plus what's actually blocking it — a deadline says WHEN,
   this says what to click. */
function nextStepFor(o, st){
  st = st || S.read();
  const steps = journeyFor(o);
  const i = Math.min(toScreenStep(o, reachedFor(o, st)), steps.length - 1);
  const done = (bagFor(st, 'lessons', o.id, []) || []).length;
  const total = modules(o).length;
  const label = steps[i];
  let hint = '';
  if (label === 'Modules')          hint = done + ' of ' + total + ' done';
  else if (label === 'Team')        hint = 'no team yet';
  else if (label === 'Capstone')    hint = o.purpose === 'learncompete'
                                          ? 'unlocks the compete phase' : 'claim your certificate';
  else if (label === 'Statement')   hint = 'pick a problem statement';
  else if (label === 'Build')       hint = 'nothing submitted yet';
  else if (label === 'Submit')      hint = 'nothing submitted yet';
  else if (label === 'Results')     hint = 'waiting on results';
  else if (label === 'Evaluation')  hint = 'waiting on evaluation';
  else if (label === 'Certificate') hint = 'ready to claim';
  return { step:label, hint:hint, idx:i, total:steps.length };
}
