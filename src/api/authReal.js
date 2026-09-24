import api from './axios.js'

/**
 * Real auth — the 8 endpoints the Go backend actually serves today.
 *
 * Nothing else in the app has a backend yet, so nothing else belongs here.
 *
 * The backend answers every failure with one envelope:
 *   { success: false, error: "<code>", message: "<user-facing copy>" }
 * and its `message` already matches the copy Auth.jsx shows, so `toResult`
 * flattens both outcomes into the shape authMock returns and the page
 * renders `message` directly.
 *
 * 401 matters here: the backend uses it for a wrong password, an unknown
 * email and a bad OTP. axios.js is what keeps those from being treated as an
 * expired session — it never refreshes or redirects for /auth/* paths.
 */

const GENERIC = 'Something went wrong. Please try again.'

async function call(path, body) {
  try {
    const { data } = await api.post(path, body)
    return { ok: true, ...data }
  } catch (err) {
    const data = err.response?.data
    if (data?.message) return { ok: false, code: data.error || 'error', message: data.message }
    // no response at all — the backend is down, or the proxy is not wired up
    if (!err.response) {
      return { ok: false, code: 'network_error', message: "Can't reach the server. Check your connection and try again." }
    }
    return { ok: false, code: data?.error || 'internal_error', message: GENERIC }
  }
}

/** mobile goes up as digits only; the backend joins it with countryCode. */
export const register = ({ name, email, countryCode, mobile, password }) =>
  call('/auth/register', {
    name: name.trim(),
    email: email.trim(),
    countryCode,
    mobile: String(mobile).replace(/\D/g, ''),
    password,
  })

export const verifySignupOtp = ({ email, code }) =>
  call('/auth/signup/otp/verify', { email: email.trim(), code: String(code).trim() })

export const resendSignupOtp = ({ email }) =>
  call('/auth/signup/otp/resend', { email: email.trim() })

export const login = ({ email, password }) =>
  call('/auth/login', { email: email.trim(), password })

export const requestLoginOtp = ({ email }) =>
  call('/auth/login/otp/request', { email: email.trim() })

export const verifyLoginOtp = ({ email, code }) =>
  call('/auth/login/otp/verify', { email: email.trim(), code: String(code).trim() })

/** Revokes the refresh token server-side. Failure is ignored by the caller —
 *  the local session is cleared either way. */
export const logout = (refreshToken) => call('/auth/logout', { refreshToken })
