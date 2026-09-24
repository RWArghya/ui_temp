import { USE_MOCK } from './config.js'
import { authStore } from '../store/auth'
import * as mockAuth from './authMock.js'
import * as realAuth from './authReal.js'

/**
 * The auth surface the UI talks to. One import, one set of function names, one
 * result shape — which implementation runs is decided once, here, by USE_MOCK.
 *
 * Other modules (profile, initiatives, settings…) can adopt the same pattern
 * when they get endpoints: a mock file, a real file, and a facade like this.
 */

const impl = USE_MOCK ? mockAuth : realAuth

export const TOKEN_KEY = 'token'          // src/api/axios.js reads this one
export const REFRESH_KEY = 'refreshToken'

export function setTokens(token, refreshToken) {
  // The refresh token rotates on every use, so a response that carries a new
  // one has already killed the old one — always take what came back.
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/**
 * Persist whatever a successful sign-in returned.
 *
 * `onboarded` is stored as the API reports it but nothing routes on it any
 * more — the onboarding gate is gone. It is kept because the backend sends it
 * and it costs nothing to carry.
 */
export function applySession(res) {
  if (!res?.ok || !res.user) return res
  setTokens(res.token, res.refreshToken)

  const local = authStore.read()
  const sameUser = (local.email || '').trim().toLowerCase() === (res.user.email || '').trim().toLowerCase()
  const onboarded = Boolean(res.user.onboarded) || (sameUser && Boolean(local.onboarded))
  // keep whatever this browser already held for the same person (the mock
  // password hash, avatar, created date) rather than flattening the record
  const prevAccount = sameUser && local.account ? local.account : {}
  authStore.save({
    account: { ...prevAccount, name: res.user.name, email: res.user.email, verified: true },
    name: res.user.name,
    email: res.user.email,
    onboarded,
  })
  return res
}

const withSession = (fn) => async (args) => applySession(await fn(args))

export const register          = (args) => impl.register(args)
export const verifySignupOtp   = withSession(impl.verifySignupOtp)
export const resendSignupOtp   = (args) => impl.resendSignupOtp(args)
export const login             = withSession(impl.login)
export const requestLoginOtp   = (args) => impl.requestLoginOtp(args)
export const verifyLoginOtp    = withSession(impl.verifyLoginOtp)

/**
 * Sign out. The local session is cleared synchronously so callers can navigate
 * straight away; revoking the refresh token server-side is fire-and-forget,
 * because a failed revoke must not strand someone on a page they just left.
 */
export function logout() {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  clearTokens()
  authStore.clear()
  if (!USE_MOCK && refreshToken) {
    realAuth.logout(refreshToken).catch(() => {})
  }
}
