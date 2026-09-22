import Modal from './Modal.jsx'

/**
 * ViewCertModal — read-only view of a self-added certificate.
 * A pencil icon in the top-right header area lets the user
 * switch into edit mode (calls onEdit).
 */
export default function ViewCertModal({ isOpen, cert, onEdit, onClose }) {
  if (!cert) return null

  const hasLink  = !!cert.link
  const hasPhoto = !!(cert.photo || cert.proofUrl)

  return (
    <Modal
      isOpen={isOpen}
      title={cert.title || 'Certificate'}
      onClose={onClose}
      maxWidth="max-w-lg"
      headerExtra={
        <button
          type="button"
          onClick={() => { onClose(); onEdit(cert) }}
          className="w-7 h-7 rounded-[2px] text-graphite-dim hover:text-ink-900 hover:bg-paper flex items-center justify-center cursor-pointer transition-colors"
          title="Edit certificate"
          aria-label="Edit certificate"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
      }
    >
      <div className="p-6 space-y-4">

        {/* Org + date */}
        {(cert.org || cert.issueDate || cert.date) && (
          <p className="text-[13px] text-graphite-dim leading-relaxed">
            {[cert.org, cert.issueDate || cert.date].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Certificate image */}
        {hasPhoto && (
          <div
            className="rounded-[2px] border border-paper-line overflow-hidden bg-paper cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(cert.photo || cert.proofUrl, '_blank')}
            title="Click to open full image"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.open(cert.photo || cert.proofUrl, '_blank') }}
          >
            <img
              src={cert.photo || cert.proofUrl}
              alt={cert.title}
              className="w-full max-h-72 object-contain"
            />
          </div>
        )}

        {/* Certificate link */}
        {hasLink && (
          <a
            href={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-signal hover:underline"
          >
            <svg className="w-3.5 h-3.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            View credential ↗
          </a>
        )}

        {/* If neither */}
        {!hasLink && !hasPhoto && (
          <p className="text-[13px] text-graphite-dim italic">No link or image attached.</p>
        )}


      </div>
    </Modal>
  )
}
