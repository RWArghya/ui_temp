# Backend API Requirements — Master Specification

> **Status**: Aligned with latest `dev` code and Go modular monolith backend architecture.  
> **Detailed Module Specs**:
> - 🔐 **Auth & Identity**: [`api_req/auth.md`](api_req/auth.md)
> - 📊 **Dashboard, Catalogs & Workspaces**: [`api_req/dashboard.md`](api_req/dashboard.md)
> - 👤 **Profile, Account Security & Resume**: [`api_req/profile.md`](api_req/profile.md)

---

## 1. Authentication & Identity (See [`api_req/auth.md`](api_req/auth.md))

| Feature | UI Action | Endpoint | Method | Rate Limit | Status |
|---|---|---|---|---|---|
| **Register User** | Signup submit | `/api/v1/auth/register` | `POST` | 10/min (IP) | Ready for backend |
| **Verify Signup OTP** | 6-digit email OTP after signup | `/api/v1/auth/signup/otp/verify` | `POST` | 10/min (IP) | Ready for backend |
| **Resend Signup OTP** | Click "Resend code" | `/api/v1/auth/signup/otp/resend` | `POST` | 5/min (IP) | Ready for backend |
| **Password Login** | Standard login submit | `/api/v1/auth/login` | `POST` | 10/min (IP) | Ready for backend |
| **Request Login OTP** | "Log in with OTP instead" $\rightarrow$ email submit | `/api/v1/auth/login/otp/request` | `POST` | 5/min (IP) | Simulated in `src/pages/Auth.jsx` |
| **Verify Login OTP** | 6-digit login code $\rightarrow$ sign in | `/api/v1/auth/login/otp/verify` | `POST` | 10/min (IP) | Simulated in `src/pages/Auth.jsx` |
| **Token Refresh** | Background silent token rotation | `/api/v1/auth/refresh` | `POST` | None | Ready for backend |
| **Logout** | Topbar profile dropdown $\rightarrow$ Log out | `/api/v1/auth/logout` | `POST` | Bearer Token | Client store clear |
| **Forgot Password** | "Forgot password?" modal submit | `/api/v1/auth/password/forgot` | `POST` | 5/min (IP) | Ready for backend |
| **Reset Password** | Reset password form submit | `/api/v1/auth/password/reset` | `POST` | 5/min (IP) | Ready for backend |
| **Initial Onboarding** | Track/interest picker on `/onboarding` | `/api/v1/auth/onboarding` | `POST` | Bearer Token | Client store update |

---

## 2. Dashboard, Catalogs & Workspaces (See [`api_req/dashboard.md`](api_req/dashboard.md))

| Feature | UI Action | Endpoint | Method | Status |
|---|---|---|---|---|
| **KPI Overview** | Dashboard load (`/dashboard`) | `/api/v1/dashboard/kpis` | `GET` | Mocked — `src/dashboard/Views.jsx` |
| **My Initiatives** | User's enrolled initiatives ("My Activity") | `/api/v1/initiatives/mine` | `GET` | Mocked — `src/api/mock/initiatives.js` |
| **Active Initiatives** | "Continue where you left off" carousel | `/api/v1/initiatives/active` | `GET` | Mocked — `src/dashboard/data.js` |
| **Recommended Initiatives**| "Recommended for you" track section | `/api/v1/initiatives/recommended` | `GET` | Mocked — `src/dashboard/data.js` |
| **Filtered Catalogs** | Search & filters in Learn, Build, Compete | `/api/v1/initiatives` | `GET` | Mocked — `src/dashboard/PurposeViews.jsx` |
| **Bookmark / Save** | Bookmark button toggle on cards | `/api/v1/initiatives/:id/save` | `POST` | Mocked — `src/dashboard/data.js` |
| **Recently Viewed** | Recent initiatives recording & retrieval | `/api/v1/initiatives/recent` & `/:id/recent-view` | `GET` / `POST` | Mocked — `src/dashboard/data.js` |
| **Initiative Detail** | `/dashboard/initiative?id=:id` | `/api/v1/initiatives/:id` | `GET` | Mocked — `src/dashboard/data.js` |
| **Register Initiative** | Click "Register" on preview card | `/api/v1/initiatives/:id/register` | `POST` | Mocked — `src/dashboard/Workspace.jsx` |
| **Module Curriculum** | Learn track syllabus reader | `/api/v1/initiatives/:id/modules` | `GET` | Mocked — `src/dashboard/data.js` |
| **Complete Section** | "Mark section complete →" | `/api/v1/initiatives/:id/modules/:mod/sections/:sec/complete` | `POST` | Mocked — `src/dashboard/data.js` |
| **Submit Module Quiz** | Module assessment quiz submission | `/api/v1/initiatives/:id/modules/:mod/quiz` | `POST` | Mocked — `src/dashboard/data.js` |
| **Claim Certificate** | Capstone completion claim | `/api/v1/initiatives/:id/certificate/claim` | `POST` | Mocked — `src/dashboard/Workspace.jsx` |
| **Pick Problem Statement** | Build track radio card selection | `/api/v1/initiatives/:id/problem-statement` | `POST` | Mocked — `src/dashboard/Workspace.jsx` |
| **Join Squad / Team** | "Join squad" in Team step | `/api/v1/initiatives/:id/teams/:teamId/join` | `POST` | Mocked — `src/dashboard/Workspace.jsx` |
| **Submit Prototype** | Repository, demo link, notes & file upload | `/api/v1/initiatives/:id/submissions` | `POST` | Mocked — `src/dashboard/Workspace.jsx` |
| **Self-Assessment** | Evaluator rubric scoring in `Evaluate.jsx` | `/api/v1/initiatives/:id/submissions/self-assessment` | `POST` | Mocked — `src/dashboard/Evaluate.jsx` |
| **Public Certificate** | `/certificate/:id` standalone view | `/api/v1/certificates/:certId` | `GET` | Built — `src/pages/CertificateView.jsx` |
| **Notifications Feed** | Topbar notification bell dropdown | `/api/v1/notifications` & `/:id/read` | `GET` / `POST` | Built in `src/dashboard/Dashboard.jsx` |

---

## 3. Profile, Account Security & Resume (See [`api_req/profile.md`](api_req/profile.md))

| Feature | UI Action | Endpoint | Method | Status |
|---|---|---|---|---|
| **User Profile Details** | `/profile` load | `/api/v1/profile/me` | `GET` | Mocked — `src/api/mock/profile.js` |
| **Update Scalar Profile** | Save bio, headline, region, public toggle | `/api/v1/profile/me` | `PATCH` | Mocked — `src/api/mock/profile.js` |
| **Upload Avatar** | Avatar image file select | `/api/v1/profile/me/avatar` | `POST` | S3 Upload wrapper |
| **Public Visitor Profile** | Visitor URL (`/profile/preview` or `/p/:slug`) | `/api/v1/profile/public/:slug` | `GET` | Built — `src/pages/ProfilePreview.jsx` |
| **Export Resume PDF** | "Download PDF" in Resume builder | `/api/v1/profile/me/resume/pdf` | `POST` | Built — `src/pages/Resume.jsx` |
| **Export Resume LaTeX** | "Copy LaTeX Source" in Resume builder | `/api/v1/profile/me/resume/latex` | `POST` | Built — `src/pages/Resume.jsx` |
| **Section Items CRUD** | Add/Edit/Delete Education, Projects, Publications, Achievements, Certs, Links | `/api/v1/profile/me/:section(/:itemId)` | `POST` / `PATCH` / `DELETE` | Mocked — `src/dashboard/Profile.jsx` |
| **Upload Cert Proof** | External certificate image proof upload | `/api/v1/profile/me/certificates/proof` | `POST` | Client FileReader / S3 |
| **User Settings** | `/dashboard?view=settings` load & update | `/api/v1/profile/me/settings` | `GET` / `PATCH` | Mocked — `src/dashboard/Settings.jsx` |
| **Change Password** | "Change password" form submit in Settings | `/api/v1/account/password` | `POST` | Mocked — `src/store/auth.js` |
| **Change Email** | Request & verify new email address | `/api/v1/account/email/request` & `/verify` | `POST` | Ready for backend |
| **Manage Sessions** | List and revoke active login sessions | `/api/v1/account/sessions(/:id/revoke)` | `GET` / `POST` | Ready for backend |
| **Deactivate Account** | Password-gated account deactivation | `/api/v1/account/deactivate` | `POST` | Ready for backend |
| **Delete Account** | Danger zone $\rightarrow$ Type "DELETE" | `/api/v1/account` | `DELETE` | Mocked — `src/store/auth.js` |

---

## 4. Landing & Marketing Endpoints

| Feature | UI Action | Endpoint | Method | Status |
|---|---|---|---|---|
| **Live Stats Console** | Homepage live stats bar | `/api/v1/network/live-stats` | `GET` | Mocked — `src/api/mock/liveStats.js` |
| **Featured Challenges** | Homepage challenge carousel | `/api/v1/initiatives?flagship=true` | `GET` | Mocked — `src/api/mock/challenges.js` |
| **Testimonials** | Homepage proof section | `/api/v1/testimonials` | `GET` | Mocked — `src/api/mock/testimonials.js` |
