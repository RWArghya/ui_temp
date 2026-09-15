# Backend API Requirements — Dashboard, Activity & Card Workspaces

Tracks all backend endpoints, data contracts, and request/response specifications for the Dashboard (`/dashboard`), Catalogs (`/dashboard/learning`, `/dashboard/learncompete`, `/dashboard/competing`), My Activity (`/dashboard?view=activity`), and Initiative Workspaces (`/dashboard/workspace` & `/dashboard/initiative`).

Mock implementations and reactive state management live in `src/dashboard/data.js` and `src/dashboard/store.js`.

---

## Endpoints

### 1. Dashboard Home & KPI Overview

| Feature | UI Action | Endpoint | Method | Request Body / Query Params | Expected Response Shape | Client / Mock File |
|---|---|---|---|---|---|---|
| KPI Overview Metrics | Dashboard load (`/dashboard`) | `/api/dashboard/kpis` | `GET` | Headers: Bearer Token | `{ totalOngoing: number, coursesEnrolled: number, buildChallenges: number, hackathons: number, savedCount: number }` | Derived from `activeList(st)` in `src/dashboard/data.js` |
| Active Initiatives | "Continue where you left off" single row & "View all" | `/api/initiatives/active` | `GET` | Headers: Bearer Token | `Initiative[]` (with progress %, active step label, next action) | `activeList(st)` in `src/dashboard/data.js` |
| Recommended Initiatives | "Recommended for you" track sections | `/api/initiatives/recommended` | `GET` | Query: `?limit=12` | `Initiative[]` (sorted by matching user interests & region) | `recommendedList(st)` in `src/dashboard/data.js` |
| Saved Initiatives | Saved page (`/dashboard?view=saved`) | `/api/initiatives/saved` | `GET` | Headers: Bearer Token | `Initiative[]` (user bookmarked initiatives) | `savedList(st)` in `src/dashboard/data.js` |
| Bookmark Toggle | Bookmark icon click on any initiative card | `/api/initiatives/:id/save` | `POST` | Path: `id`, Body: `{ saved: boolean }` | `{ success: true, id: string, saved: boolean }` | `toggleSavedPatch(id, st)` in `src/dashboard/data.js` |
| Recently Viewed | Recent page (`/dashboard?view=recent`) | `/api/initiatives/recent` | `GET` | Headers: Bearer Token | `Initiative[]` (last 12 viewed initiatives) | `recentViews(st)` in `src/dashboard/data.js` |
| Record Recent View | Opening any card or workspace | `/api/initiatives/:id/recent-view` | `POST` | Path: `id` | `{ success: true, recent: string[] }` | `recordRecentPatch(id, st)` in `src/dashboard/data.js` |

---

### 2. Catalogs & Multi-Facet Filtering (Learn, Build, Compete)

| Feature | UI Action | Endpoint | Method | Request Body / Query Params | Expected Response Shape | Client / Mock File |
|---|---|---|---|---|---|---|
| Filtered Catalog Grid | Changing search query or filter selects in Learn/Build/Compete | `/api/initiatives` | `GET` | Query: `purpose=learning\|learncompete\|competing&q=&area=&region=&status=&mode=` | `Initiative[]` (open & live initiatives matching filters) | `purposeOpenList(view, st, filters)` in `src/dashboard/data.js` |
| Filter Available Areas | Filter dropdown population | `/api/initiatives/areas` | `GET` | Query: `purpose=<purpose>` | `string[]` (distinct technology/domain areas for track) | `purposeAreasList(view)` in `src/dashboard/data.js` |
| Filter Available Formats | Filter dropdown population | `/api/initiatives/modes` | `GET` | Query: `purpose=<purpose>` | `string[]` (e.g. `Virtual`, `Hybrid`, `In-person`) | `purposeModesList(view)` in `src/dashboard/data.js` |

---

### 3. "My Activity" 4-Tab Navigation

| Feature | UI Action | Endpoint | Method | Request Body / Query Params | Expected Response Shape | Client / Mock File |
|---|---|---|---|---|---|---|
| All In-Progress | `/dashboard?view=activity` | `/api/initiatives/active` | `GET` | `status=inprogress` | `Initiative[]` | `ActivityView.jsx` (`tab=all`) |
| In-Progress Learn | `/dashboard?view=activity&tab=learning` | `/api/initiatives/active?purpose=learning` | `GET` | `purpose=learning` | `Initiative[]` | `ActivityView.jsx` (`tab=learning`) |
| In-Progress Build | `/dashboard?view=activity&tab=learncompete` | `/api/initiatives/active?purpose=learncompete` | `GET` | `purpose=learncompete` | `Initiative[]` | `ActivityView.jsx` (`tab=learncompete`) |
| In-Progress Compete | `/dashboard?view=activity&tab=competing` | `/api/initiatives/active?purpose=competing` | `GET` | `purpose=competing` | `Initiative[]` | `ActivityView.jsx` (`tab=competing`) |

---

### 4. Initiative Workspace & Details

| Feature | UI Action | Endpoint | Method | Request Body / Query Params | Expected Response Shape | Client / Mock File |
|---|---|---|---|---|---|---|
| Initiative Details | Opening `/dashboard/initiative?id=:id` | `/api/initiatives/:id` | `GET` | Path: `id` | Full `<InitiativeDetail>` (key facts, modules syllabus, problem statements, teams) | `byId(id)` in `src/dashboard/data.js` |
| Register Initiative | Clicking "Register" on unregistered card | `/api/initiatives/:id/register` | `POST` | Path: `id` | `{ success: true, initiativeId: string, registeredAt: string }` | State patch in `src/dashboard/Workspace.jsx` |
| Module Syllabus & Content | Learn track module list & detail | `/api/initiatives/:id/modules` | `GET` | Path: `id` | `Module[]` (sections, concepts, resources, quiz questions) | `modules(o)` in `src/dashboard/data.js` |
| Mark Section Complete | Clicking "Mark section complete →" | `/api/initiatives/:id/modules/:moduleKey/sections/:secId/complete` | `POST` | Path: `id`, `moduleKey`, `secId` | `{ success: true, completedSections: string[], progressPct: number }` | `moduleSectionsDone` in `src/dashboard/data.js` |
| Submit Module Quiz | Submitting assessment in Quiz tab | `/api/initiatives/:id/modules/:moduleKey/quiz` | `POST` | Path: `id`, `moduleKey`, Body: `{ answers: Record<number, number> }` | `{ success: true, score: number, total: number, passed: boolean }` | `moduleQuizState` in `src/dashboard/data.js` |
| Claim Capstone Certificate | Clicking "Claim certificate" upon all modules done | `/api/initiatives/:id/certificate/claim` | `POST` | Path: `id` | `{ success: true, certificateId: string, issuedAt: string, verifyUrl: string }` | Client store cert claim |
| Select Problem Statement | Selecting problem statement radio card (Build track) | `/api/initiatives/:id/problem-statement` | `POST` | Path: `id`, Body: `{ statementCode: string }` | `{ success: true, selectedStatement: ProblemStatement }` | `Workspace.jsx` statement state |
| Join Squad / Team | Clicking "Join squad" in Team step | `/api/initiatives/:id/teams/:teamId/join` | `POST` | Path: `id`, `teamId`, Body: `{ role: string }` | `{ success: true, team: Team }` | `Workspace.jsx` team state |
| Submit Prototype / Build Artifacts | Submitting repository, demo link, notes & file | `/api/initiatives/:id/submissions` | `POST` | `multipart/form-data` or `{ repoUrl: string, demoUrl: string, notes: string, fileAttachment?: string }` | `{ success: true, submissionId: string, submittedAt: string }` | `BuildSubmit` in `src/dashboard/Workspace.jsx` |
| Toggle Mentor Connect | Requesting / toggling mentor assistance | `/api/initiatives/:id/mentor-connect` | `POST` | Path: `id`, Body: `{ enabled: boolean }` | `{ success: true, mentorRequested: boolean }` | `MentorToggle` in `src/dashboard/Workspace.jsx` |

---

### 5. Settings & Account Operations (`/dashboard?view=settings`)

| Feature | UI Action | Endpoint | Method | Request Body / Query Params | Expected Response Shape | Client / Mock File |
|---|---|---|---|---|---|---|
| User Settings | Settings load | `/api/profile/me/settings` | `GET` | Headers: Bearer Token | `{ notifications: Record<string, boolean>, discoverable: boolean, openToTeams: boolean, landingView: string }` | `settingsFor(st)` in `src/dashboard/data.js` |
| Update Preferences | Toggle switch / select dropdown | `/api/profile/me/settings` | `PATCH` | Partial `<Settings>` | Updated `<Settings>` | `Settings.jsx` store patch |
| Change Password | "Change password" form submit | `/api/auth/change-password` | `POST` | `{ currentPassword: string, newPassword: string }` | `{ success: true, message: string }` | `authStore.changePassword` |
| Delete Account | Danger Zone → "Delete account" | `/api/account/me` | `DELETE` | Headers: Bearer Token | `{ success: true }` | `authStore.clear()` & `S.reset()` |

---

## Schemas & Payloads

### `KPIOverview`
```typescript
interface KPIOverview {
  totalOngoing: number;    // Total active registered initiatives (e.g. 7)
  coursesEnrolled: number; // In-progress Learn initiatives (e.g. 3)
  buildChallenges: number; // In-progress Build initiatives (e.g. 2)
  hackathons: number;      // In-progress Compete initiatives (e.g. 2)
  savedCount: number;      // Bookmarked initiatives count
}
```

### `Initiative`
```typescript
interface Initiative {
  id: string;
  name: string;
  org: string;
  purpose: 'learning' | 'learncompete' | 'competing';
  status: 'live' | 'upcoming' | 'past';
  mode: 'Virtual' | 'Hybrid' | 'In-person';
  region: string;
  deadline: string;        // ISO format (e.g. "2026-11-20T23:59:59Z")
  areas: string[];         // e.g. ["AI / GenAI", "Agentic AI"]
  prize?: string;          // e.g. "₹35,00,000" or "IITD Certificate"
  progressPct?: number;    // 0 - 100
  stepLabel?: string;      // Current milestone label (e.g. "Module 2: Agent Architecture")
  features?: {
    mentorConnect?: { enabled: boolean };
  };
}
```

### `SubmissionPayload`
```typescript
interface SubmissionPayload {
  initiativeId: string;
  repoUrl: string;         // GitHub / GitLab repository URL
  demoUrl?: string;        // Live demo or Loom / YouTube walkthrough
  notes?: string;          // Architecture and evaluator notes
  fileAttachment?: string; // Optional uploaded PDF/ZIP binary or URL (max 2MB)
  statementCode?: string;  // e.g. "PS-138"
}
```
