import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

export default function EditItemModal({
  isOpen,
  type = 'publication', // 'publication' | 'achievement'
  initialData = null,
  onSave,
  onDelete,
  onClose,
}) {
  const isPub = type === 'publication'
  const titleLabel = isPub ? 'Publication / Paper title' : 'Achievement title'
  const modalTitle = initialData
    ? (isPub ? 'Edit publication' : 'Edit achievement')
    : (isPub ? 'Add publication' : 'Add achievement')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setLink(initialData.link || '')
      } else {
        setTitle('')
        setDescription('')
        setLink('')
      }
    }
  }, [isOpen, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...(initialData || {}),
      title: title.trim(),
      description: description.trim(),
      ...(isPub ? { link: link.trim() } : {}),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={modalTitle}
      subtitle={isPub ? 'Share research papers, articles, and preprints.' : 'Highlight hackathon placements, honors, or awards.'}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
        {/* Title */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            {titleLabel} <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isPub ? 'e.g. Grounded RAG for Medical Q&A' : 'e.g. Runner-up — CityHacks 2025'}
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Optional Description */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Description (optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={isPub ? 'Abstract or key contributions of the paper...' : 'Details about the award, problem statement, or team achievement...'}
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white resize-y"
          />
        </div>

        {/* Paper Link (if publication) */}
        {isPub && (
          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
              Link / DOI (optional)
            </label>
            <input
              type="text"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="e.g. arxiv.org/abs/2025.12345 or doi.org/..."
              className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
          </div>
        )}



        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-paper-line">
          {initialData && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(initialData.id, initialData.title)}
              className="px-3 py-1.5 text-[12px] font-semibold text-danger hover:bg-danger-soft rounded-[2px] cursor-pointer transition-colors"
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
