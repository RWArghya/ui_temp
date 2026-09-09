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
    { "id": "sc-1", "title": "AWS Cloud Practitioner", "org": "Amazon Web Services", "shared": true }
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
