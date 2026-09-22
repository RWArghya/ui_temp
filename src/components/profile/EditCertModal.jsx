import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

export default function EditCertModal({
  isOpen,
  initialData = null, // null for new, or certificate object for editing
  onSave,
  onDelete,
  onClose,
}) {
  const [title, setTitle] = useState('')
  const [org, setOrg] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [link, setLink] = useState('')
  const [photo, setPhoto] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '')
        setOrg(initialData.org || '')
        setIssueDate(initialData.issueDate || initialData.date || '')
        setLink(initialData.link || '')
        setPhoto(initialData.photo || initialData.proofUrl || '')
      } else {
        setTitle('')
        setOrg('')
        setIssueDate('')
        setLink('')
        setPhoto('')
      }
      setValidationError('')
    }
  }, [isOpen, initialData])

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, etc.)')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const maxW = 1200
        const scale = img.width > maxW ? maxW / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setPhoto(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!link.trim() && !photo) {
      setValidationError('Please provide at least a certificate link or an image.')
      return
    }
    setValidationError('')
    onSave({
      ...(initialData || {}),
      title: title.trim(),
      org: org.trim(),
      issueDate: issueDate.trim(),
      link: link.trim(),
      photo: photo || '',
      proofUrl: photo || '',
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={initialData ? 'Edit certificate' : 'Add certificate'}
      subtitle="Add external certificates earned elsewhere."
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
        {/* Certificate title */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Certificate name <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. AWS Certified Solutions Architect"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Issuing Organization */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Issuing organization
          </label>
          <input
            type="text"
            value={org}
            onChange={e => setOrg(e.target.value)}
            placeholder="e.g. Amazon Web Services, Coursera, Google"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Issue Date */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Issue date
          </label>
          <input
            type="text"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
            placeholder="e.g. 2024, or May 2024"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* ── At least one of link or image is required ── */}
        <div className="pt-0.5">
          <p className="text-[11.5px] text-graphite-dim mb-3 leading-relaxed">
            <span className="font-semibold text-ink-900">At least one of the following is required</span>
            {' '}— a link to your certificate or an image of it.
          </p>

          {/* Certificate link */}
          <div className="mb-3">
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
              Certificate link
            </label>
            <input
              type="text"
              value={link}
              onChange={e => { setLink(e.target.value); setValidationError('') }}
              placeholder="e.g. https://www.credly.com/badges/..."
              className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-paper-line" />
            <span className="text-[11px] font-semibold text-graphite-dim uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-paper-line" />
          </div>

          {/* Certificate image */}
          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
              Certificate image
            </label>

            {photo ? (
              <div className="border border-paper-line rounded-[2px] p-2.5 bg-paper flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={photo}
                    alt="Certificate document"
                    className="w-14 h-11 object-cover rounded-[2px] border border-paper-line bg-white flex-none"
                  />
                  <div className="min-w-0">
                    <span className="text-[12.5px] font-semibold text-ink-900 block truncate">Photo attached</span>
                    <span className="text-[11px] text-dash-ok font-medium">✓ Ready to save</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 text-[11.5px] font-medium border border-paper-line bg-white hover:bg-paper rounded-[2px] text-ink-900 cursor-pointer transition-colors">
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setPhoto(''); setValidationError('') }}
                    className="px-2.5 py-1 text-[11.5px] font-medium text-danger hover:bg-danger-soft rounded-[2px] cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-paper-line hover:border-signal rounded-[2px] bg-paper hover:bg-signal-soft/30 cursor-pointer transition-colors group">
                <div className="flex items-center gap-2 text-graphite-dim group-hover:text-signal">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span className="text-[12px] font-semibold">Upload certificate image</span>
                </div>
                <span className="text-[10.5px] text-graphite-dim mt-1">Supports PNG, JPG, or WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => { handlePhotoUpload(e); setValidationError('') }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <p className="text-[12px] text-danger font-medium">{validationError}</p>
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
