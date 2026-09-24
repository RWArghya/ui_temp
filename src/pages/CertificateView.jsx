/**
 * CertificateView — /profile/certificate/:certId
 *
 * Displays a formatted H2S certificate for a single earned initiative.
 * Data is passed via router location.state to avoid extra API calls.
 * Chrome comes from the shared PageToolbar / SaveMenu, so this page and the
 * resume have one toolbar between them; back returns to wherever the user
 * came from (Certificates tab or AllCertificates).
 */

import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { MOCK_USER_INITIATIVES } from '../api/mock/initiatives.js'
import '../dashboard/proto.css'
import PageToolbar from '../components/profile/PageToolbar.jsx'
import SaveMenu from '../components/profile/SaveMenu.jsx'
import EmptyState from '../components/profile/EmptyState.jsx'
import Icon from '../dashboard/Icon.jsx'

export default function CertificateView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { certId } = useParams()

  // Data passed from the parent via navigate state, with fallback for direct links / page refresh
  const { cert, userName, returnTo } = location.state || {}
  const activeCert = cert || (MOCK_USER_INITIATIVES.completed || []).find(
    c => c.id === certId || String(c.id).replace('init-', '') === certId
  ) || (certId ? {
    id: certId,
    name: 'Hack2skill Certificate of Completion',
    org: 'Hack2skill',
    completedDate: 'Upon Completion',
    verifiableId: certId,
  } : null)
  const activeUserName = userName || 'Aarav Sharma'

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo.path, { state: returnTo.state })
    } else {
      navigate(-1)
    }
  }

  const handleSavePdf = () => {
    window.print()
  }

  const handleSaveJpeg = () => {
    if (!activeCert) return
    // Render certificate to high-res 2x canvas and download as JPEG
    const canvas = document.createElement('canvas')
    const scale = 2
    const width = 1200
    const height = 820
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Top accent stripe gradient (#1a237e via #3949ab to #e91e63)
    const topGrad = ctx.createLinearGradient(0, 0, width, 0)
    topGrad.addColorStop(0, '#1a237e')
    topGrad.addColorStop(0.5, '#3949ab')
    topGrad.addColorStop(1, '#e91e63')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, width, 10)

    // Bottom accent stripe gradient (#e91e63 via #3949ab to #1a237e)
    const bottomGrad = ctx.createLinearGradient(0, 0, width, 0)
    bottomGrad.addColorStop(0, '#e91e63')
    bottomGrad.addColorStop(0.5, '#3949ab')
    bottomGrad.addColorStop(1, '#1a237e')
    ctx.fillStyle = bottomGrad
    ctx.fillRect(0, height - 8, width, 8)

    // Corner Ornaments
    ctx.strokeStyle = 'rgba(57, 73, 171, 0.35)'
    ctx.lineWidth = 2
    // Top-left
    ctx.beginPath()
    ctx.moveTo(40, 70)
    ctx.lineTo(40, 40)
    ctx.lineTo(70, 40)
    ctx.stroke()
    // Top-right
    ctx.beginPath()
    ctx.moveTo(width - 70, 40)
    ctx.lineTo(width - 40, 40)
    ctx.lineTo(width - 40, 70)
    ctx.stroke()
    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(40, height - 70)
    ctx.lineTo(40, height - 40)
    ctx.lineTo(70, height - 40)
    ctx.stroke()
    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(width - 70, height - 40)
    ctx.lineTo(width - 40, height - 40)
    ctx.lineTo(width - 40, height - 70)
    ctx.stroke()

    // Header: Brand
    ctx.fillStyle = '#1a237e'
    ctx.font = '900 28px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Hack2skill', width / 2, 70)

    ctx.fillStyle = '#3949ab'
    ctx.font = '600 13px Inter, sans-serif'
    ctx.fillText('INNOVATION · LEARNING · ACHIEVEMENT', width / 2, 95)

    // Title: Certificate of Completion
    ctx.fillStyle = '#1a237e'
    ctx.font = 'bold 38px Georgia, serif'
    ctx.fillText('Certificate of Completion', width / 2, 170)

    // Accent line under title
    const lineGrad = ctx.createLinearGradient(width / 2 - 80, 0, width / 2 + 80, 0)
    lineGrad.addColorStop(0, 'transparent')
    lineGrad.addColorStop(0.5, 'rgba(57, 73, 171, 0.5)')
    lineGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width / 2 - 80, 185)
    ctx.lineTo(width / 2 + 80, 185)
    ctx.stroke()

    // "This is to certify that"
    ctx.fillStyle = '#6b7280'
    ctx.font = 'italic 16px Georgia, serif'
    ctx.fillText('This is to certify that', width / 2, 240)

    // Participant Name
    ctx.fillStyle = '#1a237e'
    ctx.font = 'bold 40px Georgia, serif'
    ctx.fillText(activeUserName || 'Participant', width / 2, 305)

    // "has successfully completed"
    ctx.fillStyle = '#6b7280'
    ctx.font = 'italic 16px Georgia, serif'
    ctx.fillText('has successfully completed', width / 2, 365)

    // Certificate Name
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 26px Georgia, serif'
    ctx.fillText(activeCert.name || 'Initiative Completion', width / 2, 420)

    // Organiser
    ctx.fillStyle = '#4b5563'
    ctx.font = '16px Inter, sans-serif'
    ctx.fillText(`Organised by ${activeCert.org || 'Hack2skill'}`, width / 2, 460)

    // Divider line above footer
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(80, 560)
    ctx.lineTo(width - 80, 560)
    ctx.stroke()

    // Footer columns:
    // Left: Date Issued
    ctx.textAlign = 'left'
    ctx.fillStyle = '#9ca3af'
    ctx.font = '600 12px Inter, sans-serif'
    ctx.fillText('DATE ISSUED', 90, 605)
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 18px Georgia, serif'
    ctx.fillText(activeCert.completedDate || 'Upon Completion', 90, 635)

    // Center: Verified Badge / Seal
    ctx.textAlign = 'center'
    const sealGrad = ctx.createLinearGradient(width / 2 - 32, 590, width / 2 + 32, 654)
    sealGrad.addColorStop(0, '#1a237e')
    sealGrad.addColorStop(1, '#3949ab')
    ctx.fillStyle = sealGrad
    ctx.beginPath()
    ctx.arc(width / 2, 622, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(width / 2 - 13, 622)
    ctx.lineTo(width / 2 - 4, 631)
    ctx.lineTo(width / 2 + 13, 612)
    ctx.stroke()
    ctx.fillStyle = '#9ca3af'
    ctx.font = '600 11px Inter, sans-serif'
    ctx.fillText('VERIFIED', width / 2, 675)

    // Right: Credential ID
    ctx.textAlign = 'right'
    ctx.fillStyle = '#9ca3af'
    ctx.font = '600 12px Inter, sans-serif'
    ctx.fillText('CREDENTIAL ID', width - 90, 605)
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px "Courier New", monospace'
    ctx.fillText(activeCert.verifiableId || '', width - 90, 635)

    // Export to JPEG download
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    const link = document.createElement('a')
    link.download = `${activeCert.verifiableId || 'certificate'}.jpeg`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!activeCert) {
    return (
      <div className="doc-root min-h-screen bg-paper flex items-center justify-center p-8">
        <EmptyState
          icon="AlertTriangle"
          tone="amber"
          title="Certificate not found"
          message="We couldn't load this certificate. Go back to your profile and open it again."
          action={{ label: 'Back to profile', onClick: () => navigate('/profile') }}
        />
      </div>
    )
  }

  return (
    <div className="doc-root min-h-screen bg-paper pb-16">
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
      <PageToolbar
        onBack={handleBack}
        backLabel="Certificates"
        title={activeCert.name}
        maxWidth="max-w-[900px]"
      >
        <SaveMenu
          items={[
            { icon: 'FileText', label: 'PDF', hint: 'Print or save as PDF', onSelect: handleSavePdf },
            { icon: 'LayoutGrid', label: 'Image (JPEG)', hint: 'High-resolution .jpeg', onSelect: handleSaveJpeg },
          ]}
        />
      </PageToolbar>

      {/* ── Certificate Sheet ── */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8">
        <div
          className="cert-sheet doc-sheet bg-white shadow-2xl rounded-[4px] overflow-hidden"
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
                {activeUserName || 'Participant'}
              </p>

              <p className="text-[14px] text-gray-500 italic tracking-wide">has successfully completed</p>

              <p className="text-[18px] sm:text-[22px] font-bold text-ink-900 max-w-lg mx-auto leading-tight px-4">
                {activeCert.name}
              </p>

              <p className="text-[13.5px] text-gray-600">
                Organised by{' '}
                <span className="font-semibold text-ink-900">{activeCert.org}</span>
              </p>
            </div>

            {/* Date and ID row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-8 pt-6 border-t border-gray-200">
              {/* Issue date */}
              <div className="text-center sm:text-left">
                <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1 font-sans">Date Issued</p>
                <p className="text-[15px] font-semibold text-ink-900">{activeCert.completedDate || 'Upon Completion'}</p>
              </div>

              {/* Centre seal / badge */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a237e] to-[#3949ab] flex items-center justify-center shadow-md text-white">
                  <Icon name="Check" size={30} />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1.5 font-sans">Verified</p>
              </div>

              {/* Verifiable ID */}
              <div className="text-center sm:text-right">
                <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1 font-sans">Credential ID</p>
                <p className="text-[13px] font-mono font-semibold text-ink-900">{activeCert.verifiableId}</p>
              </div>
            </div>
          </div>

          {/* Bottom accent stripe */}
          <div className="h-2 bg-gradient-to-r from-[#e91e63] via-[#3949ab] to-[#1a237e]" />
        </div>
      </div>
    </div>
  )
}
