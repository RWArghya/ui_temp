import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

export default function EditEducationModal({
  isOpen,
  initialData = null, // null for new, or education item object for editing
  onSave,
  onDelete,
  onClose,
}) {
  const [degree, setDegree] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [institution, setInstitution] = useState('')
  const [boardOrUniversity, setBoardOrUniversity] = useState('')
  const [location, setLocation] = useState('')
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [isOngoing, setIsOngoing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDegree(initialData.degree || initialData.title || '')
        setSpecialization(initialData.specialization || '')
        setInstitution(initialData.institution || initialData.org || '')
        setBoardOrUniversity(initialData.boardOrUniversity || '')
        setLocation(initialData.location || '')
        setStartYear(initialData.startYear || '')
        setEndYear(initialData.endYear || '')
        setIsOngoing(Boolean(initialData.isOngoing))
      } else {
        setDegree('')
        setSpecialization('')
        setInstitution('')
        setBoardOrUniversity('')
        setLocation('')
        setStartYear('')
        setEndYear('')
        setIsOngoing(false)
      }
    }
  }, [isOpen, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    const compiledTitle = [degree.trim(), specialization.trim()].filter(Boolean).join(', ')
    const compiledOrg = [institution.trim(), boardOrUniversity.trim()].filter(Boolean).join(' · ')
    
    onSave({
      ...(initialData || {}),
      degree: degree.trim(),
      specialization: specialization.trim(),
      institution: institution.trim(),
      boardOrUniversity: boardOrUniversity.trim(),
      location: location.trim(),
      startYear: startYear.trim(),
      endYear: isOngoing ? 'Present' : endYear.trim(),
      isOngoing,
      title: compiledTitle,
      org: compiledOrg,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={initialData ? 'Edit education' : 'Add education'}
      subtitle="School, college, degree, board/university, and duration."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
        {/* Degree / Level */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Degree / Standard <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={degree}
            onChange={e => setDegree(e.target.value)}
            placeholder="e.g. B.Tech, Senior Secondary (XII), High School (X)"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Specialization / Field of Study */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Specialization / Stream
          </label>
          <input
            type="text"
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
            placeholder="e.g. Computer Science, Science (PCM), Commerce"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* School / College */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            School or College <span className="text-signal">*</span>
          </label>
          <input
            type="text"
            required
            value={institution}
            onChange={e => setInstitution(e.target.value)}
            placeholder="e.g. IIT Delhi, Delhi Public School, St. Xavier's"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Board or University */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Board or University
          </label>
          <input
            type="text"
            value={boardOrUniversity}
            onChange={e => setBoardOrUniversity(e.target.value)}
            placeholder="e.g. MAKAUT, CBSE, ICSE, University of Mumbai"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. New Delhi, India"
            className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
          />
        </div>

        {/* Year Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
              Start year
            </label>
            <input
              type="text"
              value={startYear}
              onChange={e => setStartYear(e.target.value)}
              placeholder="e.g. 2022"
              className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-ink-900 mb-1">
              End year
            </label>
            <input
              type="text"
              disabled={isOngoing}
              value={isOngoing ? 'Present' : endYear}
              onChange={e => setEndYear(e.target.value)}
              placeholder="e.g. 2026"
              className="w-full px-3.5 py-2 text-[13px] border border-paper-line rounded-[2px] focus:outline-none focus:border-signal text-ink-900 bg-white disabled:bg-paper disabled:text-graphite-dim"
            />
          </div>
        </div>

        {/* Ongoing checkbox */}
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer text-[12.5px] text-ink-900">
            <input
              type="checkbox"
              checked={isOngoing}
              onChange={e => setIsOngoing(e.target.checked)}
              className="rounded border-paper-line text-signal focus:ring-signal"
            />
            <span>Currently studying here (ongoing)</span>
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-paper-line">
          {initialData && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(initialData.id, initialData.degree || initialData.title || initialData.institution || 'Education')}
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
