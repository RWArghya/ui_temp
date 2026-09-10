# Backend API Requirements — Profile & Public Preview

Tracks all backend endpoints and data contracts for the Profile module (`/profile`), Public Preview (`/profile/preview`), and Overleaf Resume generator (`/profile/resume`).

Mock implementations live in `src/api/mock/profile.js` and `src/api/mock/initiatives.js`.

---

## Endpoints

| Feature | UI Action | Endpoint | Method | Request Body / Params | Expected Response Shape | Mock File |
|---|---|---|---|---|---|---|
| User Profile | Profile load | `/api/profile/me` | `GET` | Headers: Bearer Token | Profile Object (see schema below) | `src/api/mock/profile.js` |
| Update Profile | Save inline edits, privacy toggle, landing view | `/api/profile/me` | `PATCH` | Partial `<Profile>` | Updated `<Profile>` | `src/api/mock/profile.js` |
| Upload Avatar | Avatar file select | `/api/profile/me/avatar` | `POST` | `multipart/form-data` or `{ avatarDataUrl: string }` | `{ avatarUrl: string }` | Local canvas resize → dataURL |
| Registered Initiatives | Profile load (Journey, Certs, Rewards tabs, All Certs page) | `/api/initiatives?userId=me` | `GET` | Query: `userId=me` | `{ completed: Initiative[], active: Initiative[], pending: Initiative[], submittedIds: string[] }` | `src/api/mock/initiatives.js` |
| Public Profile Visitor View | Share URL visited (`/p/:slug` or `/profile/preview?u=:id`) | `/api/profile/public/:slug` | `GET` | Params: `slug` | Sanitized public `<Profile>` (omits email, private items) | Stubbed in `ProfilePreview.jsx` |
| Export Resume PDF | "Print / Save PDF" (backend rendering) | `/api/profile/resume/pdf` | `POST` | `{ profileId: string, template: "overleaf-classic" }` | Binary PDF stream or `{ pdfUrl: string }` | Client-side `window.print()` / LaTeX stub |
| Navigate to Role View | "Go to view →" button on each active role | TBD — to be wired to dashboard shell by teammate | `—` | `—` | `—` | Stub button in Profile > Overview > Roles, no-op until dashboard is merged |
| All Certificates Page | "Show all certificates" button in Certs tab | `/api/initiatives?userId=me` (same call, full data passed via router state) | `GET` | Same as above | Same as above, but `pending[]` must include closed initiatives where `cert_issued: false` | `src/api/mock/initiatives.js` |
| Add Section Item | "+ Add" in Education, Projects, Publications, Achievements, Self-Certs | `/api/profile/me/:section` or `/api/profile/me` | `POST` / `PATCH` | `{ title, org?, link?, proofUrl? }` | `{ success: true, item: <SectionItem> }` | `src/api/mock/profile.js` |
| Edit Section Item | "Edit" → "Save Changes" on any existing item | `/api/profile/me/:section/:itemId` or `/api/profile/me` | `PUT` / `PATCH` | `{ title, org?, link?, proofUrl? }` | `{ success: true, item: <SectionItem> }` | `src/api/mock/profile.js` |
| Delete Section Item | "Remove" → Confirmation modal "Remove" | `/api/profile/me/:section/:itemId` or `/api/profile/me` | `DELETE` / `PATCH` | `itemId` | `{ success: true, removedId: string }` | `src/api/mock/profile.js` |
| Toggle Share State | "Share" / "✓ Shared" toggle on self-added items | `/api/profile/me/:section/:itemId/share` | `PATCH` | `{ shared: boolean }` | `{ success: true, shared: boolean }` | `src/api/mock/profile.js` |
| Upload Certificate Proof | "Add certificate image" file picker | `/api/profile/me/certificates/proof` | `POST` | `multipart/form-data` | `{ proofUrl: string }` | Data URL FileReader |

---

## Schema: Full Profile Object (`/api/profile/me`)

```json
{
  "id": "usr-aarav-001",
  "name": "Aarav Sharma",
  "email": "aarav.sharma@iitd.ac.in",
  "headline": "Final-year CSE · ML enthusiast",
  "org": "IIT Delhi",
  "region": "India — North",
  "avatar": "data:image/jpeg;base64,...",
  "isPublic": false,
  "links": "github.com/aarav-sharma",
  "resume": null,
  "skills": ["Python", "React", "ML / DL", "Node.js"],
  "interests": ["AI / GenAI", "Agentic AI", "Cloud"],
  "domains": ["HealthTech", "FinTech"],
  "roles": [
    { "key": "competing", "label": "🏆 Competitor", "primary": false },
    { "key": "learning", "label": "📚 Learner", "primary": true }
  ],
  "landingView": "learning",
  "achievements": [
    { "id": "ach-1", "title": "Runner-up — CityHacks 2025", "shared": true },
    { "id": "ach-2", "title": "Best ML Paper — IIT Delhi Tech Fest 2025", "shared": false }
  ],
  "education": [
    { "id": "edu-1", "title": "B.Tech, Computer Science & Engineering", "org": "IIT Delhi" }
  ],
  "projects": [
    { "id": "proj-1", "title": "AgentChat — LLM-powered support agent", "link": "github.com/aarav-sharma/agentchat", "shared": true }
  ],
  "publications": [
    { "id": "pub-1", "title": "Grounded RAG for Medical Q&A (EMNLP 2025 Workshop)", "link": "arxiv.org/abs/2025.12345", "shared": true }
  ],
  "selfCerts": [
    { "id": "sc-1", "title": "AWS Cloud Practitioner", "org": "Amazon Web Services", "link": "https://aws.amazon.com/verify", "proofUrl": "data:image/...", "shared": true }
  ],
  "contributions": {
    "github": "aarav-sharma",
    "stackoverflow": null
  },
  "xp": 340,
  "level": 3,
  "credits": 180,
  "badges": [
    { "id": "b1", "ico": "🚀", "label": "First submission" },
    { "id": "b2", "ico": "📚", "label": "Active learner" }
  ],
  "promptCredits": 150,
  "promptStreak": 2
}
```

---

## Section Items CRUD Specification

Sections supporting manual entries: `education`, `projects`, `publications`, `achievements`, and `selfCerts` (external certificates).

### 1. Add Entry
- **Trigger**: Click `+ Add <Section>` button (expands form), enter fields, click Add / Submit.
- **Payload**:
  - `education`: `{ title: string (required), org: string (optional) }`
  - `projects`: `{ title: string (required), link: string (optional) }`
  - `publications`: `{ title: string (required), link: string (optional) }`
  - `achievements`: `{ title: string (required) }`
  - `selfCerts`: `{ title: string (required), org: string (optional), link: string (optional), proofUrl: string (optional) }`
- **Behavior**: Generates client or server ID, appends to corresponding array, persists via `PATCH /api/profile/me` or collection endpoint.

### 2. Edit Entry
- **Trigger**: Click `Edit` button on any row item.
- **UI Behavior**: Replaces the row in-place with an inline form pre-filled with the item's current values. Displays `Save Changes` and `Cancel` buttons.
- **Save Payload**: Updated fields matching the section schema above.
- **Cancel Behavior**: Discards in-progress edits and restores the read-only row with original data.

### 3. Delete Entry
- **Trigger**: Click `Remove` button on any row item.
- **UI Behavior**: Prompts user with a confirmation modal: *"Remove this entry? '<Item Title>' will be permanently removed from your profile. This cannot be undone."*
- **Confirm**: Calls delete mutation, removes from local list, persists change.
- **Cancel**: Dismisses modal with no changes.

---

## Privacy Matrix (Facebook-style Profile Lock)

| Field / Section | Private Profile (`isPublic: false`) | Public Profile (`isPublic: true`) |
|---|---|---|
| Avatar & Banner | Visible | Visible |
| Full Name | Visible | Visible |
| Headline & Org | Visible | Visible |
| Email Address | **Hidden** (Never exposed to visitors) | **Hidden** (Never exposed to visitors) |
| Region | Hidden | Visible |
| Skills & Domains | Hidden | Visible |
| Verified Certifications | Hidden | Visible |
| Projects | Hidden | Only items where `shared: true` |
| Publications | Hidden | Only items where `shared: true` |
| External Certifications | Hidden | Only items where `shared: true` |
| Achievements | Hidden | Only items where `shared: true` |
| Education | Hidden | Visible |
| XP, Badges, Credits | Hidden | Visible |
