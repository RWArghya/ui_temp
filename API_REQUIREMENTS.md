# Backend API Requirements — Master Specification

Tracks every backend endpoint and data contract assumed by the frontend application across all modules:
- **Dashboard & Workspaces**: [api_req/dashboard.md](file:///c:/Users/MP2KK/ui_temp/api_req/dashboard.md)
- **Profile & Resume Builder**: [api_req/profile.md](file:///c:/Users/MP2KK/ui_temp/api_req/profile.md)
- **Landing & Marketing**: Documented below

Mock implementations live in `src/api/mock/` and `src/dashboard/data.js` behind standard client abstractions.

Status legend: **Mocked / Client-Ready** (implemented against typed mock data or client store, ready for swap) · **TBD** (external marketing stubs).

---

## 1. Dashboard, Catalogs & Workspaces (See [api_req/dashboard.md](file:///c:/Users/MP2KK/ui_temp/api_req/dashboard.md))

| Feature | UI Action | Endpoint | Method | Request | Response Shape | Status |
|---|---|---|---|---|---|---|
| KPI Overview Metrics | Dashboard load (`/dashboard`) | `/api/dashboard/kpis` | GET | Bearer token | `{ totalOngoing: number, coursesEnrolled: number, buildChallenges: number, hackathons: number, savedCount: number }` | Mocked — `src/dashboard/data.js` |
| Active Initiatives | "Continue where you left off" single row | `/api/initiatives/active` | GET | Bearer token | `Initiative[]` (with progress %, active step label, next action) | Mocked — `src/dashboard/data.js` |
| Recommended Initiatives | "Recommended for you" track sections | `/api/initiatives/recommended` | GET | Query: `?limit=12` | `Initiative[]` (sorted by matching user interests & region) | Mocked — `src/dashboard/data.js` |
| Filtered Catalogs | Filter bar in Learn, Build, Compete | `/api/initiatives` | GET | `?purpose=&q=&area=&region=&status=&mode=` | `Initiative[]` | Mocked — `src/dashboard/data.js` |
| My Activity (4 Tabs) | `/dashboard?view=activity` (All, Learn, Build, Compete) | `/api/initiatives/active` | GET | `?purpose=learning\|learncompete\|competing` | `Initiative[]` (filtered by active track) | Mocked — `src/dashboard/ActivityView.jsx` |
| Saved Initiatives | `/dashboard?view=saved` & bookmark click | `/api/initiatives/saved` & `/api/initiatives/:id/save` | GET / POST | `{ saved: boolean }` | `{ success: true, saved: boolean }` | Mocked — `src/dashboard/data.js` |
| Recently Viewed | `/dashboard?view=recent` & opening cards | `/api/initiatives/recent` & `/api/initiatives/:id/recent-view` | GET / POST | — | `Initiative[]` | Mocked — `src/dashboard/data.js` |
| Initiative Details | Opening `/dashboard/initiative?id=:id` | `/api/initiatives/:id` | GET | Path: `id` | Full `<InitiativeDetail>` (syllabus, problem statements, teams) | Mocked — `src/dashboard/data.js` |
| Register Initiative | Clicking "Register" on card preview | `/api/initiatives/:id/register` | POST | Path: `id` | `{ success: true, registeredAt: string }` | Mocked — `src/dashboard/Workspace.jsx` |
| Module Syllabus | Learn track module hub & detail reader | `/api/initiatives/:id/modules` | GET | Path: `id` | `Module[]` (sections, concepts, resources, quiz) | Mocked — `src/dashboard/data.js` |
| Mark Section Done | "Mark section complete →" | `/api/initiatives/:id/modules/:mod/sections/:sec/complete` | POST | Path params | `{ success: true, progressPct: number }` | Mocked — `src/dashboard/data.js` |
| Submit Module Quiz | Quiz assessment submission | `/api/initiatives/:id/modules/:mod/quiz` | POST | `{ answers: Record<number, number> }` | `{ success: true, score: number, passed: boolean }` | Mocked — `src/dashboard/data.js` |
| Claim Certificate | Capstone module completion | `/api/initiatives/:id/certificate/claim` | POST | Path: `id` | `{ success: true, certificateId: string }` | Mocked — `src/dashboard/Workspace.jsx` |
| Submit Prototype | Artifact submission form (Build & Compete) | `/api/initiatives/:id/submissions` | POST | `{ repoUrl, demoUrl, notes, fileAttachment }` | `{ success: true, submissionId: string }` | Mocked — `src/dashboard/Workspace.jsx` |
| Mentor Connect | Toggle mentor support pairing | `/api/initiatives/:id/mentor-connect` | POST | `{ enabled: boolean }` | `{ success: true, mentorRequested: boolean }` | Mocked — `src/dashboard/Workspace.jsx` |
| Innovator Settings | `/dashboard?view=settings` | `/api/profile/me/settings` | GET / PATCH | Partial `<Settings>` | Updated `<Settings>` | Mocked — `src/dashboard/Settings.jsx` |
| Change Password | "Change password" form in Settings | `/api/auth/change-password` | POST | `{ currentPassword, newPassword }` | `{ success: true, message: string }` | Mocked — `authStore.changePassword` |
| Delete Account | Danger Zone → "Delete account" in Settings | `/api/account/me` | DELETE | Bearer token | `{ success: true }` | Mocked — `authStore.clear()` & `S.reset()` |

---

## 2. Profile & Resume Builder (See [api_req/profile.md](file:///c:/Users/MP2KK/ui_temp/api_req/profile.md))

| Feature | UI action | API required | Method | Request | Response | Status |
|---|---|---|---|---|---|---|
| User Profile details | `/profile` load | `/api/profile/me` | GET | Bearer token | Complete Profile Object | Mocked — `src/api/mock/profile.js` |
| Update Profile | Save edits / privacy toggle | `/api/profile/me` | PATCH | Partial `<Profile>` | Updated `<Profile>` | Mocked — `src/api/mock/profile.js` |
| Registered Initiatives | Profile journey / certs / all certs | `/api/initiatives?userId=me` | GET | `userId=me` | `{ completed: [], active: [], pending: [], submittedIds: [] }` | Mocked — `src/api/mock/initiatives.js` |
| Single Certificate View | Direct link or reload `/profile/certificate/:certId` | `/api/certificates/:certId` | GET | `certId` | Certificate Object | Client state with API fallback |
| Public Visitor Profile | Visitor view (`/profile/preview`) | `/api/profile/public/:slug` | GET | `slug` | Filtered public Profile Object | Stubbed in `ProfilePreview.jsx` |
| Export Resume PDF / LaTeX | "Print / Save PDF" & "Export LaTeX (.tex)" | `/api/profile/resume/pdf` & `/api/profile/resume/latex` | POST / Client | `{ profileId, config }` | Binary PDF / Plaintext `.tex` file | Client-side `window.print()` & `latexGenerator.js` |
| Add Section Item | "+ Add" in Education, Projects, Publications, Achievements, Certs, Links | `/api/profile/me/:section` | POST / PATCH | Detailed payload per section | `{ success: true, item }` | Mocked — `src/api/mock/profile.js` |
| Edit Section Item | "Edit" → "Save Changes" on item | `/api/profile/me/:section/:id` | PUT / PATCH | Detailed payload per section | `{ success: true, item }` | Mocked — `src/api/mock/profile.js` |
| Delete Section Item | "Remove" with modal confirmation | `/api/profile/me/:section/:id` | DELETE / PATCH | `id` | `{ success: true, removedId }` | Mocked — `src/api/mock/profile.js` |
| Upload Certificate Proof | "Add certificate image" file picker | `/api/profile/me/certificates/proof` | POST | `multipart/form-data` | `{ proofUrl: string }` | Client FileReader |

---

## 3. Home / Landing Page

| Feature | UI action | API required | Method | Request | Response | Status |
|---|---|---|---|---|---|---|
| Hero live console | Home page load | `/api/network/live-stats` | GET | — | `{ liveInitiatives: number, submissionsThisWeek: number, mentorsMapped: number, partnerInstitutes: string, networkStatus: "live" \| "offline" }` | Mocked — `src/api/mock/liveStats.js` |
| Flagship challenges grid | Home page load | `/api/initiatives?flagship=true` | GET | — | `[{ id, tag, title, description, href }]` | Mocked — `src/api/mock/challenges.js` |
| Testimonials / proof section | Home page load | `/api/testimonials` | GET | — | `[{ id, status: "pending" \| "published", quote?, placeholder?, role }]` | Mocked — `src/api/mock/testimonials.js` |

---

## Mock → Real Backend Swap Guide

1. **Dashboard & Workspaces**:
   - The reactive state store in `src/dashboard/store.js` and queries in `src/dashboard/data.js` map 1:1 to the endpoints defined in [api_req/dashboard.md](file:///c:/Users/MP2KK/ui_temp/api_req/dashboard.md).
   - Swapping local store queries with backend calls involves replacing `rawRead()` / `activeList()` with standard `api.get('/initiatives/active')` hooks.

2. **Profile & Marketing**:
   - Each mock function in `src/api/mock/*.js` returns `Promise<data>` via `mockRequest()`, matching `axios` promises.
   - Replace the mock function bodies with `api.get(...)` / `api.post(...)` without changing component call sites.
