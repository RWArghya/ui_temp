import Icon from '../../dashboard/Icon.jsx'

/* ---- IconChip ----
 * The tinted square behind a content-type icon — the profile's counterpart to
 * proto.css's `.icon-chip`, which the dashboard uses everywhere.
 *
 * It is a component rather than that class because `.icon-chip` (and the
 * --chip-* vars it reads) is scoped under `.dash-root`, and three profile
 * routes — /profile/preview, /profile/resume, /profile/certificate/:id —
 * render outside the dashboard shell. This reads the global theme tokens from
 * index.css instead, which proto.css re-points under dark mode, so one
 * component covers every profile surface in both themes.
 *
 * Sizes track `.icon-chip` (38 / 30 / 48px); the radius does not. proto's chip
 * is 10px, but the profile sits on index.css's 2px control / 4px card scale —
 * which is also what ui.jsx's Card uses across Arena, Evaluate, Mentor and
 * Workspace. Settings is the file on proto's 8px scale, not this one. So the
 * chips follow the page they are on: 4 / 6 / 8px.
 */

const TONES = {
  blue:  'bg-signal-soft text-signal',
  green: 'bg-dash-ok-soft text-dash-ok',
  amber: 'bg-dash-warn-soft text-dash-warn',
  slate: 'bg-paper text-graphite border border-paper-line',
}

const SIZES = {
  sm: ['w-[30px] h-[30px] rounded-[4px]', 16],
  md: ['w-[38px] h-[38px] rounded-[6px]', 18],
  lg: ['w-12 h-12 rounded-[8px]', 24],
}

/**
 * @param {string} name      Icon name from the dashboard icon set (dashboard/Icon.jsx)
 * @param {'blue'|'green'|'amber'|'slate'} tone
 * @param {'sm'|'md'|'lg'} size
 * @param {ReactNode} children  Custom glyph, used instead of `name`
 */
export default function IconChip({ name, tone = 'slate', size = 'md', className = '', children }) {
  const [box, iconSize] = SIZES[size] || SIZES.md
  return (
    <span
      className={[
        box,
        TONES[tone] || TONES.slate,
        'grid place-items-center flex-none',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      {children || <Icon name={name} size={iconSize} />}
    </span>
  )
}
