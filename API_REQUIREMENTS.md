# Backend API Requirements — Home / Landing Page

Tracks every backend endpoint the current UI assumes. Mock implementations live in
`src/api/mock/` behind the same function signature the real `axios` calls will use, so
swapping mock → real is a one-line change per call site (see "Mock → real swap" below).

Status legend: **Mocked** (built against fake data, ready for a real endpoint) · **TBD** (page/feature not yet designed, so the contract is unknown).

## Mocked — implemented against `src/api/mock/`

| Feature | UI action | API required | Method | Request | Response | Status |
|---|---|---|---|---|---|---|
| Hero live console | Home page load | `/api/network/live-stats` | GET | — | `{ liveInitiatives: number, submissionsThisWeek: number, mentorsMapped: number, partnerInstitutes: string, networkStatus: "live" \| "offline" }` | Mocked — `src/api/mock/liveStats.js` |
| Flagship challenges grid | Home page load | `/api/initiatives?flagship=true` | GET | — | `[{ id, tag, title, description, href }]` | Mocked — `src/api/mock/challenges.js` |
| Testimonials / proof section | Home page load | `/api/testimonials` | GET | — | `[{ id, status: "pending" \| "published", quote?, placeholder?, role }]` | Mocked — `src/api/mock/testimonials.js` |
| User Profile details | `/profile` load | `/api/profile/me` | GET | Bearer token | Complete Profile Object | Mocked — `src/api/mock/profile.js` |
| Update Profile | Save edits / privacy toggle | `/api/profile/me` | PATCH | Partial `<Profile>` | Updated `<Profile>` | Mocked — `src/api/mock/profile.js` |
| User Registered Initiatives | Profile journey / certs | `/api/initiatives?userId=me` | GET | `userId=me` | `{ completed: [], active: [], submittedIds: [] }` | Mocked — `src/api/mock/initiatives.js` |
| Public Visitor Profile | Visitor view (`/profile/preview`) | `/api/profile/public/:slug` | GET | `slug` | Filtered public Profile Object | Stubbed in `ProfilePreview.jsx` |
| Export Resume PDF | "Print / Save PDF" | `/api/profile/resume/pdf` | POST | `{ profileId }` | Binary PDF / URL | Client-side `window.print()` / API Req in `api_req/profile.md` |
| Add Section Item | "+ Add" in Education, Projects, Publications, Achievements, Certs | `/api/profile/me/:section` | POST / PATCH | `{ title, org?, link?, proofUrl? }` | `{ success: true, item }` | Mocked — `src/api/mock/profile.js` |
| Edit Section Item | "Edit" → "Save Changes" on item | `/api/profile/me/:section/:id` | PUT / PATCH | `{ title, org?, link?, proofUrl? }` | `{ success: true, item }` | Mocked — `src/api/mock/profile.js` |
| Delete Section Item | "Remove" with modal confirmation | `/api/profile/me/:section/:id` | DELETE / PATCH | `id` | `{ success: true, removedId }` | Mocked — `src/api/mock/profile.js` |
| Upload Certificate Proof | "Add certificate image" file picker | `/api/profile/me/certificates/proof` | POST | `multipart/form-data` | `{ proofUrl: string }` | Client FileReader / API Req in `api_req/profile.md` |

## TBD — destination page not in the reference design

These are linked from the home page (Explore modal, program cards, footer, doors CTA) but
their own UI wasn't provided, so a `PlaceholderPage` stub renders instead. No contract is
assumed yet.

| Feature | UI action | API required | Method | Status |
|---|---|---|---|---|
| Client/partner logos in marquee | Home page load | `/api/partners` (or static asset) | GET | TBD — currently static list in `src/data/clients.js` |
| Initiatives listing / filter by purpose | "See all initiatives", Explore → Learn/Compete/Build | `/api/initiatives?purpose=` | GET | TBD — Initiatives page not designed |
| Enterprise breakdown page | "Full enterprise breakdown" link | TBD | TBD | TBD — Enterprise page not designed |
| Organisation account creation | Doors CTA → "Create organisation account" | TBD | TBD | TBD — form/flow not designed |
| Program-scoped registration | Program card click (`?program=<slug>`) | TBD | TBD | TBD — CustomerRegister page not designed |
| Sponsor / demo request | "Book a demo instead", "Talk to the team", Explore → Sponsor | TBD | TBD | TBD — Sponsor page not designed |
| Login | Header "Log in", Explore → Mentor | `/api/auth/login` | POST | TBD — Auth page not designed; `src/api/axios.js` already assumes a bearer-token + 401-redirect contract for whatever this becomes |

## Mock → real swap

Each mock function in `src/api/mock/*.js` returns `Promise<data>` via `mockRequest()`
(`src/api/mock/mockClient.js`), matching what `src/api/axios.js` calls will return. To go
live: replace the body of e.g. `fetchLiveStats()` with `api.get("/network/live-stats").then(r => r.data)`
and the call sites (`useMockQuery(fetchLiveStats)` in `HeroConsole.jsx`) don't change.
