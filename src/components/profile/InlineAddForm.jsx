/* ---- TEAMMATE BOUNDARY: InlineAddForm ----
 * Inline form for adding OR editing a list entry.
 * Used in Education, Projects, Publications, Certificates, and Achievements sections.
 * If you already have an InlineForm / EditableForm component, use that instead.
 * ---- TEAMMATE BOUNDARY END ---- */

import React, { useState, useEffect, useRef } from 'react'

/**
 * InlineAddForm — inline add / edit form.
 *
 * Modes:
 *  - Always visible (default): form is always rendered (legacy behaviour).
 *  - Collapsible: shows a trigger button; form expands on click, collapses after save.
 *  - Edit: pre-filled with `initialValues`; shows "Save Changes" + "Cancel".
 *
 * Field types supported via `field.type`:
 *  - 'text' (default)
 *  - 'url'   — shows a URL input with https:// placeholder hint
 *  - 'file'  — shows an image upload input with a small preview + "or paste link" URL input
 *
 * @param {{ id, placeholder, type?, required?, urlLabel? }[]} fields
 * @param {string}   addLabel        Button label when adding (e.g. '+ Add Education')
 * @param {string}   triggerLabel    Collapsed-state trigger button label (defaults to addLabel)
 * @param {string}   submitLabel     Override submit button text (e.g. 'Save Changes')
 * @param {function} onAdd           Called with the values object on submit
 * @param {function} onCancel        Called when cancel is clicked
 * @param {boolean}  disabled
 * @param {boolean}  collapsible     If true, form starts hidden behind a trigger button
 * @param {object}   initialValues   If set, pre-fills form fields (edit mode)
 * @param {boolean}  startOpen       If true AND collapsible, start expanded
 */
export default function InlineAddForm({
  fields,
  addLabel    = '+ Add',
  triggerLabel,
  submitLabel,
  onAdd,
  onCancel,
  disabled    = false,
  collapsible = false,
  initialValues = null,
  startOpen   = false,
}) {
  const isEditMode = initialValues !== null

  const blankValues = () =>
    Object.fromEntries(fields.map(f => [f.id, '']))

  const fillValues = (init) =>
    Object.fromEntries(fields.map(f => [f.id, init?.[f.id] ?? '']))

  const [open,        setOpen]        = useState(!collapsible || isEditMode || startOpen)
  const [values,      setValues]      = useState(isEditMode ? fillValues(initialValues) : blankValues())
  const [errors,      setErrors]      = useState({})
  const [previews,    setPreviews]    = useState({})   // { fieldId: dataURL }
  const firstInputRef = useRef(null)

  // Sync when initialValues changes (switching edit targets)
  useEffect(() => {
    if (initialValues) {
      setValues(fillValues(initialValues))
      setErrors({})
      setPreviews({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  // Focus first input when form opens
  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [open])

  function handleChange(id, val) {
    setValues(v => ({ ...v, [id]: val }))
    if (errors[id]) setErrors(e => ({ ...e, [id]: '' }))
  }

  function handleFileChange(id, file) {
    if (!file) return
    if (!/^image\//.test(file.type)) {
      setErrors(e => ({ ...e, [id]: 'Please select an image file.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      setValues(v => ({ ...v, [id]: ev.target.result }))
      setPreviews(p => ({ ...p, [id]: ev.target.result }))
      if (errors[id]) setErrors(e => ({ ...e, [id]: '' }))
    }
    reader.readAsDataURL(file)
  }

  function validate() {
    const newErrors = {}
    fields.forEach(f => {
      // For file fields: either a file preview OR a paired URL link field is acceptable
      if (f.required !== false && !values[f.id]?.toString().trim()) {
        // If this field has a pairField (URL fallback), check that too
        if (!f.urlPairId || !values[f.urlPairId]?.toString().trim()) {
          newErrors[f.id] = `${f.placeholder || 'This field'} is required`
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onAdd({ ...values })
    if (!isEditMode) {
      setValues(blankValues())
      setErrors({})
      setPreviews({})
      if (collapsible) setOpen(false)
    }
  }

  function handleCancel() {
    setValues(isEditMode ? fillValues(initialValues) : blankValues())
    setErrors({})
    setPreviews({})
    if (collapsible) setOpen(false)
    onCancel?.()
  }

  const effectiveSubmitLabel = submitLabel ?? (isEditMode ? 'Save Changes' : addLabel.replace(/^\+\s*/, '').trim() || 'Add')
  const effectiveTriggerLabel = triggerLabel ?? addLabel

  // ── Collapsed trigger button ──
  if (collapsible && !open) {
    return (
      <button
        type="button"
        id={`btn-trigger-${addLabel.replace(/\s+/g, '-').toLowerCase()}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={[
          'mt-4 inline-flex items-center gap-1.5 px-3 py-[6px] text-[12.5px] font-semibold',
          'border border-paper-line rounded-[2px] bg-white text-graphite-dim',
          'hover:border-signal hover:text-signal transition-colors cursor-pointer disabled:opacity-50',
        ].join(' ')}
      >
        <span className="text-[15px] leading-none">+</span>
        {effectiveTriggerLabel.replace(/^\+\s*/, '')}
      </button>
    )
  }

  // ── Expanded form ──
  // Split fields into rows: a field with newRow:true starts a new row.
  const rows = fields.reduce((acc, f, i) => {
    if (i === 0 || f.newRow) acc.push([])
    acc[acc.length - 1].push({ ...f, _globalIdx: i })
    return acc
  }, [])

  return (
    <div className="mt-4 space-y-2">
      {/* Input rows */}
      {rows.map((rowFields, rowIdx) => (
        <div key={rowIdx} className="flex flex-wrap items-center gap-2">
          {rowFields.map((f, colIdx) => {
            const globalIdx = f._globalIdx
            const isFirstField = globalIdx === 0

            // Divider between url and file fields on the same row
            const showDivider = colIdx > 0 && (
              (rowFields[colIdx - 1]?.type === 'url' && f.type === 'file') ||
              (rowFields[colIdx - 1]?.type === 'file' && f.type === 'url')
            )

            return (
              <React.Fragment key={f.id}>
                {showDivider && (
                  <span className="text-[14px] font-light text-graphite-dim select-none flex-none">/</span>
                )}

                {f.type === 'file' ? (
                  /* ── File upload button ── */
                  <div className="flex flex-col gap-1 flex-none">
                    <label
                      htmlFor={`inline-add-${f.id}`}
                      className={[
                        'inline-flex items-center gap-2 px-3.5 py-[10px] text-[13px] font-semibold font-sans',
                        'border rounded-[2px] bg-white text-graphite-dim cursor-pointer whitespace-nowrap',
                        'hover:border-signal hover:text-signal transition-colors',
                        errors[f.id] ? 'border-[#c0392b]' : 'border-paper-line',
                      ].join(' ')}
                    >
                      {previews[f.id] ? (
                        <img
                          src={previews[f.id]}
                          alt="Preview"
                          className="w-5 h-5 object-cover rounded border border-paper-line flex-none"
                        />
                      ) : (
                        <span className="text-[15px] leading-none flex-none">📎</span>
                      )}
                      <span>
                        {previews[f.id] ? 'Image selected — click to change' : (f.placeholder || 'Add certificate image')}
                      </span>
                      <input
                        id={`inline-add-${f.id}`}
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={disabled}
                        onChange={e => handleFileChange(f.id, e.target.files?.[0])}
                      />
                    </label>
                    {errors[f.id] && (
                      <span className="text-[11px] text-[#c0392b]">{errors[f.id]}</span>
                    )}
                  </div>
                ) : (
                  /* ── Text / URL input ── */
                  <div className="flex flex-col flex-1 min-w-[150px]">
                    <input
                      ref={isFirstField ? firstInputRef : undefined}
                      id={`inline-add-${f.id}`}
                      type={f.type === 'url' ? 'url' : 'text'}
                      value={values[f.id]}
                      onChange={e => handleChange(f.id, e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder={
                        f.type === 'url' && !f.placeholder?.startsWith('http')
                          ? (f.placeholder || 'https://...')
                          : f.placeholder
                      }
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
                )}
              </React.Fragment>
            )
          })}
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          id={`btn-submit-${addLabel.replace(/\s+/g, '-').toLowerCase()}`}
          className={[
            'px-3.5 py-[7px] text-[12.5px] font-semibold whitespace-nowrap',
            'bg-signal text-white rounded-[2px] border border-signal',
            'hover:bg-signal-dark transition-colors disabled:opacity-50 cursor-pointer',
          ].join(' ')}
        >
          {effectiveSubmitLabel}
        </button>

        {/* Cancel button: always show in edit mode; show in collapsible mode too */}
        {(isEditMode || collapsible) && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={disabled}
            id={`btn-cancel-${addLabel.replace(/\s+/g, '-').toLowerCase()}`}
            className="px-3.5 py-[7px] text-[12.5px] font-medium text-graphite-dim border border-paper-line rounded-[2px] bg-white hover:bg-paper transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
