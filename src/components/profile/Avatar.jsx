/* ---- TEAMMATE BOUNDARY: Avatar ----
 * User avatar — initials fallback, photo when set, upload affordance.
 * If you already have an Avatar component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * Avatar — shows a photo or initials. When `onUpload` is provided, wraps in
 * a `<label>` to allow file picking. Sizes: 'sm' | 'md' | 'xl'.
 *
 * @param {string|null}   src        base64 dataURL or null
 * @param {string}        name       Used to compute initials when no photo
 * @param {'sm'|'md'|'xl'} size
 * @param {function}      onUpload   If set, renders as a clickable upload label
 * @param {function}      onClear    "Remove photo" action (only rendered when src is set)
 */
const SIZE = {
  sm: 'w-[30px] h-[30px] text-[11px]',
  md: 'w-[34px] h-[34px] text-[13px]',
  xl: 'w-[84px] h-[84px] text-[26px] border-[4px] border-white shadow-[0_1px_2px_rgba(16,18,35,.06),0_8px_24px_-12px_rgba(16,18,35,.18)]',
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

export default function Avatar({ src, name, size = 'md', onUpload, className = '' }) {
  const ring = SIZE[size] || SIZE.md
  const base = `rounded-full flex-none bg-ink-900 text-white grid place-items-center font-bold ${ring} ${className}`

  const inner = src
    ? <img src={src} alt={name || 'Avatar'} className="w-full h-full rounded-full object-cover" />
    : <span aria-label={`Initials: ${initials(name)}`}>{initials(name)}</span>

  if (onUpload) {
    return (
      <label
        className={`${base} relative cursor-pointer group overflow-hidden`}
        title={src ? 'Change photo' : 'Add photo'}
        id="avatar-upload-label"
      >
        {inner}
        {/* upload overlay hint */}
        <span className="absolute inset-0 rounded-full bg-ink-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-[10px] font-semibold leading-tight text-center px-1">
            {src ? 'Change' : 'Add\nphoto'}
          </span>
        </span>
        <input
          id="avatar-file-input"
          type="file"
          accept="image/*"
          hidden
          onChange={onUpload}
        />
      </label>
    )
  }

  return <div className={base}>{inner}</div>
}
