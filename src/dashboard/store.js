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

const DEFAULT_DEMO_REGISTERED = [
  'icc-global',
  'genai-academy',
  'npci-upi',
  'agentic-bootcamp',
  'police-hack',
  'isro-bhuvan',
]

function rawRead() {
  try {
    const raw = JSON.parse(localStorage.getItem(H2S_KEY) || '{}')
    if (!raw.registered || raw.registered.length === 0) {
      raw.registered = [...DEFAULT_DEMO_REGISTERED, 'inspire-26']
      raw.submissions = raw.submissions || ['inspire-26']
      raw.intents = raw.intents || ['competing', 'learning', 'learncompete']
    }
    return raw
  } catch {
    return {
      registered: [...DEFAULT_DEMO_REGISTERED, 'inspire-26'],
      submissions: ['inspire-26'],
      intents: ['competing', 'learning', 'learncompete'],
    }
  }
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

/* Plausible populated history so ongoing initiatives and numbers have content. */
export function seedDemoPatch(st) {
  return {
    registered: [...DEFAULT_DEMO_REGISTERED, 'inspire-26'],
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
