/**
 * Auth API — register + login only (see src/pages/Auth.jsx).
 * Same promise-returning shape as client.js.
 */
import api from './axios.js'

export const register = (d) => api.post('/auth/register', d).then((r) => r.data)
export const verifySignupOtp = (d) => api.post('/auth/signup/otp/verify', d).then((r) => r.data)
export const login = (d) => api.post('/auth/login', d).then((r) => r.data)
