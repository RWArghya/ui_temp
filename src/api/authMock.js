import { authStore } from '../store/auth'

/**
 * Mock auth — today's behaviour, moved out of Auth.jsx unchanged.
 *
 * Everything here used to live in the page: the account-existence checks, the
 * weak password hash, the client-side OTP, and the "verified" flag. The page
 * now calls the same functions the real client exposes, so there is one code
 * path in the UI and the difference lives here.
 *
 * Every function returns the same shape as the real client:
 *   success  { ok: true, ... }
 *   failure  { ok: false, code, message }
 *
 * `devCode` is the one extra field. There is no email sender in this mode, so
 * the generated code comes back for the page's prototype hint to display. The
 * real client never returns it, which is what makes that hint disappear.
 */

/* Prototype-compatible weak hash (client-side only, never used in production) */
function weakHash(s) {
  let h = 5381
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h
}

const same = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()

/* The pending code lives here rather than in React state so the page never has
   to compare codes itself — verify() does, the same way the API would. */
let pending = null // { email, code }

function issueCode(email) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  pending = { email: (email || '').trim(), code }
  return code
}

function sessionFor(account, { onboarded } = {}) {
  return {
    ok: true,
    // no tokens in mock mode — auth.js only persists them when present
    user: {
      id: account.email,
      name: account.name,
      email: account.email,
      onboarded: onboarded ?? Boolean(account.onboarded),
    },
  }
}

export async function register({ name, email, countryCode, mobile, password }) {
  const existing = authStore.read().account
  if (existing && same(existing.email, email)) {
    return { ok: false, code: 'email_taken', message: 'That email is already registered — log in instead.' }
  }
  authStore.save({
    account: {
      name: name.trim(),
      email: email.trim(),
      mobile: countryCode + ' ' + String(mobile).replace(/\D/g, ''),
      pw: weakHash(password),
      verified: false,
      created: new Date().toISOString().slice(0, 10),
    },
    name: name.trim(),
    email: email.trim(),
  })
  return { ok: true, userId: email.trim(), message: `Verification code sent to ${email.trim()}`, devCode: issueCode(email) }
}

export async function verifySignupOtp({ email, code }) {
  if (!pending || !same(pending.email, email) || pending.code !== String(code).trim()) {
    return { ok: false, code: 'otp_invalid', message: 'That code is incorrect. Check and try again.' }
  }
  pending = null
  const acct = authStore.read().account
  if (acct && !acct.verified) authStore.save({ account: { ...acct, verified: true } })
  return sessionFor(authStore.read().account)
}

export async function resendSignupOtp({ email }) {
  return { ok: true, message: `Verification code sent to ${(email || '').trim()}`, devCode: issueCode(email) }
}

export async function login({ email, password }) {
  const existing = authStore.read().account
  if (!existing || !same(existing.email, email)) {
    return { ok: false, code: 'email_not_found', message: 'No account found for that email.' }
  }
  if (existing.pw !== weakHash(password)) {
    return { ok: false, code: 'password_mismatch', message: "That password doesn't match." }
  }
  return sessionFor(existing)
}

export async function requestLoginOtp({ email }) {
  const existing = authStore.read().account
  if (!existing || !same(existing.email, email)) {
    return { ok: false, code: 'email_not_found', message: 'No account found for that email.' }
  }
  return { ok: true, message: `Verification code sent to ${(email || '').trim()}`, devCode: issueCode(email) }
}

export async function verifyLoginOtp({ email, code }) {
  if (!pending || !same(pending.email, email) || pending.code !== String(code).trim()) {
    return { ok: false, code: 'otp_invalid', message: 'That code is incorrect. Check and try again.' }
  }
  pending = null
  return sessionFor(authStore.read().account)
}

/** No server session to revoke; auth.js still clears the local one. */
export async function logout() {
  pending = null
  return { ok: true, message: 'Logged out' }
}
