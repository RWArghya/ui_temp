/* ---- Button ----
 * One button set for the profile surfaces.
 *
 * Before this there were six: filled-signal at five different paddings,
 * white-bordered at five more, a signal-outlined empty-state CTA, two reds,
 * and the header's own GHOST_BTN constant. Same three jobs, twelve sizes.
 *
 * RADIUS is deliberately a single constant. The profile sits on index.css's
 * 2px control radius (the marketing site's sharp look) while proto.css — the
 * dashboard — uses 6px. Whichever way that gets settled, it is this one line,
 * not a sweep through forty class strings.
 */

const RADIUS = 'rounded-[2px]'

const VARIANTS = {
  // the committing action: save, confirm, copy
  primary: 'text-white bg-signal hover:bg-signal-dark border border-transparent',
  // the neutral partner to a primary: cancel, close, download
  secondary: 'text-ink-900 bg-white border border-paper-line hover:bg-paper',
  // an invitation rather than a commitment: "Add education" in an empty state
  accent: 'text-signal bg-white border border-signal hover:bg-signal-soft',
  // toolbar buttons in the profile header
  ghost: 'text-ink-900 bg-white border border-paper-line hover:border-signal hover:text-signal',
  // destructive, confirmed: the final button in ConfirmDialog
  danger: 'text-white bg-danger border border-transparent hover:brightness-90',
  // destructive, unconfirmed: "Delete" inside an editor, deliberately quiet
  dangerQuiet: 'text-danger bg-transparent border border-transparent hover:bg-danger-soft',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[13px]',
}

/**
 * @param {'primary'|'secondary'|'accent'|'ghost'|'danger'|'dangerQuiet'} variant
 * @param {'sm'|'md'} size
 * @param {string} className  Layout only (margins, width) — not colour or padding
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer',
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        RADIUS,
        SIZES[size] || SIZES.md,
        VARIANTS[variant] || VARIANTS.secondary,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
