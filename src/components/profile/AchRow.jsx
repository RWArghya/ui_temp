/* ---- TEAMMATE BOUNDARY: AchRow ----
 * A single achievement / certificate / project / publication row.
 * Has optional share toggle and remove button.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * AchRow — list item for self-added content (achievements, certs, projects, publications).
 *
 * @param {string}    icon       Emoji or character prefix
 * @param {string}    title
 * @param {string}    subtitle   Secondary line (org, link, etc.)
 * @param {boolean}   shared     Current share state (optional)
 * @param {function}  onShare    Toggle share callback (optional)
 * @param {function}  onRemove   Remove callback (optional)
 * @param {boolean}   verified   If true, renders green "Verified" pill instead of share
 * @param {string}    verifiedId Used when verified=true
 * @param {boolean}   saving     Shows saving spinner
 */
export default function AchRow({
  icon,
  title,
  subtitle,
  shared,
  onShare,
  onRemove,
  verified = false,
  verifiedId,
  saving = false,
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-3',
        'px-3.5 py-3 border rounded-[2px] mb-2',
        verified
          ? 'bg-[#e7f6ee] border-transparent'
          : 'border-paper-line bg-white',
      ].join(' ')}
    >
      {/* left */}
      <div className="min-w-0">
        <span className="text-[13px] text-ink-900">
          {icon} {title}
        </span>
        {subtitle && (
          <p className="text-[11px] text-graphite-dim mt-1 truncate">{subtitle}</p>
        )}
      </div>

      {/* right actions */}
      <div className="flex items-center gap-2 flex-none">
        {saving && (
          <span className="text-[11px] text-graphite-dim animate-pulse">Saving…</span>
        )}

        {verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-[11px] py-1 text-[12px] font-medium bg-[#e7f6ee] text-[#0f9d58]">
            ✅ Verified
            {verifiedId && <span className="text-[10px] text-[#0f9d58]/70 ml-1">{verifiedId}</span>}
          </span>
        ) : (
          onShare && (
            <button
              type="button"
              onClick={onShare}
              disabled={saving}
              className="text-[12px] border border-paper-line rounded-[2px] px-[11px] py-[5px] font-semibold text-ink-900 bg-white hover:border-signal hover:text-signal transition-colors disabled:opacity-50 cursor-pointer"
            >
              {shared ? '✓ Shared' : 'Share on link'}
            </button>
          )
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={saving}
            className="text-[12px] text-graphite-dim hover:text-[#c0392b] px-[10px] py-[5px] font-medium disabled:opacity-50 cursor-pointer transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
