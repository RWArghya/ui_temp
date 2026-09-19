# Backend API Requirements — Dashboard, Catalogs & Workspaces

> **Module**: Initiatives, Workspace & Notifications (`internal/initiatives/`, `internal/workspace/`, `internal/notifications/`)  
> **Route Groups**: `/api/v1/dashboard`, `/api/v1/initiatives`, `/api/v1/certificates`, `/api/v1/notifications`  
> **Client Sources**: [`src/dashboard/Views.jsx`](file:///c:/Users/MP2KK/ui_temp/src/dashboard/Views.jsx), [`src/dashboard/Workspace.jsx`](file:///c:/Users/MP2KK/ui_temp/src/dashboard/Workspace.jsx), [`src/dashboard/PurposeViews.jsx`](file:///c:/Users/MP2KK/ui_temp/src/dashboard/PurposeViews.jsx), [`src/dashboard/Evaluate.jsx`](file:///c:/Users/MP2KK/ui_temp/src/dashboard/Evaluate.jsx), and [`src/pages/CertificateView.jsx`](file:///c:/Users/MP2KK/ui_temp/src/pages/CertificateView.jsx)  
> **Backend Architecture Reference**: [`H2S-Innovator-Dashboard-Backend.md §3`](file:///c:/Users/MP2KK/ui_temp/H2S-Innovator-Dashboard-Backend.md#3-http-layer--chi-with-public-vs-authenticated-route-groups)

---

## 1. Endpoints Overview

### A. Dashboard Home & KPIs (`/api/v1/dashboard`)

| Feature | UI Action | Endpoint | Method | Expected Response Shape |
|---|---|---|---|---|
| **KPI Overview Metrics** | Dashboard load | `/api/v1/dashboard/kpis` | `GET` | `{ totalOngoing: number, coursesEnrolled: number, buildChallenges: number, hackathons: number, savedCount: number }` |

---

### B. Catalogs, Listings & Filtering (`/api/v1/initiatives`)

| Feature | UI Action | Endpoint | Method | Query Parameters | Expected Response Shape |
|---|---|---|---|---|---|
| **Filtered Catalog Grid** | Search & multi-facet dropdown filter | `/api/v1/initiatives` | `GET` | `purpose=learning\|learncompete\|competing&q=&area=&region=&status=&mode=` | `Initiative[]` |
| **My Initiatives** | User's enrolled initiatives / "My Activity" | `/api/v1/initiatives/mine` | `GET` | `purpose?: string` (Optional filter for tabs) | `Initiative[]` (enrolled with progress stats) |
| **Active / In-Progress** | "Continue where you left off" carousel | `/api/v1/initiatives/active` | `GET` | None | `Initiative[]` (top in-progress items) |
| **Recommended Initiatives** | "Recommended for you" track section | `/api/v1/initiatives/recommended` | `GET` | `limit=12` | `Initiative[]` (matched against user interests) |
| **Saved Initiatives** | Bookmarks page (`?view=saved`) | `/api/v1/initiatives/saved` | `GET` | None | `Initiative[]` |
| **Toggle Save / Bookmark** | Click bookmark icon on any card | `/api/v1/initiatives/:id/save` | `POST` | Body: `{ saved: boolean }` | `{ success: true, id: string, saved: boolean }` |
| **Recently Viewed** | Recent page (`?view=recent`) | `/api/v1/initiatives/recent` | `GET` | None | `Initiative[]` (last 12 viewed) |
| **Record Recent View** | Opening card / workspace | `/api/v1/initiatives/:id/recent-view` | `POST` | Path: `id` | `{ success: true, recent: string[] }` |
| **Catalog Filter Areas** | Filter dropdown population | `/api/v1/initiatives/areas` | `GET` | `purpose?: string` | `string[]` (distinct technology areas) |
| **Catalog Filter Formats** | Filter dropdown population | `/api/v1/initiatives/modes` | `GET` | `purpose?: string` | `string[]` (e.g. `Virtual`, `Hybrid`, `In-person`) |

---

### C. Workspace & Challenge Workflows (`/api/v1/initiatives/:id/...`)

| Feature | UI Action | Endpoint | Method | Request Body / Params | Expected Response Shape |
|---|---|---|---|---|---|
| **Initiative Detail** | Opening `/dashboard/initiative?id=:id` | `/api/v1/initiatives/:id` | `GET` | Path: `id` | Full `<InitiativeDetail>` |
| **Register Initiative** | Click "Register" on un-enrolled card | `/api/v1/initiatives/:id/register` | `POST` | Path: `id` | `{ success: true, initiativeId: string, registeredAt: string }` |
| **Module Curriculum** | Learn track syllabus & lesson list | `/api/v1/initiatives/:id/modules` | `GET` | Path: `id` | `Module[]` (sections, resources, quizzes) |
| **Mark Section Complete** | Click "Mark section complete →" | `/api/v1/initiatives/:id/modules/:mod/sections/:sec/complete` | `POST` | Path: `id`, `mod`, `sec` | `{ success: true, completedSections: number[], progressPct: number }` |
| **Submit Module Quiz** | Assessment quiz submit | `/api/v1/initiatives/:id/modules/:mod/quiz` | `POST` | Body: `{ answers: Record<number, number> }` | `{ success: true, score: number, total: number, passed: boolean }` |
| **Claim Certificate** | "Claim Certificate" upon 100% completion | `/api/v1/initiatives/:id/certificate/claim` | `POST` | Path: `id` | `{ success: true, certificateId: string, issuedAt: string, verifyUrl: string }` |
| **Select Problem Statement** | Build track problem statement radio card | `/api/v1/initiatives/:id/problem-statement` | `POST` | Body: `{ statementCode: string }` | `{ success: true, statementCode: string }` |
| **Join Squad / Team** | Click "Join squad" in Team step | `/api/v1/initiatives/:id/teams/:teamId/join` | `POST` | Path: `id`, `teamId`, Body: `{ role: string }` | `{ success: true, team: Team }` |
| **Submit Prototype** | Submitting repository, demo link, notes & files | `/api/v1/initiatives/:id/submissions` | `POST` | `<SubmissionPayload>` | `{ success: true, submissionId: string, submittedAt: string }` |
| **Self-Assessment** | Evaluator rubric review in `Evaluate.jsx` | `/api/v1/initiatives/:id/submissions/self-assessment` | `POST` | `<SelfAssessmentPayload>` | `{ success: true, scoredAt: string, averageScore: number }` |

---

### D. Public Certificate Verification & Notifications

| Feature | UI Action | Endpoint | Method | Request Body / Params | Expected Response Shape |
|---|---|---|---|---|---|
| **Public Certificate View** | Visiting `/certificate/:certId` | `/api/v1/certificates/:certId` | `GET` | Path: `certId` (Public, no auth) | `<CertificateDetail>` (recipient, title, issuer, verify URL) |
| **List Notifications** | Notification bell dropdown open | `/api/v1/notifications` | `GET` | Headers: Bearer Token | `Notification[]` |
| **Mark Notification Read** | Click notification or "Mark all read" | `/api/v1/notifications/:id/read` | `POST` | Path: `id` | `{ success: true, id: string }` |

---

## 2. Schemas & Payloads

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
  fileAttachment?: string; // Optional uploaded PDF/ZIP binary URL
  statementCode?: string;  // e.g. "PS-138"
}
```

### `SelfAssessmentPayload` (from `src/dashboard/Evaluate.jsx`)
```typescript
interface SelfAssessmentPayload {
  initiativeId: string;
  submissionId: string;
  scores: {
    problemFit: number;         // 1 - 100
    technicalExecution: number; // 1 - 100
    innovation: number;         // 1 - 100
    presentation: number;       // 1 - 100
  };
  notes: string;                // Evaluator commentary
}
```

### `CertificateDetail` (from `src/pages/CertificateView.jsx`)
```typescript
interface CertificateDetail {
  id: string;
  recipientName: string;
  title: string;                // Initiative name
  org: string;                  // Issuing organization
  issuedAt: string;             // ISO date string
  certType: 'completion' | 'participation' | 'winner';
  verifyUrl: string;
  issuerLogoUrl?: string;
  signatureUrl?: string;
}
```
