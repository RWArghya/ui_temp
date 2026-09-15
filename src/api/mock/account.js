/**
 * Account/Settings actions — email change, password change, sessions,
 * deactivate, delete. Mock only: no backend exists yet. Every function here
 * is the integration point — swap the body for a real fetch/axios call to
 * the matching endpoint and nothing calling these has to change.
 *
 * Suggested real routes (adjust to whatever the actual API ends up being):
 *   POST /account/email/change-request
 *   POST /account/email/verify
 *   POST /account/password/change
 *   GET  /account/sessions
 *   POST /account/sessions/:id/revoke
 *   POST /account/deactivate
 *   POST /account/delete
 *
 * Password verification here reads the same weak, non-cryptographic hash
 * src/store/auth.js already uses for the demo login — duplicated rather
 * than imported so this file doesn't reach into Authentication's module.
 * A real backend verifies against a securely hashed password server-side;
 * nothing here should be mistaken for that.
 */
import { mockRequest } from './mockClient'
import { authStore } from '../../store/auth'

function weakHash(s) {
  let h = 5381
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h
}
function verifyPassword(password) {
  const account = authStore.read().account
  return !!account && weakHash(password) === account.pw
}

export async function requestEmailChange(newEmail, password) {
  await mockRequest(null, { delay: 700 })
  if (!verifyPassword(password)) return { ok: false, error: 'Incorrect password. Please try again.' }
  // TODO(api): backend re-validates format/uniqueness, creates a
  // short-lived token, and emails a verification link to newEmail.
  return { ok: true, token: Math.random().toString(36).slice(2) }
}

export async function resendEmailChangeVerification(_newEmail) {
  // Identity was already verified by password when the change was first
  // requested; a resend just re-sends the same pending link.
  await mockRequest(null, { delay: 500 })
  return { ok: true }
}

export async function verifyEmailChange(_token) {
  // TODO(api): backend validates the token and applies the email change
  // server-side; the client never flips its own "verified" flag for real.
  await mockRequest(null, { delay: 500 })
  return { ok: true }
}

export async function changePassword(currentPw, newPw) {
  await mockRequest(null, { delay: 600 })
  // Delegates to the same verify-then-rotate the login screen's hash uses —
  // real backend work (hashing, invalidating other sessions) happens there.
  return authStore.changePassword(currentPw, newPw)
}

export async function listSessions() {
  // TODO(api): backend returns every session tied to this account. This
  // prototype only ever has the one it's running in.
  await mockRequest(null, { delay: 400 })
  return [{ id: 'current', device: 'Windows • Chrome', current: true, lastActive: new Date().toISOString() }]
}

export async function revokeSession(_id) {
  // TODO(api): backend invalidates that session's token.
  await mockRequest(null, { delay: 400 })
  return { ok: true }
}

export async function deactivateAccount(password) {
  await mockRequest(null, { delay: 700 })
  if (!verifyPassword(password)) return { ok: false, error: 'Incorrect password. Please try again.' }
  // TODO(api): backend deactivates the account and invalidates this session.
  return { ok: true }
}

export async function deleteAccount(password) {
  await mockRequest(null, { delay: 700 })
  if (!verifyPassword(password)) return { ok: false, error: 'Incorrect password. Please try again.' }
  // TODO(api): backend permanently deletes the account per its
  // data-retention rules and invalidates every active session.
  return { ok: true }
}
