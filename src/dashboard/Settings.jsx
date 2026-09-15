import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { authStore } from '../store/auth'
import { S } from './store'
import {
  requestEmailChange, resendEmailChangeVerification, verifyEmailChange, changePassword,
  listSessions, revokeSession, deactivateAccount, deleteAccount,
} from '../api/mock/account'

/* ============================================================================
   Innovator Settings — five account actions, each its own plain bordered
   card (tinted only for the two destructive ones): Change Email Address,
   Change Password, Manage Active Sessions, Deactivate Account, Delete My
   Account. No tabs, no Notifications/Privacy/Preferences — out of scope.

   Every "backend" call in this file goes through src/api/mock/account.js —
   there's no real API yet, but nothing here decides an email is changed or
   a password is correct on its own; it always asks that service and reacts
   to what comes back, so swapping in real endpoints later doesn't touch
   this component's logic, only account.js.

   Right rail ("Your progress") stays owned by Dashboard.jsx's shared Shell —
   not duplicated here. Never touches src/pages/Profile.jsx or its data —
   reads/writes the same `h2s` store (st/sv) every other dashboard view uses.
   ============================================================================ */

function IconDot({ name, tone }) {
  return <span className="icon-chip round shrink-0" style={{ background: tone.bg, color: tone.fg }}><Icon name={name} size={16} /></span>
}
const BLUE = { bg: 'var(--chip-blue-bg)', fg: 'var(--chip-blue-fg)' }
const SLATE = { bg: 'var(--chip-slate-bg)', fg: 'var(--chip-slate-fg)' }
const AMBER = { bg: 'var(--chip-amber-bg)', fg: 'var(--chip-amber-fg)' }
const RED = { bg: 'var(--danger-soft)', fg: 'var(--danger)' }

function Box({ tone, tinted, icon, title, desc, children }) {
  const style = tinted ? { border: `1px solid ${tone.fg}`, background: tone.bg } : undefined
  return (
    <div className={`rounded-lg p-4 ${tinted ? '' : 'border border-dash-line-soft'}`} style={style}>
      <div className="flex items-center gap-3">
        <IconDot name={icon} tone={tone} />
        <div>
          <strong className="block text-[13.5px] text-dash-ink">{title}</strong>
          <p className="text-sm text-dash-muted">{desc}</p>
        </div>
      </div>
      {children ? <div className="mt12">{children}</div> : null}
    </div>
  )
}

function PasswordField({ label, value, onChange, autoComplete, error, disabled }) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      <label>{label}</label>
      <div className="relative">
        <input className={`input pr-10 ${error ? 'error' : ''}`} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} disabled={disabled} />
        <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dash-faint" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          <Icon name={show ? 'EyeOff' : 'Eye'} size={16} />
        </button>
      </div>
      {error ? <p className="error-text mt4">{error}</p> : null}
    </div>
  )
}

/* Minimal toast using proto.css's own .toast/.toast-wrap (already styled,
   never wired to React until now) — not a new notification library. */
function Toast({ text, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [text])
  if (!text) return null
  return <div className="toast-wrap"><div className="toast">{text}</div></div>
}

/* Shared confirmation modal shell for Deactivate/Delete — centered, compact,
   closes on backdrop click. Built from proto.css's own .modal-* classes
   (already scoped to .dash-root) rather than the marketing site's daisyUI
   <dialog>-based Modal, to avoid two modal systems fighting over the same
   class names in the same tree. */
function ConfirmModal({ title, tone, onClose, error, busy, confirmLabel, confirmDisabled, onConfirm, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <strong style={{ color: tone.fg }}>{title}</strong>
          <button className="btn-icon btn-ghost" onClick={onClose} aria-label="Close"><Icon name="X" size={16} /></button>
        </div>
        <div className="modal-body">
          {children}
          {error ? <p className="error-text mt10">{error}</p> : null}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost btn-sm rounded-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className={tone === RED ? 'btn btn-danger btn-sm rounded-btn' : 'btn btn-outline btn-sm rounded-btn'}
            style={tone === AMBER ? { borderColor: 'var(--warn)', color: 'var(--warn)' } : undefined}
            disabled={confirmDisabled || busy}
            onClick={onConfirm}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const maskEmail = (e) => {
  const [user, domain] = String(e).split('@')
  return user && domain ? user[0] + '***@' + domain : e
}
const RESEND_SECONDS = 30

export default function Settings({ st, sv, go }) {
  const navigate = useNavigate()
  const account = authStore.read().account || {}
  const [toast, setToast] = useState('')

  /* ---------------- Change Email Address ---------------- */
  const currentEmail = st.email || account.email || ''
  const [newEmail, setNewEmail] = useState('')
  const [emailPw, setEmailPw] = useState('')
  const [emailStage, setEmailStage] = useState('idle') // idle | sending | pending | verifying | error
  const [emailError, setEmailError] = useState('')
  const [emailPwError, setEmailPwError] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendIn, setResendIn] = useState(0)
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  const submitEmailChange = async (e) => {
    e.preventDefault()
    const v = newEmail.trim()
    let hasErr = false
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setEmailError('Please enter a valid email address.'); hasErr = true }
    else setEmailError('')
    if (!emailPw) { setEmailPwError('Enter your current password to confirm it\'s you.'); hasErr = true }
    else setEmailPwError('')
    if (hasErr) return
    setEmailStage('sending')
    try {
      const res = await requestEmailChange(v, emailPw)
      if (!res.ok) { setEmailPwError(res.error); setEmailStage('idle'); return }
      setPendingEmail(v)
      setEmailPw('')
      setEmailStage('pending')
      setResendIn(RESEND_SECONDS)
    } catch {
      setEmailError('Could not send the verification email. Please try again.')
      setEmailStage('idle')
    }
  }
  const resendEmail = async () => {
    if (resendIn > 0) return
    setEmailStage('sending')
    try { await resendEmailChangeVerification(pendingEmail); setEmailStage('pending'); setResendIn(RESEND_SECONDS) }
    catch { setEmailError('Could not resend the verification email.'); setEmailStage('pending') }
  }
  const cancelEmailChange = () => { setEmailStage('idle'); setPendingEmail(''); setNewEmail(''); setEmailPw(''); setEmailPwError(''); setResendIn(0) }
  /* Stands in for the user clicking the link in their inbox — there's no
     real mail server here. Clearly a prototype affordance, not a real
     "verify" action, and never presented as one. */
  const simulateVerifyClick = async () => {
    setEmailStage('verifying')
    try {
      await verifyEmailChange('mock-token')
      sv({ email: pendingEmail })
      authStore.save({ account: { ...account, email: pendingEmail } })
      setEmailStage('idle')
      setNewEmail(''); setPendingEmail('')
      setToast('Email updated successfully.')
    } catch {
      setEmailError('Verification failed. Please try again.')
      setEmailStage('pending')
    }
  }

  /* ---------------- Change Password ---------------- */
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwErrors, setPwErrors] = useState({})
  const [pwBusy, setPwBusy] = useState(false)
  const submitPwChange = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!curPw) errs.cur = 'Current password is required.'
    if (!newPw) errs.new = 'New password is required.'
    else if (newPw.length < 8) errs.new = 'Use at least 8 characters.'
    if (newPw && confirmPw !== newPw) errs.confirm = "Passwords don't match."
    setPwErrors(errs)
    if (Object.keys(errs).length) return
    setPwBusy(true)
    try {
      const res = await changePassword(curPw, newPw)
      if (res.ok) {
        setCurPw(''); setNewPw(''); setConfirmPw(''); setPwErrors({})
        setToast('Password updated.')
      } else {
        setPwErrors({ cur: res.error })
      }
    } finally {
      setPwBusy(false)
    }
  }

  /* ---------------- Manage Active Sessions ---------------- */
  const [sessions, setSessions] = useState(null) // null = loading
  useEffect(() => { listSessions().then(setSessions).catch(() => setSessions([])) }, [])
  const signOutSession = async (session) => {
    await revokeSession(session.id)
    if (session.current) { authStore.clear(); navigate('/auth') }
    else setSessions(list => list.filter(s => s.id !== session.id))
  }

  /* ---------------- Deactivate / Delete ---------------- */
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deactivatePw, setDeactivatePw] = useState('')
  const [deactivateErr, setDeactivateErr] = useState('')
  const [deactivateBusy, setDeactivateBusy] = useState(false)
  const closeDeactivate = () => { setDeactivateOpen(false); setDeactivatePw(''); setDeactivateErr('') }
  const confirmDeactivate = async () => {
    setDeactivateBusy(true); setDeactivateErr('')
    try {
      const res = await deactivateAccount(deactivatePw)
      if (!res.ok) { setDeactivateErr(res.error); return }
      authStore.clear(); navigate('/auth')
    } finally { setDeactivateBusy(false); setDeactivatePw('') }
  }

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePw, setDeletePw] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteErr, setDeleteErr] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const closeDelete = () => { setDeleteOpen(false); setDeletePw(''); setDeleteConfirmText(''); setDeleteErr('') }
  const confirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') { setDeleteErr('Type DELETE to confirm account deletion.'); return }
    setDeleteBusy(true); setDeleteErr('')
    try {
      const res = await deleteAccount(deletePw)
      if (!res.ok) { setDeleteErr(res.error); return }
      S.reset(); authStore.clear(); navigate('/auth')
    } finally { setDeleteBusy(false); setDeletePw('') }
  }

  return (
    <>
      <h1>Settings</h1>
      <p className="small muted mt6">Manage your account.</p>

      <div className="col gap12 mt16">
        {/* ---------------- Change Email Address ---------------- */}
        <Box tone={BLUE} icon="Mail" title="Change Email Address" desc={`Currently ${currentEmail || 'not set'}. Used to sign in and for account notifications.`}>
          {emailStage === 'pending' || emailStage === 'verifying' ? (
            <div className="rounded-lg p-3" style={{ background: 'var(--primary-soft)' }}>
              <strong className="text-[13px] text-dash-ink">Verify your new email</strong>
              <p className="mt4 text-sm text-dash-muted">
                We've sent a verification link to <strong className="text-dash-ink">{maskEmail(pendingEmail)}</strong>.
                Please check your inbox and click the link to confirm your new email address.
              </p>
              <div className="row gap8 wrap mt12" style={{ alignItems: 'center' }}>
                <button className="btn btn-outline btn-sm rounded-btn" disabled={resendIn > 0 || emailStage === 'verifying'} onClick={resendEmail}>
                  {resendIn > 0 ? `Resend available in ${resendIn}s` : 'Resend email'}
                </button>
                <button className="btn btn-ghost btn-sm rounded-btn" onClick={cancelEmailChange} disabled={emailStage === 'verifying'}>Cancel</button>
              </div>
              <div className="mt10" style={{ borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
                <button className="btn btn-ghost btn-sm rounded-btn" onClick={simulateVerifyClick} disabled={emailStage === 'verifying'}>
                  {emailStage === 'verifying' ? 'Verifying…' : '(Prototype) Simulate clicking the email link'}
                </button>
                <p className="xs faint mt4">No real email is sent here — this stands in for the link a real inbox would receive.</p>
              </div>
            </div>
          ) : (
            <form className="col gap12" onSubmit={submitEmailChange} noValidate>
              <div className="flex flex-wrap items-end gap-3">
                <div className="field" style={{ marginBottom: 0, flex: '1 1 260px' }}>
                  <label>New email address</label>
                  <input className={`input ${emailError ? 'error' : ''}`} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="you@example.com" disabled={emailStage === 'sending'} />
                  {emailError ? <p className="error-text mt4">{emailError}</p> : null}
                </div>
              </div>
              <PasswordField
                label="Current password"
                value={emailPw}
                onChange={e => { setEmailPw(e.target.value); setEmailPwError('') }}
                autoComplete="current-password"
                error={emailPwError}
                disabled={emailStage === 'sending'}
              />
              <p className="xs faint">We'll email a verification link to your new address, but need your current password first to confirm it's really you.</p>
              <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} type="submit" disabled={!newEmail.trim() || emailStage === 'sending'}>
                {emailStage === 'sending' ? 'Sending…' : 'Update email'}
              </button>
            </form>
          )}
        </Box>

        {/* ---------------- Change Password ---------------- */}
        <Box tone={BLUE} icon="Lock" title="Change Password" desc="Keep your account secure with a strong password.">
          <form className="grid gap-4 sm:grid-cols-3" onSubmit={submitPwChange}>
            <PasswordField label="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" error={pwErrors.cur} />
            <PasswordField label="New password" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" error={pwErrors.new} />
            <PasswordField label="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" error={pwErrors.confirm} />
            <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
              <button className="btn btn-primary btn-sm" type="submit" disabled={pwBusy}>{pwBusy ? 'Updating…' : 'Update password'}</button>
            </div>
          </form>
          <p className="xs faint mt10">Demo-only: this prototype's account password is <code>demo1234</code> unless you've changed it before. A real backend never exposes this.</p>
        </Box>

        {/* ---------------- Manage Active Sessions ---------------- */}
        <Box tone={SLATE} icon="ShieldCheck" title="Manage Active Sessions" desc="Review your active devices and sign out to keep your account secure.">
          {sessions === null ? (
            <p className="small muted">Loading sessions…</p>
          ) : (
            <div className="col gap8">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-dash-line-soft p-3">
                  <div className="flex items-center gap-3">
                    <Icon name="Video" size={18} />
                    <div>
                      <strong className="block text-[13px] text-dash-ink">{s.device}</strong>
                      <p className="text-xs text-dash-muted">
                        {s.current ? 'Current session · ' : 'Last active: '}
                        {new Date(s.lastActive).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm rounded-btn" onClick={() => signOutSession(s)}>Sign out</button>
                </div>
              ))}
              {sessions.length <= 1 ? <p className="xs faint">No other active sessions.</p> : null}
            </div>
          )}
        </Box>

        {/* ---------------- Deactivate ---------------- */}
        <Box tone={AMBER} tinted icon="AlertTriangle" title="Deactivate Account" desc="Temporarily disable your account while keeping your data.">
          <button className="btn btn-outline btn-sm rounded-btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} onClick={() => setDeactivateOpen(true)}>Deactivate account</button>
        </Box>

        {/* ---------------- Delete ---------------- */}
        <Box tone={RED} tinted icon="Trash2" title="Delete My Account" desc="Permanently remove your account and all associated data.">
          <button className="btn btn-danger btn-sm rounded-btn" onClick={() => setDeleteOpen(true)}>Delete my account</button>
        </Box>
      </div>

      {deactivateOpen ? (
        <ConfirmModal
          title="Deactivate your account?"
          tone={AMBER}
          onClose={closeDeactivate}
          error={deactivateErr}
          busy={deactivateBusy}
          confirmLabel="Deactivate account"
          confirmDisabled={!deactivatePw}
          onConfirm={confirmDeactivate}
        >
          <p className="small muted">Your account will be temporarily disabled. Your profile and activity are kept — sign back in anytime to return.</p>
          <div className="mt12"><PasswordField label="Current password" value={deactivatePw} onChange={e => setDeactivatePw(e.target.value)} autoComplete="current-password" /></div>
        </ConfirmModal>
      ) : null}

      {deleteOpen ? (
        <ConfirmModal
          title="Delete your account?"
          tone={RED}
          onClose={closeDelete}
          error={deleteErr}
          busy={deleteBusy}
          confirmLabel="Delete my account"
          confirmDisabled={!deletePw || deleteConfirmText !== 'DELETE'}
          onConfirm={confirmDelete}
        >
          <p className="small" style={{ color: 'var(--danger)' }}>This action is permanent.</p>
          <p className="small muted mt4">Your account, profile, activity, submissions, and associated data will be permanently removed and cannot be recovered.</p>
          <div className="mt12"><PasswordField label="Current password" value={deletePw} onChange={e => setDeletePw(e.target.value)} autoComplete="current-password" /></div>
          <div className="field mt12">
            <label>Type <strong>DELETE</strong> to confirm</label>
            <input className="input" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" />
          </div>
        </ConfirmModal>
      ) : null}

      <Toast text={toast} onDone={() => setToast('')} />
    </>
  )
}
