/**
 * AllCertificates — /profile/certificates
 *
 * Full LinkedIn-style "All Certificates" page.
 * Shows:
 *  - H2S Verified (earned) — all certificates with verifiable ID badge
 *  - Pending — registered initiatives where cert hasn't been issued yet (greyed out)
 *  - Self-added (Other) — user-typed external certificates
 *
 * Has a back arrow → "All Certificates" heading like LinkedIn.
 * Navigated to from the Certificates tab via "Show all certificates" button.
 * State passed via router location.state to avoid a second API fetch.
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'

/* ---- TEAMMATE BOUNDARY: AllCertificates sub-components ---- */
import SectionCard from '../components/profile/SectionCard.jsx'
import Pill        from '../components/profile/Pill.jsx'
/* ---- TEAMMATE BOUNDARY END ---- */

// ── Single certificate row (earned, pending, or self-added)
function CertRow({ name, org, date, verifiableId, pending = false, selfAdded = false, onView }) {
  return (
    <div className={[
      'flex items-center gap-4 py-4 border-b border-paper-line last:border-0',
      pending ? 'opacity-60' : '',
    ].join(' ')}>
      {/* Icon */}
      <div className={[
        'w-11 h-11 flex-none rounded-[2px] grid place-items-center text-[20px] border',
        pending
          ? 'bg-paper border-paper-line text-graphite-dim'
          : selfAdded
            ? 'bg-[#f0f0f5] border-paper-line text-ink-900'
            : 'bg-[#e7f6ee] border-[#a3e0bf] text-[#0f9d58]',
      ].join(' ')}>
        {pending ? '⏳' : selfAdded ? '🎓' : '🏆'}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-semibold text-ink-900 leading-tight">{name}</p>
          {!pending && !selfAdded && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px] uppercase tracking-wide">
              ✓ Verified
            </span>
          )}
          {pending && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#fff8e7] text-[#b08000] rounded-[2px] uppercase tracking-wide">
              ⏳ Pending
            </span>
          )}
          {selfAdded && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-paper text-graphite-dim rounded-[2px] uppercase tracking-wide border border-paper-line">
              Self-added
            </span>
          )}
        </div>
        <p className="text-[12.5px] text-graphite-dim mt-0.5">{org}</p>
        {date && (
          <p className="text-[11.5px] text-graphite-dim mt-0.5">
            Issued {date}
            {verifiableId && (
              <span className="ml-2 font-mono text-[10.5px] text-graphite-dim">
                · ID: {verifiableId}
              </span>
            )}
          </p>
        )}
        {pending && (
          <p className="text-[11.5px] text-graphite-dim mt-0.5 italic">
            Certificate will be issued once this initiative closes
          </p>
        )}
      </div>

      {/* View button — earned certs only, not pending, not self-added */}
      {!pending && !selfAdded && onView && (
        <button
          type="button"
          onClick={onView}
          className={[
            'flex-none px-2.5 py-[5px] text-[12px] font-semibold',
            'border border-paper-line rounded-[2px] bg-white text-graphite-dim',
            'hover:border-signal hover:text-signal transition-colors cursor-pointer',
          ].join(' ')}
        >
          View
        </button>
      )}
    </div>
  )
}

export default function AllCertificates() {
  const navigate = useNavigate()
  const location = useLocation()

  // Prefer state passed from Profile page to avoid double-fetch
  const { profile: fetchedProfile, initiatives: fetchedInits } = useProfile()
  const profile = location.state?.profile || fetchedProfile
  const inits   = location.state?.initiatives || fetchedInits

  if (!profile || !inits) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-graphite-dim">Loading certificates...</p>
        </div>
      </div>
    )
  }

  const earned  = inits.completed ?? []
  const pending = inits.pending   ?? []
  const self    = profile.selfCerts ?? []

  const totalEarned  = earned.length
  const totalPending = pending.length

  return (
    <div className="min-h-screen bg-paper pb-16 text-ink-900">

      {/* ── LinkedIn-style header with back arrow ── */}
      <div className="bg-white border-b border-paper-line sticky top-0 z-30 shadow-sm">
        <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <button
            id="btn-back-to-certs"
            type="button"
            onClick={() => navigate('/profile', { state: { tab: 'certificates' } })}
            className="p-1.5 rounded-full hover:bg-paper transition-colors cursor-pointer flex-none"
            aria-label="Back to profile"
          >
            <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] font-display font-bold text-ink-900 leading-tight">All Certificates</h1>
            <p className="text-[11.5px] text-graphite-dim">
              {totalEarned} earned
              {totalPending > 0 && (
                <span className="ml-1.5 text-graphite-dim/60">· {totalPending} pending</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 pt-6 space-y-5">

        {/* H2S Verified (Earned) */}
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              H2S Verified Certificates
              <span className="text-[12px] font-normal text-graphite-dim">
                ({totalEarned} earned
                {totalPending > 0 && (
                  <span className="text-graphite-dim/60 ml-1">, {totalPending} pending</span>
                )}
                )
              </span>
            </span>
          }
        >
          {earned.length > 0 ? (
            <div className="mt-2">
              {earned.map(c => (
                <CertRow
                  key={c.id}
                  name={c.name}
                  org={c.org}
                  date={c.completedDate}
                  verifiableId={c.verifiableId}
                  onView={() => navigate(`/profile/certificate/${c.id}`, {
                    state: {
                      cert: c,
                      userName: profile?.name,
                      returnTo: { path: '/profile/certificates', state: { profile, initiatives: inits } },
                    },
                  })}
                />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-graphite-dim py-4">
              Nothing yet — certificates appear automatically when an initiative closes.
            </p>
          )}

          {/* Pending certs — shown under the same section, dimmed */}
          {pending.length > 0 && (
            <>
              <div className="pt-4 mt-2 border-t border-paper-line">
                <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-graphite-dim mb-1">
                  Pending ({pending.length})
                </p>
                <p className="text-[12px] text-graphite-dim mb-2">
                  These initiatives closed or are in review — your certificate will appear here once issued.
                </p>
              </div>
              {pending.map(c => (
                <CertRow
                  key={c.id}
                  name={c.name}
                  org={c.org}
                  pending
                />
              ))}
            </>
          )}
        </SectionCard>

        {/* Self-added (Other Certificates) */}
        {self.length > 0 && (
          <SectionCard title="Other Certificates (Self-added)">
            <p className="text-[12.5px] text-graphite-dim mt-1 mb-2">
              Added manually — unverified by Hack2skill. Shared items appear on your public profile.
            </p>
            <div>
              {self.map(c => (
                <CertRow
                  key={c.id}
                  name={c.title}
                  org={c.org}
                  selfAdded
                />
              ))}
            </div>
          </SectionCard>
        )}

        {earned.length === 0 && pending.length === 0 && self.length === 0 && (
          <SectionCard>
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">🏆</div>
              <p className="text-[14px] font-medium text-ink-900">No certificates yet</p>
              <p className="text-[13px] text-graphite-dim">
                Complete a Hack2skill initiative to earn your first verified certificate.
              </p>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
