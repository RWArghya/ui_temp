/* ---- EditHeadlineModal ----
 * LinkedIn-style popup modal to edit headline and organization (e.g. IIT Delhi).
 */
import { useState } from 'react'

export default function EditHeadlineModal({
  initialHeadline = '',
  initialOrg = '',
  isOpen,
  onSave,
  onClose,
}) {
  const [headline, setHeadline] = useState(initialHeadline)
  const [org, setOrg] = useState(initialOrg)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ headline: headline.trim(), org: org.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-card shadow-2xl max-w-lg w-full overflow-hidden border border-paper-line"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-line">
          <div>
            <h3 className="text-[17px] font-display font-bold text-ink-900">Edit intro</h3>
            <p className="text-[12px] text-graphite-dim mt-0.5">
              Update your professional headline and institution / company.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-graphite-dim hover:bg-paper hover:text-ink-900 flex items-center justify-center text-[16px] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1.5">
              Headline <span className="text-signal">*</span>
            </label>
            <input
              type="text"
              id="input-headline"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Final-year CSE · ML enthusiast"
              required
              className="w-full px-3.5 py-2.5 text-[13.5px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
            <p className="text-[11px] text-graphite-dim mt-1">
              Appears directly beneath your name on your profile and public link.
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1.5">
              College or Company
            </label>
            <input
              type="text"
              id="input-org"
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="e.g. IIT Delhi"
              className="w-full px-3.5 py-2.5 text-[13.5px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
            <p className="text-[11px] text-graphite-dim mt-1">
              Your current educational institute or organization.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-graphite-dim border border-paper-line rounded-[2px] bg-white hover:bg-paper cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-headline"
              className="px-5 py-2 text-[13px] font-semibold text-white bg-signal hover:bg-signal-dark rounded-[2px] cursor-pointer transition-colors"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
