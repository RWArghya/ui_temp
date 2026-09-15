/* ---- TEAMMATE BOUNDARY: KVRow ----
 * Simple key–value display row used in the Details and public preview cards.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * KVRow — label on the left, value on the right, optional bottom border.
 *
 * @param {string}  label
 * @param {string}  value       Renders '—' if falsy
 * @param {boolean} last        If true, no bottom border
 */
export default function KVRow({ label, value, last = false }) {
  return (
    <div
      className={[
        'flex justify-between items-center gap-3 py-[9px]',
        last ? '' : 'border-b border-paper-line',
      ].join(' ')}
    >
      <span className="text-[13px] text-graphite-dim">{label}</span>
      <span className="text-[13px] text-ink-900 text-right">{value || '—'}</span>
    </div>
  )
}
