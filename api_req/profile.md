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
| Navigate to Role View | "Go to view →" button on each active role | Client-side route (`/dashboard?view=<roleKey>`) | `—` | `—` | `—` | Resolved — client-side routing within Dashboard shell |
| All Certificates Page | "Show all certificates" button in Certs tab | `/api/initiatives?userId=me` (same call, full data passed via router state) | `GET` | Same as above | Same as above, but `pending[]` must include closed initiatives where `cert_issued: false` | `src/api/mock/initiatives.js` |
| Single Certificate View | Direct link or page reload on `/profile/certificate/:certId` | `/api/certificates/:certId` | `GET` | Path param: `certId` | `{ certId: string, title: string, org: string, date: string, type: string, recipientName: string, issuerLogo?: string, signatureUrl?: string }` | Client router state (`location.state.cert`) with API fallback |
| Add Section Item | "+ Add" in Education, Projects, Publications, Achievements, Self-Certs, Connected Profiles | `/api/profile/me/:section` or `/api/profile/me` | `POST` / `PATCH` | Detailed Section Payload (see CRUD specs below) | `{ success: true, item: <SectionItem> }` | `src/api/mock/profile.js` |
| Edit Section Item | "Edit" → "Save Changes" on any existing item | `/api/profile/me/:section/:itemId` or `/api/profile/me` | `PUT` / `PATCH` | Detailed Section Payload | `{ success: true, item: <SectionItem> }` | `src/api/mock/profile.js` |
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
  "cover": "data:image/jpeg;base64,...",
  "isPublic": false,
  "links": "https://aarav-sharma.vercel.app",
  "resume": null,
  "skills": ["Python", "React", "ML / DL", "Node.js"],
  "interests": ["AI / GenAI", "Agentic AI", "Cloud"],
  "domains": ["HealthTech", "FinTech"],
  "roles": [
    { "key": "competing", "label": "🏆 Competitor", "primary": false },
    { "key": "learning", "label": "📚 Learner", "primary": true }
  ],
  "landingView": "learning",
  "about": "Passionate developer and student researcher building AI systems and real-time distributed platforms.",
  "education": [
    {
      "id": "edu-1",
      "degree": "B.Tech",
      "specialization": "Computer Science & Engineering",
      "institution": "IIT Delhi",
      "boardOrUniversity": "IIT Delhi",
      "location": "New Delhi, India",
      "startYear": "2022",
      "endYear": "2026",
      "isOngoing": true,
      "title": "B.Tech, Computer Science & Engineering",
      "org": "IIT Delhi"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "AgentChat — LLM-Powered Multi-Agent Support Orchestrator",
      "techStack": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
      "description": "Multi-agent customer routing engine using localized LLMs with automated fallback and vector search for knowledge retrieval.",
      "sourceCodeUrl": "https://github.com/aarav-sharma/agentchat",
      "demoUrl": "https://agentchat-demo.h2s.io",
      "docsUrl": "https://docs.agentchat.dev",
      "shared": true
    }
  ],
  "publications": [
    {
      "id": "pub-1",
      "title": "Grounded RAG for Medical Q&A (EMNLP 2025 Workshop)",
      "description": "Explores verified citation synthesis across multi-hop biomedical research queries with 94.2% factual consistency.",
      "link": "https://arxiv.org/abs/2025.12345",
      "shared": true
    }
  ],
  "achievements": [
    {
      "id": "ach-1",
      "title": "Runner-up — CityHacks 2025",
      "description": "Awarded 2nd place among 120+ teams for building an AI-powered urban traffic rerouting simulator.",
      "shared": true
    },
    {
      "id": "ach-2",
      "title": "Best ML Paper — IIT Delhi Tech Fest 2025",
      "description": "Selected as the outstanding machine learning submission for work on sparse attention mechanisms.",
      "shared": false
    }
  ],
  "selfCerts": [
    {
      "id": "sc-1",
      "title": "AWS Certified Cloud Practitioner",
      "org": "Amazon Web Services",
      "date": "2024-08",
      "link": "https://aws.amazon.com/verify",
      "proofUrl": null,
      "shared": true
    },
    {
      "id": "sc-2",
      "title": "Full Stack Cloud & Java Development",
      "org": "Infosys Springboard",
      "date": "2024-10",
      "link": "",
      "proofUrl": "data:image/svg+xml;utf8,...",
      "shared": true
    }
  ],
  "connectedProfiles": [
    {
      "id": "link-1",
      "platform": "GitHub",
      "url": "https://github.com/aarav-sharma",
      "shared": true
    },
    {
      "id": "link-2",
      "platform": "LeetCode",
      "url": "https://leetcode.com/u/aarav_sharma",
      "shared": true
    },
    {
      "id": "link-3",
      "platform": "LinkedIn",
      "url": "https://linkedin.com/in/aarav-sharma-cse",
      "shared": true
    },
    {
      "id": "link-4",
      "platform": "Developer Portfolio",
      "url": "https://aarav-sharma.vercel.app",
      "shared": true
    }
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

Sections supporting manual entries: `education`, `projects`, `publications`, `achievements`, `selfCerts` (external certificates), and `connectedProfiles` (Links).

### 1. Add Entry
- **Trigger**: Click `+ Add` button (opens section modal), enter fields, click "Save changes".
- **Payload**:
  - `education`: `{ degree: string (required), specialization?: string, institution?: string, boardOrUniversity?: string, location?: string, startYear?: string, endYear?: string, isOngoing?: boolean }`
  - `projects`: `{ title: string (required), techStack?: string[], description?: string, sourceCodeUrl?: string, demoUrl?: string, docsUrl?: string, shared: boolean }`
  - `publications`: `{ title: string (required), description?: string, link?: string, shared: boolean }`
  - `achievements`: `{ title: string (required), description?: string, shared: boolean }`
  - `selfCerts`: `{ title: string (required), org?: string, date?: string, link?: string, proofUrl?: string (dataUrl/photo), shared: boolean }`
  - `connectedProfiles`: `{ platform: string (required), url: string (required), shared: boolean }`
- **Behavior**: Generates unique client or server ID, appends to corresponding array, persists via `PATCH /api/profile/me` or collection endpoint.

### 2. Edit Entry
- **Trigger**: Click `Edit` button on any row item.
- **UI Behavior**: Opens modal pre-filled with the item's current values. Displays `Save changes`, `Cancel`, and `Delete` buttons.
- **Save Payload**: Updated fields matching the section schema above.
- **Cancel Behavior**: Discards in-progress edits and restores read-only row with original data.

### 3. Delete Entry
- **Trigger**: Click `Remove` / `Delete` button (either in modal footer or direct row action).
- **UI Behavior**: Prompts user with a confirmation modal (`ConfirmDialog`): *"Remove this entry? '<Item Title>' will be permanently removed from your profile. This cannot be undone."*
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
| Connected Profiles / Links | Hidden | Only items where `shared: true` |
| Education | Hidden | Visible |
| XP, Badges, Credits | Hidden | Visible |
