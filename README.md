# React + Vite

## Mock data or the real backend

The app ships with mock data and a localStorage auth flow so it runs with no
backend at all. One variable switches the auth flow to the real Go API.

```bash
cp .env.example .env.local     # *.local is gitignored
```

| `VITE_USE_MOCK` | What happens |
| --- | --- |
| unset or `true` | Mock everything, including the seeded demo login `demo@hack2skill.com` / `demo1234`. **This is the default.** |
| `false` | Auth calls the backend; everything else stays mock. |

Restarting `npm run dev` after changing it is the whole switch — no code edits.
Only `src/api/config.js` reads the variable.

### Real mode

Point `VITE_PROXY_TARGET` at the running backend (default
`http://localhost:8090`). The dev server proxies `/api` there, so the browser
sees one origin and there is no CORS to configure. In production nginx does the
same job, which is why `VITE_API_URL` stays `/api/v1` in both.

Only these eight endpoints are real today:

```
POST /auth/register            POST /auth/login
POST /auth/signup/otp/verify   POST /auth/login/otp/request
POST /auth/signup/otp/resend   POST /auth/login/otp/verify
POST /auth/refresh             POST /auth/logout
```

Everything else — onboarding, forgot/reset password, social login, Settings,
profile, dashboard, initiatives, certificates — has no backend yet and stays on
its mock implementation in both modes. `src/api/auth.js` shows the pattern for
adding the next one: a mock module, a real module, and a facade that picks
between them.

**Getting OTP codes in real mode.** There is no email sender yet. With
`OTP_DEBUG_LOG=true` (on by default in the backend's compose file) codes go to
its log:

```bash
docker logs h2s-backend 2>&1 | grep OTP
```

## Toolchain

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
