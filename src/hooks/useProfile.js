/**
 * useProfile — loads profile + initiatives data from mock APIs.
 *
 * Returns { profile, initiatives, loading, error, refetch }
 * where `profile` is the full user object and `initiatives` contains
 * { completed, active, submittedIds }.
 *
 * When a real backend is ready, swap `fetchProfile` and `fetchUserInitiatives`
 * for the real axios calls — callers don't change.
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchProfile } from '../api/mock/profile.js'
import { fetchUserInitiatives } from '../api/mock/initiatives.js'

export function useProfile() {
  const [profile, setProfile]         = useState(null)
  const [initiatives, setInitiatives] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prof, init] = await Promise.all([fetchProfile(), fetchUserInitiatives()])
      setProfile(prof)
      setInitiatives(init)
    } catch (err) {
      setError(err.message || 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { profile, initiatives, loading, error, refetch: load }
}
