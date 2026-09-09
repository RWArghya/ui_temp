/* ---- TEAMMATE BOUNDARY: AchRow ----
 * A single achievement / certificate / project / publication row.
 * Has optional share toggle, edit button, remove button, and view button (for earned certs).
 * If you already have a similar list-row component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * AchRow — list item for self-added content (achievements, certs, projects, publications).
 *
 * @param {string}    icon         Emoji or character prefix
 * @param {string}    title
 * @param {string}    subtitle     Secondary line (org, link, etc.)
 * @param {boolean}   shared       Current share state (optional)
 * @param {function}  onShare      Toggle share callback (optional)
 * @param {function}  onEdit       Edit callback — triggers inline edit form (optional)
 * @param {function}  onRemove     Remove callback — triggers confirmation dialog (optional)
 * @param {function}  onView       View certificate callback (optional, earned certs only)
 * @param {boolean}   verified     If true, renders green "Verified" pill instead of share toggle
 * @param {string}    verifiedId   Used when verified=true
 * @param {boolean}   saving       Shows saving spinner
 */
export default function AchRow({
  icon,
  title,
  subtitle,
  shared,
  onShare,
  onEdit,
  onRemove,
  onView,
  verified  = false,
  verifiedId,
  saving    = false,
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-3',
        'py-3 border-b border-paper-line last:border-0',
      ].join(' ')}
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && <span className="text-[18px] flex-none">{icon}</span>}

        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-ink-900 leading-tight truncate">{title}</p>
          {subtitle && (
            <p className="text-[12px] text-graphite-dim mt-0.5 truncate">{subtitle}</p>
          )}
          {verified && verifiedId && (
            <p className="text-[11px] text-[#0f9d58] mt-0.5 font-mono">ID: {verifiedId}</p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-none">
        {/* Verified badge (read-only earned cert) */}
        {verified && (
          <span className="px-2 py-0.5 text-[10.5px] font-bold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px] uppercase tracking-wide">
            ✓ Verified
          </span>
        )}

        {/* View button — only for earned/verified certs, navigates to CertificateView */}
        {verified && onView && (
          <button
            type="button"
            onClick={onView}
            className={[
              'px-2.5 py-[4px] text-[11.5px] font-semibold',
              'border border-paper-line rounded-[2px] bg-white text-graphite-dim',
              'hover:border-signal hover:text-signal transition-colors cursor-pointer',
            ].join(' ')}
            title="View certificate"
          >
            View
          </button>
        )}

        {/* Share toggle — for self-added items */}
        {!verified && onShare && (
          <button
            type="button"
            onClick={onShare}
            disabled={saving}
            title={shared ? 'Remove from public profile' : 'Show on public profile'}
            className={[
              'px-2.5 py-[4px] text-[11px] font-semibold rounded-[2px] border cursor-pointer transition-colors',
              shared
                ? 'bg-[#e7f6ee] text-[#0f9d58] border-[#a3e0bf] hover:bg-[#d4f0e1]'
                : 'bg-white text-graphite-dim border-paper-line hover:border-graphite-dim',
              saving ? 'opacity-50' : '',
            ].join(' ')}
          >
            {shared ? '✓ Shared' : 'Share'}
          </button>
        )}

        {/* Edit button */}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className={[
              'px-2.5 py-[4px] text-[11.5px] font-semibold',
              'border border-paper-line rounded-[2px] bg-white text-graphite-dim',
              'hover:border-signal hover:text-signal transition-colors cursor-pointer',
            ].join(' ')}
          >
            Edit
          </button>
        )}

        {/* Remove button — triggers confirmation dialog in parent */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove"
            className={[
              'px-2.5 py-[4px] text-[11.5px] font-semibold',
              'border border-paper-line rounded-[2px] bg-white text-graphite-dim',
              'hover:border-[#c0392b] hover:text-[#c0392b] transition-colors cursor-pointer',
            ].join(' ')}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
