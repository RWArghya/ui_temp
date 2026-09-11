/* The six paid program types — shared by enterprise.html, customer-register.html,
   customer.html and program.html. Mirrors the offer live on hello.hack2skill.com. */
const PROGRAMS = [
  { id:'innovation', ico:'💡', label:'Innovation Challenge',
    blurb:'Publish real problem statements and crowdsource solutions from outside your walls.',
    outcome:'5–15 shortlisted solutions, 1–3 pilots',
    focus:'Problem statements', focusHint:'One line each. Three to six works best.',
    whoFor:'R&D, innovation and strategy teams with a problem they can describe but not staff.',
    youGet:['5–15 shortlisted solutions with working prototypes','Direct line to the teams behind them',
            'Option to pilot or acquire','A published case study'],
    runs:'8–12 weeks', scale:'2,000–20,000 participants',
    stages:['Problem statements finalised','Outreach to matched innovators','Build phase with mentors',
            'Jury evaluation','Shortlist and pilot conversations'] },

  { id:'internal', ico:'🏢', label:'Internal Hackathon',
    blurb:'Run it for your own employees — same platform, private to your organisation.',
    outcome:'40–70% employee participation',
    focus:'Themes or tracks', focusHint:'What should teams build against? e.g. "cut onboarding time".',
    whoFor:'HR, engineering leadership and internal-innovation owners.',
    youGet:['A private, branded instance only your staff can access','Cross-team collaboration you can measure',
            'A ranked shortlist of internal ideas','Participation and engagement analytics'],
    runs:'3–6 weeks', scale:'50–5,000 employees',
    stages:['Tracks and eligibility agreed','Internal comms and sign-ups','Build sprint',
            'Internal jury and demo day','Ideas routed to owners'] },

  { id:'evangelism', ico:'📣', label:'Product Evangelism',
    blurb:'Get developers building on your product, and hear what breaks before your customers do.',
    outcome:'73% average lift in adoption',
    focus:'Product and tasks', focusHint:'Which product, and what should developers actually do with it?',
    whoFor:'Developer relations, product marketing and platform teams.',
    youGet:['Hundreds of developers with hands on your product','Structured, written feedback on the rough edges',
            'Public integrations and content','A warm pool for your next launch'],
    runs:'4–8 weeks', scale:'500–10,000 developers',
    stages:['Tasks and rewards defined','Developer outreach','Build and publish phase',
            'Feedback synthesis','Showcase and rewards'] },

  { id:'startup', ico:'🚀', label:'Startup Pitch',
    blurb:'Source prototypes and founding teams solving your problem already.',
    outcome:'20–50 qualified startups',
    focus:'Investment or partnership thesis', focusHint:'Stage, sector and what a fit looks like.',
    whoFor:'Corporate venture, M&A and partnership teams.',
    youGet:['20–50 screened startups matched to your thesis','Pitch day with your investment committee',
            'Diligence-ready materials','First-look rights via the H2S startup network'],
    runs:'6–10 weeks', scale:'200–2,000 startups reached',
    stages:['Thesis and screening criteria set','Sourcing from 10,000+ partner startups','Screening rounds',
            'Pitch day','Term-sheet conversations'] },

  { id:'recruitment', ico:'🎯', label:'Recruitment Drive',
    blurb:'Hire on demonstrated skill instead of CV keywords, from a pre-warmed pool.',
    outcome:'Cost-per-hire down to near zero',
    focus:'Roles to fill', focusHint:'Title, level and location for each open role.',
    whoFor:'Talent acquisition and engineering hiring managers.',
    youGet:['A ranked candidate pool scored on real work','Interview-ready shortlists',
            'Employer-brand exposure to 7M+ innovators','Continued access to everyone who entered'],
    runs:'4–6 weeks', scale:'1,000–50,000 candidates',
    stages:['Roles and skill rubric agreed','Challenge designed against the rubric','Candidate outreach',
            'Automated + human scoring','Shortlist to your ATS'] },

  { id:'student', ico:'🎓', label:'Student Challenge',
    blurb:'Reach 10,000+ partner institutes and build your brand with the next intake.',
    outcome:'10K–100K student reach',
    focus:'Campuses and themes', focusHint:'Which regions or institute tiers, and the theme.',
    whoFor:'Campus hiring, brand and CSR teams.',
    youGet:['Reach across 10,000+ partner institutes','Early-talent pipeline for internships',
            'Brand presence with the next graduating cohort','Regional participation analytics'],
    runs:'6–10 weeks', scale:'10,000–100,000 students',
    stages:['Campuses and theme agreed','Institute mobilisation','Campus rounds',
            'National finals','Offers and internships'] }
];
/* ---------------------------------------------------------------
   A program used to BE its type: c.programs held type ids and
   c.specs was keyed by type, which capped an organisation at one
   Innovation Challenge. A program now has its own KEY —
   '<type>' for the first of a type, then '<type>~2', '<type>~3' —
   so Samsung can run three at once. baseType() is what keeps every
   type-level lookup (label, purpose, outcome rate) working unchanged.
   --------------------------------------------------------------- */
const baseType = id => String(id || '').split('~')[0];
const programById = id => PROGRAMS.find(p => p.id === baseType(id));

/* Presentation — what participants see. Separate from the SPEC (objective,
   judging, prizes), because a sponsor can reserve a name and URL today and
   scope it next week. Defaults are derived, never blank. */
function progMeta(cust, key){
  const p = programById(key) || {};
  const org = (cust || {}).org || '';
  const m = ((cust || {}).meta || {})[key] || {};
  return Object.assign({
    name: (org ? org + ' ' : '') + (p.label || key),
    slug: '', org, format: 'Virtual', visibility: 'public',
    banner: '', card: '', video: '', about: ''
  }, m);
}
const progName = (cust, key) => progMeta(cust, key).name;

/* next free key for a type in this workspace */
function nextProgKey(cust, typeId){
  const have = (cust && cust.programs) || [];
  if (!have.includes(typeId)) return typeId;
  let n = 2;
  while (have.includes(typeId + '~' + n)) n++;
  return typeId + '~' + n;
}

/* url slug — lowercase, digits, hyphens; unique across this workspace */
function progSlug(s){
  return String(s || '').toLowerCase().trim()
    .replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 48);
}

/* a program in a customer's workspace is in exactly one of three states */
function programState(cust, id){
  if (!cust || !(cust.programs || []).includes(id)) return 'about';       // not added yet
  const spec = (cust.specs || {})[id];
  return spec && spec.scoped ? 'brief' : 'scope';                          // added → scoped or not
}

/* ---------------------------------------------------------------
   Delivery stages. The Enabler advances these; the Sponsor's
   Talent Pool and Reports read them. One ladder, two audiences.
   --------------------------------------------------------------- */
const STAGES = ['scoped','signed-off','outreach','live','closed'];
const STAGE_LABEL = { 'scoped':'Scoped', 'signed-off':'Signed off', 'outreach':'Outreach running',
                      'live':'Live', 'closed':'Closed' };
function stageOf(spec){
  if (!spec) return null;
  if (spec.stage) return spec.stage;
  if (spec.approved) return 'signed-off';
  if (spec.scoped)   return 'scoped';
  return null;
}
const stageIdx = spec => STAGES.indexOf(stageOf(spec));

/* target participants drive every downstream number */
const PARTICIPANT_MID = { 'Under 500':300, '500–5,000':2500, '5,000–50,000':22000, '50,000+':70000 };

/* outcome label + what fraction of the shortlist converts, per program type */
const OUTCOME = {
  innovation: ['Pilot-ready solutions', 0.25],
  internal:   ['Ideas with an owner',   0.60],
  evangelism: ['Integrations shipped',  1.40],
  startup:    ['Startups in diligence', 0.35],
  recruitment:['Hires',                 0.55],
  student:    ['Internship offers',     0.45]
};

/* Projected until a program goes live, then realised. Same model either way, so the
   sponsor can see the plan and the actuals in the same shape. */
function funnel(spec, programId){
  const target = PARTICIPANT_MID[(spec || {}).participants] || 2500;
  const proj = {
    reach:         target * 12,
    registrations: target,
    submissions:   Math.round(target * 0.18),
    shortlist:     Math.max(3, Math.round(target * 0.006))
  };
  const [label, rate] = OUTCOME[baseType(programId)] || ['Outcomes', 0.3];
  proj.outcome = Math.max(1, Math.round(proj.shortlist * rate));
  proj.outcomeLabel = label;

  const i = stageIdx(spec);
  // nothing real exists before outreach; live is partway through; closed is the full number
  const realisedPct = i >= STAGES.indexOf('closed') ? 1
                    : i >= STAGES.indexOf('live')   ? 0.64
                    : i >= STAGES.indexOf('outreach') ? 0.21
                    : 0;
  const actual = {};
  Object.keys(proj).forEach(k => {
    if (k !== 'outcomeLabel') actual[k] = Math.round(proj[k] * realisedPct);
  });
  // outreach reaches people but nobody has submitted yet
  if (i === STAGES.indexOf('outreach')){ actual.submissions = 0; actual.shortlist = 0; actual.outcome = 0; }
  return { proj, actual, realisedPct, isLive: realisedPct > 0, label };
}

/* ---------------------------------------------------------------
   The pulse. One line per program, specific and temporal — "closes in
   16 days · 2,534 in · 84 shortlisted" — instead of a static status word.
   A sponsor's home page used to show plan-time counts ("3 programs
   planned") that never change once set; this reads live off the same
   funnel() and effectiveClose() every other screen reads, so it can
   never disagree with them, and it goes stale in exactly the way a
   program actually does — a day at a time. --------------------------- */
function daysLeft(dateStr){
  if (!dateStr) return null;
  const ms = new Date(dateStr + 'T00:00:00') - new Date(new Date().toISOString().slice(0,10) + 'T00:00:00');
  return Math.round(ms / 86400000);
}
function programPulse(c, id){
  const s = (c.specs || {})[id] || {}, stage = stageOf(s);
  const p = programById(id) || {};
  if (!stage) return { text:'Not scoped yet', tone:'muted' };
  if (stage === 'scoped') return { text:'Awaiting your sign-off', tone:'warn' };
  if (stage === 'signed-off') return { text:'Ready for outreach', tone:'muted' };
  const f = funnel(s, id);
  const io = s.initiativeId && typeof byId === 'function' ? byId(s.initiativeId) : null;
  const close = io && typeof effectiveClose === 'function' ? effectiveClose(io, S.read()) : null;
  const dl = daysLeft(close);
  if (stage === 'outreach')
    return { text:`Mobilising · registrations open`, tone:'warn' };
  if (stage === 'live'){
    const closeTxt = dl == null ? '' : dl > 0 ? `Closes in ${dl}d · ` : dl === 0 ? 'Closes today · ' : 'Closed, judging · ';
    return { text:`${closeTxt}${f.actual.registrations.toLocaleString('en-IN')} in · ${f.actual.submissions.toLocaleString('en-IN')} submitted`,
             tone: dl != null && dl <= 3 ? 'warn' : 'ok' };
  }
  return { text:`Closed · ${f.actual.outcome} ${f.label.toLowerCase()}`, tone:'ok' };
}

/* ---------------------------------------------------------------
   The people. A sponsor is buying access to innovators, so there has
   to be a screen where those innovators are actually visible.
   Deterministic, seeded off the program key — same rules as everything else.
   --------------------------------------------------------------- */
const P_FIRST = ['Aarav','Riya','Kabir','Ishita','Manav','Sana','Rohit','Ananya','Dhruv','Meera',
                 'Vikram','Jaya','Nikhil','Priya','Arjun','Tara','Karan','Neha','Aditya','Fatima'];
const P_LAST  = ['Sharma','Kapoor','Nair','Rao','Prasad','Qureshi','Menon','Bose','Malhotra','Iyer',
                 'Shetty','Deshmukh','Verma','Reddy','Khan','Joshi'];
const P_ORG   = ['IIT Delhi','NIT Trichy','BITS Pilani','VIT Vellore','IIIT Hyderabad','Independent',
                 'Zoho','Freshworks','Infosys','A seed-stage startup','Manipal','DTU'];

function participantsFor(key, spec, programId){
  const f = funnel(spec, programId);
  const total = f.actual.registrations;
  if (!total) return { total:0, submitted:0, rows:[] };
  const r = rng(hashStr(key + 'people'));
  const shown = Math.min(24, total);                 // a page of the pool, not all of it
  const submitRate = f.proj.registrations ? f.actual.submissions / f.proj.registrations : 0;
  const rows = [];
  for (let i = 0; i < shown; i++){
    const submitted = r() < Math.max(submitRate, 0.18);
    rows.push({
      id: key + '-p' + i,
      name: P_FIRST[Math.floor(r() * P_FIRST.length)] + ' ' + P_LAST[Math.floor(r() * P_LAST.length)],
      org: P_ORG[Math.floor(r() * P_ORG.length)],
      region: NETWORK_SPLIT[Math.floor(r() * NETWORK_SPLIT.length)][0],
      submitted,
      score: submitted ? Number((2.4 + r() * 2.6).toFixed(1)) : null
    });
  }
  rows.sort((a,b) => (b.score || 0) - (a.score || 0));
  return { total, submitted: f.actual.submissions, rows };
}

/* ---------------------------------------------------------------
   The bridge. A sponsor buys a PROGRAM; innovators register for an
   INITIATIVE and mentors are mapped to one. The Enabler is what turns
   the first into the second — without this they're separate universes.
   --------------------------------------------------------------- */
/* Sponsor program TYPES (the six paid names above) are a separate, commercial
   question from participant PURPOSES — deliberately left untouched here, since
   that's still an open business decision, not a design one (see the handover notes).
   What has to change: every program type must publish to a purpose that still
   exists. Innovation Challenge, Startup Pitch and Recruitment Drive all published
   as statement-driven work before — that's now Build's compete phase,
   so they consolidate onto it rather than onto a purpose that no longer exists. */
const PURPOSE_OF_PROGRAM = {
  innovation:'learncompete', startup:'learncompete', evangelism:'learncompete',
  recruitment:'learncompete', internal:'competing', student:'competing'
};
const AREA_VOCAB = ['AI / GenAI','Agentic AI','Web3','Blockchain','AR / VR','Cloud','Cybersecurity',
                    'Data Science','IoT','Robotics','FinTech','HealthTech','Sustainability','Space',
                    'Product','UI/UX'];

/* read the areas out of what the sponsor actually wrote, rather than guessing */
function areasFromSpec(spec){
  const text = ((spec.objective || '') + ' ' + (spec.focus || '') + ' ' + (spec.metric || '')).toLowerCase();
  const hits = AREA_VOCAB.filter(a => {
    const t = a.toLowerCase().split(' / ')[0];
    return text.includes(t) || (t === 'data science' && /data|forecast|model/.test(text))
        || (t === 'sustainability' && /grid|energy|carbon|emission/.test(text))
        || (t === 'fintech' && /payment|fraud|credit|upi/.test(text));
  });
  return hits.length ? hits.slice(0,3) : ['AI / GenAI'];
}

function initiativeFromProgram(key, spec, programId, org, hq, todayISO, meta, design){
  const p = programById(programId) || {};
  meta = meta || {};
  design = design || {};
  const tl = design.timeline || {};
  const weeks = parseInt(spec.weeks) || 6;
  const start = spec.start ? new Date(spec.start) : new Date(todayISO);
  const end = new Date(start.getTime() + weeks * 7 * 86400000);
  const target = PARTICIPANT_MID[spec.participants] || 2500;
  return {
    /* the sponsor's own slug becomes the initiative id, so the URL they were
       given at creation is the URL that resolves once it is published */
    id: (meta.slug || (org + '-' + programId)).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
    name: meta.name || (org + ' ' + p.label),
    org,
    purpose: PURPOSE_OF_PROGRAM[baseType(programId)] || 'competing',
    status: 'live',
    region: hq || 'India — West',
    mode: meta.format || 'Virtual',
    /* a private program is published but never listed — handled by initiatives.html */
    unlisted: meta.visibility === 'private',
    /* the sponsor PICKED areas in P0 — only fall back to guessing them out of
       their objective text when they didn't */
    areas: (meta.areas && meta.areas.length) ? meta.areas : areasFromSpec(spec),
    prize: spec.budget || 'Recognition + rewards',
    /* the authored timeline wins over start+duration once P2 is done */
    deadline: tl.submitClose || end.toISOString().slice(0,10),
    regOpen: tl.regOpen || '', regClose: tl.regClose || '', resultsOn: tl.resultsOn || '',
    /* THE point of P2: the sponsor's real statements travel with the initiative,
       so problemStatements() stops generating and starts reading. */
    statements: statementsForPublish(design),
    rules: design.rules || null,
    submission: design.submission || null,
    rounds: design.rounds || [],
    prizes: design.prizes || [],
    /* the features travel with the initiative — every downstream page decides
       what to show by reading these, never by guessing from the program type */
    features: design.features || null,
    mentoring: ((design.features||{}).mentorConnect||{}).enabled ? (design.mentoring || null) : null,
    regs: Math.round(target * 0.21),
    pop: 60,
    blurb: meta.about || spec.objective || p.blurb,
    sponsored: key            // marks it as published from a sponsor program
  };
}

/* ---------------------------------------------------------------
   The sponsor workspace sidebar. Rendered from ONE function, used by
   customer.html, program.html, participants.html and program-new.html,
   so the four pages that show it cannot drift apart.

   Items are real links (customer.html?v=...) rather than onclick
   handlers, so they work from a page that isn't customer.html.
   customer.html intercepts them and switches section in place.

   Ground stays LIGHT on purpose: navy is the mentor sidebar's signal
   (see the mentor-mode note in README) and two personas must not share
   the one cue that tells them apart.
   --------------------------------------------------------------- */
/* 'Reports' and 'Participants' used to be global nav items — one page
   listing every program's numbers, and one listing every program's people.
   Neither question is ever "across all my programs" in practice; it is
   always "how is THIS one doing" or "who applied to THIS one". They are now
   tabs inside a program's own workspace (see program.html) instead of a
   detour through a separate page and back. Talent Pool stays global — reach
   and pool-after-close genuinely are a cross-program, account-level number. */
const SPONSOR_NAV = [
  ['overview','Overview',      '\u{1F3E0}'],
  ['programs','Programs',      '\u{1F9E9}'],
  ['talent',  'Talent Pool',   '\u{1F465}'],
  ['arena',   'PromptWars',    '\u{1F3AE}']
];
const SPONSOR_NAV_ACCT = [
  ['team',    'Organisation',  '\u{1FAAA}'],
  ['support', 'Your H2S team', '\u{1F4AC}']
];
function sponsorSideHTML(active){
  const item = ([v,label,ico]) =>
    `<a class="side-item${v === active ? ' active' : ''}" data-v="${v}" href="customer.html?v=${v}">
       <span class="ico">${ico}</span> ${label}</a>`;
  return `<aside class="sidebar">
    <div class="side-group">${SPONSOR_NAV.map(item).join('')}</div>
    <div class="side-group">
      <span class="tag">Account</span>
      ${SPONSOR_NAV_ACCT.map(item).join('')}
    </div>
    <div class="side-group" style="padding:0 12px">
      <hr class="sep" style="margin:8px 0 16px">
      <p class="xs faint">Prototype ·
        <a href="#" onclick="S.save({customer:null});location.href='enterprise.html';return false"
           style="color:var(--primary)">reset</a></p>
    </div>
  </aside>`;
}

/* ---------------------------------------------------------------
   P2 — THE COMPETITION DESIGN.

   P0 is what the program looks like, P1 is what it is measured by,
   this is what it actually IS: the dates, the problems, who may
   enter, what they hand in, and how it is judged.

   Kept separate from c.specs on purpose. The spec is the sponsor's
   commercial brief and stops changing once signed off; the design is
   an operational document that the Enabler edits alongside them.
   --------------------------------------------------------------- */
/* ===================================================================
   PLATFORM FEATURES — capabilities a program switches ON.

   Two things drove this. Evaluation is not one thing: some programs are
   scored by an engine in minutes, some by a person over a week, and a
   real program mixes them ROUND BY ROUND — basic engine to screen three
   thousand entries, premium engine on the survivors, a human jury for
   the final. And mentoring is not universal: a program either runs
   mentor hours or it does not, and everything downstream (a roadmap
   stage, a journey step, a public tab) should appear only if it does.

   So a feature is enabled first, and enabling it is what unlocks its
   configuration surface. Nothing half-configured can publish, and
   nothing disabled clutters a page that will never use it.
   =================================================================== */

function progDesign(cust, key){
  const d = ((cust || {}).design || {})[key] || {};
  const s = ((cust || {}).specs  || {})[key] || {};
  /* dates default off the scope's start + duration rather than today, so the
     timeline opens already roughly right instead of blank */
  const start = s.start ? new Date(s.start) : null;
  const wk    = parseInt(s.weeks) || 6;
  const iso   = dt => dt ? new Date(dt).toISOString().slice(0,10) : '';
  const plus  = (dt, days) => dt ? iso(new Date(dt.getTime() + days * 86400000)) : '';
  return Object.assign({
    timeline: {
      regOpen:    start ? plus(start, -21) : '',
      regClose:   start ? plus(start, 0)   : '',
      teamLock:   start ? plus(start, 7)   : '',
      kickoff:    start ? iso(start)       : '',
      submitClose:start ? plus(start, wk * 7)      : '',
      resultsOn:  start ? plus(start, wk * 7 + 14) : ''
    },
    statements: [],
    rules: { teamMin:1, teamMax:4, soloAllowed:true, onePerPerson:true,
             employeeOnly:false, eligibility:'' },
    submission: { repo:true, demo:true, deck:true, video:false, doc:false, note:'' },
    rounds: [],
    prizes: [],
    /* off by default — a feature nobody switched on must not appear anywhere */
    features: { aiEval:{ enabled:false, tiers:['basic'] }, mentorConnect:{ enabled:false } },
    mentoring: { cats:['tech','product','biz','domain'], sessionMins:30,
                 perCat:1, policy:'encouraged', from:'', to:'', note:'' },
    /* the registration FORM — separate from `rules` (who is eligible, team size).
       Empty template means the builder hasn't been opened yet and shows the
       template picker; the two core fields are never absent, so a program can
       never end up with a form that cannot collect a name and an email. */
    registration: { template:'', fields:[] },
    /* sponsor-defined modules bolted onto the Design workspace — Note, Checklist,
       Quiz or Webinar/workshop. Only a REQUIRED one can block sign-off (see
       designBlockers below); the rest are purely informational. */
    customModules: []
  }, d, {
    /* nested objects need merging, not replacing, or a saved partial wipes the defaults */
    timeline:   Object.assign({}, progDesign.__t(start, wk), d.timeline),
    rules:      Object.assign({ teamMin:1, teamMax:4, soloAllowed:true, onePerPerson:true,
                                employeeOnly:false, eligibility:'' }, d.rules),
    submission: Object.assign({ repo:true, demo:true, deck:true, video:false, doc:false, note:'' }, d.submission),
    features:   { aiEval: Object.assign({ enabled:false, tiers:['basic'] }, ((d.features||{}).aiEval)||{}),
                  mentorConnect: Object.assign({ enabled:false }, ((d.features||{}).mentorConnect)||{}) },
    mentoring:  Object.assign({ cats:['tech','product','biz','domain'], sessionMins:30,
                                perCat:1, policy:'encouraged', from:'', to:'', note:'' }, d.mentoring),
    registration: Object.assign({ template:'', fields:[] }, d.registration),
    customModules: d.customModules || []
  });
}
progDesign.__t = function(start, wk){
  const iso  = dt => dt ? new Date(dt).toISOString().slice(0,10) : '';
  const plus = (dt, days) => dt ? iso(new Date(dt.getTime() + days * 86400000)) : '';
  return { regOpen: start ? plus(start,-21) : '', regClose: start ? plus(start,0) : '',
           teamLock: start ? plus(start,7) : '', kickoff: start ? iso(start) : '',
           submitClose: start ? plus(start, wk*7) : '',
           resultsOn: start ? plus(start, wk*7+14) : '' };
};

/* Whether a custom module is done — a Note is done once it has text, a
   Checklist once every item is ticked, a Quiz once every question has text and
   a marked-correct answer, a Webinar once every session has a title and date.
   One function so the Design page's dot, the rail's status and designBlockers()
   below can never disagree about what "done" means for a given module. */
function customModuleReady(m){
  if (!m) return false;
  if (m.type === 'note') return !!(m.note || '').trim();
  if (m.type === 'checklist'){
    const items = m.items || [];
    return items.length > 0 && items.every(i => i.done);
  }
  if (m.type === 'quiz'){
    const qs = m.questions || [];
    return qs.length > 0 && qs.every(q => (q.text||'').trim() && (q.options||[]).some(o => o.correct));
  }
  if (m.type === 'webinar'){
    const ss = m.sessions || [];
    return ss.length > 0 && ss.every(s => (s.title||'').trim() && s.date);
  }
  return false;
}

/* One readiness function, so the design page, the sign-off gate and the Enabler's
   publish gate can never disagree about whether a program is ready.

   `s` (the program's spec — objective, focus, metric, participants) used to be
   checked on its own page before Design was ever reachable. Scope merged into
   Design, so those same requirements are checked here now, alongside the
   requirements Design always had. Every caller should pass the spec; a caller
   that omits it is checking design-only readiness, which under-reports what's
   actually missing rather than over-reporting it. */
function designBlockers(d, programId, s){
  s = s || {};
  const out = [];
  if (!(s.objective || '').trim() || !(s.focus || '').trim() || !(s.metric || '').trim())
    out.push('the objective and success metric');
  if (!(s.participants || '').trim()) out.push('target participants');
  const t = d.timeline || {};
  if (!(d.statements || []).length) out.push('at least one problem statement');
  const order = [['regOpen','registration opens'],['regClose','registration closes'],
                 ['submitClose','submissions close'],['resultsOn','results']];
  if (order.some(([k]) => !t[k])) out.push('the full timeline');
  else {
    const dates = order.map(([k]) => t[k]);
    for (let i = 1; i < dates.length; i++)
      if (dates[i] < dates[i-1]) { out.push('a timeline that runs forwards'); break; }
  }
  if (!(d.rounds || []).length) out.push('at least one judging round');
  else {
    /* a fully automated round is scored on the engine's own categories, so a
       sponsor rubric is not required there — demanding one would be asking them
       to weight criteria nobody reads */
    const bad = d.rounds.some(r => {
      if (!roundEval(r).human) return false;
      const w = (r.criteria || []).reduce((n,c) => n + (+c.weight || 0), 0);
      return !(r.criteria || []).length || w !== 100;
    });
    if (bad) out.push('every round\u2019s criteria weighted to 100%');
  }
  const subm = d.submission || {};
  if (!['repo','demo','deck','video','doc'].some(k => subm[k])) out.push('at least one submission requirement');
  if (baseType(programId) !== 'recruitment' && !(d.prizes || []).length)
    out.push('at least one prize or reward tier');

  /* an enabled feature that is not configured is worse than a disabled one —
     it promises participants something the program cannot deliver */
  const f = d.features || {};
  if ((f.aiEval || {}).enabled){
    if (!(f.aiEval.tiers || []).length) out.push('at least one AI engine tier switched on');
    const usable = (f.aiEval.tiers || []).some(t => aiCatsFor(t, d.submission).length);
    if ((f.aiEval.tiers || []).length && !usable)
      out.push('a submission requirement the AI engine can actually read');
    const orphan = (d.rounds || []).some(r => {
      const e = roundEval(r);
      return e.engine !== 'none' && !(f.aiEval.tiers || []).includes(e.engine);
    });
    if (orphan) out.push('every round using an engine tier that is switched on');
  } else if ((d.rounds || []).some(r => roundEval(r).engine !== 'none')){
    out.push('AI evaluation enabled, or rounds moved back to an assigned evaluator');
  }
  if ((f.mentorConnect || {}).enabled){
    const m = d.mentoring || {};
    if (!(m.cats || []).length) out.push('at least one mentor category');
    if (!m.from || !m.to) out.push('a mentoring window');
    else if (m.to < m.from) out.push('a mentoring window that runs forwards');
    else if (t.submitClose && m.to > t.submitClose)
      out.push('a mentoring window that closes before submissions do');
  }
  /* a custom module the sponsor marked required is a promise to participants —
     an incomplete one is exactly as blocking as an incomplete built-in module */
  (d.customModules || []).forEach(cm => {
    if (cm.required && !customModuleReady(cm))
      out.push('the “' + (cm.title || 'untitled module') + '” module completed');
  });
  return out;
}
const designReady = (d, programId, s) => designBlockers(d, programId, s).length === 0;

/* a stable, human code per statement — PS-101, PS-102 … in authoring order */
const psCode = i => 'PS-' + (101 + i);

/* the sponsor's authored statements, in the shape every consumer already expects */
function statementsForPublish(d){
  return (d.statements || []).map((x,i) => ({
    code: psCode(i), area: x.area || '', title: x.title || '',
    desc: x.desc || '', output: x.output || '', cap: +x.cap || 0
  }));
}

/* ---------------------------------------------------------------
   P3 — SIGN-OFF.

   `approved:true` was the whole of it, which answered "was it signed"
   and nothing else: not who signed, not when, and — the one that
   matters — not WHAT they signed. A brief that keeps changing after
   approval means the flag is true and meaningless.

   So sign-off stores a SNAPSHOT of the terms. Everything after can be
   compared against it, and a change is classified:

     MATERIAL  — alters what participants were promised or what the
                 sponsor is paying for. Needs re-signing.
     COSMETIC  — wording. Does not.

   That distinction is the whole design. Without it you either freeze a
   living document, or you let the prize money change silently after the
   customer agreed to it.
   --------------------------------------------------------------- */

/* The terms, flattened. Only fields somebody could be held to. */
function signoffTerms(spec, design){
  spec = spec || {}; design = design || {};
  const t = design.timeline || {};
  return {
    /* commercial */
    objective:    spec.objective || '',
    metric:       spec.metric || '',
    participants: spec.participants || '',
    budget:       spec.budget || '',
    weeks:        spec.weeks || '',
    /* the competition */
    regOpen:t.regOpen||'', regClose:t.regClose||'', kickoff:t.kickoff||'',
    teamLock:t.teamLock||'', submitClose:t.submitClose||'', resultsOn:t.resultsOn||'',
    statements: (design.statements || []).map(x => (x.title||'') + '|' + (x.desc||'')).join('~'),
    statementCount: (design.statements || []).length,
    teamMin:(design.rules||{}).teamMin, teamMax:(design.rules||{}).teamMax,
    soloAllowed:!!(design.rules||{}).soloAllowed,
    eligibility:(design.rules||{}).eligibility || '',
    handIn: ['repo','demo','deck','video','doc']
      .filter(k => (design.submission||{})[k]).join(','),
    rounds: (design.rounds || []).map(r =>
      (r.name||'') + ':' + (r.jury||0) + ':' +
      (r.criteria||[]).map(c => (c.label||'') + '=' + (c.weight||0)).join('+')).join('~'),
    /* HOW a round is judged is part of the deal. A sponsor who signed for a
       human jury and got an engine did not get what they signed for. */
    evalModes: (design.rounds || []).map(r => {
      const e = roundEval(r);
      return (r.name||'') + '=' + e.engine + (e.human ? '+human' : '') +
             (e.engine !== 'none' ? '@' + e.aiWeight : '');
    }).join('~'),
    mentorConnect: ((design.features||{}).mentorConnect||{}).enabled ? 'on' : 'off',
    mentorCats: (((design.features||{}).mentorConnect||{}).enabled
      ? ((design.mentoring||{}).cats || []) : []).join(','),
    mentorPolicy: (((design.features||{}).mentorConnect||{}).enabled
      ? ((design.mentoring||{}).policy || '') : ''),
    prizes: (design.prizes || []).map(x =>
      (x.place||'') + '=' + (x.label||'') + '=' + (x.value||'')).join('~')
  };
}

/* Which of those, if it moves, changes the deal. Everything not listed here is
   wording — a retitled program or a reworded description does not reopen a brief. */
const MATERIAL_TERMS = {
  participants:'Target participants', budget:'Prize / reward pool', weeks:'Duration',
  regOpen:'Registration opens', regClose:'Registration closes', kickoff:'Kickoff',
  teamLock:'Teams lock', submitClose:'Submissions close', resultsOn:'Results date',
  statements:'Problem statements', statementCount:'Number of problem statements',
  teamMin:'Minimum team size', teamMax:'Maximum team size', soloAllowed:'Solo entries',
  eligibility:'Eligibility', handIn:'What teams hand in',
  rounds:'Judging rounds and weights', prizes:'Prize tiers',
  evalModes:'How each round is evaluated', mentorConnect:'Mentor Connect',
  mentorCats:'Mentor categories', mentorPolicy:'Mentoring requirement'
};
const COSMETIC_TERMS = { objective:'Objective wording', metric:'Success metric wording' };

const signoffOf = (cust, key) => (((cust || {}).signoff || {})[key]) || null;

/* What has moved since the signature. One function, so the banner on the brief,
   the re-sign sheet and the Enabler's publish gate cannot disagree. */
function signoffDrift(cust, key){
  const rec = signoffOf(cust, key);
  if (!rec || !rec.terms) return { material:[], cosmetic:[], signed:false };
  const now  = signoffTerms(((cust||{}).specs||{})[key], progDesign(cust, key));
  const then = rec.terms;
  const diff = dict => Object.keys(dict).filter(k => String(now[k]) !== String(then[k]))
    .map(k => ({ key:k, label:dict[k], was:then[k], is:now[k] }));
  return { material:diff(MATERIAL_TERMS), cosmetic:diff(COSMETIC_TERMS), signed:true, rec };
}
/* signed, and signed for what is on the page right now */
const signoffCurrent = (cust, key) => {
  const d = signoffDrift(cust, key);
  return d.signed && !d.material.length;
};

/* The P5/P6 gates moved to app.js: initiative.html, workspace.html and
   mentor.html all read them and none of them load programs.js. The outreach
   model below stays here — it is sponsor-side only. */

/* ===================================================================
   P4 — OUTREACH, derived from the program rather than a constant.

   NETWORK_SPLIT was a fixed regional table shown to every sponsor
   identically. The plan now comes from the target, the areas the sponsor
   picked, and their own HQ — and the reminder schedule comes from the
   timeline, so moving a date moves the sends.
   =================================================================== */
function outreachPlan(spec, design, meta, hq){
  const target = PARTICIPANT_MID[(spec || {}).participants] || 2500;
  const areas  = (meta || {}).areas || [];
  /* the sponsor's own region is weighted up — that is where their brand pulls */
  const rows = NETWORK_SPLIT.map(([region, pc]) => {
    const w = region === hq ? pc * 1.4 : pc;
    return { region, weight:w };
  });
  const total = rows.reduce((n,r) => n + r.weight, 0);
  return rows.map(r => Object.assign(r, {
    share: Math.round(r.weight / total * 100),
    invites: Math.round(target * 12 * (r.weight / total))
  })).sort((a,b) => b.invites - a.invites)
    .map(r => Object.assign(r, { areas }));
}

/* Reminders read the timeline. A date moves, the sends move with it. */
function outreachSchedule(design){
  const t = (design || {}).timeline || {};
  const off = (d, n) => d ? new Date(new Date(d).getTime() + n * 86400000)
    .toISOString().slice(0,10) : '';
  const plan = [
    ['Launch announcement',   t.regOpen,     0,  'The whole matched pool'],
    ['Reminder — one week in',t.regOpen,     7,  'Opened, did not register'],
    ['Closing in 72 hours',   t.regClose,   -3,  'Opened, did not register'],
    ['Kickoff briefing',      t.kickoff,     0,  'Everyone registered'],
    ['Halfway nudge',         t.submitClose,-Math.max(3, Math.round(
        (t.kickoff && t.submitClose
          ? (new Date(t.submitClose) - new Date(t.kickoff)) / 86400000 / 2 : 7))), 'Registered, no submission'],
    ['Submissions close in 48 hours', t.submitClose, -2, 'Registered, no submission'],
    ['Results are out',       t.resultsOn,   0,  'Everyone who took part']
  ];
  return plan.filter(([,anchor]) => anchor)
    .map(([label, anchor, delta, audience]) => ({
      label, audience, on:off(anchor, delta),
      sent: off(anchor, delta) <= TODAY()
    }))
    .sort((a,b) => a.on.localeCompare(b.on));
}

/* the sponsor's own journey through a program — mirrors the delivery stages.
   Kept for anywhere still reading it by STAGES-key (e.g. a per-stage list
   inside a tabbed view); OUTER_JOURNEY below is the one shown as the top
   ladder everywhere in the product now. */
const SPONSOR_JOURNEY = [
  { key:'scoped',    label:'Scope',    blurb:'Define the program' },
  { key:'signed-off',label:'Sign off', blurb:'Approve the brief' },
  { key:'outreach',  label:'Outreach', blurb:'Approve who we mobilise' },
  { key:'live',      label:'Live',     blurb:'Watch it run' },
  { key:'closed',    label:'Results',  blurb:'Outcomes and case study' }
];

/* ---------------------------------------------------------------
   THE ONE OUTER LADDER — Purpose > Build > Design > Approval > Live >
   Results — shown at the top of program.html, program-design.html and
   program-signoff.html. Scope merged into Design (its fields moved onto
   Design's own tabs — see designBlockers()); Sign-off and Outreach approval
   merged into one Approval stage, since both are the same kind of moment —
   the sponsor reviewing something and giving the go-ahead — rather than two
   separate phases. Purpose and Build happen on program-new.html, before a
   program has a workspace at all, so they always render as already-done
   here: orientation for where you are in the whole lifecycle, not a control.
   --------------------------------------------------------------- */
const OUTER_JOURNEY = [
  { key:'purpose',  label:'Purpose',  blurb:'Program type chosen' },
  { key:'build',    label:'Build',    blurb:'What participants see' },
  { key:'design',   label:'Design',   blurb:'Timelines, statements, rules, judging' },
  { key:'approval', label:'Approval', blurb:'Sign off and approve outreach' },
  { key:'live',     label:'Live',     blurb:'Watch it run' },
  { key:'closed',   label:'Results',  blurb:'Outcomes and case study' }
];
/* maps a program's real state onto one of the six stages above. Purpose and
   Build are always past (index 0, 1) by the time this is ever called —
   nothing reads this before a program exists in c.programs. */
function outerStageIdx(spec){
  const st = stageOf(spec);
  if (st === 'live')   return 4;
  if (st === 'closed') return 5;
  if (st === 'scoped' || st === 'signed-off' || st === 'outreach') return 3; // Approval
  return 2; // Design — not yet scoped (designBlockers() still non-empty)
}

/* where the innovator network sits — used for reach planning */
const NETWORK_SPLIT = [['India — North',32],['India — South',27],['India — West',18],['India — East',9],
                       ['APAC',7],['Europe',4],['Middle East & Africa',2],['Americas',1]];

/* ===================================================================
   THE RUNG MODEL  —  one canvas, one rail, seven rungs
   -------------------------------------------------------------------
   Replaces the six-stage OUTER_JOURNEY ladder for the *sponsor's own
   program pages*. OUTER_JOURNEY stays where it is: workspace.html,
   mentor.html and enabler.html still render it, and changing it would
   change three other personas' pages.

   The rail is NOT a wizard. Every rung is always clickable. The split
   that matters is vertical, not horizontal:

     Purpose · Design page · Design forms · Timeline & process
        -> the sponsor authors these. A dot means "done".
     Live · Result · Closed
        -> these become true. A dot means "reached". Nobody clicks
           "Live" to make a program live; the Enabler publishes it and
           the registration date arrives.

   Everything below is derived on every call. There is no rung state
   stored anywhere, for the same reason there is no isComplete flag:
   two sources of truth eventually disagree, and the one on screen is
   the one people believe.
   =================================================================== */

const RUNGS = [
  { key:'purpose', label:'Purpose',            sub:'type · objective',  kind:'author' },
  { key:'page',    label:'Design page',        sub:'the public page',   kind:'author' },
  { key:'forms',   label:'Design forms',       sub:'what you collect',  kind:'author' },
  { key:'process', label:'Timeline & process', sub:'dates · judging',   kind:'author' },
  { key:'live',    label:'Live',               sub:'registrations',     kind:'system' },
  { key:'result',  label:'Result',             sub:'leaderboard',       kind:'system' },
  { key:'closed',  label:'Closed',             sub:'archive',           kind:'system' }
];
const AUTHOR_RUNGS = RUNGS.filter(r => r.kind === 'author').map(r => r.key);
const RUNG_LABEL = RUNGS.reduce((m,r) => (m[r.key] = r.label, m), {});

/* Which rung fixes which blocker. designBlockers() returns human phrases and
   is the single readiness function — this only decides where each phrase is
   *repaired*, so a blocker on the overview is a door rather than a note.
   Anything unmapped falls to 'process', which is where the bulk of the
   competition design lives; a new blocker therefore surfaces somewhere real
   rather than silently vanishing from the list. */
const RUNG_OF_BLOCKER = {
  'the objective and success metric':'purpose',
  'target participants':'purpose',
  'at least one submission requirement':'forms',
  'at least one problem statement':'process',
  'the full timeline':'process',
  'a timeline that runs forwards':'process',
  'at least one judging round':'process',
  'every round’s criteria weighted to 100%':'process',
  'at least one prize or reward tier':'process',
  'at least one AI engine tier switched on':'process',
  'a submission requirement the AI engine can actually read':'process',
  'every round using an engine tier that is switched on':'process',
  'AI evaluation enabled, or rounds moved back to an assigned evaluator':'process',
  'at least one mentor category':'process',
  'a mentoring window':'process',
  'a mentoring window that runs forwards':'process',
  'a mentoring window that closes before submissions do':'process'
};

/* The page rung's own requirements. designBlockers() never checked the
   participant-facing page at all — it could not, because the page was
   authored on a different screen (program-new.html's wizard) that committed
   before Design ever opened. Now that the page is a rung, what participants
   see is part of readiness: a program with no name and no URL is not ready to
   be signed off, whatever its timeline says. */
function pageBlockers(m){
  m = m || {};
  const out = [];
  if (!String(m.name || '').trim())  out.push('a program name');
  if (!String(m.slug || '').trim())  out.push('a program URL');
  if (!String(m.about || '').trim()) out.push('the about text');
  return out;
}

/* what is outstanding, per author rung — { purpose:[], page:[], forms:[], process:[] } */
function rungBlockers(cust, key){
  const d = progDesign(cust, key);
  const s = ((cust || {}).specs || {})[key] || {};
  const out = { purpose:[], page:pageBlockers(progMeta(cust, key)), forms:[], process:[] };
  designBlockers(d, key, s).forEach(b => {
    const r = RUNG_OF_BLOCKER[b] || 'process';
    out[r].push(b);
  });
  return out;
}

/* Everything standing between this program and a signature. A superset of
   designBlockers() — it adds the page rung and nothing else — so no gate that
   used to bite stops biting. */
function publishBlockers(cust, key){
  const b = rungBlockers(cust, key);
  return AUTHOR_RUNGS.reduce((all,k) => all.concat(b[k]), []);
}
const publishReady = (cust, key) => publishBlockers(cust, key).length === 0;

/* One rung's state, for the dot on the rail and the tick in the setup list.
     author: 'done' | 'open'
     system: 'lit'  (this has actually happened) | 'dark'
   A system rung is never 'open' — there is nothing to author, so there is
   nothing to be missing. */
function rungState(cust, key, rung){
  const s = ((cust || {}).specs || {})[key] || {};
  const st = stageOf(s);
  if (rung === 'live')   return (st === 'live' || st === 'closed') ? 'lit' : 'dark';
  if (rung === 'result') return (st === 'closed' || !!(s.resultsAt)) ? 'lit' : 'dark';
  if (rung === 'closed') return st === 'closed' ? 'lit' : 'dark';
  return (rungBlockers(cust, key)[rung] || []).length ? 'open' : 'done';
}

/* Where Manage should land. Not "the first unfinished rung" — that is a wizard
   wearing a rail. It lands where the work actually is: on a running program
   that is Live, on a finished one at Closed, and on one still being authored
   at the first rung with something outstanding (Purpose if nothing is). */
function landingRung(cust, key){
  const st = stageOf(((cust || {}).specs || {})[key] || {});
  if (st === 'closed') return 'closed';
  if (st === 'live')   return 'live';
  const b = rungBlockers(cust, key);
  return AUTHOR_RUNGS.find(k => (b[k] || []).length) || 'purpose';
}

/* The setup list on the program overview: the four author rungs, then the
   two things only other people can do. Deliberately not a stepper — every
   row is a link to the rung that fixes it, and nothing below an unfinished
   row is locked.

   Note what the last three rows are NOT: a Publish button. In this product
   the sponsor does not publish — they sign off, H2S countersigns, and the
   Enabler publishes to the network. A "Publish" control on the sponsor's
   page would be a button that lies about who is in charge. */
function setupItems(cust, key){
  const b = rungBlockers(cust, key);
  const s = ((cust || {}).specs || {})[key] || {};
  const d = (typeof signoffDrift === 'function') ? signoffDrift(cust, key) : { signed:false, material:[] };
  const rec = (typeof signoffOf === 'function') ? (signoffOf(cust, key) || {}) : {};
  const rows = RUNGS.filter(r => r.kind === 'author').map(r => {
    const left = b[r.key] || [];
    return { key:r.key, label:r.label, done:!left.length, rung:r.key, required:true,
             note: left.length ? left.length + (left.length === 1 ? ' thing' : ' things') + ' to settle' : '',
             detail: left.join(', ') };
  });
  rows.push({ key:'signoff', label:'Brief signed off', required:true,
    done: !!s.approved && !d.material.length,
    href: 'program-signoff.html?id=' + key,
    note: !publishReady(cust, key) ? 'After the four above'
        : !d.signed ? 'Ready for your signature'
        : d.material.length ? 'Re-signature needed'
        : 'v' + (d.rec ? d.rec.version : 1) });
  rows.push({ key:'countersign', label:'Countersigned by H2S', required:false, done:!!rec.countersignedBy,
    note: rec.countersignedBy || 'Your programs team' });
  rows.push({ key:'golive', label:'Published to the network', required:false,
    done: !!s.initiativeId, note: s.initiativeId ? 'Live' : 'H2S publishes it' });
  return rows;
}

/* Optional, listed so it is visible, never blocking. "Listed but not required"
   is a real category and it needs somewhere to live, or every optional thing
   quietly becomes mandatory to be discoverable. */
function optionalItems(cust, key){
  const m = progMeta(cust, key), d = progDesign(cust, key);
  const inPerson = m.format === 'In-person' || m.format === 'Hybrid';
  return [
    { label:'Venue',          done: !inPerson ? !!m.format : !!String(m.venueCity || '').trim(),
      note: inPerson ? (m.venueCity || 'Not set') : m.format },
    { label:'Banner and card', done: !!(m.banner || m.card), rung:'page' },
    { label:'Custom modules', done: !!(d.customModules || []).length, rung:'forms',
      note: (d.customModules || []).length ? (d.customModules.length + ' added') : 'None' },
    { label:'AI evaluation',  done: !!((d.features || {}).aiEval || {}).enabled, rung:'process' },
    { label:'Mentor Connect', done: !!((d.features || {}).mentorConnect || {}).enabled, rung:'process' }
  ];
}

const canvasHref = (key, rung) => 'program-design.html?id=' + key + (rung ? '&r=' + rung : '');

/* ===================================================================
   THE SPONSOR'S OVERVIEW  —  reach, portfolio shape, one series
   -------------------------------------------------------------------
   Anurag's page 4, resolved: five counters that were not the same kind
   of thing. Reach is *people*; not-scoped / initiated / live / closed
   are four slices of *one* number, the program count. Tiling all five
   made them look comparable when four of them add up and one does not.

   So: one headline number for reach, one composition strip splitting it
   by persona, one segmented bar for the portfolio, and one switchable
   series. Everything derived; nothing stored.

   Scope is the sponsor's OWN programs, never the wider H2S network.
   "How many students reach I have" — their reach, not the platform's.
   =================================================================== */

/* Registrations across this org's programs.

   Deliberately NOT called unique people. The funnel model is per program
   and there is nothing in it that could identify the same person twice, so
   claiming uniqueness here would be inventing a number nobody could defend.
   The label on screen says "registrations across N programs" for that
   reason — see the note under the headline. */
function reachFor(cust){
  const ids = (cust && cust.programs) || [];
  let total = 0, per = [];
  ids.forEach(id => {
    const s = ((cust.specs || {})[id]) || {};
    const n = (funnel(s, id).actual || {}).registrations || 0;
    if (n) per.push({ id, name: progName(cust, id), n });
    total += n;
  });
  per.sort((a,b) => b.n - a.n);
  return { total, per, programs: ids.length };
}

/* Persona composition. Seeded off the org so it never reshuffles, and
   forced to sum to the total exactly — a composition whose parts do not
   add up to its whole is the fastest way to lose a reader's trust.

   The weighting is illustrative, like the funnel conversion rates in this
   file: student challenges skew student, recruitment drives skew
   professional. Replace with real profile data before this is shown as
   fact. Persona will come off the innovator's platform profile — one
   profile, filled once, so the same filter means the same thing at org
   scope and at program scope. */
/* NOT `PERSONAS` — app.js already owns that name for the four product personas
   (innovator / sponsor / mentor / enabler). Redeclaring a top-level const that
   another loaded file declares throws at PARSE time, which takes out this whole
   file: every function in it becomes undefined and pages render blank panels
   with no visible error. check.py now checks for this across files. */
const AUDIENCE_PERSONAS = ['Students','Professionals','Freelancers'];
const PERSONA_SKEW = {
  student:    [0.82, 0.10, 0.08],
  innovation: [0.46, 0.34, 0.20],
  internal:   [0.04, 0.94, 0.02],
  evangelism: [0.30, 0.42, 0.28],
  startup:    [0.18, 0.52, 0.30],
  recruitment:[0.55, 0.38, 0.07]
};
function personaSplit(cust){
  const r = reachFor(cust);
  if (!r.total) return { total:0, parts: AUDIENCE_PERSONAS.map(k => ({ k, n:0, pct:0 })) };
  const acc = [0,0,0];
  r.per.forEach(x => {
    const w = PERSONA_SKEW[baseType(x.id)] || PERSONA_SKEW.innovation;
    const jitter = rng(hashStr(x.id + 'persona'))();       // ±3pt, stable per program
    const shift = (jitter - 0.5) * 0.06;
    const ws = [w[0] + shift, w[1] - shift, w[2]];
    ws.forEach((v,i) => acc[i] += x.n * v);
  });
  /* largest-remainder, so the three parts sum to total and not total±2 */
  const floors = acc.map(v => Math.floor(v));
  let short = r.total - floors.reduce((a,b) => a+b, 0);
  const order = acc.map((v,i) => [i, v - Math.floor(v)]).sort((a,b) => b[1] - a[1]);
  for (let i = 0; i < order.length && short > 0; i++, short--) floors[order[i][0]]++;
  return { total:r.total,
    parts: AUDIENCE_PERSONAS.map((k,i) => ({ k, n:floors[i], pct: floors[i] / r.total * 100 })) };
}

/* The portfolio as one bar. Four slices of the program count — which is
   what makes a bar honest here and four stat tiles dishonest. */
const PORTFOLIO_SEGS = [
  { key:'unscoped',  label:'Not scoped', tone:'warn',
    note:'waiting on H2S to scope it with you' },
  { key:'initiated', label:'Initiated',  tone:'mid',
    note:'being authored — not announced to anyone' },
  { key:'live',      label:'Live',       tone:'ok',
    note:'running now, on the network' },
  { key:'closed',    label:'Closed',     tone:'off',
    note:'finished — their overview is the report' }
];
function portfolioOf(cust){
  const ids = (cust && cust.programs) || [];
  const n = { unscoped:0, initiated:0, live:0, closed:0 };
  ids.forEach(id => {
    const s = ((cust.specs || {})[id]) || {};
    const st = stageOf(s);
    if (st === 'closed') n.closed++;
    else if (st === 'live' || st === 'outreach') n.live++;
    else if (s.scoped || Object.keys(s).length) n.initiated++;
    else n.unscoped++;
  });
  return { total: ids.length,
    segs: PORTFOLIO_SEGS.map(s => Object.assign({}, s, { n: n[s.key] })) };
}

/* Registrations over time — one series, cumulative, across the org's
   programs or one of them. Shaped off the authored registration window
   so moving a date moves the curve; sign-up is front-loaded, which is
   what a real hackathon curve does. Illustrative, like funnel(). */
function regSeries(cust, onlyId){
  const ids = ((cust && cust.programs) || []).filter(id => !onlyId || id === onlyId);
  const curves = [];
  let lo = null, hi = null;
  ids.forEach(id => {
    const s = ((cust.specs || {})[id]) || {};
    const tot = (funnel(s, id).actual || {}).registrations || 0;
    if (!tot) return;
    const d = (typeof progDesign === 'function') ? progDesign(cust, id) : { timeline:{} };
    const a = d.timeline.regOpen, b = d.timeline.regClose;
    if (!a || !b || b < a) return;
    const t0 = new Date(a + 'T00:00:00Z').getTime(), t1 = new Date(b + 'T00:00:00Z').getTime();
    const span = Math.max(1, Math.round((t1 - t0) / 86400000));
    const jr = rng(hashStr(id + 'curve'));
    /* front-loaded with a closing spike — the two things a real sign-up curve
       does, and nothing in between worth faking */
    let w = [], sum = 0;
    for (let i = 0; i <= span; i++){
      const x = i / span;
      const v = Math.exp(-x * 2.4) + (x > 0.88 ? 1.7 * (x - 0.88) / 0.12 : 0) + jr() * 0.12;
      w.push(v); sum += v;
    }
    let run = 0;
    const byDay = w.map(v => { run += tot * v / sum; return run; });
    curves.push({ t0, span, byDay, tot });
    if (lo === null || t0 < lo) lo = t0;
    if (hi === null || t1 > hi) hi = t1;
  });
  if (!curves.length) return [];

  /* One daily grid across the union of every window, and each program's total is
     CARRIED FORWARD past its own close. Summing the curves on a union of their
     dates instead — the obvious version — makes the line dip every time a date
     belongs to only one program, which is a chart that lies about the direction
     of its own metric. */
  const days = Math.round((hi - lo) / 86400000);
  const step = Math.max(1, Math.ceil(days / 40));            // ~40 points, readable
  const out = [];
  for (let i = 0; i <= days; i += step){
    const t = lo + i * 86400000;
    let n = 0;
    curves.forEach(cv => {
      const k = Math.round((t - cv.t0) / 86400000);
      if (k < 0) return;
      n += k >= cv.byDay.length ? cv.tot : cv.byDay[k];
    });
    out.push({ d: new Date(t).toISOString().slice(0,10), n: Math.round(n) });
  }
  return out;
}

/* Reach by region, weighted the same way the outreach plan is — so the
   two panels cannot disagree about where this org's pull is. */
function reachByRegion(cust){
  const r = reachFor(cust);
  if (!r.total) return [];
  const hq = (cust || {}).hq;
  const raw = NETWORK_SPLIT.map(([region, pc]) => [region, pc * (region === hq ? 1.4 : 1)]);
  const tot = raw.reduce((a,[,v]) => a + v, 0);
  return raw.map(([region,v]) => ({ region, n: Math.round(r.total * v / tot), hq: region === hq }))
            .sort((a,b) => b.n - a.n);
}
