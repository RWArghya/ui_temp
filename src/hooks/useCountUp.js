import { useEffect, useRef, useState } from "react"

/**
 * Counts up to `target` once the element scrolls into view. Starts (and
 * stays at, under reduced motion) the real figure — never a wrong number.
 */
export function useCountUp(target, { duration = 1400, threshold = 0.4 } = {}) {
  const ref = useRef(null)
  const [value, setValue] = useState(target)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setValue(target)
      return
    }

    setValue(0)
    let started = false
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true
            let start = null
            const step = (ts) => {
              if (start === null) start = ts
              const progress = Math.min(1, (ts - start) / duration)
              setValue(Math.floor(progress * target))
              if (progress < 1) requestAnimationFrame(step)
              else setValue(target)
            }
            requestAnimationFrame(step)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, threshold])

  return [ref, value]
}
