/* ---- TEAMMATE BOUNDARY: CoverBand ----
 * Gradient or custom photo cover strip at the top of the profile card.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * CoverBand — the brand banner behind the profile photo.
 * When onUpload is provided, renders a visible button with a '+' icon
 * to upload/change the cover photo.
 *
 * @param {string|null} src       Image URL or dataURL, fallback to gradient if null
 * @param {function}    onUpload  Handler for file input change
 * @param {function}    onClear   Optional clear/remove handler
 */
export default function CoverBand({ src, onUpload, onClear }) {
  return (
    <div
      className="relative h-[130px] w-full bg-cover bg-center overflow-hidden group"
      style={{
        backgroundImage: src ? `url(${src})` : 'linear-gradient(135deg, #1548b7 0%, #3f1d80 100%)',
      }}
    >
      {/* Upload button affordance */}
      {onUpload && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <label
            htmlFor="cover-file-input"
            id="btn-upload-cover"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white text-[11.5px] font-medium backdrop-blur-sm cursor-pointer border border-white/20 transition-all shadow-sm active:scale-95"
            title={src ? 'Change cover photo' : 'Add cover photo'}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <span>{src ? 'Edit cover' : 'Add cover'}</span>
            <input
              id="cover-file-input"
              type="file"
              accept="image/*"
              hidden
              onChange={onUpload}
            />
          </label>
        </div>
      )}
    </div>
  )
}

