import IconChip from './IconChip.jsx'
import Button from './Button.jsx'

/* ---- EmptyState ----
 * One empty state for every empty section.
 *
 * There were eight: some centred with a CTA, one with a dashed border and an
 * emoji, and three that were a single grey sentence with no icon and no way
 * forward. A section with nothing in it is the moment the page most needs to
 * say what goes there — so they all get the same shape now.
 *
 * `action` is optional on purpose. Sections the user fills themselves offer a
 * button; sections the platform fills (journey, verified certificates, badges)
 * explain how they fill instead of offering an action that doesn't exist.
 *
 * Mirrors proto.css's .empty-state, which the dashboard uses for the same job.
 */

/**
 * @param {string} icon      Icon name from the dashboard icon set
 * @param {'blue'|'green'|'amber'|'slate'} tone
 * @param {string} title     What is missing, as a statement
 * @param {string} message   What goes here, or how it gets filled
 * @param {{label: string, onClick: function}} [action]
 */
export default function EmptyState({ icon, tone = 'blue', title, message, action }) {
  return (
    <div className="py-10 flex flex-col items-center text-center">
      {icon && <IconChip name={icon} tone={tone} size="lg" />}
      {title && (
        <p className="text-[14px] font-semibold text-ink-900 mt-3.5">{title}</p>
      )}
      {message && (
        <p className="text-[12.5px] text-graphite-dim mt-1.5 max-w-[340px] leading-relaxed">
          {message}
        </p>
      )}
      {action && (
        <Button variant="accent" size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
