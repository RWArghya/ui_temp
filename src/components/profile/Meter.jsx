/* ---- TEAMMATE BOUNDARY: Meter ----
 * Thin progress bar (XP, profile completion, etc.).
 * If you already have a ProgressBar component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * Meter — thin progress bar.
 *
 * @param {number}  pct        0–100
 * @param {string}  accent     'primary' (default) | 'violet'
 * @param {string}  className
 */
export default function Meter({ pct = 0, accent = 'primary', className = '' }) {
  const fill = accent === 'violet' ? 'bg-violet' : 'bg-signal'
  return (
    <div
      className={[
        'h-[6px] rounded-full bg-white-soft overflow-hidden',
        className,
      ].join(' ')}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${fill}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}
