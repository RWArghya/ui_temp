import { useState, useRef, useEffect } from 'react'
import Icon from '../../dashboard/Icon.jsx'
import Button from './Button.jsx'

/* ---- SaveMenu ----
 * "Save" with a format menu. The resume offers PDF / LaTeX, the certificate
 * PDF / JPEG — the formats differ, the control should not. Previously these
 * were two hand-built dropdowns at different widths and paddings, one of them
 * still labelling its formats with emoji.
 */

/**
 * @param {{icon: string, label: string, hint: string, onSelect: function}[]} items
 * @param {string} label
 */
export default function SaveMenu({ items, label = 'Save' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <Button
        id="btn-save-dropdown"
        variant="primary"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Icon name="Download" size={14} />
        <span>{label}</span>
        <Icon
          name="ChevronDown"
          size={14}
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-[4px] bg-white shadow-xl border border-paper-line py-1 z-50 font-sans animate-in fade-in zoom-in-95 duration-100">
          {items.map((item, i) => (
            <div key={item.label}>
              {i > 0 && <div className="border-t border-paper-line my-0.5" />}
              <button
                type="button"
                onClick={() => { setOpen(false); item.onSelect() }}
                className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-paper cursor-pointer transition-colors"
              >
                <Icon name={item.icon} size={15} className="text-graphite-dim flex-none" />
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-ink-900">{item.label}</span>
                  <span className="block text-[10.5px] text-graphite-dim">{item.hint}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
