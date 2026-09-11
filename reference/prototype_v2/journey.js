/* ============================================================================
   Journeys — one definition of "what progress means" per persona.

   The right rail on every dashboard reads this file. Each step is DERIVED from
   real state (registrations, submissions, approvals, scores) — nothing here is
   a flag somebody sets by hand, so a rail can never claim progress the rest of
   the product doesn't also show.

   THE RAIL HOLDS TWO QUESTIONS, and demotes one rather than dropping it.
   "Where am I in the process" matters intensely until the path is done, then it's
   answered permanently. "What's next / what closes first" only starts mattering
   once real work is routed to you, and then it never stops. So:

     path incomplete  → the checklist leads; live work sits beneath it (usually
                        empty, which is itself the honest answer)
     path complete    → the checklist collapses to one expandable receipt and the
                        work list takes the primary position

   It collapses rather than disappears because the path isn't purely historical:
   request a new challenge and the mentor's mapping step is live again. A checklist
   that vanished on completion would have nowhere to come back to.

   XP and badges are INNOVATOR-ONLY, on purpose. Only innovatorRail() passes
   `xp:true`; the mentor and sponsor rails render the same checklist with plain
   step progress. A mentor's path is mostly things H2S does TO them — approve,
   map — so scoring it would award points for waiting; a sponsor is a buyer, and
   gamifying a procurement step reads as noise. Both still get the checklist,
   which is the part that actually helps.

   Where XP does apply, steps score from app.js's XP_WEIGHTS — the same table
   xpFor() sums for the profile total — so a "+40 XP" chip and the profile header
   agree by construction. Never hardcode an XP number in a step; add a weight to
   XP_WEIGHTS and reference it.
   ============================================================================ */

/* ---------- step builders ---------- */

function innovatorSteps(st, certCount){
  const reg = (st.registered  || []).length;
  const sub = (st.submissions || []).length;
  return [
    { label:'Account created', done:true, xp:0 },
    { label:'Profile completed', done: profileScore(st).pct === 100, xp: XP_WEIGHTS.profile,
      go:'profile', badge:'⭐ Profile complete' },
    { label:'Registered for your first initiative', done: reg >= 1, xp: XP_WEIGHTS.registered,
      href:'app.html?view=recommended' },
    { label:'Made your first submission', done: sub >= 1, xp: XP_WEIGHTS.submission,
      badge:'🚀 First submission' },
    { label:'Earned your first certificate', done: certCount >= 1, xp: XP_WEIGHTS.certificate,
      badge:'🏅 First certificate' }
  ];
}

function mentorSteps(st){
  const ms     = mentorStatus(st);
  const mapped = approvedChallenges(st).length;
  const scored = Object.keys(st.scores || {}).length;
  return [
    { label:'Account created', done:true },
    { label:'Registered as a mentor', done: ms !== 'none', go:'mentor' },
    { label:'Approved by the H2S team', done: ms === 'approved',
      waiting: ms === 'pending' || ms === 'info' },
    { label:'Mapped to a challenge', done: mapped >= 1 },
    { label:'Scored your first submission', done: scored >= 1 }
  ];
}

/* ---------- what's live right now ----------
   The innovator's version names the JOURNEY step they're stuck on, not just a date:
   a deadline says WHEN, the step says what to click. The mentor's version is
   deadlines, because their work is other people's submissions waiting on them. */
function innovatorNext(st){
  const live = (st.registered || []).map(byId).filter(o => o && o.status !== 'past');
  if (!live.length) return null;
  return {
    title:'What\'s next',
    sub: live.length + ' live initiative' + (live.length === 1 ? '' : 's'),
    rows: live.slice()
      .sort((a,b) => daysLeft(a.deadline) - daysLeft(b.deadline))
      .slice(0, 3)
      .map(o => {
        const n = nextStepFor(o, st);
        const d = daysLeft(o.deadline);
        return { name:o.name, step:n.step, hint:n.hint,
                 when: d < 0 ? 'closed' : d + 'd', urgent: d >= 0 && d <= 3,
                 href:'workspace.html?id=' + o.id };
      })
  };
}
function mentorNext(st){
  const rows = assignmentsFor(approvedChallenges(st), (st.mentorApp || {}).areas || [])
    .filter(q => !((st.scores || {})[q.key]));
  if (!rows.length) return null;
  return {
    title:'What closes first',
    sub: rows.length + ' waiting on your score',
    rows: rows.slice(0, 3).map(q => {
      const o = byId(q.id) || {};
      const d = daysLeft(q.due);
      return { name:q.team, step:o.name || '', hint:'',
               when: d < 0 ? 'overdue' : d + 'd', urgent: d < 0 || d <= 3,
               href:'mentor.html?id=' + q.id };
    })
  };
}
function nextBlock(next){
  if (!next) return '';
  return `
  <div class="card card-pad mt16">
    <div class="row between gap8 mb12">
      <h4>${next.title}</h4>
      <span class="xs faint">${next.sub}</span>
    </div>
    <div class="col">
      ${next.rows.map(r => `<a class="rail-list-item" href="${r.href}">
        <span class="icon-chip sm ${r.urgent ? 'amber' : 'blue'}">${Icon('Clock', {size:15})}</span>
        <span class="col grow" style="min-width:0">
          <span class="small medium truncate">${r.name}</span>
          <span class="xs muted truncate">${r.step}${r.hint ? ' · ' + r.hint : ''}</span>
        </span>
        <span class="xs ${r.urgent ? 'bold' : 'faint'}" style="color:${r.urgent ? 'var(--danger)' : ''}">${r.when}</span>
      </a>`).join('')}
    </div>
  </div>`;
}

/* ---------- renderer ----------
   Shared by all three dashboards so the rail looks and behaves identically
   whichever persona you're viewing as. `steps` is whatever the builders above
   (or customer.html) hand it; this function knows nothing about personas. */
function journeyRail(opts){
  const steps   = opts.steps || [];
  const showXp  = !!opts.xp;
  const doneN   = steps.filter(s => s.done).length;
  const nextUp  = steps.find(s => !s.done);
  const earned  = steps.filter(s => s.done).reduce((n,s) => n + (s.xp || 0), 0);
  const total   = steps.reduce((n,s) => n + (s.xp || 0), 0);
  /* With XP off the ring measures steps completed — the honest thing to show when
     there are no points behind it. */
  const pct     = showXp ? (total ? Math.round((earned / total) * 100) : 0)
                         : (steps.length ? Math.round((doneN / steps.length) * 100) : 0);

  const stepHTML = steps.map(s => {
    const click = s.go   ? ` onclick="show('${s.go}')"`
                : s.href ? ` onclick="location.href='${s.href}'"`
                : '';
    const clickable = s.go || s.href ? ' clickable' : '';
    return `<div class="jstep-row${s.done ? ' done' : ''}${clickable}"${click}>
      <span class="jstep-box">${s.done ? Icon('Check', {size:12}) : ''}</span>
      <span class="jstep-label">${s.label}${
        s.waiting && !s.done ? ' <span class="xs" style="color:var(--warn)">· in review</span>' : ''}</span>
      ${showXp && s.xp ? `<span class="jstep-tag">${s.done ? '+' : ''}${s.xp} XP</span>` : ''}
    </div>`;
  }).join('');

  const complete = !nextUp;
  const next = opts.next || null;

  /* Finished path → one expandable receipt, so the record survives without spending
     the column on it. A plain <details>, no state to keep. */
  const pathBlock = complete ? `
    <details class="card card-pad">
      <summary class="row gap8" style="cursor:pointer;list-style:none">
        <span class="icon-chip sm green">${Icon('CheckCircle2', {size:16})}</span>
        <span class="medium small">${opts.title || 'Getting started'} complete · ${doneN}/${steps.length}</span>
      </summary>
      <div class="mt12">${stepHTML}</div>
      ${showXp && opts.badges && opts.badges.length ? `
        <div class="row wrap gap8 mt16">
          ${opts.badges.map(b => `<span class="pill pill-hat">${b.label}</span>`).join('')}
        </div>` : ''}
    </details>`
  : `
    <div class="card card-pad">
      <div class="row gap16">
        <div class="pring" style="--pct:${pct}"><div class="pring-inner">${pct}%</div></div>
        <div class="col grow">
          <h4>${opts.title || 'Getting started'}</h4>
          <p class="xs muted mt4">${doneN} of ${steps.length} steps</p>
        </div>
      </div>
      <p class="xs muted mt12">${opts.blurb || ''}</p>
      ${opts.levelLabel ? `<p class="xs faint mt6">${opts.levelLabel}</p>` : ''}
      <div class="mt16 col">${stepHTML}</div>
      ${opts.cta ? `<a class="btn btn-primary btn-sm btn-block mt16" href="${opts.cta.href}" onclick="${opts.cta.go ? `show('${opts.cta.go}');return false;` : ''}">${opts.cta.label} ${Icon('ArrowRight',{size:14})}</a>` : ''}
      ${showXp && opts.badges && opts.badges.length ? `
        <div class="mt16" style="border-top:1px solid var(--line-soft);padding-top:12px">
          <span class="tag">Badges</span>
          <div class="row wrap gap8 mt8">
            ${opts.badges.map(b => `<span class="pill pill-hat">${b.label}</span>`).join('')}
          </div>
        </div>`
      : showXp ? `<p class="xs faint mt16" style="border-top:1px solid var(--line-soft);padding-top:12px">
           Badges unlock as you tick steps off.</p>` : ''}
    </div>`;

  /* Order by which question is live. While the path runs it leads and the work list
     follows; once it's done they swap. In the overlap window — everything ticked but
     the last step, which the deadlines are about — the checklist still leads. */
  const workBlock = next ? nextBlock(next)
    : complete ? '' : `<p class="xs faint mt12">${opts.emptyNext || 'Nothing live yet.'}</p>`;

  return complete ? workBlock + '<div class="mt16"></div>' + pathBlock : pathBlock + workBlock;
}

/* Convenience wrappers so each dashboard's call site stays one line. */
function innovatorRail(st, certCount){
  const xp = xpFor(st, certCount), lv = levelFor(xp);
  return journeyRail({
    xp: true,
    title:'Getting started',
    blurb:'Five steps from account to certificate. Each one earns XP.',
    levelLabel:`Level ${lv.level} · ${xp} XP across your whole account`,
    steps: innovatorSteps(st, certCount),
    badges: badgesFor(st, certCount),
    next: innovatorNext(st),
    emptyNext: 'Register for an initiative and it shows up here with its next step.'
  });
}
/* No xp:true — see the header note. The mentor path is status and access, not points. */
function mentorRail(st){
  return journeyRail({
    title:'Your mentor path',
    blurb:'Registration is open to anyone — approval and mapping are ours to do.',
    steps: mentorSteps(st),
    next: mentorNext(st),
    emptyNext: 'Nothing routed to you yet — that starts once a challenge is mapped.'
  });
}
