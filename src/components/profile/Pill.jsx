/* ---- TEAMMATE BOUNDARY: Pill ----
 * Status pill / hat chip. If you already have a Pill/Badge component, use that.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * Pill — small rounded badge.
 *
 * variant: 'default' | 'hat' | 'ok' | 'warn' | 'live' | 'accent'
 */
const styles = {
  default: 'bg-paper-line text-graphite-dim',
  hat:     'bg-signal-soft text-signal-dark font-bold',
  accent:  'bg-signal-soft text-signal-dark font-bold',
  ok:      'bg-dash-ok-soft text-dash-ok',
  warn:    'bg-dash-warn-soft text-dash-warn',
  live:    'bg-dash-live-bg text-dash-live before:content-[""] before:inline-block before:w-[6px] before:h-[6px] before:rounded-full before:bg-dash-live before:mr-1.5',
}

export default function Pill({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-[11px] py-1',
        'text-[12px] font-medium leading-[1.5] whitespace-nowrap',
        styles[variant] || styles.default,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
