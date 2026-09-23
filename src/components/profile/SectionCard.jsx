/* ---- TEAMMATE BOUNDARY: SectionCard ----
 * Generic white card matching .card from the IPUF design system.
 * Title is optional. If you already have a Card component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * SectionCard — white bordered card with optional heading, subtitle and action.
 *
 * The card owns the gap between its header and its body. It used to not: every
 * call site added its own `mt-4` (or `mt-3`, on the preview page) and its own
 * `mt-1 mb-4` description paragraph, which is why vertical rhythm drifted
 * between sections and between the two pages. Pass `subtitle` instead of
 * writing a paragraph, and give `children` no top margin.
 *
 * @param {ReactNode} title      Card heading
 * @param {ReactNode} subtitle   One line under the heading, explaining the section
 * @param {ReactNode} action     Control in the top right (see CardAction)
 * @param {ReactNode} children
 * @param {string}    className  Extra Tailwind classes
 */
export default function SectionCard({ title, subtitle, action, children, className = '' }) {
  const hasHeader = title || subtitle || action

  return (
    <div
      className={[
        'bg-white border border-paper-line rounded-card',
        'p-[18px] shadow-[0_1px_2px_rgba(16,18,35,.06),0_8px_24px_-12px_rgba(16,18,35,.18)]',
        className,
      ].join(' ')}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[15px] font-bold text-ink-900 font-display leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[13px] text-graphite-dim mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-none">{action}</div>}
        </div>
      )}
      {children != null && (
        <div className={hasHeader ? 'mt-4' : ''}>{children}</div>
      )}
    </div>
  )
}
