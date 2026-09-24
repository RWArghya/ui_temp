import { useSyncExternalStore } from 'react'

/* true while the media query matches; re-renders on change */
export default function useMedia(query) {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', notify)
      return () => m.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
