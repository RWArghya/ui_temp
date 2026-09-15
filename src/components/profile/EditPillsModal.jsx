import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import Pill from './Pill.jsx'

export default function EditPillsModal({
  isOpen,
  title = 'Edit items',
  subtitle = 'Add or remove tags.',
  initialItems = [],
  variant = 'default',
  placeholder = 'Add a tag and press Enter...',
  onSave,
  onClose,
}) {
  const [items, setItems] = useState(initialItems)
  const [inputVal, setInputVal] = useState('')

  useEffect(() => {
    if (isOpen) {
      setItems([...initialItems])
      setInputVal('')
    }
  }, [isOpen, initialItems])

  const handleAdd = () => {
    const trimmed = inputVal.trim()
    if (!trimmed) return
    if (items.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setInputVal('')
      return
    }
    setItems(prev => [...prev, trimmed])
    setInputVal('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleRemove = (idxToRemove) => {
    setItems(prev => prev.filter((_, idx) => idx !== idxToRemove))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(items)
  }

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Active tags area */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-2">
            Current tags ({items.length})
          </label>
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-3 bg-paper border border-paper-line rounded-[2px] min-h-[50px] max-h-[160px] overflow-y-auto">
              {items.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] bg-white border border-paper-line rounded-[2px] font-medium text-ink-900"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-graphite-dim hover:text-[#c0392b] text-[13px] font-bold leading-none cursor-pointer"
                    title={`Remove ${item}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-paper border border-dashed border-paper-line rounded-[2px] text-center text-[12px] text-graphite-dim">
              No tags added yet. Type below to add.
            </div>
          )}
        </div>

        {/* Input to add new tag */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Add new tag
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inputVal.trim()}
              className="px-4 py-2 text-[12.5px] font-semibold border border-paper-line rounded-[2px] bg-white text-ink-900 hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              + Add
            </button>
          </div>
          <p className="text-[11px] text-graphite-dim mt-1">Press Enter or click "+ Add" to add to list.</p>
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
