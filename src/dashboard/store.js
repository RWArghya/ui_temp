/* ============================================================
   H2S Dashboard — React state store + persistence bridge.
   Identity lives in the existing authStore (h2s_auth). Dashboard
   activity (registrations, submissions, promptwars, mentor) lives
   in the prototype's `h2s` key. This hook exposes one `st()` state
   object and applies patches atomically so React re-renders on
   every change, mirroring app.js's S.save() + show().
   ============================================================ */
import { useCallback, useRef, useSyncExternalStore } from 'react'
import { authStore } from '../store/auth'

const H2S_KEY = 'h2s'
let listeners = new Set()
let cache = null

function rawRead() {
  try { return JSON.parse(localStorage.getItem(H2S_KEY) || '{}') } catch { return {} }
}
function read() {
  if (cache) return cache
  cache = rawRead()
  return cache
}
function emit() { cache = null; listeners.forEach(l => l()) }

/* ---- prototype-compatible S store ---- */
export const S = {
  read: rawRead,
  save(patch) { const cur = rawRead(); localStorage.setItem(H2S_KEY, JSON.stringify(Object.assign(cur, patch))); emit() },
  reset() { localStorage.removeItem(H2S_KEY); emit() },
}

function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function getSnapshot() { return read() }

/* Identity bridge: fold the authenticated user into h2s state (name, email,
   region, interests) so the dashboard has a real person to render. */
function identity() {
  const a = authStore.read()
  const h = read()
  const base = {}
  if (a.name && !h.name) base.name = a.name
  if (a.email && !h.email) base.email = a.email
  if (Object.keys(base).length) { const cur = rawRead(); localStorage.setItem(H2S_KEY, JSON.stringify(Object.assign(cur, base))) }
  return Object.assign({}, base, a.primary ? { primary: a.primary } : {})
}

/* A fresh account stays genuinely empty — no auto-injected registrations,
   submissions or completed profile. app.html never fabricates activity on
   load; the only way to get a populated demo is the sidebar's explicit
   "load sample activity" link (seedDemoPatch below), matching the reference
   exactly. An auto-seeded dashboard is why "Getting started" showed as
   already complete and the stats never matched a real first visit.

   The reference's seedDemo(): "fills a plausible history so the numbers
   have something to count." Only invoked from the sidebar's opt-in link. */
export function seedDemoPatch(st) {
  return {
    registered: ['icc-global', 'genai-academy', 'npci-upi', 'inspire-26'],
    submissions: ['inspire-26'],
    intents: [...new Set([...(st.intents || []), 'competing', 'learning', 'learncompete'])],
  }
}

/* The dashboard aggregates multiple keys into one render object that also
   carries helpers React components call to mutate state. */
export function useH2S() {
  const st = useSyncExternalStore(subscribe, getSnapshot)
  const ident = useRef(identity())
  const combined = Object.assign({}, st, ident.current)

  const sv = useCallback((patch) => { S.save(patch) }, [])
  const reset = useCallback(() => S.reset(), [])

  return { st: combined, sv, reset }
}
