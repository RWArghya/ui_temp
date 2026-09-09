/**
 * Renders `count` skeleton blocks so it can sit directly inside the same
 * grid the real cards use once data arrives — no layout jump.
 */
export default function LoadingState({ count = 1, className = "h-40 rounded-card" }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} aria-hidden="true" />
      ))}
      <span className="sr-only">Loading…</span>
    </>
  )
}
