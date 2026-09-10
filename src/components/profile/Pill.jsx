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
  accent:  'bg-violet-soft text-violet font-bold',
  ok:      'bg-[#e7f6ee] text-[#0f9d58]',
  warn:    'bg-[#fff4e0] text-[#b26a00]',
  live:    'bg-[#ffe9e9] text-[#c0392b] before:content-[""] before:inline-block before:w-[6px] before:h-[6px] before:rounded-full before:bg-[#c0392b] before:mr-1.5',
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
