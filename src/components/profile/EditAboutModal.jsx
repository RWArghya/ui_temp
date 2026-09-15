import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

export default function EditAboutModal({
  isOpen,
  initialAbout = '',
  onSave,
  onClose,
}) {
  const [about, setAbout] = useState(initialAbout)

  useEffect(() => {
    if (isOpen) setAbout(initialAbout)
  }, [isOpen, initialAbout])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(about.trim())
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Edit about"
      subtitle="Summarize your professional background, interests, and aspirations."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Summary / About
          </label>
          <textarea
            rows={5}
            value={about}
            onChange={e => setAbout(e.target.value)}
            placeholder="Write a brief professional overview about yourself..."
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white resize-y"
          />
        </div>

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
