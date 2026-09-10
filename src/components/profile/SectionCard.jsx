/* ---- TEAMMATE BOUNDARY: SectionCard ----
 * Generic white card matching .card from the IPUF design system.
 * Title is optional. If you already have a Card component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * SectionCard — white bordered card with optional heading and header action.
 *
 * @param {string}      title      - Optional card heading
 * @param {ReactNode}   action     - Optional action button placed in top right
 * @param {ReactNode}   children
 * @param {string}      className  - Extra Tailwind classes
 */
export default function SectionCard({ title, action, children, className = '' }) {
  return (
    <div
      className={[
        'bg-white border border-paper-line rounded-card',
        'p-[18px] shadow-[0_1px_2px_rgba(16,18,35,.06),0_8px_24px_-12px_rgba(16,18,35,.18)]',
        className,
      ].join(' ')}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 mb-0">
          {title ? (
            <h3 className="text-[15px] font-bold text-ink-900 font-display">{title}</h3>
          ) : <div />}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
