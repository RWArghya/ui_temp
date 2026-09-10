/* ---- Modal ----
 * Reusable modal matching the exact design tokens of ConfirmDialog.jsx and the project.
 */
export default function Modal({
  isOpen,
  title,
  subtitle,
  children,
  onClose,
  maxWidth = 'max-w-md',
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-card border border-paper-line shadow-2xl ${maxWidth} w-full overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-line">
          <div>
            <h3 className="text-[16px] font-display font-bold text-ink-900">{title}</h3>
            {subtitle && (
              <p className="text-[12px] text-graphite-dim mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[2px] text-graphite-dim hover:text-ink-900 hover:bg-paper flex items-center justify-center text-[15px] cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
