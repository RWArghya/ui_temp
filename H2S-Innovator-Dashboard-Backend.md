# H2S Innovator Dashboard — Backend Architecture (Corrected)

Written for: a backend engineer (or Claude session) building the Go API. This document replaces the submitted `H2S-Golang-Backend-App-Architecture.pdf` — same stack, same shape, but re-pointed at what's actually being built right now, with every gap from the review closed and OTP login added. See [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) for the full platform-wide review this narrows down from.

## Scope: Innovator Dashboard only

This build covers everything reachable inside the Innovator's own dashboard shell — the parts of H2S that are already built and shipping on the frontend:

**In scope**: Auth (password + OTP login, signup + OTP email verification, forgot password), Account & Settings (email change, password change, session management, deactivate, delete), Profile (all sections + public preview + resume export), Dashboard home & KPIs, Catalogs (Learn/Build/Compete), Initiative workspace (modules, quiz, certificate claim, team join, prototype submission, self-assessment), Saved & Recently Viewed, Notifications feed.

**Out of scope for this build**: Mentor — the application flow, the console (`src/dashboard/Mentor.jsx` — a real, already-built frontend page, not a hypothetical future one), and the "Mentor Connect" request toggle inside the Build workspace — all excluded together, not just the console. Arena / "PromptWars" (`src/dashboard/Arena.jsx` — drops, submissions, credit ledger, leaderboard, swag store) — also excluded entirely. Sponsor/Org admin tooling, Platform admin. The innovator's own **self-assessment** of their submission (a real, currently-shipped feature — `src/dashboard/Evaluate.jsx`, gates journey progress) IS in scope and is a distinct feature from mentor judging — its table (`submission_self_assessments`) lives in [BACKEND_ARCHITECTURE.md §4.5](BACKEND_ARCHITECTURE.md#45-teams--submissions-team-submission).

---

## 1. Stack Summary

Unchanged from the submitted PDF — these choices are correct for this product and don't need revisiting.

| Layer | Choice | Why |
|---|---|---|
| HTTP framework | [chi](https://github.com/go-chi/chi) | Idiomatic `net/http`, composable sub-routers per module, no lock-in |
| Data access | [sqlc](https://github.com/sqlc-dev/sqlc) | Type-safe Go generated from raw SQL — full query control, no ORM magic |
| Postgres driver | [pgx v5](https://github.com/jackc/pgx) | Native Postgres types, fast pooling via `pgxpool` |
| Migrations | [golang-migrate](https://github.com/golang-migrate/migrate) | SQL-first schema management, CLI + library |
| Cache / rate-limit | [go-redis v9](https://github.com/redis/go-redis) | Official Redis client, pooling + pub/sub built in |
| Messaging | [amqp091-go](https://github.com/rabbitmq/amqp091-go) | Official RabbitMQ-maintained AMQP 0.9.1 client |
| Object storage | S3-compatible (S3 / MinIO) via `aws-sdk-go-v2/service/s3` | **New vs. the PDF** — avatars, cert-proof images, submission attachments never belong in Postgres |
| Password hashing | `golang.org/x/crypto/argon2` (argon2id) | **New vs. the PDF** — the PDF never specified one; argon2id is the current recommended default |

---

## 2. Directory layout — with why/usage per file

```
main.go                          # Wires everything below into one process and starts/stops it cleanly.
                                  # Usage: the only file that knows about every module at once — reads
                                  # config, opens the DB pool/Redis/RabbitMQ, builds the router, starts
                                  # the HTTP server, and shuts it all down on SIGINT/SIGTERM.

controllers/
  routes.go                      # Every route lives here, grouped public vs. authenticated vs. role-gated.
                                  # Usage: the single place that answers "what can hit this API and does
                                  # it need to be logged in?" — golden rule: RBAC decisions belong here,
                                  # not scattered through handler bodies.
  auth_controller.go             # POST /register, /login, /login/otp/request, /login/otp/verify,
                                  # /refresh, /logout, /password/forgot, /password/reset.
                                  # Usage: the ONLY controller allowed to issue or revoke a session.
  account_controller.go          # Settings' 5 actions: email change (+verify), password change,
                                  # session list/revoke, deactivate, delete.
                                  # Usage: every handler here re-verifies the caller's current password
                                  # server-side before mutating anything — mirrors Settings.jsx exactly.
  profile_controller.go          # Profile CRUD, section items (education/projects/publications/
                                  # achievements/self-certs/links), avatar upload, public preview,
                                  # resume export.
  initiative_controller.go       # Catalog list/filter, initiative detail, register, save/unsave,
                                  # recent-view recording, KPI summary.
  learning_controller.go         # Module syllabus, mark-section-done, quiz submit, certificate claim.
  team_controller.go             # Team create/join/roster for Build & Compete initiatives.
  submission_controller.go       # Submit prototype, list own submissions, self-assessment.
  notification_controller.go     # Notification feed list + mark-read.
services/
  <module>_service.go            # One per controller above. Usage: business logic and validation live
                                  # here, never in the controller — the controller's only job is
                                  # decode request → call service → encode response.
  email_service.go                # Writes to the `email_outbox` table (§6) — does NOT call a mail
                                  # provider directly. Usage: keeps every caller decoupled from "how do
                                  # we actually send mail", and means an email never gets lost because a
                                  # request handler crashed mid-send.
queries/
  schema.sql                     # Per-module table DDL, or a pointer into migrations/ for that module's
                                  # tables. Usage: what sqlc reads to type-check queries.sql against.
  queries.sql                    # sqlc-annotated raw SQL — every query the module's service layer runs.
                                  # Usage: this is the actual API surface between Go code and Postgres;
                                  # nothing outside this file ever writes raw SQL.
db/                               # sqlc-generated: models.go, queries.sql.go, db.go. Usage: never hand-
                                  # edited — regenerated by `sqlc generate` whenever queries.sql changes.
platform/
  middleware/
    auth.go                      # Parses the access-token JWT, loads the caller onto the request context.
    rbac.go                      # **New vs. the PDF** — per-route-group role check. Only one real role
                                  # in this build's scope (Innovator); still worth its own middleware
                                  # rather than an inline check, since Sponsor/Admin roles land later.
    ratelimit.go                 # **New vs. the PDF** — Redis-backed sliding window, applied to
                                  # /login, /login/otp/request, /password/forgot specifically.
    request_id.go / logging.go / recovery.go   # Standard chi middleware, unchanged from the PDF.
  config/                        # Env loading — DB/Redis/RabbitMQ URLs, JWT signing key, S3 bucket,
                                  # email provider key, OTP length/TTL, rate-limit thresholds.
  observability/                 # Tracing/metrics — unchanged from the PDF.
migrations/
  NNNNNN_<name>.up.sql / .down.sql   # golang-migrate pairs. Usage: the single source of truth for what's
                                  # actually applied to Postgres; sqlc's `schema:` field points at this
                                  # same directory so generated types can never drift from reality.
pkg/
  dbpool/                        # pgxpool wrapper — unchanged from the PDF.
  cache/                         # go-redis wrapper — unchanged from the PDF, now also backs rate limits.
  mq/                            # amqp091-go connection/channel management — unchanged from the PDF.
  storage/                       # **New vs. the PDF** — thin S3 client wrapper: PutObject/presigned-GET
                                  # only. Usage: every file upload (avatar, submission attachment, cert
                                  # proof) goes through here, never through a raw AWS SDK call in a handler.
  scheduler/                     # **New vs. the PDF** — a ticker-driven goroutine that publishes to
                                  # RabbitMQ on a schedule. Usage: flips initiative status on deadline,
                                  # opens the next PW drop, purges expired OTP/email-change/reset tokens.
sqlc.yaml
go.mod
```

---

## 3. HTTP layer — chi, with public vs. authenticated route groups

The PDF's router mounted everything flat with no distinction between public and authenticated routes. Corrected:

```go
import (
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "h2s/platform/middleware/auth"
    "h2s/platform/middleware/rbac"
    "h2s/platform/middleware/ratelimit"
)

func NewRouter(deps *Deps) *chi.Mux {
    r := chi.NewRouter()
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(30 * time.Second))

    r.Route("/api/v1", func(r chi.Router) {
        // Public — no session required. Rate-limited: these are exactly the
        // endpoints credential-stuffing and OTP-brute-force attacks hit first.
        r.Group(func(r chi.Router) {
            r.Use(ratelimit.PerIP(deps.Redis, "auth", 10, time.Minute))
            r.Post("/auth/register", authCtl.Register)
            r.Post("/auth/login", authCtl.Login)
            r.Post("/auth/login/otp/request", authCtl.RequestLoginOTP)
            r.Post("/auth/login/otp/verify", authCtl.VerifyLoginOTP)
            r.Post("/auth/signup/otp/verify", authCtl.VerifySignupOTP)
            r.Post("/auth/signup/otp/resend", authCtl.ResendSignupOTP)
            r.Post("/auth/refresh", authCtl.Refresh)
            r.Post("/auth/password/forgot", authCtl.ForgotPassword)
            r.Post("/auth/password/reset", authCtl.ResetPassword)
            r.Get("/profile/public/{slug}", profileCtl.PublicBySlug)
            r.Get("/certificates/{certId}", learningCtl.PublicCertificate)
        })

        // Authenticated — every route below requires a valid access token.
        r.Group(func(r chi.Router) {
            r.Use(auth.RequireSession(deps.JWT))

            r.Post("/auth/logout", authCtl.Logout)

            r.Route("/account", func(r chi.Router) {
                r.Post("/email/request", accountCtl.RequestEmailChange)   // password-gated
                r.Post("/email/resend", accountCtl.ResendEmailVerify)
                r.Post("/email/verify", accountCtl.VerifyEmailChange)
                r.Post("/password", accountCtl.ChangePassword)
                r.Get("/sessions", accountCtl.ListSessions)
                r.Post("/sessions/{id}/revoke", accountCtl.RevokeSession)
                r.Post("/deactivate", accountCtl.Deactivate)              // password-gated
                r.Delete("/", accountCtl.Delete)                          // password + typed "DELETE"
            })

            r.Route("/profile", func(r chi.Router) {
                r.Get("/me", profileCtl.Me)
                r.Patch("/me", profileCtl.UpdateMe)
                r.Post("/me/avatar", profileCtl.UploadAvatar)
                r.Route("/me/{section}", func(r chi.Router) {            // education|projects|publications|
                    r.Post("/", profileCtl.AddSectionItem)                // achievements|self-certs|links
                    r.Patch("/{itemId}", profileCtl.EditSectionItem)
                    r.Delete("/{itemId}", profileCtl.DeleteSectionItem)
                })
                r.Post("/me/resume/pdf", profileCtl.ExportResumePDF)
                r.Post("/me/resume/latex", profileCtl.ExportResumeLatex)
            })

            r.Route("/dashboard", func(r chi.Router) {
                r.Get("/kpis", initiativeCtl.KPIs)
            })

            r.Route("/initiatives", func(r chi.Router) {
                r.Get("/", initiativeCtl.List)                  // catalog + filters
                r.Get("/active", initiativeCtl.Active)
                r.Get("/recommended", initiativeCtl.Recommended)
                r.Get("/saved", initiativeCtl.Saved)
                r.Get("/recent", initiativeCtl.Recent)
                r.Get("/areas", initiativeCtl.Areas)
                r.Get("/modes", initiativeCtl.Modes)
                r.Get("/{id}", initiativeCtl.Detail)
                r.Post("/{id}/register", initiativeCtl.Register)
                r.Post("/{id}/save", initiativeCtl.ToggleSave)
                r.Post("/{id}/recent-view", initiativeCtl.RecordRecentView)

                r.Get("/{id}/modules", learningCtl.Modules)
                r.Post("/{id}/modules/{mod}/sections/{sec}/complete", learningCtl.CompleteSection)
                r.Post("/{id}/modules/{mod}/quiz", learningCtl.SubmitQuiz)
                r.Post("/{id}/certificate/claim", learningCtl.ClaimCertificate)

                r.Post("/{id}/problem-statement", teamCtl.SelectProblemStatement)
                r.Post("/{id}/teams/{teamId}/join", teamCtl.JoinTeam)
                r.Post("/{id}/submissions", submissionCtl.Submit)
                r.Post("/{id}/submissions/self-assessment", submissionCtl.SubmitSelfAssessment)  // gates journey progress, see §4.5 in the DB doc
            })

            r.Route("/notifications", func(r chi.Router) {
                r.Get("/", notificationCtl.List)
                r.Post("/{id}/read", notificationCtl.MarkRead)
            })
        })
    })

    return r
}
```

---

## 4. Auth module — OTP added, both login paths

The submitted PDF had no auth module at all. This is the corrected design, covering the two OTP flows the frontend now has (`src/pages/Auth.jsx`):

- **Signup email verification** — already existed conceptually (verify the email you just registered with) — `purpose = 'signup_verify'`.
- **Login with OTP** — new, added alongside password login as a toggle on the login screen (`Log in with OTP instead`) — `purpose = 'login'`.

Both share one table and one pair of endpoints, distinguished by `purpose`, exactly mirroring how `Auth.jsx` reuses one OTP state machine for both (`otpPurpose` state).

```sql
create type otp_purpose as enum ('signup_verify', 'login');

create table otp_codes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  purpose       otp_purpose not null,
  code_hash     text not null,             -- sha256(code) — the raw 6-digit code is never stored
  expires_at    timestamptz not null,       -- now() + 10 minutes
  attempt_count int not null default 0,     -- locks out after 5 wrong guesses, matches golden rule
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index on otp_codes (user_id, purpose) where consumed_at is null;
```

**Request** (`POST /auth/login/otp/request` or `/auth/signup/otp/verify`'s resend sibling):
1. Look up the account by email. For `login`, an unknown email returns the same "No account found for that email" error the password path already gives — the frontend already leaks this on the password login screen, so the OTP path staying consistent with it is a deliberate call, not an oversight; tightening both together (generic "check your email" response) is a fine follow-up but should happen to both paths at once, not just this one.
2. Rate-limited via Redis: `ratelimit.PerKey(redis, "otp:"+email, 5, time.Hour)` — 5 requests per email per hour, independent of the per-IP limit on the route group.
3. Generate a 6-digit code, hash it, insert an `otp_codes` row, and hand it to `email_service` → outbox (§6) rather than sending inline.

**Verify** (`POST /auth/login/otp/verify` or `/auth/signup/otp/verify`):
1. Load the latest unconsumed row for `(user_id, purpose)`.
2. Reject if expired, if `attempt_count >= 5` ("Too many attempts — request a new code"), or if the hash doesn't match (and increment `attempt_count` on a miss).
3. On match: mark `consumed_at`, and for `purpose = 'login'` issue a session exactly like password login does (new `auth_sessions` row + access/refresh token pair); for `purpose = 'signup_verify'`, set `users.email_verified_at = now()` and return success so the client can continue to onboarding. Either way, write an `audit_logs` row (`otp_login` or `email_verified`).

Everything else auth-related — `auth_sessions`, `email_change_requests`, `password_reset_requests`, `audit_logs`, password hashing — is unchanged from [BACKEND_ARCHITECTURE.md §4.1](BACKEND_ARCHITECTURE.md#41-auth--account-auth-account); this document doesn't repeat it.

---

## 5. Data layer — sqlc config scoped to this build

```yaml
version: "2"
sql:
  - schema: "migrations"
    queries: "internal/auth/queries/queries.sql"
    engine: "postgresql"
    gen:
      go: { package: "authdb", out: "internal/auth/db", sql_package: "pgx/v5", emit_json_tags: true, emit_interface: true }
  - schema: "migrations"
    queries: "internal/account/queries/queries.sql"
    engine: "postgresql"
    gen:
      go: { package: "accountdb", out: "internal/account/db", sql_package: "pgx/v5", emit_json_tags: true, emit_interface: true }
  # ...one block per module in §2: profile, initiative, learning, team, submission, notification
```

One schema pass across all modules (not per-module) so cross-module foreign keys resolve — `submissions.initiative_id → initiatives.id` needs both tables visible to the same sqlc run, same as the PDF's original single-pass rationale.

Example query file (`internal/auth/queries/queries.sql`), showing the OTP queries added on top of the PDF's pattern:

```sql
-- name: InsertOTP :one
INSERT INTO otp_codes (user_id, purpose, code_hash, expires_at)
VALUES ($1, $2, $3, now() + interval '10 minutes')
RETURNING *;

-- name: GetActiveOTP :one
SELECT * FROM otp_codes
WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL
ORDER BY created_at DESC LIMIT 1;

-- name: IncrementOTPAttempts :exec
UPDATE otp_codes SET attempt_count = attempt_count + 1 WHERE id = $1;

-- name: ConsumeOTP :exec
UPDATE otp_codes SET consumed_at = now() WHERE id = $1;
```

`emit_interface: true` on every module, per the PDF — each service depends on the generated `Querier` interface, not the concrete pool, so a service test can mock it. (The query layer itself still gets integration-tested against real Postgres — mocking `Querier` proves the service's *logic*, not that the SQL is correct.)

---

## 6. Cache — Redis, three concrete uses (the PDF only gestured at "use it for stuff")

| Use | Key pattern | TTL | Why |
|---|---|---|---|
| Rate limiting | `ratelimit:{route}:{ip}`, `otp:{email}` | window length | Backs the `/auth/*` route group and OTP request endpoint — a sliding-window counter, incremented and checked atomically with `INCR` + `EXPIRE`. |
| Session lookup | `session:{access_token_jti}` → `user_id` | = access token TTL | Avoids a Postgres round-trip on every authenticated request just to know who's calling; the source of truth for revocation is still `auth_sessions` in Postgres, checked on refresh. |
| Catalog cache-aside | `initiatives:list:{filter_hash}` | 60s | The catalog (`/initiatives`) is read far more than it's written — cache the filtered list, invalidate by TTL rather than on every write (an initiative's status/deadline changing doesn't need to be instant for every viewer). |

---

## 7. Messaging — RabbitMQ, the email outbox specifically

The PDF showed the exchange/queue wiring but no concrete consumer. This build's first real consumer is the email outbox, because OTP delivery depends on it:

```sql
create table email_outbox (
  id          uuid primary key default gen_random_uuid(),
  to_email    citext not null,
  template    text not null,         -- 'otp_login' | 'otp_signup_verify' | 'email_change_verify' | 'password_reset'
  data        jsonb not null,        -- template variables (the code, the verification link, ...)
  status      text not null default 'pending',   -- 'pending' | 'sent' | 'failed'
  attempts    int not null default 0,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
```

`email_service.Send(...)` just inserts a row here and publishes `{ outbox_id }` to the `email.outbox` queue — the request handler returns immediately. A consumer goroutine pulls from the queue, calls the actual email provider, and updates `status`. If the provider is down, the message stays in the queue and retries — nothing about an OTP request ever blocks on SMTP being up.

```go
ch.ExchangeDeclare("h2s.events", "topic", true, false, false, false, nil)
q, _ := ch.QueueDeclare("email.outbox", true, false, false, false, nil)
ch.QueueBind(q.Name, "email.outbox", "h2s.events", false, nil)
```

---

## 8. Wiring — `main.go`

```go
func main() {
    ctx := context.Background()
    cfg := config.Load()

    pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
    if err != nil { log.Fatal(err) }
    defer pool.Close()

    rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
    defer rdb.Close()

    mqConn, err := amqp.Dial(cfg.RabbitMQURL)
    if err != nil { log.Fatal(err) }
    defer mqConn.Close()

    store, err := storage.New(cfg.S3Bucket, cfg.S3Region)   // new vs. the PDF
    if err != nil { log.Fatal(err) }

    deps := &Deps{DB: pool, Redis: rdb, MQ: mqConn, Storage: store, JWT: cfg.JWTKey}
    router := httpapi.NewRouter(deps)

    go scheduler.Run(ctx, deps)   // new vs. the PDF — initiative status flips, PW drop rotation, token purge

    srv := &http.Server{Addr: ":8080", Handler: router, ReadTimeout: 15 * time.Second, WriteTimeout: 15 * time.Second}
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
    <-quit

    shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    srv.Shutdown(shutdownCtx)
}
```

---

## 9. Reference docs

| Component | Repo | Docs |
|---|---|---|
| chi | https://github.com/go-chi/chi | https://pkg.go.dev/github.com/go-chi/chi/v5 |
| sqlc | https://github.com/sqlc-dev/sqlc | https://docs.sqlc.dev/en/latest/ |
| pgx / pgxpool | https://github.com/jackc/pgx | https://pkg.go.dev/github.com/jackc/pgx/v5 |
| golang-migrate | https://github.com/golang-migrate/migrate | README covers CLI + library usage |
| go-redis | https://github.com/redis/go-redis | https://pkg.go.dev/github.com/redis/go-redis/v9 |
| amqp091-go | https://github.com/rabbitmq/amqp091-go | README covers usage |
| argon2 | golang.org/x/crypto/argon2 | https://pkg.go.dev/golang.org/x/crypto/argon2 |
| aws-sdk-go-v2 (S3) | https://github.com/aws/aws-sdk-go-v2 | https://pkg.go.dev/github.com/aws/aws-sdk-go-v2/service/s3 |
| PostgreSQL | — | https://www.postgresql.org/docs/ |
| Redis | — | https://redis.io/docs/latest/ |
| RabbitMQ | — | https://www.rabbitmq.com/docs |

---

## 10. What this document deliberately does not repeat

The full table-by-table DDL for every module (profile sections, initiatives, teams, submissions, learning, notifications) already exists in [BACKEND_ARCHITECTURE.md §4](BACKEND_ARCHITECTURE.md#4-database-design), grounded against the real frontend contracts in [api_req/dashboard.md](api_req/dashboard.md) and [api_req/profile.md](api_req/profile.md). This document only adds what changed for this narrower build: the `otp_codes` and `email_outbox` tables (§4, §7), the corrected route groups (§3), and the scope cut (Mentor and Arena excluded entirely, not just deferred — see the Scope section at the top). Build from both together — this one for "what to build and why," the other for "the exact schema."
