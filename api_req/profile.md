# Backend API Requirements — Profile, Account & Resume

> **Module**: Profile & Account (`internal/profile/` and `internal/account/` in backend)  
> **Route Group**: `/api/v1/profile` and `/api/v1/account`  
> **Client Sources**: [`src/dashboard/Profile.jsx`](file:///c:/Users/MP2KK/ui_temp/src/dashboard/Profile.jsx), [`src/dashboard/Settings.jsx`](file:///c:/Users/MP2KK/ui_temp/src/dashboard/Settings.jsx), [`src/pages/Resume.jsx`](file:///c:/Users/MP2KK/ui_temp/src/pages/Resume.jsx), and [`src/pages/ProfilePreview.jsx`](file:///c:/Users/MP2KK/ui_temp/src/pages/ProfilePreview.jsx)  
> **Backend Architecture Reference**: [`H2S-Innovator-Dashboard-Backend.md §3`](file:///c:/Users/MP2KK/ui_temp/H2S-Innovator-Dashboard-Backend.md#3-http-layer--chi-with-public-vs-authenticated-route-groups)

---

## 1. Endpoints Overview

### A. Profile & Portfolio Endpoints (`/api/v1/profile`)

| Feature | UI Action | Endpoint | Method | Request Body / Params | Expected Response Shape |
|---|---|---|---|---|---|
| **Get My Profile** | Profile load | `/api/v1/profile/me` | `GET` | Headers: Bearer Token | Full `<Profile>` object (see schema below) |
| **Update Scalar Fields** | Edit bio, headline, region, public toggle | `/api/v1/profile/me` | `PATCH` | Partial `<Profile>` | Updated `<Profile>` |
| **Upload Avatar** | Avatar file picker select | `/api/v1/profile/me/avatar` | `POST` | `multipart/form-data` | `{ avatarUrl: string }` |
| **Public Profile View** | Open `/p/:slug` or `/profile/preview` | `/api/v1/profile/public/:slug` | `GET` | Path: `slug` | Sanitized public `<Profile>` (omits email & private prefs) |
| **Export Resume PDF** | Click "Download PDF" in Resume builder | `/api/v1/profile/me/resume/pdf` | `POST` | `{ settings?: ResumeSettings, overrides?: Partial<Profile> }` | Binary PDF stream or `{ pdfUrl: string }` |
| **Export Resume LaTeX** | Click "Copy LaTeX Source" in Resume builder | `/api/v1/profile/me/resume/latex` | `POST` | `{ settings?: ResumeSettings, overrides?: Partial<Profile> }` | Plaintext `.tex` LaTeX source |
| **Add Section Item** | Click "+ Add" in any profile section modal | `/api/v1/profile/me/:section` | `POST` | Path: `section`, Body: `<SectionItem>` | `{ success: true, item: <SectionItem> }` |
| **Edit Section Item** | "Edit" $\rightarrow$ "Save Changes" on any item | `/api/v1/profile/me/:section/:itemId` | `PATCH` | Path: `section`, `itemId`, Body: `<SectionItem>` | `{ success: true, item: <SectionItem> }` |
| **Delete Section Item** | "Remove" on item with confirmation | `/api/v1/profile/me/:section/:itemId` | `DELETE` | Path: `section`, `itemId` | `{ success: true, removedId: string }` |
| **Upload External Cert Proof** | Certificate image upload picker | `/api/v1/profile/me/certificates/proof` | `POST` | `multipart/form-data` | `{ proofUrl: string }` |
| **User Settings & Prefs** | Settings tab load | `/api/v1/profile/me/settings` | `GET` | Headers: Bearer Token | `{ notifications: NotificationPrefs, discoverable: boolean, openToTeams: boolean, landingView: string }` |
| **Update Settings** | Toggle switch / select dropdown | `/api/v1/profile/me/settings` | `PATCH` | Partial `<Settings>` | Updated `<Settings>` |

> Supported `:section` routes: `education`, `projects`, `publications`, `achievements`, `self-certs`, `links` (`connectedProfiles`).

---

### B. Account & Security Endpoints (`/api/v1/account`)
Every mutating handler in this group re-verifies the user's current password server-side before executing, as built into `src/dashboard/Settings.jsx`.

| Feature | UI Action | Endpoint | Method | Request Body / Params | Expected Response Shape |
|---|---|---|---|---|---|
| **Change Password** | "Change password" form submit | `/api/v1/account/password` | `POST` | `{ currentPassword: string, newPassword: string }` | `{ success: true, message: string }` |
| **Request Email Change** | "Change email address" submit | `/api/v1/account/email/request` | `POST` | `{ newEmail: string, currentPassword: string }` | `{ success: true, message: "Verification link sent" }` |
| **Resend Email Verification** | "Resend email link" click | `/api/v1/account/email/resend` | `POST` | `{ newEmail: string }` | `{ success: true, message: string }` |
| **Verify Email Change** | Verification link clicked in email | `/api/v1/account/email/verify` | `POST` | `{ token: string }` | `{ success: true, newEmail: string }` |
| **List Active Sessions** | "Active login sessions" panel | `/api/v1/account/sessions` | `GET` | Headers: Bearer Token | `Session[]` (IP, device/UA, lastActive, current: bool) |
| **Revoke Session** | "Revoke device" button click | `/api/v1/account/sessions/:id/revoke` | `POST` | Path: `id` | `{ success: true, revokedId: string }` |
| **Deactivate Account** | "Deactivate account" modal confirm | `/api/v1/account/deactivate` | `POST` | `{ currentPassword: string }` | `{ success: true, message: "Account deactivated" }` |
| **Delete Account Permanently**| Danger Zone $\rightarrow$ Type "DELETE" & submit | `/api/v1/account` | `DELETE` | `{ currentPassword: string, confirmation: "DELETE" }` | `{ success: true, message: "Account and data purged" }` |

---

## 2. Schema: Full Profile Object (`/api/v1/profile/me`)

```json
{
  "id": "usr_7f8a9b1c-3d2e-4a5b-8c7d-9e0f1a2b3c4d",
  "name": "Aarav Sharma",
  "email": "aarav.sharma@iitd.ac.in",
  "phone": "+91 98765 43210",
  "headline": "Final-year CSE · ML & Distributed Systems",
  "about": "Computer Science undergraduate at IIT Delhi with expertise in scalable architectures and applied GenAI.",
  "org": "IIT Delhi",
  "region": "India — North",
  "avatarUrl": "https://s3.amazonaws.com/h2s-avatars/usr_7f8a9b1c.png",
  "isPublic": true,
  "slug": "aarav-sharma",
  "skills": ["Python", "Go", "C++", "React", "PostgreSQL", "Docker", "PyTorch"],
  "interests": ["AI / GenAI", "Cloud Systems", "Distributed Computing"],
  "domains": ["Distributed Systems", "Generative AI", "High-Throughput Backends"],
  "landingView": "learning",
  "createdAt": "2026-01-15T00:00:00Z",
  "education": [
    {
      "id": "edu_1",
      "degree": "B.Tech",
      "specialization": "Computer Science & Engineering",
      "institution": "IIT Delhi",
      "boardOrUniversity": "IIT Delhi",
      "location": "New Delhi, India",
      "startYear": "2022",
      "endYear": "2026",
      "isOngoing": true,
      "gpa": "9.4 / 10.0"
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "title": "Autonomous Distributed Cache",
      "description": "High-throughput in-memory caching engine using consistent hashing and Raft consensus in Go.",
      "techStack": ["Go", "Raft", "gRPC", "Docker"],
      "sourceCodeUrl": "https://github.com/aarav-sharma/cache",
      "demoUrl": "https://cache-demo.aarav.dev",
      "docsUrl": ""
    }
  ],
  "publications": [
    {
      "id": "pub_1",
      "title": "Optimizing Speculative Decoding in Resource-Constrained Edge LLMs",
      "description": "Published in Workshop on Efficient Systems for Foundation Models.",
      "link": "https://arxiv.org/abs/2403.00000"
    }
  ],
  "achievements": [
    {
      "id": "ach_1",
      "title": "1st Place Winner — Smart India Hackathon 2025",
      "description": "Selected #1 out of 2,400+ nationwide teams."
    }
  ],
  "selfCerts": [
    {
      "id": "sc_1",
      "title": "AWS Certified Solutions Architect",
      "org": "Amazon Web Services",
      "issueDate": "2024-08",
      "link": "https://aws.amazon.com/verify",
      "proofUrl": "https://s3.amazonaws.com/h2s-proofs/sc_1.png"
    }
  ],
  "connectedProfiles": [
    { "id": "link_1", "platform": "GitHub", "url": "https://github.com/aarav-sharma" },
    { "id": "link_2", "platform": "LinkedIn", "url": "https://linkedin.com/in/aarav-sharma-cse" },
    { "id": "link_3", "platform": "LeetCode", "url": "https://leetcode.com/u/aarav_sharma" }
  ],
  "xp": 340,
  "level": 3,
  "credits": 180,
  "badges": [
    { "id": "first-submission", "ico": "🚀", "label": "First submission" },
    { "id": "active-learner", "ico": "📚", "label": "Active learner" }
  ]
}
```

---

## 3. Section Items CRUD Specifications

### 1. Add Entry (`POST /api/v1/profile/me/:section`)
- **Payloads**:
  - `education`: `{ degree: string, specialization?: string, institution?: string, boardOrUniversity?: string, location?: string, startYear?: string, endYear?: string, isOngoing?: boolean, gpa?: string }`
  - `projects`: `{ title: string, techStack?: string[], description?: string, sourceCodeUrl?: string, demoUrl?: string, docsUrl?: string }`
  - `publications`: `{ title: string, description?: string, link?: string }`
  - `achievements`: `{ title: string, description?: string }`
  - `self-certs`: `{ title: string, org?: string, issueDate?: string, link?: string, proofUrl?: string }`
  - `links`: `{ platform: string, url: string }`

### 2. Edit Entry (`PATCH /api/v1/profile/me/:section/:itemId`)
- Partial JSON update over the target section schema.

### 3. Delete Entry (`DELETE /api/v1/profile/me/:section/:itemId`)
- Deletes the row from database and purges any associated files from S3 if applicable.

---

## 4. Privacy Matrix for Public Profile (`/api/v1/profile/public/:slug`)

When `isPublic: true`:

| Field / Section | Visibility on Public URL |
|---|---|
| Full Name, Headline, Org, Avatar | **Visible** |
| Email Address & Mobile Phone | **Strictly Hidden** (Never returned by backend) |
| Region, Bio, About | **Visible** |
| Skills, Domains, Interests | **Visible** |
| Education, Projects, Publications, Achievements | **Visible** |
| Verified Platform Certificates & Self-Certs | **Visible** |
| Connected Profiles (GitHub, LinkedIn, LeetCode) | **Visible** |
| XP, Level, Badges | **Visible** |
| Notification settings & private preferences | **Hidden** |
