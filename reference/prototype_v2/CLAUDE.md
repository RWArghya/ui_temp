# prototype_v2 — read this before porting anything

This folder is a **static HTML/CSS/JS reference prototype** of the Hack2skill
IPUF platform. It is not production code and is not meant to run inside the
React app — it exists so every UX decision, gate, edge case and component
boundary is already settled before you write a single `.tsx` file. Treat it
as the spec, not as code to lift verbatim.

**Read in this order:**
1. This file.
2. `PHASES.md` — what's actually built vs. stubbed vs. not started. Don't
   assume a page exists because it's mentioned somewhere; check there.
3. `COMPONENTS.md` — the function-by-function map from this prototype's
   `shell.js` to intended React components, plus a page → route table.

## Current porting scope: Innovator Dashboard + Profile only

The React codebase's next milestone is **only** the Innovator-facing
dashboard and the user profile — not Learn/Compete/Build's full depth, not
Mentor, not Sponsor, not Enabler. Concretely, port from:

- `app.html` — specifically the `home` view (`homeMain`/`homeRail` in the
  inline script) and its two "view all" destinations (`continuingMain`,
  `recommendedMain`). Learn/Compete/Build (`purposeMain`) are the same
  component family (`InitiativeCard`, filters) and are reasonable to include
  if convenient, but are not the milestone.
- `shell.js` — `Sidebar`, `Topbar`, `initiativeCard`/`continueCard`,
  `ProfileChecklist`/`ProfileProgressCard`, `statusPill`, `purposeMeta`. This
  is the actual component library; everything in `app.html` is composed from
  it.
- `profile.html` — currently a stub in this prototype (the real design was
  being built separately and plugs in here). Wire the shell/guard/query-param
  seams described below even though the page body itself is a placeholder.
- The state layer it all reads from: `app.js`, `data.js`, `journey.js`.

Do not port `mentor.html`, `customer*.html`, `program*.html`,
`participants.html`, `workspace.html`, or `initiative.html` as part of this
milestone. They exist and work (see `PHASES.md`), but are later phases.

## The React codebase currently reflects an OLDER prototype — supersede it

If the React repo already has Innovator/Dashboard/Profile components built
against a previous prototype iteration, **prototype_v2 replaces that
reference, not supplements it.** The most consequential differences from
whatever came before (verify against the actual old components before
assuming, but expect to find and remove these patterns):

- **"Home" is "Dashboard."** Any old component named/labelled `Home` for
  this nav item should be renamed, not duplicated.
- **No global search bar, no quick-actions row.** If the old build has
  either, remove it — this was a deliberate simplification, not an omission.
- **One card component, not two.** `initiativeCard` and `continueCard` are
  the same component; `continueCard` is `initiativeCard` with `dest:
  'workspace', progress: true`. If the old code has a separate
  `ContinueCard`/`RecommendedCard` pair with duplicated markup, collapse them.
- **"View all" navigates within the shell**, not to a separate top-level
  route with its own header — sidebar and (if present) the right rail stay
  mounted; only the main column's content changes. This is the Flipkart-style
  behaviour `continuingMain`/`recommendedMain` implement.
- **The profile-completion checklist has exactly one "done" signal**: a
  circular check at the end of the row, or (mutually exclusive) a "Next"
  button in that same slot. No leading checkbox, no strikethrough, no
  separate "Completed" badge. This was a real bug in an earlier pass of this
  very prototype — if the old React code has any of those extra signals,
  that's the same bug, fix it the same way.
- **The right rail is not a fixed sidebar of widgets.** Below 100% profile
  completion it shows *only* the profile card (no Recent Activity, no Saved
  Initiatives widgets — those are left-nav destinations, not rail content).
  At 100% it is removed *entirely*, and the grid it leaves behind reflows
  to use the freed width (`.shell:not(.has-rail) .grid.g3` in `styles.css` —
  in React this is "the rail component returns `null`", not `display:none`).
- **Topbar shows the avatar only** — no name text, no dropdown. Clicking it
  navigates straight to `/profile`. Settings and logout moved to the
  sidebar's footer, replacing an earlier "pinned initiative" card that used
  to live there.
- **Icons are line icons with lucide-react names** (`Icon('BookOpen')`,
  `Icon('ClipboardCheck')`, …), not emoji. See "Icons" below — this is
  meant to be closer to a rename than a redesign.

If you're unsure whether something in the old React code is a real
divergence or just a different implementation of the same behaviour, prefer
this prototype's behaviour — it's the one that went through review.

## Architecture (see COMPONENTS.md for the full detail)

Two layers, on purpose:

| Layer | Files | Becomes |
|---|---|---|
| State / business rules | `app.js`, `data.js`, `journey.js` (`programs.js` for Phase 3+) | Hooks + pure selectors. Already framework-agnostic. |
| Presentation | `shell.js`, `icons.js`, `styles.css` | Components — each function returns an HTML string today, JSX tomorrow. |
| Pages | each `*.html`'s inline `<script>` | Route components, composing the two layers above. |

State lives in one `localStorage` key (`h2s`) behind `S.read()`/`S.save()`.
Every derived fact (profile %, journey position, gate eligibility) is
**computed on read, never cached as a flag** — if you find yourself wanting
to add an `isComplete` boolean anywhere, there's already a function that
answers that question; find it instead (`profileScore`, `reachedFor`,
`regWindow`, etc. in `app.js`/`data.js`).

## Known gotchas (things that will bite you if you don't know them)

- **`.tag` uppercases its text via CSS** (`text-transform:uppercase`). Don't
  hardcode uppercase strings expecting them to look normal elsewhere, and
  don't do case-sensitive comparisons against rendered `.tag` text.
- **A duplicate top-level `const`/`function` name loaded on the same page is
  a parse-time `SyntaxError` that silently kills the whole second file** —
  the page renders, every handler in that file is simply undefined. `daysLeft`
  is currently declared in both `data.js` and `programs.js` (pre-existing
  from prototype_v1, not fixed because the later one winning is harmless
  here) — don't let this pattern spread. `check.py` (this repo's own linter,
  not needed in the React repo) catches this class of bug; there's no
  equivalent safety net once this becomes real modules, but ES module
  imports make the failure mode impossible anyway (a real duplicate `const`
  export is a build error, not a silent runtime one) — one more reason this
  particular gotcha mostly disappears once ported.
- **`location.href = x` does not stop script execution.** Every redirect in
  this prototype is followed by `throw` for exactly that reason. Irrelevant
  once you're doing real `<Navigate>`/`router.push()`, but if you're reading
  this prototype's page scripts to understand a flow, don't mistake the
  `throw` for an error path — it's a guard.
- **A full re-render on every keystroke steals focus from the input being
  typed into.** This bit `program.html`'s scope form during the build — text
  fields there commit on `onchange` (blur), not `oninput`, specifically to
  avoid re-rendering mid-keystroke. Not a concern once you're in React with
  controlled inputs and real reconciliation, but if you're porting the
  *behaviour* of a form rather than rewriting it from scratch, don't copy an
  `oninput`-triggers-full-rerender pattern anywhere in this codebase.
- **Never nest an `<a>`/`<button>` inside another `<a>`/`<button>`.** Browsers
  auto-close the outer element at the inner one, which silently breaks
  layout (this happened once in `onboarding.html`'s intent picker — the
  "set as primary" button broke the 3-column grid it was inside). Components
  in this prototype that need a clickable child inside a clickable card use
  `<div role="button" tabindex>` for the outer element instead.

## Design tokens & icons

- Font: Inter, loaded via Google Fonts in `styles.css`. No display/body/mono
  split — one family, weight and size carry the hierarchy.
- Color system: indigo primary (`--primary`), soft pastel icon-chip
  backgrounds (`--chip-*-bg`/`--chip-*-fg`), status pills with a consistent
  soft-background/solid-text pattern (`--ok-soft`/`--ok`, etc.). All tokens
  are CSS custom properties on `:root` in `styles.css` — port them as your
  design-token source, don't re-derive colors from the rendered pages.
- Icons (`icons.js`): every icon is named after its `lucide-react` component
  (`Icon('Home')`, `Icon('BookOpen')`, `Icon('ClipboardCheck')`, …) and drawn
  in the same visual language (24×24, 2px stroke, round caps/joins), but the
  path data was hand-approximated, not copied byte-for-byte from the lucide
  package. Porting is: swap `Icon('Name')` for `<Name />` from
  `lucide-react`, verify visually, move on — a rename with a visual check,
  not a redesign.

## Running this prototype (only needed if you want to click through it)

```
python serve.py     # static server on :8777 with no-cache headers — do NOT
                     # use `python -m http.server`, it caches and you'll edit
                     # a file, reload, and see the old version
python check.py      # syntax-checks every .js and inline <script>, checks
                     # for dead links and duplicate top-level declarations
```

Neither is needed in the React repo. State resets with `S.reset()` in the
console, or via Settings → "Reset prototype data" in the sidebar.
