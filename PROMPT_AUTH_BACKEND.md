# Implementation Prompt — Auth Backend (Register, Login)

Paste this to a backend Claude Code session (or hand to an engineer) to implement just this slice of the Go API. Self-contained — doesn't assume the other H2S docs are open, though it points at them for what it reuses rather than repeats.

**Step 1 of a phased build.** Forgot-password, Settings/account management, profile, initiatives, and everything else come in later prompts — don't build ahead of this one.

---

## Scope

Two flows only, matching `src/pages/Auth.jsx` + `src/store/auth.js` field-for-field:

1. **Register** (signup + email OTP verification)
2. **Login** (password login, and passwordless OTP login)

Stack: Go, chi, sqlc, pgx v5, golang-migrate, go-redis (rate limiting), argon2id for password hashing. See [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) for the golden rules — follow them even though most barely bite for a slice this narrow.

---

## 1. Register

**Frontend contract** (`Auth.jsx`'s signup form + `VALIDATION` + `handleSubmit`):

| Field | Rule |
|---|---|
| `name` | required, ≥2 chars (trimmed) |
| `email` | required, `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` |
| `mobile` | required, country code (`+91`/`+1`/`+44`/`+65`/`+971`) + 10 digits, stored as one string `"+91 98765 43210"` |
| `password` | required, ≥8 chars AND contains a digit |
| terms checkbox | required, client-side only — no backend field |

Flow:
1. `POST /api/v1/auth/register` `{ name, email, mobile, password }` →
   - Email already registered: `409` — frontend renders "That email is already registered — log in instead." Return something distinguishable, e.g. `{ error: "email_taken" }`.
   - Otherwise: create the `users` row with `email_verified_at = null`, hash the password (argon2id), generate a 6-digit OTP, insert into `otp_codes` (`purpose = 'signup_verify'`, 10-minute expiry), send it via the email outbox (§4). Return `201` — no session yet, the account isn't usable until verified.
2. `POST /api/v1/auth/signup/otp/verify` `{ email, code }` → validate against `otp_codes`, on match set `email_verified_at = now()`, mark the code consumed, **and issue a session** (this is also the "log the user in" moment — matches `afterAuth()` in the frontend, which proceeds straight to onboarding after verify, no separate login step).
3. `POST /api/v1/auth/signup/otp/resend` `{ email }` → same generation as step 1, no new user row, rate-limited (§5).

Wrong-code handling: increment `otp_codes.attempt_count`; at 5, reject with "too many attempts, request a new code" even if a later guess would've been right.

---

## 2. Login

Frontend has two login methods, toggled by the user (`loginMethod` state in `Auth.jsx`) — implement both:

**2a. Password login**
`POST /api/v1/auth/login` `{ email, password }` →
- Email not found: `401` → frontend shows "No account found for that email."
- Password mismatch: `401` → frontend shows "That password doesn't match."
- Match: issue a session.

**2b. OTP login** ("Log in with OTP instead")
1. `POST /api/v1/auth/login/otp/request` `{ email }` → same "No account found for that email" check as password login (the frontend already checks this before requesting, so the backend enforcing it too is consistent, not newly leaky — this is existing, shipped behavior, not something this build introduces). Generate + send a 6-digit OTP, `otp_codes` row with `purpose = 'login'`.
2. `POST /api/v1/auth/login/otp/verify` `{ email, code }` → validate, on match issue a session exactly like password login. Same attempt-lockout as signup verify.

Both login paths return the same session shape — the frontend doesn't care which method was used.

**Session issuance** (shared by password login, OTP login, signup verify): create an `auth_sessions` row (device label from `User-Agent`, IP, hashed refresh token), return `{ accessToken, refreshToken }`. This is the same table Settings' "Manage Active Sessions" reads from later — don't design a second, incompatible session mechanism.

`POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout` — standard refresh-rotation and session-revoke. Needed for any of the above to be usable beyond one page load.

---

## 3. Schema for this step

```sql
create extension if not exists pgcrypto;
create type user_status as enum ('active', 'deactivated', 'deleted');

create table users (
  id                uuid primary key default gen_random_uuid(),
  email             citext unique not null,
  email_verified_at timestamptz,
  password_hash     text not null,
  name              text not null,
  mobile            text,
  status            user_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table auth_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id),
  refresh_token_hash text not null unique,
  device_label       text,
  ip                 inet,
  user_agent         text,
  created_at         timestamptz not null default now(),
  last_active_at     timestamptz not null default now(),
  revoked_at         timestamptz
);
create index on auth_sessions (user_id) where revoked_at is null;

-- purpose has only 2 values for this step — 'password_reset' gets added by a later migration
-- when forgot-password is actually built (expand/contract, don't pre-add an unused enum value).
create type otp_purpose as enum ('signup_verify', 'login');

create table otp_codes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  purpose       otp_purpose not null,
  code_hash     text not null,
  expires_at    timestamptz not null,
  attempt_count int not null default 0,
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index on otp_codes (user_id, purpose) where consumed_at is null;
```

`users` here only has the columns this step needs (`headline`/`org`/`region`/`avatar_file_id`/etc. from the full schema in [DATABASE_SCHEMA.md §3](DATABASE_SCHEMA.md#3-auth--account) come with Profile, later). Extend, don't replace, when that step lands.

---

## 4. Email delivery

Both flows send an OTP by email. Don't call an email provider inline from the request handler — write to an outbox table and let a consumer send it:

```sql
create table email_outbox (
  id         uuid primary key default gen_random_uuid(),
  to_email   citext not null,
  template   text not null,     -- 'otp_signup_verify' | 'otp_login'
  data       jsonb not null,    -- { code }
  status     text not null default 'pending',
  attempts   int not null default 0,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
```

---

## 5. Rate limiting

Redis-backed — login and OTP requests are exactly where credential-stuffing and brute-force land:

- `POST /auth/login` — per IP, e.g. 10/minute
- `POST /auth/login/otp/request`, `/auth/signup/otp/resend` — per email, e.g. 5/hour

---

## 6. Routes summary

```
POST /api/v1/auth/register
POST /api/v1/auth/signup/otp/verify
POST /api/v1/auth/signup/otp/resend
POST /api/v1/auth/login
POST /api/v1/auth/login/otp/request
POST /api/v1/auth/login/otp/verify
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

All public (no session required) — this is the one route group in the whole API that has to be, by definition.

---

## 7. Definition of done

- [ ] All 8 routes above implemented and matching the request/response shapes in §1–2
- [ ] `users`, `auth_sessions`, `otp_codes`, `email_outbox` migrations
- [ ] Passwords hashed with argon2id; never logged, never in a response body
- [ ] Rate limiting per §5
- [ ] Wrong-code lockout at 5 attempts on both `signup_verify` and `login` OTP purposes
