import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

export default function EditProjectModal({
  isOpen,
  initialData = null, // null for new, or project item object for editing
  onSave,
  onDelete,
  onClose,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState([])
  const [techInput, setTechInput] = useState('')
  const [sourceLink, setSourceLink] = useState('')
  const [liveLink, setLiveLink] = useState('')
  const [docsLink, setDocsLink] = useState('')
  const [shared, setShared] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setTechStack(Array.isArray(initialData.techStack) ? [...initialData.techStack] : [])
        setSourceLink(initialData.sourceLink || initialData.link || '')
        setLiveLink(initialData.liveLink || '')
        setDocsLink(initialData.docsLink || '')
        setShared(Boolean(initialData.shared))
      } else {
        setTitle('')
        setDescription('')
        setTechStack([])
        setSourceLink('')
        setLiveLink('')
        setDocsLink('')
        setShared(false)
      }
      setTechInput('')
    }
  }, [isOpen, initialData])

  const handleAddTech = () => {
    const trimmed = techInput.trim()
    if (!trimmed) return
    if (!techStack.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setTechStack(prev => [...prev, trimmed])
    }
    setTechInput('')
  }

  const handleRemoveTech = (idxToRemove) => {
    setTechStack(prev => prev.filter((_, idx) => idx !== idxToRemove))
  }

  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTech()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...(initialData || {}),
      title: title.trim(),
      description: description.trim(),
      techStack,
      sourceLink: sourceLink.trim(),
      liveLink: liveLink.trim(),
      docsLink: docsLink.trim(),
      link: sourceLink.trim() || liveLink.trim(),
      shared,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={initialData ? 'Edit project' : 'Add project'}
      subtitle="Showcase your technical work, repository, demo, and stack."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
        {/* Project Title */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Project title <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. AgentChat — LLM-powered support agent"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Tech Stack Pills Manager */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Tech stack
          </label>
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2.5 mb-2 bg-paper border border-paper-line rounded-[2px]">
              {techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] bg-white border border-paper-line rounded-[2px] font-medium text-ink-900"
                >
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(idx)}
                    className="text-graphite-dim hover:text-[#c0392b] text-[12px] font-bold leading-none cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={handleTechKeyDown}
              placeholder="e.g. React, Python, FastAPI (press Enter)"
              className="flex-1 px-3 py-1.5 text-[12.5px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
            <button
              type="button"
              onClick={handleAddTech}
              disabled={!techInput.trim()}
              className="px-3 py-1.5 text-[12px] font-semibold border border-paper-line rounded-[2px] bg-white hover:bg-paper disabled:opacity-40 cursor-pointer transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Description / Overview
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief overview of what this project does and problems it solves..."
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white resize-y"
          />
        </div>

        {/* Source Code Link */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Source code repository
          </label>
          <input
            type="text"
            value={sourceLink}
            onChange={e => setSourceLink(e.target.value)}
            placeholder="e.g. github.com/your-username/repo"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Live Demo & Documentation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
              Live website / Demo
            </label>
            <input
              type="text"
              value={liveLink}
              onChange={e => setLiveLink(e.target.value)}
              placeholder="e.g. https://myproject.com"
              className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
              Documentation (optional)
            </label>
            <input
              type="text"
              value={docsLink}
              onChange={e => setDocsLink(e.target.value)}
              placeholder="e.g. https://docs.myproject.com"
              className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
          </div>
        </div>

        {/* Share on Public Profile Toggle */}
        <div className="pt-2 border-t border-paper-line">
          <label className="flex items-center justify-between p-2.5 rounded-[2px] bg-paper border border-paper-line cursor-pointer">
            <div>
              <span className="text-[12.5px] font-bold text-ink-900 block">Share on public profile</span>
              <span className="text-[11px] text-graphite-dim block">
                Allow visitors with your public profile link to view this project.
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
              onClick={() => onDelete(initialData.id, initialData.title)}
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
