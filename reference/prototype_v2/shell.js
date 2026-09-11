/* ============================================================================
   shell.js — the app-shell component layer for prototype_v2.

   Each function here returns (or mounts) markup for one reusable piece of
   chrome, mapped 1:1 to what would become a React component later:
   Sidebar, Topbar, RightRail cards, Pill, InitiativeCard, ProgressRing.

   Depends on: icons.js (Icon), app.js (S, notify/notesFor, hats, avatarHTML,
   initials, PERSONAS, rolesFor). Load order in every page:
     icons.js -> data.js -> app.js -> journey.js -> shell.js -> page script
   ============================================================================ */

/* ---------------------------------------------------------- nav definitions */
const NAV_INNOVATOR = [
  { k:'home',        label:'Dashboard',   ico:'Home',      href:'app.html' },
  { k:'learning',    label:'Learn',       ico:'BookOpen',  href:'app.html?view=learning' },
  { k:'competing',   label:'Compete',     ico:'Trophy',    href:'app.html?view=competing' },
  { k:'learncompete',label:'Build',       ico:'Wrench',    href:'app.html?view=learncompete' },
  { k:'arena',       label:'Arena',       ico:'Gamepad2',  href:'app.html?view=arena', disabled:true }
];
const NAV_INNOVATOR_UTILITY = [
  { k:'saved',  label:'Saved',  ico:'Bookmark', href:'app.html?view=saved' },
  { k:'recent', label:'Recent', ico:'Clock',    href:'app.html?view=recent' }
];
function NAV_MENTOR(st){
  st = st || S.read();
  const status = mentorStatus(st);
  const mapped = approvedChallenges(st).length > 0;
  const out = [{ k:'mentor', label:'Mentor home', ico:'Home', href:'app.html?view=mentor' }];
  if (status === 'approved')
    out.push({ k:'m_challenges', label:'My challenges', ico:'Flag', href:'app.html?view=m_challenges' });
  const dim = status !== 'approved' || !mapped;
  out.push(
    { k:'m_queue',   label:'Evaluation queue',   ico:'ClipboardCheck', href:'app.html?view=m_queue',   soft:dim },
    { k:'m_teams',   label:'Teams & office hours', ico:'Users',        href:'app.html?view=m_teams',   soft:dim },
    { k:'m_sessions',label:'Booked sessions',    ico:'Calendar',       href:'app.html?view=m_sessions',soft:dim },
    { k:'m_impact',  label:'Impact',             ico:'TrendingUp',     href:'app.html?view=m_impact',  soft:dim }
  );
  return out;
}

const NAV_SPONSOR = [
  { k:'overview', label:'Overview',    ico:'Home',      href:'customer.html' },
  { k:'programs', label:'Programs',    ico:'Layers',    href:'customer.html?v=programs' },
  { k:'talent',   label:'Talent Pool', ico:'Users',     href:'customer.html?v=talent' }
];

/* ---------------------------------------------------------------- sidebar */
function Sidebar(opts){
  opts = opts || {};
  const mode = opts.mode || 'innovator';
  const active = opts.active !== undefined ? opts.active : 'home';
  const st = opts.st || S.read();
  const nav = mode === 'mentor' ? NAV_MENTOR(st) : mode === 'sponsor' ? NAV_SPONSOR : NAV_INNOVATOR;
  const persona = (PERSONAS.find(p => p.k === opts.persona) || PERSONAS[0]);

  const navLink = n => n.disabled
    ? `<span class="side-link disabled" title="Coming soon">${Icon(n.ico, {size:18})}<span>${n.label}</span><span class="pill pill-outline xs" style="margin-left:auto">Soon</span></span>`
    : `<a class="side-link${n.k === active ? ' active' : ''}${n.soft ? ' soft' : ''}" href="${n.href}">
        ${Icon(n.ico, {size:18})}<span>${n.label}</span>
      </a>`;

  return `
  <aside class="app-sidebar">
    <a class="brand" href="index.html">
      <span class="brand-mark">H2S</span>
      <span class="brand-name">Hack2skill</span>
    </a>
    <nav class="side-nav">
      ${nav.map(navLink).join('')}
      ${mode === 'innovator' ? `
        <div class="divider" style="margin:8px 4px"></div>
        ${NAV_INNOVATOR_UTILITY.map(navLink).join('')}
      ` : ''}
    </nav>
    <div class="side-spacer"></div>
    <div class="side-foot">
      <div style="position:relative">
        <button class="persona-pill-btn" id="personaBtn" onclick="togglePersonaMenu()">
          ${Icon(persona.ico, {size:16})}<span>${persona.label}</span>
          <span style="margin-left:auto;display:flex">${Icon('ChevronUp',{size:15})}</span>
        </button>
      </div>
      <div class="divider" style="margin:2px 4px"></div>
      <div style="position:relative">
        <button class="side-link" id="settingsBtn" onclick="toggleSettingsMenu()" style="width:100%">
          ${Icon('Settings',{size:18})}<span>Settings</span>
        </button>
      </div>
      <a class="side-link" href="index.html">${Icon('LogOut',{size:18})}<span>Log out</span></a>
    </div>
  </aside>`;
}

function toggleSettingsMenu(){
  const old = document.getElementById('settingsMenu');
  if (old){ old.remove(); return; }
  const menu = document.createElement('div');
  menu.className = 'persona-menu'; menu.id = 'settingsMenu';
  menu.innerHTML = `
    <div class="tag-line">Prototype utilities</div>
    <button onclick="if(confirm('Load sample activity for this demo?')){window.loadSampleActivity && window.loadSampleActivity();location.reload();}">${Icon('Sparkles',{size:16})}<span>Load sample activity</span></button>
    <button onclick="if(confirm('Reset all prototype data?')){S.reset();location.href='index.html';}">${Icon('Trash2',{size:16})}<span>Reset prototype data</span></button>`;
  document.getElementById('settingsBtn').parentElement.appendChild(menu);
  setTimeout(() => document.addEventListener('click', function away(e){
    const m = document.getElementById('settingsMenu');
    if (m && !m.contains(e.target) && !e.target.closest('#settingsBtn')){ m.remove(); document.removeEventListener('click', away); }
  }), 0);
}

function togglePersonaMenu(){
  const old = document.getElementById('personaMenu');
  if (old){ old.remove(); return; }
  const st = S.read();
  const menu = document.createElement('div');
  menu.className = 'persona-menu'; menu.id = 'personaMenu';
  menu.innerHTML = `
    <div class="tag-line">View as — prototype only</div>
    ${PERSONAS.map(p => `<a class="${location.pathname.indexOf(p.href.split('?')[0]) !== -1 && (p.href.indexOf('view=mentor') === -1 || location.search.indexOf('view=mentor') !== -1) ? 'on' : ''}" href="${p.href}">
      ${Icon(p.ico, {size:16})}<span>${p.label}</span>
    </a>`).join('')}`;
  document.getElementById('personaBtn').parentElement.appendChild(menu);
  setTimeout(() => document.addEventListener('click', function away(e){
    const m = document.getElementById('personaMenu');
    if (m && !m.contains(e.target) && e.target.id !== 'personaBtn' && !e.target.closest('#personaBtn')){
      m.remove(); document.removeEventListener('click', away);
    }
  }), 0);
}

/* ---------------------------------------------------------------- topbar */
function Topbar(opts){
  opts = opts || {};
  const st = opts.st || S.read();
  return `
  <header class="app-topbar">
    <div class="grow"></div>
    <div class="topbar-actions">
      <div class="bell-wrap" id="bellWrap"></div>
      <a class="avatar-link" href="profile.html" title="Profile">${avatarHTML(st)}</a>
    </div>
  </header>`;
}

function mountBell(who){
  const wrap = document.getElementById('bellWrap');
  if (!wrap) return;
  wrap.innerHTML = `<button class="bell-btn" id="bellBtn" onclick="toggleBell('${who}')">
    ${Icon('Bell', {size:17})}<span class="bell-dot" id="bellDot" style="display:none"></span>
  </button>`;
  paintBell(who);
}
function paintBell(who){
  const dot = document.getElementById('bellDot');
  if (!dot) return;
  const n = unreadFor(who);
  dot.textContent = n > 9 ? '9+' : n;
  dot.style.display = n ? 'grid' : 'none';
}
function toggleBell(who){
  const open = document.getElementById('bellPanel');
  if (open){ open.remove(); return; }
  const list = notesFor(who);
  const panel = document.createElement('div');
  panel.className = 'bell-panel'; panel.id = 'bellPanel';
  panel.innerHTML = `
    <div class="bell-head">
      <strong class="small">Notifications</strong>
      ${list.length ? `<button class="btn btn-quiet btn-sm" onclick="markRead('${who}');paintBell('${who}');
        document.getElementById('bellPanel').remove()">Mark all read</button>` : ''}
    </div>
    <div class="bell-list">
      ${list.length ? list.map(n => `
        <a class="bell-item ${n.read ? '' : 'unread'}" ${n.link ? `href="${n.link}"` : ''}>
          <div class="row between gap8">
            <strong class="small">${n.title}</strong>
            <span class="xs faint" style="white-space:nowrap">${timeAgo(n.at)}</span>
          </div>
          <p class="xs muted mt4">${n.body}</p>
        </a>`).join('')
      : `<div class="bell-empty"><p class="small muted">Nothing yet.</p>
         <p class="xs faint mt8">Actions by other people — an approval, a score, a stage change — land here.</p></div>`}
    </div>`;
  document.getElementById('bellWrap').appendChild(panel);
  markRead(who);
  setTimeout(() => paintBell(who), 1200);
  setTimeout(() => document.addEventListener('click', function away(e){
    const p = document.getElementById('bellPanel');
    if (p && !p.contains(e.target) && !e.target.closest('#bellBtn')){ p.remove(); document.removeEventListener('click', away); }
  }), 0);
}

/* mounts the parts of the shell that need JS after the static HTML lands */
function mountShell(who, persona){
  mountBell(who || 'you');
}

/* ---------------------------------------------------------------- pills */
function statusPill(status){
  const map = {
    live:      ['pill-live', 'dot', 'Live'],
    upcoming:  ['pill-upcoming', '', 'Upcoming'],
    past:      ['pill-done', '', 'Completed'],
    inprogress:['pill-progress', '', 'In Progress']
  };
  const [cls, dot, label] = map[status] || ['pill', '', status];
  return `<span class="pill ${cls}">${dot ? '<span class="pill-dot"></span>' : ''}${label}</span>`;
}
const PURPOSE_META = {
  competing:    { cover:'c-competing',    ico:'Trophy',  label:'Compete' },
  learning:     { cover:'c-learning',     ico:'BookOpen',label:'Learn' },
  learncompete: { cover:'c-learncompete', ico:'Wrench',  label:'Build' }
};
const purposeMeta = p => PURPOSE_META[p] || PURPOSE_META.competing;

function daysLeftLabel(deadline){
  if (!deadline) return '';
  const d = daysLeft(deadline);
  if (d < 0) return 'Closed';
  if (d === 0) return 'Closes today';
  return `Closes in ${d}d`;
}

/* ---------------------------------------------------------------- cards
   One card body for both "Recommended for you" and "Continue where you left
   off" — the only difference is a progress bar and which page the card (and
   its single CTA) points to. Clicking anywhere on the card opens that same
   destination; the bookmark is the one other control, and it never navigates
   (stopPropagation) — that is the whole "one unambiguous action" rule. */
function initiativeCard(o, opts){
  opts = opts || {};
  const st = S.read();
  const meta = purposeMeta(o.purpose);
  const saved = isSaved(o.id, st);
  const dest = opts.dest === 'workspace' ? 'workspace.html?id=' + o.id : 'initiative.html?id=' + o.id;
  const showProgress = !!opts.progress;
  const pct = showProgress ? progressPctFor(o, st) : 0;
  const ctaLabel = opts.cta || (opts.dest === 'workspace' ? 'Continue' : (o.purpose === 'learning' ? 'Enrol' : 'View'));

  return `
  <div class="init-card" onclick="location.href='${dest}'">
    <div class="init-cover ${meta.cover}">
      <span class="icon-chip round" style="color:${meta.cover === 'c-competing' ? '#3557d6' : meta.cover === 'c-learning' ? '#0f9c7a' : '#d9820a'}">${Icon(meta.ico,{size:17})}</span>
    </div>
    <div class="init-body">
      <div class="row between gap8">
        ${statusPill(showProgress && o.status !== 'past' ? 'inprogress' : o.status)}
        <span class="xs faint">${o.mode || ''}</span>
      </div>
      <div class="row gap8" style="align-items:flex-start">
        <div class="init-name grow">${o.name}</div>
        <button class="btn-icon btn-ghost save-btn${saved ? ' is-saved' : ''}" title="${saved ? 'Saved' : 'Save for later'}"
          onclick="event.stopPropagation();const on=toggleSaved('${o.id}');this.classList.toggle('is-saved',on);toast(on?'Saved for later':'Removed from saved');">
          ${Icon('Bookmark',{size:15})}
        </button>
      </div>
      <div class="init-org">${o.org} · ${o.region || ''}</div>
      <div class="init-meta">
        ${(o.areas || []).slice(0,3).map(a => `<span class="pill pill-outline">${a}</span>`).join('')}
      </div>
      ${showProgress ? `<div class="pbar mt10"><i style="width:${pct}%"></i></div>
        <div class="row between gap4 mt6"><span class="xs faint">${opts.stepLabel || ''}</span><span class="xs faint">${pct}%</span></div>` : ''}
      <div class="init-foot">
        <span class="xs muted">${o.prize ? o.prize + ' · ' : ''}${daysLeftLabel(o.deadline)}</span>
        <a class="btn btn-primary btn-sm" href="${dest}">${ctaLabel} ${Icon('ArrowRight',{size:13})}</a>
      </div>
    </div>
  </div>`;
}

/* continue-card — "Continue where you left off": same card, workspace-bound, with progress */
function continueCard(o, next){
  return initiativeCard(o, { dest:'workspace', progress:true, cta:'Continue', stepLabel: next ? next.step : '' });
}

/* rough visual progress — reads the same reachedFor()/journeyFor() the
   workspace stepper uses, so the % here can never disagree with it */
function progressPctFor(o, st){
  const steps = journeyFor(o);
  const reached = toScreenStep(o, reachedFor(o, st));
  return steps.length ? Math.round((Math.min(reached, steps.length - 1) / (steps.length - 1)) * 100) : 0;
}

/* Prototype-only seeding, so a fresh demo isn't a wall of empty states.
   Picks a couple of real seeded initiatives and drives them through the
   real state functions — nothing here is faked data, just fast-forwarded
   real actions. */
window.loadSampleActivity = function(){
  const picks = INITIATIVES.filter(o => o.status !== 'past').slice(0, 2);
  picks.forEach(o => {
    const st = S.read();
    if (!(st.registered || []).includes(o.id)){
      S.save({ registered:(st.registered || []).concat([o.id]) });
      logActivity('You registered for ' + o.name);
    }
  });
  if (picks[1]) toggleSaved(picks[1].id);
  logActivity('You earned 120 XP');
  toast('Sample activity loaded.');
};

/* ---------------------------------------------------------------- profile
   ProfileChecklist / ProfileProgressCard — one canonical component, not
   duplicated per page. Each row has exactly ONE "done" signal (a circular
   check at the end of the row); an incomplete row's ONLY affordance is the
   "Next" button in that same right-hand slot. Deliberately its own class
   names (.check-list-*), not journey.js's .jstep-row — that one is a
   different component (the XP-scored "Getting started" journey) with
   different semantics, and sharing a class between two unrelated
   components is exactly the kind of coupling that makes a later port to
   separate React components error-prone. See COMPONENTS.md. */
function ProfileChecklist(st){
  return PROFILE_STEPS.map(s => {
    const v = st[s.key];
    const ok = s.test ? s.test(v) : !!(v && String(v).trim());
    return `<div class="check-list-row">
      <span class="check-list-label">${s.label}</span>
      ${ok
        ? `<span class="check-list-status" aria-label="Completed">${Icon('Check',{size:12})}</span>`
        : `<a class="btn btn-outline btn-sm" href="profile.html?focus=${s.key}">Next ${Icon('ArrowRight',{size:12})}</a>`}
    </div>`;
  }).join('');
}
function ProfileProgressCard(st){
  const { pct, missing } = profileScore(st);
  return `
  <div class="card card-pad">
    <div class="row between"><h3>Your progress</h3></div>
    <div class="row gap16 mt12">
      <div class="pring" style="--pct:${pct}"><div class="pring-inner">${pct}%</div></div>
      <div class="col">
        <span class="medium small">Profile completion</span>
        <span class="xs muted">${PROFILE_STEPS.length - missing.length} of ${PROFILE_STEPS.length} steps</span>
      </div>
    </div>
    <a class="btn btn-primary btn-block btn-sm mt12" href="profile.html">Complete profile ${Icon('ArrowRight',{size:13})}</a>
    <div class="mt16">${ProfileChecklist(st)}</div>
  </div>`;
}

/* ---------------------------------------------------------------- misc */
function toast(msg){
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap){ wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3600);
}
