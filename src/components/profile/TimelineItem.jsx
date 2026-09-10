/* ---- TEAMMATE BOUNDARY: TimelineItem ----
 * Single item in the Journey tab chronological feed.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * TimelineItem — one entry in the Journey timeline.
 *
 * @param {'done'|'now'|'default'} variant
 * @param {string}  title
 * @param {string}  subtitle
 */
export default function TimelineItem({ variant = 'default', title, subtitle }) {
  const dotColor = {
    done:    'bg-[#0f9d58] border-[#0f9d58]',
    now:     'bg-signal border-signal shadow-[0_0_0_4px_#e8edfa]',
    default: 'bg-white border-paper-line',
  }[variant] || 'bg-white border-paper-line'

  return (
    <div className="relative pb-5">
      {/* dot */}
      <div
        className={`absolute -left-6 top-[5px] w-[10px] h-[10px] rounded-full border-2 ${dotColor}`}
        aria-hidden="true"
      />
      <strong className="text-[13px] text-ink-900 block">{title}</strong>
      {subtitle && <p className="text-[11px] text-graphite-dim mt-1.5">{subtitle}</p>}
    </div>
  )
}
