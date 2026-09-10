/**
 * CertificateView — /profile/certificate/:certId
 *
 * Displays a formatted H2S certificate for a single earned initiative.
 * Data is passed via router location.state to avoid extra API calls.
 * Includes a "Save as PDF / Image" button (window.print) and a ← back button
 * that returns to wherever the user came from (Certificates tab or AllCertificates).
 */

import { useNavigate, useLocation, useParams } from 'react-router-dom'

export default function CertificateView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { certId } = useParams()

  // Data passed from the parent via navigate state
  const { cert, userName, returnTo } = location.state || {}

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo.path, { state: returnTo.state })
    } else {
      navigate(-1)
    }
  }

  const handleSave = () => {
    window.print()
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#f4f4f6] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-[18px] font-display font-bold text-ink-900 mb-2">Certificate not found</h2>
          <p className="text-[13px] text-graphite-dim mb-5">
            We couldn't load the certificate data. Please go back and try again.
          </p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-4 py-2 text-[13px] font-semibold bg-signal text-white rounded-[2px] cursor-pointer"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e8eaed] pb-16">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .cert-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          @page { size: landscape; margin: 1cm; }
        }
      `}</style>

      {/* ── Toolbar (hidden on print) ── */}
      <div className="no-print sticky top-0 z-30 bg-white border-b border-paper-line shadow-sm px-4 py-3">
        <div className="max-w-[900px] mx-auto flex items-center justify-between flex-wrap gap-3">
          <button
            id="btn-back-from-cert"
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-graphite-dim border border-paper-line rounded-[2px] bg-white hover:bg-paper transition-colors cursor-pointer"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-graphite-dim hidden sm:inline">
              Verifiable ID: <span className="font-mono text-ink-900">{cert.verifiableId}</span>
            </span>
            <button
              id="btn-save-certificate"
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold bg-signal text-white rounded-[2px] hover:bg-signal-dark transition-colors cursor-pointer shadow-sm"
            >
              💾 Save / Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Certificate Sheet ── */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8">
        <div
          className="cert-sheet bg-white shadow-2xl rounded-[4px] overflow-hidden"
          style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
        >
          {/* Top accent stripe */}
          <div className="h-2.5 bg-gradient-to-r from-[#1a237e] via-[#3949ab] to-[#e91e63]" />

          <div className="px-14 py-12 relative">
            {/* Corner ornaments */}
            <div className="absolute top-5 left-5 w-10 h-10 border-t-2 border-l-2 border-[#3949ab]/30 rounded-tl-sm" />
            <div className="absolute top-5 right-5 w-10 h-10 border-t-2 border-r-2 border-[#3949ab]/30 rounded-tr-sm" />
            <div className="absolute bottom-5 left-5 w-10 h-10 border-b-2 border-l-2 border-[#3949ab]/30 rounded-bl-sm" />
            <div className="absolute bottom-5 right-5 w-10 h-10 border-b-2 border-r-2 border-[#3949ab]/30 rounded-br-sm" />

            {/* Header: Logo / Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-1">
                <span className="text-[22px] font-black tracking-tight text-[#1a237e]">Hack2skill</span>
              </div>
              <p className="text-[11.5px] tracking-[0.22em] uppercase text-[#3949ab] font-sans font-semibold">
                Innovation · Learning · Achievement
              </p>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1
                className="text-[30px] sm:text-[36px] font-bold text-[#1a237e] tracking-wide mb-1"
                style={{ letterSpacing: '0.04em' }}
              >
                Certificate of Completion
              </h1>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#3949ab]/50 to-transparent mx-auto" />
            </div>

            {/* Body text */}
            <div className="text-center space-y-2 mb-8">
              <p className="text-[14px] text-gray-500 italic tracking-wide">This is to certify that</p>

              <p
                className="text-[32px] sm:text-[38px] font-bold text-[#1a237e]"
                style={{ fontFamily: '"Georgia", serif', letterSpacing: '0.01em' }}
              >
                {userName || 'Participant'}
              </p>

              <p className="text-[14px] text-gray-500 italic tracking-wide">has successfully completed</p>

              <p className="text-[18px] sm:text-[22px] font-bold text-ink-900 max-w-lg mx-auto leading-tight px-4">
                {cert.name}
              </p>

              <p className="text-[13.5px] text-gray-600">
                Organised by{' '}
                <span className="font-semibold text-ink-900">{cert.org}</span>
              </p>
            </div>

            {/* Date and ID row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-8 pt-6 border-t border-gray-200">
              {/* Issue date */}
              <div className="text-center sm:text-left">
                <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1 font-sans">Date Issued</p>
                <p className="text-[15px] font-semibold text-ink-900">{cert.completedDate || 'Upon Completion'}</p>
              </div>

              {/* Centre seal / badge */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a237e] to-[#3949ab] flex items-center justify-center shadow-md">
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1.5 font-sans">Verified</p>
              </div>

              {/* Verifiable ID */}
              <div className="text-center sm:text-right">
                <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1 font-sans">Credential ID</p>
                <p className="text-[13px] font-mono font-semibold text-ink-900">{cert.verifiableId}</p>
              </div>
            </div>
          </div>

          {/* Bottom accent stripe */}
          <div className="h-2 bg-gradient-to-r from-[#e91e63] via-[#3949ab] to-[#1a237e]" />
        </div>

        {/* Below-cert instructions (hidden on print) */}
        <p className="no-print text-center text-[12px] text-gray-500 mt-4">
          Click <strong>Save / Download PDF</strong> to open the print dialog — choose "Save as PDF" to download this certificate.
        </p>
      </div>
    </div>
  )
}
