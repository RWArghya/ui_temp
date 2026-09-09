import { useCallback, useEffect, useState } from "react"

/**
 * Thin {data,loading,error} wrapper around a mock (or, later, real) API
 * call so sections can render loading/error/empty/success consistently.
 */
export function useMockQuery(queryFn) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  const run = useCallback(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))
    queryFn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [queryFn])

  useEffect(() => run(), [run])

  return { ...state, refetch: run }
}
