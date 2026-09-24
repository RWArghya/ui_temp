import axios from 'axios'
import { authStore } from '../store/auth'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/* A bare client for the refresh call itself. Using `api` here would send the
   dead access token and, on failure, re-enter this very interceptor. */
const plain = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } })

const isAuthPath = (url = '') => url.startsWith('/auth/') || url.startsWith('auth/')

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  authStore.clear()
}

/* Single-flight: several requests can 401 at once, but only one refresh should
   go out. The rest await the same promise and then retry. */
let refreshing = null

function refreshTokens() {
  if (refreshing) return refreshing
  refreshing = (async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('no refresh token')
    const { data } = await plain.post('/auth/refresh', { refreshToken })
    if (!data?.token) throw new Error('refresh failed')
    localStorage.setItem('token', data.token)
    // the refresh token rotates — the one we just sent is already dead
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
    return data.token
  })().finally(() => { refreshing = null })
  return refreshing
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (response?.status !== 401 || !config) return Promise.reject(error)

    /* The backend answers 401 for a wrong password, an unknown email and a bad
       OTP. Refreshing or redirecting on those would reload the login page
       instead of letting Auth.jsx show the message — so sign-in endpoints are
       never treated as an expired session. */
    if (isAuthPath(config.url)) return Promise.reject(error)

    if (config._retry) {
      clearSession()
      window.location.href = '/auth?mode=login'
      return Promise.reject(error)
    }

    try {
      const token = await refreshTokens()
      config._retry = true
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
      return api(config)
    } catch {
      clearSession()
      window.location.href = '/auth?mode=login'
      return Promise.reject(error)
    }
  }
)

export default api
