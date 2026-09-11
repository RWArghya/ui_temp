# Build status — prototype_v2

Read this alongside `COMPONENTS.md` (the component map) and `CLAUDE.md` (how to
work in this repo / port it). This file is the honest state of "what exists,
what's stubbed, what's not started" — keep it current if you keep building here.

## Phase 1 — Innovator core ✅ done

`index.html`, `auth.html`, `onboarding.html`, `app.html` (Dashboard, Learn,
Compete, Build, Saved, Recent), `initiative.html`, `workspace.html`,
`profile.html` (intentionally a stub — see below).

Fully reworked per the second round of design feedback: Dashboard (not Home),
no search bar, no quick-actions row, "Continue where you left off" and
"Recommended for you" share one card component (`initiativeCard` in
`shell.js`) with a single save toggle and no redundant open-affordances,
"View all" swaps only the main column, Learn/Compete/Build each carry real
filters, the profile-completion card is the *only* right-rail content and
disappears entirely at 100%, and the profile checklist has exactly one "done"
signal (see `COMPONENTS.md`'s `ProfileChecklist` entry for the exact rule —
don't regress it).

**Arena is a deliberate stub** — nav item present but disabled ("Soon"
badge), `app.html?view=arena` still has working code behind it from an
earlier pass but is not reachable from navigation and should not be extended
until the business decides Arena's behaviour. Don't wire it further.

## Phase 2 — Mentor console ✅ done

`mentor.html` (per-challenge console: assignment, availability, sessions,
mentor teams, evaluate, impact) and the mentor dashboard views inside
`app.html` (`?view=mentor`, `m_queue`, `m_teams`, `m_sessions`,
`m_challenges`, `m_impact`). Verified end-to-end including live rubric
scoring (`commit()` in `mentor.html`).

## Phase 3 — Sponsor side ⚠️ partially done

**Built:** `customer-register.html` (3-step signup), `customer.html`
(Overview / Programs / Talent Pool), `program.html` (about a program type →
scope form → scoped/signed-off summary, all one file with internal state —
deliberately consolidated rather than the multi-file
program-new/program-design split v1 used), `program-signoff.html` (review +
snapshot sign), `participants.html` (talent pool, shared by sponsor and,
later, Enabler via `?as=enabler`).

**Verified:** register → pick a program type → the workspace renders it as
"Not scoped". Scope-form validation, save, and sign-off were built against
`programs.js`'s real gates (`designBlockers`, `signoffTerms`,
`signoffDrift`) but the full click-through (filling the scope form → sign
off → seeing the signed summary) was interrupted mid-test and **has not
been re-verified in a browser**. Do that before extending this area further.

**Not built / intentionally simplified vs. v1:**
- The rich multi-panel authoring canvas (`program-design.html`'s rung rail,
  AI-eval/Mentor-Connect feature toggles, custom modules composer) was
  collapsed into one plain scope form on `program.html` covering only what
  `designBlockers()` actually requires (objective/metric, participants,
  timeline, one problem-statement list, submission checkboxes, one judging
  round with editable rubric weights, prizes). AI evaluation and Mentor
  Connect are never enabled from this form — a sponsor cannot currently
  turn those features on. If a future pass needs them, `progDesign()`'s
  `features` shape already supports it; only the form UI is missing.
- No PromptWars/Arena booking for sponsors (consistent with Arena being a
  stub everywhere).
- No "Organisation" / "Support" sponsor sub-nav (v1's `SPONSOR_NAV_ACCT`) —
  `NAV_SPONSOR` in `shell.js` only has Overview / Programs / Talent Pool.
- `participants.html`'s `?as=enabler` branch renders with no sidebar
  (nothing sets that flag yet — it's prepared for Phase 4, not polished).

**programs.js** was copied from prototype_v1 close to verbatim, same as
`app.js`/`data.js`/`journey.js` — it's the logic/gate layer, not something to
rewrite.

## Phase 4 — Enabler + judging ❌ not started

`enabler.html` and `judging.html` (P7–P12: shortlisting, rounds, winners,
close-out) don't exist in prototype_v2 yet. `seed.js` (other people's
accounts — sponsors, mentor applications, mappings, tickets) is already
copied from v1 and unwired, waiting for this phase. This is also where
`initiativeFromProgram()` (the sponsor-program → public-initiative bridge)
gets its UI — right now a signed-off program has no path to actually
becoming a joinable initiative.

## Not ported at all

`evaluate.html` (standalone AI Evaluation tool) and `support.js` (the
support bot) from v1 were never brought into v2. Low priority — both are
self-contained and can be added later without touching anything else.
