# H2S Backend — Architecture Review & Database Design

Written for: a backend engineer (or Claude session) about to build the Go API for H2S from scratch, using the submitted architecture PDF as a starting point plus the real API contracts already agreed with the frontend ([API_REQUIREMENTS.md](API_REQUIREMENTS.md), [api_req/dashboard.md](api_req/dashboard.md), [api_req/profile.md](api_req/profile.md)).

**Current build scope: Innovator Dashboard only.** §1's gap analysis still talks about the wider platform (that's what the submitted PDF was trying to cover), but the schema in §4 and everything in [H2S-Innovator-Dashboard-Backend.md](H2S-Innovator-Dashboard-Backend.md) has been trimmed to what's actually being built right now — **Mentor (application, console, mentor-connect) and Arena/PromptWars are both deliberately excluded**, not deferred-with-placeholder-tables. If either comes back into scope later, treat that as new design work, not "uncomment the old section."

---

## 1. Verdict on the submitted PDF

**The stack choices are correct — keep them as-is:** chi, sqlc, pgx v5, golang-migrate, go-redis v9, amqp091-go, single Go binary with per-module folders. This is a solid, boring, production-proven combination for a monolith. Don't second-guess it.

**The problem is not the stack, it's that the example directory layout and router (`/agents`, `/workflows`, `/integrations`, `/cost`) are generic AI-agent-platform boilerplate — not H2S's actual domain.** H2S is a hackathon/learning platform: initiatives (hackathons, bootcamps, hybrid "learn-then-compete" tracks), teams, submissions, judging, mentors, learning modules, a weekly "PW" challenge with its own credit ledger, and a resume-building profile. None of that is reflected in the PDF's module names — it reads like a template that was never adapted to this product.

### Concrete gaps in the PDF

1. **No auth/session module**, despite the frontend already shipping a full Settings page ([src/dashboard/Settings.jsx](src/dashboard/Settings.jsx)) that needs: password-gated email change with email verification, a real device/session list with per-session revoke, account deactivation, and account deletion gated on password + typed "DELETE". This needs a first-class `sessions` module backed by a real table — not a stateless-JWT-only design, since "list my active sessions and let me revoke one" cannot work without server-side session records.
2. **No password hashing algorithm specified.** Must be explicit: argon2id (preferred) or bcrypt cost ≥ 12. Never roll a custom hash.
3. **No file/object storage strategy.** Submissions carry repo/demo URLs plus an optional file attachment; profiles carry avatars and certificate proof images. Postgres should never hold these bytes — needs S3-compatible storage (S3/MinIO/GCS) with a `files` table tracking metadata + storage key.
4. **No transactional email service.** Email verification (change-of-email flow), password reset, and deadline reminders all need real delivery. Route these through an outbox table + a RabbitMQ consumer that calls the email provider, not an inline call in the request handler (so a flaky provider never blocks or loses a request).
5. **No authorization/RBAC model**, despite the product clearly having multiple roles: Innovator (default), Mentor (gated, application-approved), Sponsor/Org admin, Judge, Platform admin. Router examples show authentication middleware (`RequestID`, `Logger`, `Recoverer`) but nothing that checks *who* is allowed to hit a route.
6. **No rate limiting**, despite Redis being available and sitting right there for it. Login, password reset, and email-verification-resend all need it — these are exactly the endpoints credential-stuffing and enumeration attacks hit first.
7. **No idempotency strategy for the credit ledger.** The frontend already models PW credits as a ledger (`pwLedger`, `PW_CREDITS_PER_DROP` in [src/dashboard/data.js](src/dashboard/data.js)) — any real money-shaped ledger needs append-only rows with a unique idempotency key, never a mutable balance column.
8. **No API versioning** in the router sketch (`r.Mount("/agents", ...)` — should be under `/api/v1/...`).
9. **No pagination convention.** Initiative catalogs, submissions, and leaderboards will all outgrow `OFFSET` pagination fast; needs a cursor/keyset standard from day one.
10. **No soft-delete policy**, despite "Delete My Account" being a real, already-shipped frontend flow with a typed confirmation. A hard `DELETE FROM users` cascades into team rosters, submissions, and leaderboards other people depend on — this needs to be a soft delete + scheduled purge, not a handler-level `DELETE`.
11. **No audit log**, despite Settings already treating email change, password change, deactivate, delete, and session-revoke as distinct, deliberate user actions. Every one of those should write an audit row (actor, action, ip, timestamp).
12. **No scheduler/cron component.** Initiative status transitions (`upcoming → live → past` on deadline), weekly PW-drop rotation, and expiry of stale email-verification tokens are all time-driven, and RabbitMQ alone doesn't fire on a schedule — needs a small scheduler (a goroutine with a ticker, or `pg_cron`) that publishes into the existing queue.
13. **No route grouping shown for public vs. authenticated endpoints** (`/auth/login`, `/auth/register` must stay outside the auth middleware; everything else sits inside it) — the `main.go` sketch mounts everything flat.
14. **Testing story is absent.** Given sqlc generates from raw SQL with no ORM to catch mistakes at compile time beyond types, the query layer needs integration tests against a real Postgres (testcontainers), not just mocked `Querier` interfaces at the service layer.

None of this invalidates the PDF — the stack is right. It just needs to be re-pointed at H2S's actual domain, and it's missing the handful of cross-cutting concerns (auth sessions, files, email, RBAC, audit, scheduling) that don't show up in a generic "here's how chi + sqlc wire together" sketch but that this specific product cannot ship without.

---

## 2. Corrected module layout

Replace the PDF's `agents/ workflows/ integrations/ cost/` example with modules that match the product:

```
controllers/
  routes.go
  auth_controller.go          # login, refresh, logout, register
  account_controller.go       # email change, password change, sessions, deactivate, delete
  profile_controller.go       # profile CRUD, section items, public preview, resume export
  initiative_controller.go    # catalog, detail, register, save, recent-view
  learning_controller.go      # modules, sections, quiz, certificate claim
  team_controller.go          # team join/create, roster
  submission_controller.go    # submit, list, self-assessment
  notification_controller.go
services/
  auth_service.go
  account_service.go
  profile_service.go
  initiative_service.go
  learning_service.go
  team_service.go
  submission_service.go
  notification_service.go
  email_service.go            # outbox writer, not the provider client itself
queries/  ... (per module, sqlc-annotated SQL)
db/       ... (sqlc-generated)
platform/
  middleware/                 # auth, request-id, logging, recovery, rbac, rate-limit
  config/
  observability/
pkg/
  dbpool/
  cache/
  mq/
  storage/                    # S3/MinIO client wrapper — new vs. the PDF
  scheduler/                  # cron-style trigger publishing to RabbitMQ — new vs. the PDF
migrations/
sqlc.yaml
go.mod
```

---

## 3. Golden rules

Hand these to whoever (or whatever) writes the code. They're the rules that keep a monolith honest as it grows.

1. **Every module = controller + service + queries**, mounted under `/api/v1/<module>`. Public routes (`/api/v1/auth/login`, `/register`, `/refresh`) live in their own `r.Group`, outside the auth middleware; everything else is inside it.
2. **AuthN = short-lived JWT access token + opaque refresh token, hashed at rest in `auth_sessions`.** Every row in that table is exactly what Settings' "Manage Active Sessions" lists. Revoking a row must invalidate that refresh token on its *next* use, not just at expiry — check `revoked_at IS NULL` on every refresh, not only on login.
3. **Passwords: argon2id or bcrypt (cost ≥ 12), never anything else.** Never log a password, never include a password field in any response DTO, never keep it in memory longer than the request that verifies it.
4. **Every security-sensitive account mutation (email change, password change, deactivate, delete, session revoke) re-verifies the current password server-side and writes an `audit_logs` row.** The frontend already treats these as distinct, deliberate actions — the backend must too.
5. **Migrations are expand/contract, always.** Add a nullable column → backfill → tighten to `NOT NULL` in a *later* migration. Never a single breaking change against a live table. Every `up` has a matching `down`.
6. **All ledger-shaped writes (XP events) are append-only rows with a unique idempotency key.** Balance is `SUM(delta)`, computed on read or materialized in a view — never a counter column that can drift from its own history.
7. **Soft-delete on user-facing entities** (`deleted_at timestamptz`) — `users`, `teams`, `submissions`. A scheduled job hard-purges past the retention window; no handler ever issues a bare `DELETE` against these tables.
8. **Every list endpoint is keyset/cursor-paginated.** `OFFSET` is fine in a dev fixture, never in a shipped endpoint over `initiatives`, `submissions`, or any leaderboard.
9. **Every external side effect (email send, certificate generation, leaderboard recompute) goes through the outbox + RabbitMQ.** Nothing that can be slow, retried, or fail independently runs synchronously inside a request handler.
10. **sqlc's whole point is compile-time-checked SQL — never undermine it with `fmt.Sprintf`-built queries.** If a query needs to be dynamic (filters), build it with sqlc's conditional patterns or a query builder that still produces a single prepared statement, not string concatenation.
11. **Every new table gets an index pass before merge**: every FK column, and every column that appears in a `WHERE` or `ORDER BY` on a list endpoint.
12. **RBAC is checked in middleware per route group**, not as scattered `if user.Role == "admin"` checks inside handlers. A route either requires a role or it doesn't; that decision lives in one place (`routes.go`), not spread through the codebase.
13. **The query/repository layer is integration-tested against a real Postgres** (testcontainers), since sqlc gives you type safety but not query-correctness safety. Service-layer tests may mock the generated `Querier` interface; the queries themselves cannot be mocked away.

---

## 4. Database design

Postgres, designed to sit under golang-migrate + sqlc exactly as the PDF proposes. Grouped by module. `uuid` primary keys throughout (`gen_random_uuid()`, `pgcrypto`); `timestamptz` for every timestamp.

A design choice worth calling out up front: **tag-shaped lists (`areas`, `skills`, `interests`, `domains`) are modeled as `text[]` columns with a GIN index, not normalized join tables.** These are small, low-cardinality, filter-only vocabularies — a join table buys nothing here that an array + GIN index doesn't already give you, and it's one fewer table + one fewer join on every catalog query. `areas` still gets a tiny lookup table, but only to validate against the canonical list the frontend already ships (`AREAS` in `src/dashboard/data.js`), not to join against.

Sections are ordered for reading, not migration order — `files` (§4.2) references `users`, and `users.avatar_file_id` references `files` back, so in real migrations create `users` without `avatar_file_id`, then `files`, then `alter table users add column avatar_file_id ...` in a third migration (expand/contract, per golden rule #5).

### 4.1 Auth & account (`auth`, `account`)

```sql
create extension if not exists pgcrypto;

create type user_status as enum ('active', 'deactivated', 'deleted');

create table users (
  id                uuid primary key default gen_random_uuid(),
  email             citext unique not null,
  email_verified_at timestamptz,
  password_hash     text not null,               -- argon2id encoded hash, never plaintext
  name              text not null,
  mobile            text,                        -- "+91 98765 43210" — country code + number as one string, matching Auth.jsx's signup form
  headline          text,
  org               text,
  region            text,
  avatar_file_id    uuid references files(id),
  is_public         boolean not null default false,
  status            user_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deactivated_at    timestamptz,
  deleted_at        timestamptz                  -- soft delete; scheduled job hard-purges after retention window
);
create index on users (status) where deleted_at is null;

-- Backs Settings' "Manage Active Sessions": one row per device/browser session.
create table auth_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id),
  refresh_token_hash text not null unique,        -- sha256 of the opaque refresh token, never the raw token
  device_label       text,                        -- e.g. "Windows • Chrome"
  ip                 inet,
  user_agent         text,
  created_at         timestamptz not null default now(),
  last_active_at     timestamptz not null default now(),
  revoked_at         timestamptz
);
create index on auth_sessions (user_id) where revoked_at is null;

-- Backs Settings' "Change Email Address" pending-verification flow.
create table email_change_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  new_email   citext not null,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);
create index on email_change_requests (user_id) where verified_at is null;

-- One table for every one-time code the frontend uses: signup email verification, OTP login,
-- and forgot-password (Auth.jsx's "reset link" is really this same code, delivered as a link
-- instead of a typed 6-digit code — no separate password_reset_requests table on purpose; a
-- fourth mostly-identical token table would be duplication, not design).
create type otp_purpose as enum ('signup_verify', 'login', 'password_reset');

create table otp_codes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  purpose       otp_purpose not null,
  code_hash     text not null,             -- sha256 of the code/token — never the raw value
  expires_at    timestamptz not null,       -- 10 minutes for signup/login OTP, 1 hour for password_reset
  attempt_count int not null default 0,     -- 5 wrong guesses locks it, forces a fresh request
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index on otp_codes (user_id, purpose) where consumed_at is null;

-- Every security-sensitive account action, per golden rule #4.
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id),           -- the account affected
  actor_id   uuid references users(id),            -- who did it (usually = user_id, differs for admin actions)
  action     text not null,                        -- 'email_change_requested' | 'password_changed' | 'deactivated' | 'deleted' | 'session_revoked' | ...
  metadata   jsonb not null default '{}',
  ip         inet,
  created_at timestamptz not null default now()
);
create index on audit_logs (user_id, created_at desc);
```

### 4.2 Files (`storage`)

```sql
create type file_kind as enum ('avatar', 'cert_proof', 'submission_attachment', 'certificate_pdf');

create table files (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id),
  kind          file_kind not null,
  storage_key   text not null,          -- S3/MinIO object key; bytes never touch Postgres
  content_type  text not null,
  size_bytes    bigint not null,
  created_at    timestamptz not null default now()
);
```

### 4.3 Profile (`profile`) — matches the Profile object contract in [api_req/profile.md](api_req/profile.md)

```sql
create table profiles (
  user_id       uuid primary key references users(id),
  cover_file_id uuid references files(id),
  about         text,
  links         text,                              -- personal site / portfolio URL shown on profile
  skills        text[] not null default '{}',       -- freeform, GIN-indexed
  interests     text[] not null default '{}',       -- constrained to `areas` at the app layer
  domains       text[] not null default '{}',       -- constrained to `areas` at the app layer
  landing_view  text not null default 'learning',   -- 'learning' | 'learncompete' | 'competing'
  contributions jsonb not null default '{}',         -- { github: "...", stackoverflow: "..." } — likely to grow platforms
  updated_at    timestamptz not null default now()
);
create index on profiles using gin (skills);
create index on profiles using gin (interests);
create index on profiles using gin (domains);

-- Canonical vocabulary the profile's `interests`/`domains` and initiatives' `areas` both draw from.
-- Matches AREAS in src/dashboard/data.js — keep the two in sync by hand, this table is the source of truth.
create table areas (
  name text primary key
);

-- Free-text CRUD sections from the Profile schema — one table per section, matching the frontend 1:1.
create table profile_education (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id),
  degree                text not null,
  specialization        text,
  institution           text,
  board_or_university   text,
  location              text,
  start_year            text,
  end_year              text,
  is_ongoing            boolean not null default false,
  sort_order            int not null default 0
);

create table profile_projects (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id),
  title            text not null,
  tech_stack       text[] not null default '{}',
  description      text,
  source_code_url  text,
  demo_url         text,
  docs_url         text,
  sort_order       int not null default 0
);

create table profile_publications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  title       text not null,
  description text,
  link        text,
  sort_order  int not null default 0
);

create table profile_achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  title       text not null,
  description text,
  sort_order  int not null default 0
);

-- "selfCerts": user-reported external certifications, distinct from platform-issued `certificates` below.
create table profile_self_certifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  title      text not null,
  org        text,
  issued_on  text,                                -- kept as the frontend's free-text "YYYY-MM", not a real date
  link       text,
  proof_file_id uuid references files(id),
  sort_order int not null default 0
);

create table profile_connected_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  platform   text not null,
  url        text not null,
  sort_order int not null default 0
);
create index on profile_education (user_id);
create index on profile_projects (user_id);
create index on profile_publications (user_id);
create index on profile_achievements (user_id);
create index on profile_self_certifications (user_id);
create index on profile_connected_profiles (user_id);
```

`xp`, `level`, `credits`, `badges` from the Profile schema are **derived, not stored** — see §4.7. Storing them as mutable columns is exactly the kind of drift-prone counter golden rule #6 exists to prevent.

### 4.4 Organizations & initiatives (`org`, `initiative`)

```sql
create type initiative_purpose as enum ('learning', 'learncompete', 'competing');
create type initiative_status  as enum ('upcoming', 'live', 'past');
create type initiative_mode    as enum ('virtual', 'hybrid', 'in_person');

create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  logo_file_id uuid references files(id),
  created_at timestamptz not null default now()
);

create table initiatives (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  slug        text unique not null,
  name        text not null,
  purpose     initiative_purpose not null,
  status      initiative_status not null default 'upcoming',
  region      text not null,
  mode        initiative_mode not null,
  areas       text[] not null default '{}',        -- GIN-indexed, matches areas.name
  prize_text  text,
  deadline    timestamptz not null,
  blurb       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on initiatives using gin (areas);
create index on initiatives (status, purpose, deadline);
create index on initiatives (region);

-- status transitions upcoming→live→past are deadline-driven; the scheduler (§ golden rule / pkg/scheduler)
-- flips `status` on a cron tick rather than every read computing it — keeps catalog queries a plain index scan.

create table problem_statements (
  id             uuid primary key default gen_random_uuid(),
  initiative_id  uuid not null references initiatives(id),
  code           text not null,                    -- e.g. "PS-138", referenced by SubmissionPayload.statementCode
  title          text not null,
  description    text,
  unique (initiative_id, code)
);

create table registrations (
  id            uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references initiatives(id),
  user_id       uuid not null references users(id),
  registered_at timestamptz not null default now(),
  unique (initiative_id, user_id)
);
create index on registrations (user_id);

create table saved_initiatives (
  user_id       uuid not null references users(id),
  initiative_id uuid not null references initiatives(id),
  saved_at      timestamptz not null default now(),
  primary key (user_id, initiative_id)
);

-- Capped to the frontend's "last 12 viewed" at the query layer (ORDER BY viewed_at DESC LIMIT 12),
-- not by deleting rows — keeps the full history available if the cap ever changes.
create table recent_views (
  user_id       uuid not null references users(id),
  initiative_id uuid not null references initiatives(id),
  viewed_at     timestamptz not null default now(),
  primary key (user_id, initiative_id)
);
create index on recent_views (user_id, viewed_at desc);
```

### 4.5 Teams & submissions (`team`, `submission`)

```sql
create type team_role   as enum ('leader', 'member');
create type submission_status as enum ('draft', 'submitted', 'under_review', 'scored');

create table teams (
  id            uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references initiatives(id),
  name          text not null,
  created_at    timestamptz not null default now()
);

create table team_members (
  team_id  uuid not null references teams(id),
  user_id  uuid not null references users(id),
  role     team_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index on team_members (user_id);

create table submissions (
  id                    uuid primary key default gen_random_uuid(),
  initiative_id         uuid not null references initiatives(id),
  team_id               uuid references teams(id),          -- nullable: solo submissions are allowed ("team = 'solo'" in the frontend)
  problem_statement_id  uuid references problem_statements(id),
  submitted_by          uuid not null references users(id),
  title                 text,
  repo_url              text,
  demo_url              text,
  notes                 text,
  attachment_file_id    uuid references files(id),          -- single optional attachment, ≤2MB — src/dashboard/Workspace.jsx's BuildSubmit only ever takes one
  status                submission_status not null default 'draft',
  submitted_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index on submissions (initiative_id, status);
create index on submissions (team_id);

-- Self-assessment: the innovator scores their OWN submission against the rubric
-- (RUBRIC in src/dashboard/data.js — ['Problem fit', 'Technical execution', 'Innovation',
-- 'Presentation'], each 0-10) via src/dashboard/Workspace.jsx's BuildSubmit → "Open evaluation" →
-- Evaluate.jsx, keyed by SELF_KEY = initiative_id + '::self'. This isn't cosmetic — reachedFor() in
-- data.js gates the innovator's own journey progress on whether this row exists, so it has to be a
-- real, persisted write, not a client-only flag. (Mentor judging of the same rubric is a separate,
-- currently out-of-scope feature — no `judging_scores` table in this build.)
create table submission_self_assessments (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references submissions(id),
  user_id        uuid not null references users(id),
  rubric         jsonb not null,        -- { "Problem fit": 8, "Technical execution": 7, ... } — same 4 keys as RUBRIC
  total          int not null,          -- sum of the 4 rubric scores, denormalized because the journey-gate check reads it constantly
  note           text,
  created_at     timestamptz not null default now(),
  unique (submission_id, user_id)
);
```

### 4.6 Learning (`learning`) & gamification

```sql
create type module_kind as enum ('video', 'reading', 'lab');

create table learning_modules (
  id            uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references initiatives(id),
  idx           int not null,
  title         text not null,
  kind          module_kind not null,
  content_url   text,
  unique (initiative_id, idx)
);

create table module_sections (
  id         uuid primary key default gen_random_uuid(),
  module_id  uuid not null references learning_modules(id),
  idx        int not null,
  title      text not null,
  body       text,
  unique (module_id, idx)
);

create table module_quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  module_id      uuid not null references learning_modules(id),
  idx            int not null,
  question       text not null,
  options        jsonb not null,       -- ["opt a", "opt b", ...]
  correct_index  int not null,
  unique (module_id, idx)
);

create table user_module_progress (
  user_id           uuid not null references users(id),
  module_id         uuid not null references learning_modules(id),
  sections_done     int[] not null default '{}',
  quiz_answers      jsonb,
  completed_at      timestamptz,
  primary key (user_id, module_id)
);

create table certificates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  initiative_id uuid not null references initiatives(id),
  cert_number   text unique not null,
  file_id       uuid references files(id),
  issued_at     timestamptz not null default now(),
  unique (user_id, initiative_id)
);

-- "pending certificate" (Profile's All Certs page) is derived, not stored:
-- a finished initiative the user registered for with no matching `certificates` row.

-- Gamification events — XP/level/badges are computed from this, never a mutable counter on `users`.
create type xp_event_kind as enum ('registered', 'submission', 'certificate', 'hat_earned', 'profile_complete');

create table xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  kind       xp_event_kind not null,
  ref_id     uuid,                     -- the initiative/submission/certificate this event came from
  points     int not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)       -- idempotent: the same achievement never scores twice
);
create index on xp_events (user_id);
-- xp = SUM(points) WHERE user_id = ?; level = a pure function of xp, computed in Go exactly like
-- levelFor() in src/dashboard/data.js today. Badges are a similar derived read over xp_events + registrations.
```

### 4.7 Notifications (`notification`)

```sql
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  type       text not null,
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc) where read_at is null;
```

No `notification_prefs` table: `Settings.jsx` dropped its notification-toggle UI outright ("No tabs, no Notifications/Privacy/Preferences — out of scope") — nothing in the current frontend would ever write to it, so it doesn't exist here either. Add it back only alongside the UI that needs it.

---

## 5. One open item to flag back to the frontend side

[api_req/dashboard.md](api_req/dashboard.md) §5 ("Settings & Account Operations") is stale — it still documents the old 4-tab Settings design (`/api/profile/me/settings` with `discoverable`/`openToTeams`, a single `/api/account/me` `DELETE`). The actual shipped [Settings.jsx](src/dashboard/Settings.jsx) is the 5-box production version: password-gated email change with verification, real session list + revoke, deactivate (password-gated), and delete (password + typed "DELETE"). The endpoints above (§4.1) are designed against the *current* implementation, not the stale doc. Worth updating `api_req/dashboard.md` §5 to match before handing this off, so nobody builds against the old contract by mistake.
