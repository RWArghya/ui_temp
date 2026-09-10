import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

const POPULAR_PLATFORMS = [
  'GitHub',
  'LinkedIn',
  'LeetCode',
  'Developer Portfolio',
  'Stack Overflow',
  'Codeforces',
  'X / Twitter',
  'Kaggle',
]

export default function EditLinkModal({
  isOpen,
  initialData = null,
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = Boolean(initialData)
  const modalTitle = isEdit ? 'Edit connected profile' : 'Add connected profile'

  const [platform, setPlatform] = useState('')
  const [url, setUrl] = useState('')
  const [shared, setShared] = useState(true)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPlatform(initialData.platform || initialData.title || '')
        setUrl(initialData.url || initialData.link || '')
        setShared(initialData.shared !== undefined ? Boolean(initialData.shared) : true)
      } else {
        setPlatform('')
        setUrl('')
        setShared(true)
      }
    }
  }, [isOpen, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    let cleanUrl = url.trim()
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`
    }

    onSave({
      ...(initialData || {}),
      platform: platform.trim(),
      url: cleanUrl,
      shared,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={modalTitle}
      subtitle="Connect your developer profiles, repositories, coding accounts, and portfolio."
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Platform / Profile name */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Platform / Profile name <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            placeholder="e.g. GitHub, LeetCode, LinkedIn, Developer Portfolio"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {POPULAR_PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`px-2 py-0.5 text-[11px] rounded-[2px] border transition-colors cursor-pointer ${
                  platform.toLowerCase() === p.toLowerCase()
                    ? 'bg-signal-soft border-signal text-signal-dark font-medium'
                    : 'bg-paper border-paper-line text-graphite-dim hover:text-ink-900 hover:border-graphite'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Profile URL */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Profile link / URL <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="e.g. https://github.com/username or leetcode.com/u/user"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Share on Public Profile Toggle */}
        <div className="pt-2 border-t border-paper-line">
          <label className="flex items-center justify-between p-2.5 rounded-[2px] bg-paper border border-paper-line cursor-pointer">
            <div>
              <span className="text-[12.5px] font-bold text-ink-900 block">Share on public profile</span>
              <span className="text-[11px] text-graphite-dim block">
                Allow visitors with your public profile link to view this connected profile.
              </span>
            </div>
            <input
              type="checkbox"
              checked={shared}
              onChange={e => setShared(e.target.checked)}
              className="w-4 h-4 rounded border-paper-line text-signal focus:ring-signal"
            />
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-paper-line">
          {initialData && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(initialData.id, initialData.platform || initialData.title)}
              className="px-3 py-1.5 text-[12px] font-semibold text-[#c0392b] hover:bg-[#fff0f0] rounded-[2px] cursor-pointer transition-colors"
            >
              Delete
            </button>
          ) : <div />}

          <div className="flex gap-2">
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
        </div>
      </form>
    </Modal>
  )
}
