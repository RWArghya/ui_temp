import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authStore } from '../store/auth'
import { logout } from '../api/auth'
import { S } from './store'
import { settingsFor } from './data'
import { getTheme, setTheme } from './theme'
import './Settings.css'

/* ============================================================================
   Settings page — recreated from design_handoff_settings_redesign/ (the
   README spec + Settings Page.dc.html reference), not from the app's shared
   proto.css design system. This page intentionally has its own look: one
   section visible at a time via a sidebar (or top tabs), inline expanding
   panels instead of modals for Change email / Change password, and an
   inline type-DELETE confirm as the only forceful confirmation on the page.
   Styles live in ./Settings.css, scoped under .settings-page so nothing here
   touches proto.css or any other view.

   Deviations from the reference (called out inline where they happen):
   - Deactivate/Delete both require the current password (authStore.verifyPassword)
     before they do anything — the reference prototype's own Delete flow only
     asks for typed "DELETE" and Deactivate asks for nothing at all; a real
     account-destroying action needs identity re-verification, not just intent.
   - Password change and delete/deactivate call this app's REAL authStore
     methods (changePassword, S.reset, authStore.clear) instead of the
     reference's no-op mock actions.
   - "Last changed" under Password is real once you change it in this
     session (authStore.account.pwChangedAt); the spec's static "4 months
     ago" copy is just the fallback before that ever happens.
   - Active sessions and email-code verification have no real endpoint in
     this app yet — stubbed behind getActiveSessions()/verifyEmailCode(),
     marked TODO below.
   ============================================================================ */

const NAV_ITEMS = [
  ['account', 'Account & security'],
  ['notifications', 'Notifications'],
  ['danger', 'Danger zone'],
]

const CHANNEL_OPTS = [
  ['inapp', 'In-app only'],
  ['inapp+email', 'In-app + email'],
  ['email', 'Email only'],
]

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function pwChecks(pw) {
  return [
    ['8+ characters', pw.length >= 8],
    ['One uppercase', /[A-Z]/.test(pw)],
    ['One number', /[0-9]/.test(pw)],
    ['One symbol', /[^A-Za-z0-9]/.test(pw)],
  ]
}
const STRENGTH_TIERS = [
  { label: 'Enter a password', color: 'var(--sp-ink-faint)', fill: 'var(--sp-str-empty)' },
  { label: 'Weak', color: 'var(--sp-danger)', fill: 'var(--sp-str-weak)' },
  { label: 'Fair', color: 'var(--sp-warn)', fill: 'var(--sp-str-fair)' },
  { label: 'Good', color: 'var(--sp-success)', fill: 'var(--sp-str-good)' },
  { label: 'Strong', color: 'var(--sp-success)', fill: 'var(--sp-str-strong)' },
]

function relativePwChange(ts) {
  if (!ts) return '4 months ago'
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

// TODO: replace with a real "list active sessions" endpoint once one exists.
function getActiveSessions() {
  return [
    { id: 's1', device: 'Chrome on Windows', meta: 'Bengaluru, IN · Active now', current: true },
    { id: 's2', device: 'Safari on iPhone', meta: 'Bengaluru, IN · 2 hours ago', current: false },
    { id: 's3', device: 'Chrome on macOS', meta: 'Mumbai, IN · 3 days ago', current: false },
  ]
}

function Badge({ tone, children }) {
  return <span className={`sp-badge sp-badge--${tone}`}>{children}</span>
}

export default function Settings({ st, sv, navLayout = 'tabs', requireTypeToDelete = true }) {
  const navigate = useNavigate()
  const account = authStore.read().account || {}
  const settings = settingsFor(st)

  const [section, setSection] = useState('account')

  const goSection = (id) => { setSection(id); setEditing(null); setPwOpen(false); setDangerOpen(null) }

  // ---- toast --------------------------------------------------------------
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  const flash = (msg) => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  // ---- theme --------------------------------------------------------------
  const [theme, setThemeState] = useState(getTheme)
  const pickTheme = (t) => { setTheme(t); setThemeState(t); flash(t === 'dark' ? 'Dark theme on' : 'Light theme on') }

  // ---- change email ---------------------------------------------------------
  const [editing, setEditing] = useState(null) // null | 'email'
  const [email, setEmail] = useState(st.email || account.email || '')
  const [draftEmail, setDraftEmail] = useState('')
  const [emailStep, setEmailStep] = useState(1)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [resend, setResend] = useState(0)
  const resendTimer = useRef(null)
  const codeRefs = useRef([])
  useEffect(() => () => clearInterval(resendTimer.current), [])

  const startEmail = () => { setEditing('email'); setEmailStep(1); setDraftEmail(''); setCode(['', '', '', '', '', '']) }
  const cancelEmail = () => { clearInterval(resendTimer.current); setEditing(null); setEmailStep(1) }
  const startResend = () => {
    clearInterval(resendTimer.current)
    setResend(45)
    resendTimer.current = setInterval(() => {
      setResend(n => { const next = n - 1; if (next <= 0) clearInterval(resendTimer.current); return Math.max(0, next) })
    }, 1000)
  }
  const emailValid = EMAIL_RE.test(draftEmail.trim())
  const codeFull = code.every(c => c !== '')
  const emailOk = emailStep === 1 ? emailValid : emailStep === 2 ? codeFull : true

  const setCodeDigit = (i, raw) => {
    const v = raw.replace(/[^0-9]/g, '').slice(-1)
    setCode(c => { const next = c.slice(); next[i] = v; return next })
    if (v && codeRefs.current[i + 1]) codeRefs.current[i + 1].focus()
  }
  const onCodeKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && codeRefs.current[i - 1]) codeRefs.current[i - 1].focus()
  }
  const onCodePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    setCode(text.split('').concat(['', '', '', '', '', '']).slice(0, 6))
    const last = Math.min(text.length, 6) - 1
    if (last >= 0 && codeRefs.current[last]) codeRefs.current[last].focus()
  }

  // TODO: call the real "confirm email change" endpoint once one exists —
  // this demo accepts any complete 6-digit code.
  const verifyEmailCode = () => true

  const emailNext = () => {
    if (!emailOk) return
    if (emailStep === 1) { startResend(); setEmailStep(2); return }
    if (emailStep === 2) { verifyEmailCode(); clearInterval(resendTimer.current); setEmailStep(3); return }
    const val = draftEmail.trim() || email
    setEmail(val)
    sv({ email: val })
    authStore.save({ account: { ...authStore.read().account, email: val } })
    setEditing(null); setEmailStep(1)
    flash('Email updated')
  }
  const emailCta = emailStep === 1 ? 'Send code' : emailStep === 2 ? 'Verify and update' : 'Done'
  const emailStepLabel = emailStep === 3 ? 'Done' : `Step ${emailStep} of 2`
  const resendText = resend > 0 ? `You can request a new code in ${resend}s` : "Didn't get it? Check spam, or request a new code."

  // ---- change password --------------------------------------------------
  const [pwOpen, setPwOpen] = useState(false)
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwError, setPwError] = useState('')

  const checks = pwChecks(newPw)
  const score = checks.filter(([, met]) => met).length
  const tier = STRENGTH_TIERS[newPw ? score : 0]
  const mismatch = confirmPw.length > 0 && confirmPw !== newPw
  const pwOk = curPw.length > 0 && score === 4 && confirmPw === newPw && newPw.length > 0

  const openPw = () => { setPwOpen(true); setPwError('') }
  const closePw = () => { setPwOpen(false); setCurPw(''); setNewPw(''); setConfirmPw(''); setPwError('') }
  const savePw = () => {
    if (!pwOk) return
    const res = authStore.changePassword(curPw, newPw)
    if (!res.ok) { setPwError(res.error); return }
    authStore.save({ account: { ...authStore.read().account, pwChangedAt: Date.now() } })
    setPwOpen(false); setCurPw(''); setNewPw(''); setConfirmPw(''); setPwError('')
    flash('Password updated')
  }

  // ---- notifications ------------------------------------------------------
  const patchNotif = (key, val) => sv({ settings: { ...st.settings, notifications: { ...settings.notifications, [key]: val } } })
  const toggleNotif = (key) => { patchNotif(key, !settings.notifications[key]); flash('Notification preference saved') }
  const pickChannel = (val) => { patchNotif('channel', val); flash('Delivery updated') }

  const NOTIF_GROUPS = [
    {
      label: 'Programs & deadlines', items: [
        ['deadlines', 'Deadline reminders', 'An initiative you registered for is closing soon.'],
        ['programUpdates', 'Program updates', "Announcements from initiatives you're registered for."],
      ],
    },
    {
      label: 'Mentoring & evaluation', items: [
        ['applicationStatus', 'Application status', 'Your mentor application moves to a new stage.'],
        ['sessions', 'Session bookings', 'Someone books, reschedules, or cancels a session.'],
        ['evaluations', 'Evaluation results', 'A submission of yours has been scored.'],
      ],
    },
  ]

  // ---- active sessions ------------------------------------------------------
  const [sessions, setSessions] = useState(getActiveSessions)
  const others = sessions.filter(s => !s.current)
  const signOutSession = (id) => { setSessions(s => s.filter(x => x.id !== id)); flash('Signed out of that device') }
  const signOutAllOthers = () => { setSessions(s => s.filter(x => x.current)); flash('Signed out of all other devices') }

  // ---- danger zone ------------------------------------------------------
  // Both actions require the current password, re-verified against the
  // same hash authStore.changePassword already checks — a password prompt
  // that only accepts non-empty input isn't a real confirmation.
  const [dangerOpen, setDangerOpen] = useState(null) // null | 'deactivate' | 'delete'
  const [dangerPw, setDangerPw] = useState('')
  const [dangerPwError, setDangerPwError] = useState('')
  const [deleteText, setDeleteText] = useState('')
  const openDanger = (kind) => { setDangerOpen(kind); setDangerPw(''); setDangerPwError(''); setDeleteText('') }
  const closeDanger = () => { setDangerOpen(null); setDangerPw(''); setDangerPwError(''); setDeleteText('') }
  const deleteOk = (requireTypeToDelete ? deleteText.trim().toUpperCase() === 'DELETE' : true) && dangerPw.length > 0
  const registeredCount = (st.registered || []).length
  const submissionCount = (st.submissions || []).length

  // TODO: call a real "deactivate account" endpoint once one exists.
  const deactivateAccount = () => {
    if (!authStore.verifyPassword(dangerPw)) { setDangerPwError('Incorrect password.'); return }
    authStore.save({ account: { ...authStore.read().account, deactivated: true } })
    logout()
    flash('Account deactivated. Signing you out…')
    setTimeout(() => navigate('/auth'), 900)
  }
  const deleteAccount = () => {
    if (!deleteOk) return
    if (!authStore.verifyPassword(dangerPw)) { setDangerPwError('Incorrect password.'); return }
    S.reset(); logout()
    flash('Account deleted. Signing you out…')
    setTimeout(() => navigate('/auth'), 900)
  }

  const sidebar = navLayout === 'sidebar'

  return (
    <div className="settings-page">
      <div className="sp-body">
      {!sidebar && (
        <nav className="sp-tabs" aria-label="Settings sections">
          {NAV_ITEMS.map(([id, label]) => (
            <button key={id} type="button" className={`sp-tab${section === id ? ' is-active' : ''}`} onClick={() => goSection(id)}>{label}</button>
          ))}
        </nav>
      )}

      <div className="sp-columns">
        {sidebar && (
          <nav className="sp-nav" aria-label="Settings sections">
            {NAV_ITEMS.map(([id, label]) => (
              <button key={id} type="button" className={`sp-nav-item${section === id ? ' is-active' : ''}`} onClick={() => goSection(id)}>
                <span className="sp-nav-bar" aria-hidden="true" />
                {label}
              </button>
            ))}
            <p className="sp-signedin">Signed in as<b>{email}</b></p>
          </nav>
        )}

        <div className="sp-content">
          {section === 'account' && (
            <>
              <section className="sp-card">
                <h2>Appearance</h2>
                <div className="sp-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="sp-row-title" style={{ marginBottom: 2 }}>Theme</div>
                    <div style={{ fontSize: 13, color: 'var(--sp-ink-soft)' }}>Light or dark, for this browser.</div>
                  </div>
                  <div className="sp-segmented" role="group" aria-label="Theme">
                    {[['light', 'Light'], ['dark', 'Dark']].map(([val, label]) => (
                      <button key={val} type="button" className={theme === val ? 'is-on' : ''} onClick={() => pickTheme(val)}>{label}</button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="sp-card">
                <h2>Sign-in</h2>

                {/* EMAIL */}
                <div className="sp-row-wrap">
                  <div className="sp-row-grid">
                    <div style={{ minWidth: 0 }}>
                      <div className="sp-row-title">Email</div>
                      <div className="sp-row-value-line">
                        <span className="sp-row-value">{email}</span>
                        {account.verified !== false && <Badge tone="success">Verified</Badge>}
                      </div>
                    </div>
                    {editing !== 'email' ? (
                      <button type="button" className="sp-btn sp-btn--secondary sp-row-action" onClick={startEmail}>Change email</button>
                    ) : <span />}
                  </div>

                  {editing === 'email' && (
                    <div className="sp-panel">
                      <div className="sp-panel-head">
                        <span className="sp-panel-title">Change email address</span>
                        <span className="sp-panel-step">{emailStepLabel}</span>
                      </div>
                      <div className="sp-panel-body">
                        {emailStep === 1 && (
                          <div className="sp-field">
                            <label htmlFor="sp-new-email">New email address</label>
                            <input id="sp-new-email" className="sp-input" value={draftEmail} onChange={e => setDraftEmail(e.target.value)} placeholder="you@example.com" autoFocus />
                            <p className="sp-help">We'll send a 6-digit code there. Your current address stays active until you confirm.</p>
                          </div>
                        )}
                        {emailStep === 2 && (
                          <div>
                            <p style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.55, color: 'var(--sp-ink-muted)' }}>
                              Enter the code we sent to <span style={{ fontWeight: 600, color: 'var(--sp-ink)' }}>{draftEmail}</span>
                            </p>
                            <div className="sp-code-row" onPaste={onCodePaste}>
                              {code.map((v, i) => (
                                <input
                                  key={i}
                                  ref={el => { codeRefs.current[i] = el }}
                                  className="sp-code-input"
                                  value={v}
                                  maxLength={1}
                                  inputMode="numeric"
                                  aria-label={`Digit ${i + 1} of 6`}
                                  onChange={e => setCodeDigit(i, e.target.value)}
                                  onKeyDown={e => onCodeKeyDown(i, e)}
                                  autoFocus={i === 0}
                                />
                              ))}
                            </div>
                            <p className="sp-help" style={{ margin: '12px 0 0' }}>{resendText}</p>
                          </div>
                        )}
                        {emailStep === 3 && (
                          <div className="sp-success">
                            <span className="sp-success-icon" aria-hidden="true">✓</span>
                            <div>
                              <div className="sp-success-title">Email updated</div>
                              <p className="sp-success-body">Sign in with {draftEmail} from now on. We've notified your old address.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="sp-panel-foot">
                        <button type="button" className="sp-btn sp-btn--cancel" onClick={cancelEmail}>{emailStep === 3 ? 'Close' : 'Cancel'}</button>
                        <button type="button" className="sp-btn sp-btn--primary" disabled={!emailOk} onClick={emailNext}>{emailCta}</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="sp-row-wrap">
                  <div className="sp-row-grid">
                    <div style={{ minWidth: 0 }}>
                      <div className="sp-row-title">Password</div>
                      <div className="sp-row-value-line" style={{ gap: 10 }}>
                        <span style={{ fontSize: 15, letterSpacing: 3, color: 'var(--sp-ink-faint)', lineHeight: 1 }}>••••••••••</span>
                        <span style={{ fontSize: 13, color: 'var(--sp-ink-soft)' }}>Last changed {relativePwChange(account.pwChangedAt)}</span>
                      </div>
                    </div>
                    {!pwOpen ? (
                      <button type="button" className="sp-btn sp-btn--secondary sp-row-action" onClick={openPw}>Change password</button>
                    ) : <span />}
                  </div>

                  {pwOpen && (
                    <div className="sp-panel">
                      <div className="sp-panel-head"><span className="sp-panel-title">Change password</span></div>
                      <div className="sp-panel-body">
                        <div>
                          <label htmlFor="sp-cur-pw">Current password</label>
                          <div className="sp-pwfield">
                            <input id="sp-cur-pw" type={showCur ? 'text' : 'password'} value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" />
                            <button type="button" className="sp-pwfield-toggle" onClick={() => setShowCur(s => !s)}>{showCur ? 'Hide' : 'Show'}</button>
                          </div>
                          {curPw.length === 0 && <a href="#" className="sp-forgot" onClick={e => e.preventDefault()}>Forgot your current password?</a>}
                          {pwError && <p className="sp-mismatch-msg">{pwError}</p>}
                        </div>

                        <div>
                          <label htmlFor="sp-new-pw">New password</label>
                          <div className="sp-pwfield">
                            <input id="sp-new-pw" type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
                            <button type="button" className="sp-pwfield-toggle" onClick={() => setShowNew(s => !s)}>{showNew ? 'Hide' : 'Show'}</button>
                          </div>
                          <div className="sp-strength">
                            <div className="sp-strength-bars" aria-hidden="true">
                              {[0, 1, 2, 3].map(i => <i key={i} style={{ background: newPw && i < score ? tier.fill : undefined }} />)}
                            </div>
                            <span className="sp-strength-label" style={{ color: tier.color }}>{tier.label}</span>
                          </div>
                          <ul className="sp-reqs">
                            {checks.map(([label, met]) => (
                              <li key={label} className={met ? 'is-met' : ''}>
                                <span className="dot" aria-hidden="true">{met ? '✓' : ''}</span>{label}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <label htmlFor="sp-confirm-pw">Confirm new password</label>
                          <div className={`sp-pwfield${mismatch ? ' is-mismatch' : ''}`}>
                            <input id="sp-confirm-pw" type={showNew ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
                          </div>
                          {mismatch && <p className="sp-mismatch-msg">Passwords don't match yet.</p>}
                        </div>

                        <p className="sp-help" style={{ margin: 0 }}>Updating your password signs out your other devices.</p>
                      </div>
                      <div className="sp-panel-foot">
                        <button type="button" className="sp-btn sp-btn--cancel" onClick={closePw}>Cancel</button>
                        <button type="button" className="sp-btn sp-btn--primary" disabled={!pwOk} onClick={savePw}>Update password</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="sp-card">
                <div className="sp-card-headrow">
                  <div>
                    <h2>Active sessions</h2>
                    <p className="sp-card-desc">Sign out any device you don't recognise.</p>
                  </div>
                  {others.length > 0 && <button type="button" className="sp-link" onClick={signOutAllOthers}>Sign out all other devices</button>}
                </div>
                {sessions.map(s => (
                  <div key={s.id} className="sp-row">
                    <div style={{ minWidth: 0 }}>
                      <div className="sp-row-value-line" style={{ marginBottom: 2 }}>
                        <span className="sp-row-title" style={{ marginBottom: 0 }}>{s.device}</span>
                        {s.current && <Badge tone="success">This device</Badge>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--sp-ink-soft)' }}>{s.meta}</div>
                    </div>
                    {!s.current && <button type="button" className="sp-btn sp-btn--secondary sp-btn--row sp-row-action" onClick={() => signOutSession(s.id)}>Sign out</button>}
                  </div>
                ))}
              </section>
            </>
          )}

          {section === 'notifications' && (
            <section className="sp-card sp-card--full">
              <h2>Notifications</h2>
              <p className="sp-card-desc">Saved automatically.</p>

              {NOTIF_GROUPS.map(g => (
                <div key={g.label}>
                  <div className="sp-group-label">{g.label}</div>
                  {g.items.map(([key, title, desc]) => (
                    <div key={key} className="sp-row sp-row--notif">
                      <div style={{ minWidth: 0 }}>
                        <div className="sp-row-title" style={{ marginBottom: 2 }}>{title}</div>
                        <div className="sp-row-desc">{desc}</div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.notifications[key]}
                        aria-label={title}
                        className={`sp-toggle${settings.notifications[key] ? ' is-on' : ''}`}
                        onClick={() => toggleNotif(key)}
                      >
                        <i aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              <div className="sp-delivery-head">
                <div className="sp-row-title" style={{ marginBottom: 2 }}>Delivery</div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--sp-ink-soft)' }}>Where the notifications above reach you.</p>
                <div className="sp-segmented" role="group" aria-label="Delivery channel">
                  {CHANNEL_OPTS.map(([val, label]) => (
                    <button key={val} type="button" className={settings.notifications.channel === val ? 'is-on' : ''} onClick={() => pickChannel(val)}>{label}</button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {section === 'danger' && (
            <section className="sp-card">
              <h2>Danger zone</h2>
              <p className="sp-card-desc">Irreversible. There's no undo past this point.</p>

              <div style={{ padding: '17px 0', borderTop: '1px solid var(--sp-divider)' }}>
                <div className="sp-row-grid">
                  <div style={{ minWidth: 0 }}>
                    <div className="sp-row-title" style={{ marginBottom: 2 }}>Deactivate account</div>
                    <div className="sp-row-desc">Temporarily disables your account. Sign back in any time to restore it.</div>
                  </div>
                  {dangerOpen !== 'deactivate' && <button type="button" className="sp-btn sp-btn--secondary sp-btn--row sp-row-action" onClick={() => openDanger('deactivate')}>Deactivate</button>}
                </div>

                {dangerOpen === 'deactivate' && (
                  <div className="sp-delete-confirm">
                    <p>Enter your password to confirm deactivating your account.</p>
                    <div>
                      <label htmlFor="sp-danger-pw-deactivate">Password</label>
                      <input id="sp-danger-pw-deactivate" type="password" className="sp-delete-input" style={{ width: '100%' }} value={dangerPw} onChange={e => { setDangerPw(e.target.value); setDangerPwError('') }} autoFocus />
                      {dangerPwError && <p className="sp-mismatch-msg">{dangerPwError}</p>}
                    </div>
                    <div className="sp-delete-actions">
                      <button type="button" className="sp-btn sp-btn--danger-fill" disabled={!dangerPw} onClick={deactivateAccount}>Deactivate my account</button>
                      <button type="button" className="sp-btn sp-btn--cancel" onClick={closeDanger}>Keep my account</button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '17px 0 20px', borderTop: '1px solid var(--sp-divider)' }}>
                <div className="sp-row-grid">
                  <div style={{ minWidth: 0 }}>
                    <div className="sp-row-title" style={{ marginBottom: 2, color: 'var(--sp-danger-ink)' }}>Delete account</div>
                    <div className="sp-row-desc">Permanently removes your profile, registrations, and submissions.</div>
                  </div>
                  {dangerOpen !== 'delete' && <button type="button" className="sp-btn sp-btn--danger-outline sp-btn--row sp-row-action" onClick={() => openDanger('delete')}>Delete account</button>}
                </div>

                {dangerOpen === 'delete' && (
                  <div className="sp-delete-confirm">
                    <p>This deletes {registeredCount} registration{registeredCount === 1 ? '' : 's'} and {submissionCount} submission{submissionCount === 1 ? '' : 's'}. It cannot be undone.</p>
                    {requireTypeToDelete && (
                      <div style={{ marginBottom: 14 }}>
                        <label htmlFor="sp-delete-text">Type <code>DELETE</code> to confirm</label>
                        <input id="sp-delete-text" className="sp-delete-input" value={deleteText} onChange={e => setDeleteText(e.target.value)} autoFocus />
                      </div>
                    )}
                    <div>
                      <label htmlFor="sp-danger-pw-delete">Password</label>
                      <input id="sp-danger-pw-delete" type="password" className="sp-delete-input" style={{ width: '100%' }} value={dangerPw} onChange={e => { setDangerPw(e.target.value); setDangerPwError('') }} />
                      {dangerPwError && <p className="sp-mismatch-msg">{dangerPwError}</p>}
                    </div>
                    <div className="sp-delete-actions">
                      <button type="button" className="sp-btn sp-btn--danger-fill" disabled={!deleteOk} onClick={deleteAccount}>Delete my account</button>
                      <button type="button" className="sp-btn sp-btn--cancel" onClick={closeDanger}>Keep my account</button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      </div>

      {toast && (
        <div className="sp-toast" role="status" aria-live="polite">
          <span className="sp-toast-dot" aria-hidden="true" />{toast}
        </div>
      )}
    </div>
  )
}
