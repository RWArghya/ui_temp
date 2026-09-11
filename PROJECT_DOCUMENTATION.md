# H2S Frontend — Project Documentation

This document explains how this project is put together, so a new developer can open the
codebase and understand it without asking around. It's written in plain language on purpose —
skip to the section you need using the list below.

1. [What is this project](#1-what-is-this-project)
2. [Getting started](#2-getting-started)
3. [Tech stack](#3-tech-stack)
4. [The big picture](#4-the-big-picture)
5. [Folder guide](#5-folder-guide)
6. [How pages and routing work](#6-how-pages-and-routing-work)
7. [How data is stored (there is no backend yet)](#7-how-data-is-stored-there-is-no-backend-yet)
8. [Styling and design system](#8-styling-and-design-system)
9. [Mock data and connecting a real backend later](#9-mock-data-and-connecting-a-real-backend-later)
10. ["I want to change X, where do I go?"](#10-i-want-to-change-x-where-do-i-go)
11. [Things you should know (current issues)](#11-things-you-should-know-current-issues)
12. [Common problems and fixes](#12-common-problems-and-fixes)

---

## 1. What is this project

This is the frontend for **Hack2skill (H2S)** — a website where companies run hackathons and
challenges, and students/developers ("innovators") join them, learn, build things, and get
certificates.

The project has **two separate parts** living in one codebase:

- **The marketing website** (what you see at `/`) — the public landing page that explains
  what Hack2skill is, shows live stats, testimonials, etc. Anyone can see this without
  logging in.
- **The dashboard app** (what you see at `/dashboard`) — the actual product. Once someone logs
  in, this is where they browse challenges, join teams, submit projects, track their progress,
  and (if they're a mentor) review other people's work.

**There is no real backend yet.** Everything is faked for now:
- The dashboard saves all your data in the browser (`localStorage`) instead of a server.
- The marketing page's "live" numbers come from fake/mock data that pretends to be an API call.

This is intentional — the project was built to look and feel finished so designers/product
people can click through it, while the actual backend gets built separately. When the backend
is ready, we swap the fake data for real API calls (see [section 9](#9-mock-data-and-connecting-a-real-backend-later)).

---

## 2. Getting started

```bash
npm install       # install dependencies (first time only)
npm run dev        # start the app locally — opens on http://localhost:5173
npm run build       # build the production version
npm run lint        # check the code for problems
npm run preview     # preview the production build locally
```

There's no `.env` file needed to run this locally — everything works out of the box because
there's no real backend to connect to yet.

**Suggested first walkthrough:**
1. Run `npm run dev` and open the site — you'll land on the marketing homepage.
2. Click "Log in" — a demo account (`demo@hack2skill.com` / `demo1234`) already exists so you
   can log straight in without signing up.
3. You'll land on `/dashboard`. In the left sidebar, click **"load sample activity"** (small
   link near the bottom, under your name) — this fills your dashboard with fake registrations,
   submissions, etc. so it doesn't look empty.
4. Click around: My Dashboard, Arena, Learn/Compete/Build, Profile, and try switching to
   "Mentor" using the **"View as"** switcher pinned to the bottom-left corner of the screen.

---

## 3. Tech stack

| What | Tool | Notes |
|---|---|---|
| Framework | **React 19** | Plain JavaScript (JSX), no TypeScript |
| Build tool | **Vite** | Fast dev server, `npm run dev` |
| Routing | **React Router v7** | One router file, see [section 6](#6-how-pages-and-routing-work) |
| Styling | **Tailwind CSS v4** | Utility classes, no separate `.css` files per component |
| Component library | **DaisyUI** | Adds ready-made styles for buttons, cards, badges etc. on top of Tailwind |
| HTTP client | **axios** | Set up and ready, but nothing calls it yet (no backend) |
| Linter | **Oxlint** | Run with `npm run lint` — this project does **not** use ESLint |
| Tests | **None yet** | There is no test setup in this project right now |

Everything is plain `.jsx`/`.js` files — no TypeScript, no CSS Modules, no styled-components.

---

## 4. The big picture

Think of the app as two buildings that share a front door:

```
                         index.html → main.jsx → Router
                                        │
                ┌───────────────────────┴────────────────────────┐
                ▼                                                 ▼
        MARKETING SITE (/)                              DASHBOARD APP (/dashboard)
        src/pages, src/components                        src/dashboard/
                                                                  │
   Public. Anyone can see it.                    Private. You need to be
   Has its own header/footer.                    "logged in" to reach it.
   Uses fake/mock API calls for                   Has its own header/sidebar
   "live" numbers and testimonials.               (does NOT reuse the
                                                    marketing site's header).
                                                    Saves everything to the
                                                    browser's localStorage —
                                                    no backend calls at all.
```

These two halves barely talk to each other. The dashboard reads who's "logged in" from a
shared identity store (see [section 7](#7-how-data-is-stored-there-is-no-backend-yet)), and a
few marketing pages link into the dashboard (like "Log in" and "Sponsor"), but they don't share
components, styling tokens, or state beyond that.

---

## 5. Folder guide

```
h2s_frontend/
├─ index.html            # The single HTML page. Sets fonts, page title, and the theme.
├─ package.json           # Dependencies and npm scripts.
├─ API_REQUIREMENTS.md    # A running list of backend APIs this app will need eventually.
└─ src/
   ├─ main.jsx             # The actual entry point — starts React and the router.
   ├─ App.jsx               # NOT USED. Leftover from the project template. Safe to ignore/delete.
   ├─ index.css             # ALL styling tokens (colors, fonts, spacing) live here. See §8.
   │
   ├─ routes/
   │   └─ router.jsx         # Every URL in the app is listed here. Start here to find any page.
   │
   ├─ pages/                # One file per marketing-site page (what shows up at each URL).
   │   ├─ Home.jsx            # The public homepage — just assembles the pieces from components/home/
   │   ├─ About.jsx           # Simple about page.
   │   ├─ Auth.jsx            # Login / signup / forgot password screens.
   │   ├─ Onboarding.jsx      # NOT BUILT YET — just a "coming soon" placeholder.
   │   ├─ Initiatives.jsx     # NOT BUILT YET — placeholder.
   │   ├─ Enterprise.jsx      # NOT BUILT YET — placeholder.
   │   ├─ CustomerRegister.jsx# NOT BUILT YET — placeholder.
   │   ├─ Sponsor.jsx         # NOT BUILT YET — placeholder.
   │   └─ Dashboard.jsx       # ⚠️ NOT the real dashboard — just a leftover placeholder file.
   │                          #    The real dashboard is the whole src/dashboard/ folder below.
   │
   ├─ components/
   │   ├─ home/               # All the building blocks of the homepage (Hero banner, stats,
   │   │                      #  testimonials, pricing-style sections, footer CTA, etc.)
   │   ├─ layout/              # SiteHeader.jsx and SiteFooter.jsx — used on every marketing page.
   │   └─ ui/                  # Small reusable pieces used across the marketing site:
   │                          #  buttons, modals, loading/error states, a "coming soon" page, etc.
   │
   ├─ dashboard/             # ⭐ THE REAL DASHBOARD APP — everything after login lives here.
   │   ├─ Dashboard.jsx        # The dashboard's shell: header, sidebar, navigation, notifications.
   │   ├─ Views.jsx            # The main screens: Home, Compete, Learn, Build.
   │   ├─ Arena.jsx            # "PromptWars" — a mini coding-challenge game inside the dashboard.
   │   ├─ Profile.jsx          # User's profile page, certificates, public profile preview.
   │   ├─ Mentor.jsx           # Everything about becoming/being a mentor.
   │   ├─ Workspace.jsx        # Where you actually do the work for one challenge/course.
   │   ├─ Evaluate.jsx         # A mock "AI evaluates your submission" screen.
   │   ├─ SupportBot.jsx       # The little chat bubble in the corner — answers from fixed rules,
   │   │                       #  not a real AI.
   │   ├─ data.js              # All the fake sample data + the logic that reads it
   │   │                       #  (XP, levels, badges, which challenges exist, etc.)
   │   ├─ store.js             # Saves/loads dashboard data from the browser's localStorage.
   │   └─ ui.jsx               # Small reusable pieces used only inside the dashboard
   │                           #  (Card, Stat box, Pill/badge, etc.)
   │
   ├─ store/
   │   └─ auth.js              # Saves/loads "who is logged in" from localStorage.
   │
   ├─ api/
   │   ├─ axios.js             # Pre-configured HTTP client, ready for when there's a real backend.
   │   └─ mock/                # Fake API functions the homepage uses today (see §9).
   │
   ├─ hooks/                  # Small reusable pieces of React logic (not tied to one screen).
   ├─ data/                   # Small static lists used by the marketing homepage
   │                          #  (client logos, process steps, etc.)
   └─ assets/                 # Images.
```

**Rule of thumb:** if you're changing something on the public website, look in `pages/` and
`components/`. If you're changing something inside the logged-in app, everything you need is
in `dashboard/`.

---

## 6. How pages and routing work

Every URL the app understands is listed in **one file**: `src/routes/router.jsx`. If you're
ever wondering "where does this page come from?", start there.

| URL | What loads | Status |
|---|---|---|
| `/` | Marketing homepage | ✅ Built |
| `/about` | About page | ✅ Built |
| `/auth` | Login / signup | ✅ Built (fake login, see §7) |
| `/onboarding` | — | ❌ Not built (placeholder) |
| `/initiatives`, `/enterprise`, `/customer-register`, `/sponsor` | — | ❌ Not built (placeholders) |
| `/dashboard` | The real dashboard app | ✅ Built |

A "placeholder" page just shows a friendly "not built yet" message instead of a blank screen
or an error — that's on purpose, so nothing looks broken while those pages are still being
designed.

**⚠️ Important gotcha:** inside the dashboard, some buttons try to go to URLs like
`/dashboard/workspace` or `/dashboard/evaluate` (for example, clicking "Continue" on a
challenge, or "AI Evaluation" in the sidebar). But `router.jsx` only knows about the exact URL
`/dashboard` — it doesn't know about anything after that. So **right now, clicking those
buttons shows a blank page.**

This isn't a missing feature — the actual `Workspace.jsx` and `Evaluate.jsx` screens are fully
built. The router just needs one small change to also recognize `/dashboard/workspace` and
`/dashboard/evaluate` as valid URLs. Whoever picks this up next should treat it as the #1 bug
to fix (see [section 11](#11-things-you-should-know-current-issues)).

---

## 7. How data is stored (there is no backend yet)

Since there's no real server, the app uses the browser's built-in storage (`localStorage`) to
remember things between page reloads. There are two separate "buckets":

### Bucket 1 — "Who is logged in" (`src/store/auth.js`)
Saved under the key `h2s_auth`. Holds your name, email, and whether you've finished
onboarding. The first time anyone opens the app, a demo account
(`demo@hack2skill.com` / `demo1234`) is automatically created so "Log in" works right away
without signing up.

### Bucket 2 — "Everything you did in the dashboard" (`src/dashboard/store.js`)
Saved under the key `h2s`. Holds which challenges you joined, your submissions, your profile,
your mentor status, your Arena/PromptWars progress — basically all dashboard activity.

**Important:** a brand-new account starts completely empty on purpose (0 challenges joined,
0% profile complete, etc.) — this matches how a real new user would look. If you want to see
a "full" dashboard with data already in it, click **"load sample activity"** in the sidebar.
This is a deliberate choice, not a bug — don't "fix" it by auto-filling data for every new
account.

**How components read/write this data:** every dashboard screen receives the current saved
data as a prop called `st` (short for "state"), and a function called `sv` to save changes.
You never touch `localStorage` directly in a component — always go through `sv(...)`.

```jsx
// reading data
const registeredCount = st.registered.length

// saving data
sv({ registered: [...st.registered, newChallengeId] })
```

### Bucket 3 — future login token (`token` key)
`src/api/axios.js` is already set up to read a `token` from localStorage and attach it to
every API request, and to log the user out automatically if a request comes back
"unauthorized". Nothing writes this key yet, because there's no real login API to get a token
from. This is just wired up and waiting for the backend.

---

## 8. Styling and design system

**All colors, fonts, spacing and shadows live in one file: `src/index.css`.** There are no
separate `.css` files per component — everything is done with Tailwind utility classes
directly in the JSX, using color/spacing names defined in that one file.

Two things worth knowing:

1. **The marketing site and the dashboard use different color palettes on purpose.** The
   marketing site uses warmer "brand" colors (named things like `signal`, `paper`, `graphite`).
   The dashboard uses a separate, more neutral "control surface" palette (everything prefixed
   `dash-`, like `dash-ink`, `dash-muted`, `dash-line`). Don't mix them — if you're styling
   something inside `src/dashboard/`, use the `dash-*` colors.

2. **DaisyUI's default theme is overridden** to match our brand colors exactly (see the
   `@plugin "daisyui/theme"` block near the top of `index.css`). If a DaisyUI button or badge
   ever looks like the "wrong" color, check that block first before assuming something else is
   broken.

If you need to change a color, font size, or spacing value anywhere in the app, `index.css` is
almost always the right place to start.

---

## 9. Mock data and connecting a real backend later

Since there's no backend, a few places on the **marketing homepage** fake an API call so the
page behaves like it would with real data (shows a loading spinner, then real-looking content,
and can simulate an error). These live in `src/api/mock/`:

- `liveStats.js` — the "live network" numbers on the homepage
- `testimonials.js` — the quotes section
- `challenges.js` — the featured-challenges section

Each one returns a `Promise` (just like a real `fetch`/`axios` call would), so swapping them
for a real API call later is a small, contained change — you don't need to touch the
components that use them.

**`API_REQUIREMENTS.md`** (in the project root) is a running list of every backend endpoint
this frontend will eventually need, with what data it expects back. Whenever you build a new
piece of UI that *should* come from a real API but doesn't exist yet, add a row there instead
of guessing at a fake endpoint.

The dashboard doesn't use mock API calls at all — it just reads/writes `localStorage`
directly (see [section 7](#7-how-data-is-stored-there-is-no-backend-yet)).

---

## 10. "I want to change X, where do I go?"

| I want to change... | Go here |
|---|---|
| Colors, fonts, spacing (marketing site) | `src/index.css` |
| Colors, fonts, spacing (dashboard) | `src/index.css` — look for the `dash-*` tokens |
| The homepage content/layout | `src/pages/Home.jsx` and `src/components/home/` |
| The site header or footer | `src/components/layout/` |
| Login/signup behavior | `src/pages/Auth.jsx` and `src/store/auth.js` |
| Add a new page/URL | `src/routes/router.jsx`, plus a new file in `src/pages/` |
| What challenges/courses exist (fake data) | `src/dashboard/data.js` — look for `INITIATIVES` |
| XP, levels, badges rules | `src/dashboard/data.js` |
| The dashboard's sidebar/header | `src/dashboard/Dashboard.jsx` |
| The Arena / PromptWars game | `src/dashboard/Arena.jsx` |
| The mentor application/queue | `src/dashboard/Mentor.jsx` |
| The support chat bubble replies | `src/dashboard/SupportBot.jsx` |
| Add/remove a fake homepage API | `src/api/mock/` and update `API_REQUIREMENTS.md` |

---

## 11. Things you should know (current issues)

These are known, real gaps in the project today — not things you did wrong.

1. **Clicking into a challenge or "AI Evaluation" shows a blank page.** Explained in
   [section 6](#6-how-pages-and-routing-work) — the router needs one small fix to recognize
   `/dashboard/workspace` and `/dashboard/evaluate` as real URLs. This is the most important
   thing to fix next.
2. **A brand-new account gets stuck on "Onboarding".** After signing up, the app tries to send
   you to `/onboarding`, but that page isn't built yet — it just shows a "coming soon" message.
3. **`src/pages/Dashboard.jsx` is not the real dashboard.** It's an old leftover placeholder
   file with a similar name. The real dashboard is the entire `src/dashboard/` folder. Easy to
   edit the wrong file by accident — double check the path.
4. **The notification bell (🔔) is always empty.** It's fully built and ready to show
   notifications, but nothing in the app currently creates any, so it never has anything to
   show.
5. **The "Enabler" option in the "View as" switcher doesn't do anything** — it's shown but
   disabled on purpose. There's no Enabler screen in this version of the app.
6. **No automated tests exist yet.** If you add one, `src/dashboard/data.js` is the best place
   to start since it's plain functions with no React in them.
7. **`src/App.jsx` is unused** — safe to ignore. The real entry point is `src/main.jsx`.

---

## 12. Common problems and fixes

| Problem | Why it happens / what to do |
|---|---|
| Page goes blank after clicking a button in the dashboard | See issue #1 above — the router is missing a route. |
| New account lands on a "coming soon" page | That's `/onboarding` — it's not built yet (issue #2). |
| Dashboard looks "already complete" on a fresh account | You (or a previous session) clicked "load sample activity". Click **"reset"** in the sidebar to clear it and start fresh. |
| A button looks the wrong color | Check `src/index.css` — the DaisyUI theme block near the top controls this everywhere at once. |
| I changed something but don't see it in the browser | Hard refresh (Ctrl+Shift+R). If that doesn't help, stop and restart `npm run dev`. |
| Lint command fails with a weird error | Make sure you're running `npm run lint` (Oxlint) — this project does not use ESLint, so ESLint configs/extensions won't help. |
| Data looks like it "reset" after reload | Some sample data is generated fresh from a fixed formula each time (not saved) — that's intentional, it keeps things looking consistent without needing to store everything. |

---

*If you change something in the codebase that this document describes, please update the
matching section here too, so it stays useful for the next person.*
