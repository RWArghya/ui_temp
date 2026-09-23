import Icon from '../../dashboard/Icon.jsx'

/* ---- PageToolbar ----
 * The bar above a full-page document view — the resume sheet and the
 * certificate sheet.
 *
 * Both pages had grown their own: the certificate viewer a white bar with a
 * square back arrow and a breadcrumb, the resume a dark #323639 strip imitating
 * a PDF reader, with "Profile" as a text button and the template name printed
 * next to it. Same job, two chromes. This is the one bar, so they cannot drift
 * again.
 *
 * Layout is fixed on purpose and matches the dashboard Topbar: navigation at
 * the far left (arrow, then breadcrumb), actions at the far right. Nothing
 * lives in the middle.
 */

/**
 * @param {function} onBack
 * @param {string}   backLabel  The place the arrow returns to
 * @param {string}   title      Where the user is now
 * @param {string}   maxWidth   Tailwind max-w-* matching the sheet below it
 * @param {ReactNode} children  Actions, rendered far right
 */
export default function PageToolbar({ onBack, backLabel, title, maxWidth = 'max-w-[1040px]', children }) {
  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-paper-line px-4 sm:px-8 py-3">
      <div className={`${maxWidth} mx-auto flex items-center justify-between gap-4`}>
        {/* far left: back, then where you are */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-[4px] border border-paper-line bg-white hover:bg-paper hover:text-signal text-ink-900 flex items-center justify-center transition-colors cursor-pointer flex-none"
            title={`Back to ${backLabel}`}
            aria-label={`Back to ${backLabel}`}
          >
            <Icon name="ArrowLeft" size={16} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="text-[14px] text-graphite-dim hover:text-ink-900 hover:underline font-medium truncate cursor-pointer transition-colors"
            >
              {backLabel}
            </button>
            <span className="text-[12px] text-graphite-dim select-none" aria-hidden="true">/</span>
            <span className="text-[14.5px] font-semibold text-ink-900 truncate max-w-[180px] sm:max-w-md">
              {title}
            </span>
          </div>
        </div>

        {/* far right: actions */}
        {children && <div className="flex items-center gap-2 flex-none">{children}</div>}
      </div>
    </header>
  )
}
