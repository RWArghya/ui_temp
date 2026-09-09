/* ---- TEAMMATE BOUNDARY: SectionCard ----
 * Generic white card matching .card from the IPUF design system.
 * Title is optional. If you already have a Card component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * SectionCard — white bordered card with optional heading.
 *
 * @param {string}      title      - Optional card heading
 * @param {ReactNode}   children
 * @param {string}      className  - Extra Tailwind classes
 */
export default function SectionCard({ title, children, className = '' }) {
  return (
    <div
      className={[
        'bg-white border border-paper-line rounded-card',
        'p-[18px] shadow-[0_1px_2px_rgba(16,18,35,.06),0_8px_24px_-12px_rgba(16,18,35,.18)]',
        className,
      ].join(' ')}
    >
      {title && (
        <h3 className="text-[15px] font-bold text-ink-900 font-display mb-0">{title}</h3>
      )}
      {children}
    </div>
  )
}
