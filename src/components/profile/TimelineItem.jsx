/* ---- TEAMMATE BOUNDARY: TimelineItem ----
 * Single item in the Journey tab chronological feed.
 * ---- TEAMMATE BOUNDARY END ---- */

import Icon from '../../dashboard/Icon.jsx'

/**
 * TimelineItem — one entry in the Journey timeline.
 *
 * The dot carries status (done / now / upcoming); the icon carries what kind of
 * event it was. Both read from the same `variant`, so they never disagree.
 *
 * Dot geometry is load-bearing: it sits 10px wide at -left-6, which puts its
 * centre 5px from the list's left edge — the rail in the parent is aligned to
 * that same 5px. Change one and you have to change the other.
 *
 * @param {'done'|'now'|'default'} variant
 * @param {string}  title
 * @param {string}  subtitle
 * @param {string}  date
 * @param {string}  icon      Icon name from the dashboard icon set
 */
export default function TimelineItem({ variant = 'default', title, subtitle, date, icon }) {
  const dotColor = {
    done:    'bg-dash-ok border-dash-ok',
    now:     'bg-signal border-signal shadow-[0_0_0_4px_var(--color-signal-soft)]',
    default: 'bg-white border-paper-line',
  }[variant] || 'bg-white border-paper-line'

  const iconColor = {
    done:    'text-dash-ok',
    now:     'text-signal',
    default: 'text-graphite-dim',
  }[variant] || 'text-graphite-dim'

  return (
    <div className="relative pb-5 last:pb-0">
      {/* status dot — centre sits 5px from the list edge, on the rail */}
      <div
        className={`absolute -left-6 top-[5px] w-[10px] h-[10px] rounded-full border-2 ${dotColor}`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <strong className="flex items-center gap-1.5 text-[13px] text-ink-900 font-semibold leading-snug min-w-0">
          {icon && <Icon name={icon} size={14} className={`flex-none ${iconColor}`} />}
          <span className="min-w-0">{title}</span>
        </strong>
        {date && (
          <span className="text-[11px] font-mono text-graphite-dim font-medium whitespace-nowrap shrink-0">
            {date}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-[12px] text-graphite-dim mt-1 leading-relaxed pl-[20px]">{subtitle}</p>
      )}
    </div>
  )
}
