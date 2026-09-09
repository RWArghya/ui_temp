/* ---- TEAMMATE BOUNDARY: InlineAddForm ----
 * One-or-two-input inline add form used at the bottom of Education,
 * Projects, Publications, Certificates, and Achievements sections.
 * ---- TEAMMATE BOUNDARY END ---- */

import { useState } from 'react'

/**
 * InlineAddForm — inline add form below a list.
 *
 * @param {{ id, placeholder, type?, required? }[]} fields  1 or 2 fields
 * @param {string}   addLabel     Button label e.g. '+ Add Education'
 * @param {function} onAdd        ({ fieldId: value, ... }) => void
 * @param {boolean}  disabled
 */
export default function InlineAddForm({ fields, addLabel = '+ Add', onAdd, disabled = false }) {
  const initial = Object.fromEntries(fields.map(f => [f.id, '']))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})

  function handleChange(id, val) {
    setValues(v => ({ ...v, [id]: val }))
    if (errors[id]) setErrors(e => ({ ...e, [id]: '' }))
  }

  function validate() {
    const newErrors = {}
    fields.forEach(f => {
      if (f.required !== false && !values[f.id].trim()) {
        newErrors[f.id] = `${f.placeholder || 'This field'} is required`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    onAdd(values)
    setValues(initial)
    setErrors({})
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {fields.map(f => (
        <div key={f.id} className="flex flex-col flex-1 min-w-[160px]">
          <input
            id={`inline-add-${f.id}`}
            type={f.type || 'text'}
            value={values[f.id]}
            onChange={e => handleChange(f.id, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={f.placeholder}
            disabled={disabled}
            className={[
              'px-3.5 py-[11px] text-[14px] font-sans',
              'border rounded-[2px] outline-none bg-white text-ink-900',
              'focus:border-signal focus:shadow-[0_0_0_3px_#e8edfa]',
              'disabled:opacity-50',
              errors[f.id] ? 'border-[#c0392b]' : 'border-paper-line',
            ].join(' ')}
          />
          {errors[f.id] && (
            <span className="text-[11px] text-[#c0392b] mt-0.5">{errors[f.id]}</span>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        id={`btn-${addLabel.replace(/\s+/g, '-').toLowerCase()}`}
        className={[
          'px-3 py-[5px] text-[12px] font-semibold whitespace-nowrap',
          'bg-signal text-white rounded-[2px] border border-signal self-start mt-0',
          'hover:bg-signal-dark transition-colors disabled:opacity-50 cursor-pointer',
        ].join(' ')}
      >
        {addLabel}
      </button>
    </div>
  )
}
