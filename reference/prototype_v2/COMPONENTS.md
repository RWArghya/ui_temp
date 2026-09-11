# Component map — for the React port

Start with `CLAUDE.md` (what this repo is, current porting scope, migration
notes if a React build already exists) and `PHASES.md` (what's actually
built vs. stubbed) before this file.

This prototype is deliberately split into two layers so that porting it to
React later is closer to a translation than a rewrite. Read this before
porting, and update it when you add or rename anything in `shell.js`.

## The split

| Layer | Files | Becomes, in React |
|---|---|---|
| **State / model / business rules** | `app.js`, `data.js`, `journey.js` | Hooks + pure selector functions. Logic is already framework-agnostic — no DOM reads except a few `mountX()` helpers noted below. |
| **Presentation / chrome** | `shell.js`, `icons.js`, `styles.css` | Components. Each function below returns an HTML string today; it returns JSX tomorrow. |
| **Pages** | every other `*.html`'s inline `<script>` | Route components / pages. Each one composes the shell components above and calls into the model layer for data. |

Nothing in `app.js`/`data.js`/`journey.js` touches `document` except: `avatarInto()`,
`mountBell()`'s call site, and the few `el(id).value` reads inside page scripts
(those belong to the *page*, not the model, and won't survive the port anyway —
a React page reads its own form state, not the DOM).

## Naming convention (apply during the port, not retrofitted now)

- **PascalCase** function in `shell.js` → returns a **component's** full markup
  (`Sidebar`, `Topbar`, `ProfileProgressCard`, `ProfileChecklist`).
- **camelCase** function → a small **helper/selector**, not a component on its
  own (`statusPill`, `purposeMeta`, `daysLeftLabel`, `progressPctFor`).
- This convention was adopted partway through the build, so a few
  component-shaped functions are still camelCase (`initiativeCard`,
  `continueCard`, `quickAction`). Renaming them (`initiativeCard` →
  `InitiativeCard`) is a pure find-and-replace across the `*.html` files that
  call them — do it as the first step of the port, not before, so the diff
  during the actual port stays small and mechanical.

## Component inventory (`shell.js`)

| Function | Intended component | Props (today's call signature) | Notes |
|---|---|---|---|
| `Sidebar(opts)` | `<Sidebar>` | `{ mode, active, persona, st }` | `mode` picks the nav list (`NAV_INNOVATOR` vs `NAV_MENTOR(st)`); `active` highlights one item. The mentor nav's dimmed items (`.soft`) are role-derived, not a prop — port `NAV_MENTOR` as a `useMemo`/selector over user state. |
| `Topbar(opts)` | `<Topbar>` | `{ st }` | Deliberately minimal: bell + avatar-link only (search and account-name were removed by design, see below). |
| `mountBell` / `paintBell` / `toggleBell` | internal to `<NotificationBell>` | `who` (persona key) | These three exist only because there's no framework state — in React this collapses to one component with local `useState` for open/closed and a `notesFor(who)` selector for the list. |
| `togglePersonaMenu` / `toggleSettingsMenu` | internal to `<Sidebar>` | — | Same story: DOM-toggled popovers standing in for `useState`. |
| `statusPill(status)` | `<StatusPill status>` | `status: 'live'\|'upcoming'\|'past'\|'inprogress'` | Pure — trivial to port. |
| `purposeMeta(purpose)` | n/a (selector) | `purpose` | Returns `{ cover, ico, label }` per purpose. Feed it a design-token map in React rather than hardcoded hex in the icon-chip color (see the inline `style=` in `initiativeCard` — that should become a CSS class or a token lookup, it was left inline here only to avoid inventing more one-off classes mid-build). |
| `initiativeCard(o, opts)` | `<InitiativeCard>` | `o` (an `INITIATIVES[]` row), `opts: { dest, progress, cta, stepLabel }` | The one card component behind both "Recommended for you" and "Continue where you left off" — `continueCard` is a thin preset of this, not a separate component. Keep that relationship in React (`ContinueCard = (props) => <InitiativeCard dest="workspace" progress ... />`). |
| `continueCard(o, next)` | preset of `<InitiativeCard>` | `o`, `next` (a journey "what's next" row) | See above — don't reimplement, wrap. |
| `progressPctFor(o, st)` | n/a (selector) | `o`, `st` | Reads `journeyFor`/`reachedFor` from the model layer — port as-is, it's already pure. |
| `ProfileChecklist(st)` | `<ProfileChecklist>` | `st` (full user state) | Iterates `PROFILE_STEPS` (in `app.js`) — that array is the single source of truth for both label text and display order. One row = one "done" signal (a circular check at the row's end) or one "Next" button in that same slot. Never add a second signal (a leading box, strikethrough, a "Completed" badge) — that was the bug this doc was written to prevent regressing on. |
| `ProfileProgressCard(st)` | `<ProfileProgressCard>` | `st` | Wraps `ProfileChecklist` with the ring + CTA. `homeRail()` in `app.html` hides it entirely at 100% — port that as the component returning `null`, not a CSS `display:none` (the surrounding grid reflow depends on the column actually being absent, see `styles.css`'s `.shell:not(.has-rail) .grid.g3` rule). |
| `toast(msg)` | `<Toast>` / a toast context | `msg` | Currently a fire-and-forget DOM node with a timeout. Standard toast-provider territory in React. |
| `window.loadSampleActivity` | dev-only utility | — | Not a component. Keep it out of the production bundle; it exists purely so this prototype isn't a wall of empty states on first load. |

## Page inventory

| File | Route (suggested) | Reads from model layer |
|---|---|---|
| `index.html` | `/` | `VIEWS`, `authAreaHTML` |
| `auth.html` | `/auth` | `S`, account fields |
| `onboarding.html` | `/onboarding` | `VIEWS`, `PS_BANK`, `REGIONS`, `landingKey` |
| `app.html` | `/app` + subroutes (`?view=` → real routes: `/app`, `/app/learning`, `/app/competing`, `/app/build`, `/app/continuing`, `/app/recommended`, `/app/saved`, `/app/recent`, `/app/mentor/*`) | almost everything — this file is the router today; in React it becomes a route tree, and each `xMain(st)` function becomes that route's page component |
| `initiative.html` | `/initiatives/:id` | `regWindow`, `eligibility`, `problemStatements`, `openTeams`, `modules` |
| `workspace.html` | `/workspace/:id` (`?step=` → nested route or local state) | the whole gate/journey surface in `app.js` — this page is the thinnest possible wrapper around it on purpose |
| `mentor.html` | `/mentor/:challengeId` (`?t=` → nested route) | mirrors `workspace.html`'s relationship to its model logic |
| `profile.html` | `/profile` | **stub** — real design to be plugged in; the shell (`Sidebar`/`Topbar` mount, onboarding/auth guard) is already correct and won't need to change when the real page lands |
| `customer-register.html` | `/enterprise/register` | `PROGRAMS`, `REGIONS` — phase 3 |
| `customer.html` | `/sponsor` + subroutes (`?v=` → `/sponsor`, `/sponsor/programs`, `/sponsor/talent`) | `programPulse`, `funnel`, `participantsFor` — phase 3, sidebar via `NAV_SPONSOR`/`Sidebar({mode:'sponsor'})` |
| `program.html` | `/sponsor/programs/:key` | `progDesign`, `designBlockers`, `programById` — one file covers the about/scope-form/scoped-summary states by branching on program state, deliberately not three separate pages |
| `program-signoff.html` | `/sponsor/programs/:key/sign-off` | `signoffTerms`, `signoffDrift`, `signoffOf` |
| `participants.html` | `/sponsor/programs/:key/talent` (and later an Enabler route via `?as=enabler`) | `participantsFor` |
| `sponsor.html` | `/contact-sales` | placeholder lead form, not phase-3 critical |

## Integration seams worth knowing before the port

- **`profile.html` is intentionally thin.** Every link into it (`ProfileChecklist`'s
  "Next" buttons, the mentor dashboard's "change" link, workspace's certificate
  link) already uses stable query params (`?focus=<PROFILE_STEPS key>`,
  `?tab=certs`). When the real profile page lands, wire those params up; no
  other file needs to change.
- **`PROFILE_STEPS` (`app.js`) is the only place profile-completion field
  names, labels, and order live.** The checklist, the weighted `%`, and (once
  it exists) the real profile page's field order should all read from it
  rather than repeating the list.
- **State lives in one `localStorage` key (`h2s`) behind the `S` object.**
  Porting to a real backend means replacing `S.read()`/`S.save()`'s
  implementation — every call site elsewhere is already written against that
  interface, not against `localStorage` directly.
