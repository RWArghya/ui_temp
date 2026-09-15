import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

export default function EditPersonalDetailsModal({
  isOpen,
  initialData = {},
  onSave,
  onClose,
}) {
  const [name, setName] = useState(initialData.name || '')
  const [headline, setHeadline] = useState(initialData.headline || '')
  const [org, setOrg] = useState(initialData.org || '')
  const [region, setRegion] = useState(initialData.region || '')

  useEffect(() => {
    if (isOpen) {
      setName(initialData.name || '')
      setHeadline(initialData.headline || '')
      setOrg(initialData.org || '')
      setRegion(initialData.region || '')
    }
  }, [isOpen, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      headline: headline.trim(),
      org: org.trim(),
      region: region.trim(),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Edit personal details"
      subtitle="Update your basic identity and display info."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Full name <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            placeholder="e.g. Aarav Sharma"
          />
        </div>

        {/* Headline */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            placeholder="e.g. Final-year CSE · ML enthusiast"
          />
        </div>

        {/* Organization */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            College or Organisation
          </label>
          <input
            type="text"
            value={org}
            onChange={e => setOrg(e.target.value)}
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            placeholder="e.g. IIT Delhi"
          />
        </div>

        {/* Region */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Region
          </label>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          >
            <option value="">Select region…</option>
            <option value="India — North">India — North</option>
            <option value="India — South">India — South</option>
            <option value="India — West">India — West</option>
            <option value="India — East">India — East</option>
            <option value="APAC">APAC</option>
            <option value="Middle East & Africa">Middle East & Africa</option>
            <option value="Europe">Europe</option>
            <option value="Americas">Americas</option>
          </select>
        </div>

        {/* Email (Read-only Note) */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Email address
          </label>
          <input
            type="email"
            disabled
            value={initialData.email || ''}
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] text-graphite-dim bg-paper cursor-not-allowed"
          />
          <p className="text-[11px] text-graphite-dim mt-1">
            Email address is protected and can only be updated from Account Settings with OTP verification.
          </p>
        </div>

        {/* Footer */}
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
            className="px-5 py-2 text-[13px] font-semibold text-white bg-signal hover:bg-signal-dark rounded-[2px] cursor-pointer transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  )
}
