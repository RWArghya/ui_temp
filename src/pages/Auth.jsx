import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { authStore } from "../store/auth"

const VALIDATION = {
  name: (v) => v.trim().length >= 2 || "Enter your full name",
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "That email doesn't look right",
  mobile: (v) => /^\d{10}$/.test(v.replace(/\D/g, "")) || "Enter a 10-digit mobile number",
  pw: (v) => (v.length >= 8 && /\d/.test(v)) || "At least 8 characters, including a number",
}

function pwScore(v) {
  let s = 0
  if (v.length >= 8) s++
  if (v.length >= 12) s++
  if (/\d/.test(v)) s++
  if (/[^A-Za-z0-9]/.test(v)) s++
  return Math.min(s, 4)
}

const PW_LABELS = ["Too weak", "Weak", "Okay", "Strong", "Very strong"]
const COUNTRY_CODES = ["+91", "+1", "+44", "+65", "+971"]

// The reference page sources these from an unprovided app.js (landingViews()/landingKey()) —
// TBD once that contract is available; these four are a placeholder set.
const LANDING_VIEWS = [
  { k: "dashboard", ico: "\u{1F3E0}", label: "My Dashboard", blurb: "Everything you're doing, in one place" },
  { k: "compete", ico: "\u{1F3C6}", label: "Compete", blurb: "Join hackathons, build, submit, win" },
  { k: "arena", ico: "\u{1F3AE}", label: "Arena", blurb: "PromptWars — the vibe coding arena" },
]

const ERROR_COLOR = "#c0392b"

export default function Auth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const urlMode = searchParams.get("mode") === "login" ? "login" : "signup"
  const next = searchParams.get("next")
  const intent = searchParams.get("intent")

  const [mode, setMode] = useState(urlMode)
  const [step, setStep] = useState("credentials")
  const [otp, setOtp] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [otpCountdown, setOtpCountdown] = useState(30)
  const [agreed, setAgreed] = useState(false)
  const [selectedLanding, setSelectedLanding] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState("")

  const [form, setForm] = useState({
    name: "",
    email: "",
    cc: "+91",
    mobile: "",
    pw: "",
  })

  const otpRef = useRef(null)
  const otpTimerRef = useRef(null)

  const login = mode === "login"

  useEffect(() => {
    setMode(urlMode)
  }, [urlMode])

  // Reference gives the auth page its own static title regardless of login/signup mode.
  useEffect(() => {
    const prev = document.title
    document.title = "Sign in — Hack2skill"
    return () => {
      document.title = prev
    }
  }, [])

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current)
    }
  }, [])

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
    setFormError("")
  }, [])

  const pwStrength = useMemo(() => pwScore(form.pw), [form.pw])

  const startOtpCountdown = useCallback(() => {
    if (otpTimerRef.current) clearInterval(otpTimerRef.current)
    setOtpCountdown(30)
    otpTimerRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(otpTimerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const generateOtp = useCallback(() => {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setGeneratedOtp(code)
    setOtp("")
    setErrors({})
    startOtpCountdown()
  }, [startOtpCountdown])

  const contextBanner = useMemo(() => {
    if (!next) return null
    if (/initiative/.test(next)) return "to register for this initiative"
    if (/dashboard|app/.test(next)) return "to open your dashboard"
    return "to continue"
  }, [next])

  function afterAuth() {
    const state = authStore.read()
    if (state.onboarded) {
      if (!next && intent === "mentor") {
        navigate("/dashboard?view=mentor", { replace: true })
        return
      }
      if (!next) {
        setSelectedLanding(state.primary || null)
        setStep("landing")
        return
      }
      navigate(next || "/dashboard", { replace: true })
      return
    }
    const params = new URLSearchParams()
    if (intent) params.set("intent", intent)
    if (next) params.set("next", next)
    navigate("/onboarding" + (params.toString() ? "?" + params : ""), { replace: true })
  }

  function handleSubmit() {
    let bad = false
    const check = (field, rule) => {
      const r = VALIDATION[rule](form[field])
      if (r !== true) {
        setErrors((prev) => ({ ...prev, [field]: r }))
        bad = true
      }
    }

    if (!login) check("name", "name")
    check("email", "email")
    if (!login) check("mobile", "mobile")
    if (login) {
      if (!form.pw) {
        setErrors((prev) => ({ ...prev, pw: "Enter your password" }))
        bad = true
      }
    } else {
      check("pw", "pw")
    }
    if (!login && !agreed) {
      setErrors((prev) => ({ ...prev, terms: "You need to accept the Terms to continue." }))
      bad = true
    }
    if (bad) return

    const existing = authStore.read().account

    if (login) {
      if (!existing || existing.email.toLowerCase() !== form.email.trim().toLowerCase()) {
        setFormError("No account found for that email.")
        return
      }
      if (existing.pw !== weakHash(form.pw)) {
        setFormError("That password doesn't match.")
        return
      }
      afterAuth()
      return
    }

    if (existing && existing.email.toLowerCase() === form.email.trim().toLowerCase()) {
      setFormError(
        <>
          That email is already registered —{" "}
          <button type="button" onClick={() => setMode("login")} className="text-signal underline">
            log in instead
          </button>
          .
        </>
      )
      return
    }

    authStore.save({
      account: {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.cc + " " + form.mobile.replace(/\D/g, ""),
        pw: weakHash(form.pw),
        verified: false,
        created: new Date().toISOString().slice(0, 10),
      },
      name: form.name.trim(),
      email: form.email.trim(),
    })
    generateOtp()
    setStep("verify")
  }

  function handleSocial(provider) {
    const existing = authStore.read().account
    const a = existing || {
      name: "Aarav Sharma",
      email: "aarav@example.com",
      mobile: "",
      pw: null,
      verified: true,
      provider,
      onboarded: true,
      created: new Date().toISOString().slice(0, 10),
    }
    authStore.save({ account: a, name: a.name, email: a.email, onboarded: true })
    // Social providers hand back a verified account, so skip onboarding and ask where to land.
    if (next) {
      navigate(next, { replace: true })
      return
    }
    setSelectedLanding(authStore.read().primary || null)
    setStep("landing")
  }

  function handleOtpVerify() {
    const v = otp.trim()
    if (v.length !== 6) {
      setErrors({ otp: "Enter all 6 digits" })
      return
    }
    if (v !== generatedOtp) {
      setErrors({ otp: "That code is incorrect. Check and try again." })
      return
    }
    if (otpTimerRef.current) clearInterval(otpTimerRef.current)
    const acct = authStore.read().account
    authStore.save({ account: { ...acct, verified: true } })
    afterAuth()
  }

  function handleForgotSubmit() {
    setStep("forgot-sent")
  }

  function handleLandingContinue() {
    if (selectedLanding) authStore.save({ primary: selectedLanding })
    // Carry the chosen landing view so the dashboard (once built) can route to it.
    navigate(`/dashboard?view=${selectedLanding || ""}`, { replace: true })
  }

  function switchMode(newMode) {
    setMode(newMode)
    setErrors({})
    setFormError("")
    setForm({ name: "", email: "", cc: "+91", mobile: "", pw: "" })
    setAgreed(false)
    navigate(`/auth?mode=${newMode}${next ? "&next=" + encodeURIComponent(next) : ""}${intent ? "&intent=" + intent : ""}`, { replace: true })
  }

  // Resume incomplete signup on mount
  useEffect(() => {
    const acct = authStore.read().account
    if (urlMode === "signup" && acct && !acct.verified) {
      generateOtp()
      setStep("verify")
    } else if (urlMode === "signup" && acct && acct.verified && !authStore.read().onboarded) {
      afterAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      {/* Auth header */}
      <header className="border-b border-paper-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[66px] max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-btn bg-ramp font-mono text-[0.68rem] font-bold text-white">
              H2S
            </span>
            <span className="font-display text-lg font-black text-ink-900">Hack2skill</span>
          </Link>
          <div className="flex-1" />
          <Link
            to="/"
            className="rounded-btn border border-paper-line px-4 py-2 text-[0.85rem] font-medium text-graphite transition-colors hover:border-ink-line hover:text-ink-900"
          >
            &larr; Back to site
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[460px] px-4 pt-12 pb-20">
        {/* Context banner */}
        {contextBanner && step === "credentials" && (
          <div className="mb-6 rounded-card border border-signal-soft bg-signal-soft/50 p-4">
            <p className="text-[0.88rem] font-semibold text-signal">One quick step</p>
            <p className="mt-1 text-[0.82rem] text-graphite">
              Create your free account {contextBanner}. We'll bring you straight back.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="rounded-card border border-paper-line bg-paper-raised p-8">
          {/* ───── Step: Credentials ───── */}
          {step === "credentials" && (
            <>
              <h2 className="font-display text-[1.5rem] font-extrabold text-ink-900">
                {login ? "Welcome back" : "Create your free account"}
              </h2>
              <p className="mt-2 text-[0.88rem] text-graphite">
                {login
                  ? "Pick up where you left off."
                  : "One account for every way you use H2S. Free, always."}
              </p>

              {/* Social buttons */}
              <button
                type="button"
                onClick={() => handleSocial("Google")}
                className="mt-6 flex h-auto w-full items-center justify-center gap-1.5 rounded-btn border border-paper-line bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-950 transition-all duration-[0.12s] ease-out hover:-translate-y-px hover:border-signal hover:text-signal hover:shadow-[0_2px_8px_-4px_rgba(16,18,35,0.35)] active:translate-y-0 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                <span className="text-[1.05rem] font-bold" style={{ color: "#4285F4" }}>
                  G
                </span>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleSocial("GitHub")}
                className="mt-2 flex h-auto w-full items-center justify-center gap-1.5 rounded-btn border border-paper-line bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-950 transition-all duration-[0.12s] ease-out hover:-translate-y-px hover:border-signal hover:text-signal hover:shadow-[0_2px_8px_-4px_rgba(16,18,35,0.35)] active:translate-y-0 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="auth-divider my-5">
                <span>or</span>
              </div>

              {/* Name (signup only) */}
              {!login && (
                <Field
                  id="auth-name"
                  label="Full name"
                  placeholder="Aarav Sharma"
                  value={form.name}
                  onChange={(v) => updateField("name", v)}
                  error={errors.name}
                />
              )}

              {/* Email */}
              <Field
                id="auth-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(v) => updateField("email", v)}
                error={errors.email}
              />

              {/* Mobile (signup only) */}
              {!login && (
                <div className="mb-3">
                  <label htmlFor="auth-mobile" className="mb-1.5 block text-[0.85rem] font-medium text-ink-900">
                    Mobile
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.cc}
                      onChange={(e) => updateField("cc", e.target.value)}
                      className="rounded-btn border border-paper-line bg-paper-raised px-3 py-2.5 text-[0.9rem] text-ink-900 outline-none focus:border-signal"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      id="auth-mobile"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={form.mobile}
                      onChange={(e) => updateField("mobile", e.target.value)}
                      className="flex-1 rounded-btn border border-paper-line bg-paper-raised px-3 py-2.5 text-[0.9rem] text-ink-900 outline-none focus:border-signal"
                      style={errors.mobile ? { borderColor: ERROR_COLOR } : undefined}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="mt-1 text-[0.75rem]" style={{ color: ERROR_COLOR }}>
                      {errors.mobile}
                    </p>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="mb-3">
                <label htmlFor="auth-pw" className="mb-1.5 block text-[0.85rem] font-medium text-ink-900">
                  Password
                </label>
                <input
                  id="auth-pw"
                  type="password"
                  placeholder="••••••••"
                  value={form.pw}
                  onChange={(e) => {
                    updateField("pw", e.target.value)
                  }}
                  className="w-full rounded-btn border border-paper-line bg-paper-raised px-3 py-2.5 text-[0.9rem] text-ink-900 outline-none focus:border-signal"
                  style={errors.pw ? { borderColor: ERROR_COLOR } : undefined}
                />
                {errors.pw && (
                  <p className="mt-1 text-[0.75rem]" style={{ color: ERROR_COLOR }}>
                    {errors.pw}
                  </p>
                )}
                {!login && (
                  <>
                    <div className="auth-pw-meter mt-2">
                      <div
                        className="auth-pw-meter-fill"
                        style={{
                          width: `${(pwStrength / 4) * 100}%`,
                          background:
                            pwStrength <= 1
                              ? ERROR_COLOR
                              : pwStrength === 2
                                ? "#d97706"
                                : "var(--color-status)",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[0.75rem] text-graphite-dim">
                      {!form.pw
                        ? "At least 8 characters, including a number"
                        : PW_LABELS[pwStrength]}
                    </p>
                  </>
                )}
              </div>

              {/* Forgot password (login only) */}
              {login && (
                <p className="mb-3 text-[0.78rem]">
                  <button
                    type="button"
                    onClick={() => setStep("forgot")}
                    className="text-signal hover:underline"
                  >
                    Forgot password?
                  </button>
                </p>
              )}

              {/* Terms (signup only) */}
              {!login && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAgreed((prev) => !prev)
                      setErrors((prev) => ({ ...prev, terms: "" }))
                    }}
                    className="mb-3 flex w-full cursor-pointer items-start gap-2.5 rounded-btn border-0 bg-transparent p-0 text-left"
                  >
                    <span
                      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border text-[0.65rem] text-white ${
                        agreed ? "border-status bg-status" : "border-graphite-dim"
                      }`}
                    >
                      {agreed && "\u2713"}
                    </span>
                    <span className="text-[0.78rem] text-graphite">
                      I agree to the{" "}
                      <span className="text-signal">Terms</span> and{" "}
                      <span className="text-signal">Privacy Policy</span>.
                    </span>
                  </button>
                  {errors.terms && (
                    <p className="mb-2 text-[0.75rem]" style={{ color: ERROR_COLOR }}>
                      {errors.terms}
                    </p>
                  )}
                </>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-btn bg-signal px-4 py-3.5 text-[0.95rem] font-semibold text-white transition-colors hover:bg-signal-dark"
              >
                {login ? "Log in" : "Create account"}
              </button>

              {formError && (
                <p className="mt-3 text-center text-[0.8rem]" style={{ color: ERROR_COLOR }}>
                  {formError}
                </p>
              )}
            </>
          )}

          {/* ───── Step: OTP Verify ───── */}
          {step === "verify" && (
            <>
              <h2 className="font-display text-[1.5rem] font-extrabold text-ink-900">
                Verify your email
              </h2>
              <p className="mt-2 text-[0.88rem] text-graphite">
                We sent a 6-digit code to <strong className="text-ink-900">{form.email}</strong>. It
                expires in 10 minutes.
              </p>

              <div className="mt-6">
                <label htmlFor="auth-otp" className="mb-1.5 block text-[0.85rem] font-medium text-ink-900">
                  Verification code
                </label>
                <input
                  ref={otpRef}
                  id="auth-otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="······"
                  value={otp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "")
                    setOtp(v)
                    setErrors((prev) => ({ ...prev, otp: "" }))
                  }}
                  className="auth-otp-input w-full rounded-btn border border-paper-line bg-paper-raised px-3 py-2.5 text-ink-900 outline-none focus:border-signal"
                  style={errors.otp ? { borderColor: ERROR_COLOR } : undefined}
                />
                {errors.otp && (
                  <p className="mt-1 text-[0.75rem]" style={{ color: ERROR_COLOR }}>
                    {errors.otp}
                  </p>
                )}
              </div>

              {/* Prototype hint */}
              <div className="mt-4 rounded-card border border-signal-soft bg-signal-soft/40 p-3">
                <p className="text-[0.75rem] text-graphite-dim">
                  Prototype — no email is actually sent. Your code is{" "}
                  <strong className="text-ink-900">{generatedOtp}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleOtpVerify}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-btn bg-signal px-4 py-3.5 text-[0.95rem] font-semibold text-white transition-colors hover:bg-signal-dark"
              >
                Verify and continue
              </button>

              <p className="mt-4 text-center text-[0.78rem] text-graphite-dim">
                {otpCountdown > 0 ? (
                  <span>Resend code in {otpCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={generateOtp}
                    className="text-signal hover:underline"
                  >
                    Resend code
                  </button>
                )}
              </p>

              <p className="mt-2 text-center text-[0.78rem] text-graphite-dim">
                Wrong address?{" "}
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-signal hover:underline"
                >
                  Change it
                </button>
              </p>
            </>
          )}

          {/* ───── Step: Forgot Password ───── */}
          {step === "forgot" && (
            <>
              <h2 className="font-display text-[1.5rem] font-extrabold text-ink-900">
                Reset your password
              </h2>
              <p className="mt-2 text-[0.88rem] text-graphite">
                We'll email you a reset link, valid for one hour.
              </p>

              <div className="mt-6">
                <label htmlFor="auth-forgot-email" className="mb-1.5 block text-[0.85rem] font-medium text-ink-900">
                  Email
                </label>
                <input
                  id="auth-forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-btn border border-paper-line bg-paper-raised px-3 py-2.5 text-[0.9rem] text-ink-900 outline-none focus:border-signal"
                />
              </div>

              <button
                type="button"
                onClick={handleForgotSubmit}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-btn bg-signal px-4 py-3 text-[0.9rem] font-semibold text-white transition-colors hover:bg-signal-dark"
              >
                Send reset link
              </button>
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-btn border border-paper-line bg-transparent px-4 py-3 text-[0.9rem] font-medium text-graphite transition-colors hover:bg-paper"
              >
                Back to log in
              </button>
            </>
          )}

          {/* ───── Step: Forgot Sent ───── */}
          {step === "forgot-sent" && (
            <>
              <h2 className="font-display text-[1.5rem] font-extrabold text-ink-900">
                Check your inbox
              </h2>
              <p className="mt-2 text-[0.88rem] text-graphite">
                If an account exists for that address, a reset link is on its way. It's deliberately
                worded that way — confirming which emails are registered leaks accounts.
              </p>
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-btn border border-paper-line bg-transparent px-4 py-3 text-[0.9rem] font-medium text-graphite transition-colors hover:bg-paper"
              >
                Back to log in
              </button>
            </>
          )}

          {/* ───── Step: Landing Picker ───── */}
          {step === "landing" && (
            <>
              <h2 className="font-display text-[1.5rem] font-extrabold text-ink-900">
                Where do you want to land?
              </h2>
              <p className="mt-2 text-[0.88rem] text-graphite">
                Your starting screen from now on — changeable any time in Profile &rarr; Roles.
              </p>

              <div className="mt-6 space-y-2">
                {LANDING_VIEWS.map((v) => (
                  <button
                    key={v.k}
                    type="button"
                    onClick={() => setSelectedLanding(v.k)}
                    className={`auth-land-row flex w-full items-center gap-3 rounded-card border px-4 py-3 text-left transition-colors ${
                      selectedLanding === v.k
                        ? "border-signal bg-signal-soft"
                        : "border-paper-line hover:border-ink-line"
                    }`}
                  >
                    <span className="text-[1.2rem]">{v.ico}</span>
                    <span className="flex-1">
                      <strong className="block text-[0.88rem] text-ink-900">{v.label}</strong>
                      <span className="text-[0.78rem] text-graphite-dim">{v.blurb}</span>
                    </span>
                    {selectedLanding === v.k && (
                      <span className="text-status text-[0.9rem]">&#10003;</span>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLandingContinue}
                disabled={!selectedLanding}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-btn bg-signal px-4 py-3.5 text-[0.95rem] font-semibold text-white transition-colors hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}
        </div>

        {/* Footer text */}
        <p className="mt-5 text-center text-[0.75rem] text-graphite-dim">
          {step === "credentials" &&
            (login ? (
              <>
                New to H2S?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-signal hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-signal hover:underline"
                >
                  Log in
                </button>
              </>
            ))}
        </p>
      </main>
    </div>
  )
}

/* ───── Field sub-component ───── */
function Field({ id, label, type = "text", placeholder, value, onChange, error }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="mb-1.5 block text-[0.85rem] font-medium text-ink-900">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-btn border border-paper-line bg-paper-raised px-3 py-2.5 text-[0.9rem] text-ink-900 outline-none focus:border-signal"
        style={error ? { borderColor: ERROR_COLOR } : undefined}
      />
      {error && (
        <p className="mt-1 text-[0.75rem]" style={{ color: ERROR_COLOR }}>
          {error}
        </p>
      )}
    </div>
  )
}

/* ───── Prototype-compatible weak hash (client-side only, never used in production) ───── */
function weakHash(s) {
  let h = 5381
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h
}
