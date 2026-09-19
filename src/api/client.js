/**
 * API client — real endpoint wrappers.
 *
 * Every function returns a Promise, same shape the mock layer does,
 * so callers never change when you swap mock → real.
 *
 * Path conventions (agreed with backend):
 *   baseURL     /api/v1                   (versioned)
 *   profile     /profile/me
 *   initiatives /initiatives/mine         (per-user, never cached as catalog)
 *   password    /account/password          (account action, not auth)
 *   delete acct DELETE /account            (no /me — you can only delete your own)
 *   self-certs  /profile/me/self-certs     (kebab-case URL convention)
 *   links       /profile/me/links          (matches UI label)
 */
import api from './axios.js'

/* ── Profile ──────────────────────────────────── */

export const getProfile     = ()  => api.get('/profile/me').then(r => r.data)
export const updateProfile  = (d) => api.patch('/profile/me', d).then(r => r.data)

/* ── Initiatives ──────────────────────────────── */

/** User's own registrations — dedicated path, safe to cache per-user. */
export const getMyInitiatives = () => api.get('/initiatives/mine').then(r => r.data)

/** Public catalog — cacheable, same for everyone. */
export const getCatalog       = () => api.get('/initiatives').then(r => r.data)

/* ── Account ──────────────────────────────────── */

export const changePassword = (d) => api.post('/account/password', d)
export const deleteAccount  = ()  => api.delete('/account')

/* ── Self-Certs (kebab-case) ──────────────────── */

export const getSelfCerts   = ()  => api.get('/profile/me/self-certs').then(r => r.data)
export const addSelfCert    = (d) => api.post('/profile/me/self-certs', d).then(r => r.data)
export const deleteSelfCert = (id) => api.delete(`/profile/me/self-certs/${id}`)

/* ── Connected Links (was connectedProfiles) ──── */

export const getLinks       = ()  => api.get('/profile/me/links').then(r => r.data)
export const addLink        = (d) => api.post('/profile/me/links', d).then(r => r.data)
export const deleteLink     = (id) => api.delete(`/profile/me/links/${id}`)
