/**
 * ProfilePreview — /profile/preview
 *
 * Public preview sub-page showing exactly what a public visitor sees
 * when visiting the user's share URL.
 * Honors `isPublic` (Facebook-style profile lock):
 *  - When isPublic === false: shows locked state card (banner, avatar, name, locked notice)
 *  - When isPublic === true: shows only public/shared content (projects, certs, achievements with shared: true)
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'

/* ---- TEAMMATE BOUNDARY: Profile Preview Components ---- */
import Avatar from '../components/profile/Avatar.jsx'
import CoverBand from '../components/profile/CoverBand.jsx'
import SectionCard from '../components/profile/SectionCard.jsx'
import Pill from '../components/profile/Pill.jsx'
import KVRow from '../components/profile/KVRow.jsx'
import Modal from '../components/profile/Modal.jsx'
/* ---- TEAMMATE BOUNDARY END ---- */

export default function ProfilePreview() {
  const navigate = useNavigate()
  const location = useLocation()

  // Use state passed from Profile page if available, else load from hook
  const { profile: fetchedProfile, initiatives } = useProfile()
  const profile = location.state?.profile || fetchedProfile
  const avatar = location.state?.avatar ?? profile?.avatar ?? null

  const [copied, setCopied] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState(null)

  if (!profile) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-graphite-dim">Loading public profile preview...</p>
        </div>
      </div>
    )
  }

  const isLocked = !profile.isPublic
  const shareUrl = window.location.origin + `/profile/preview`

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filter public items
  const publicProjects = (profile.projects || []).filter(p => p.shared)
  const publicAchievements = (profile.achievements || []).filter(a => a.shared)
  const publicSelfCerts = (profile.selfCerts || []).filter(c => c.shared)
  const publicPubs = (profile.publications || []).filter(p => p.shared)
  const publicLinks = (profile.connectedProfiles || []).filter(l => l.shared !== false)
  const verifiedCerts = initiatives?.completed || []

  return (
    <div className="min-h-screen bg-paper text-ink-900 pb-16">
      {/* Top sticky banner for owner navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-paper-line px-4 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-[780px] mx-auto flex items-center justify-between flex-wrap gap-2 text-[12.5px]">
          <div className="flex items-center gap-2">
            <button
              id="btn-back-to-profile"
              type="button"
              onClick={() => navigate('/profile', { state: { profile, avatar, initiatives } })}
              className="inline-flex items-center gap-1.5 font-semibold text-signal hover:underline cursor-pointer"
            >
              ← Back to profile editor
            </button>
            <span className="text-graphite-dim">|</span>
            <span className="text-graphite-dim">
              Previewing visitor view ({profile.isPublic ? '🌐 Public Mode' : '🔒 Locked / Private Mode'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-preview-link"
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 text-[11.5px] font-medium border border-paper-line rounded-[2px] bg-white hover:border-signal cursor-pointer"
            >
              {copied ? '✓ Copied URL' : 'Copy link'}
            </button>
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 pt-5">
        <div className={`p-3.5 rounded-[3px] border text-[12.5px] mb-5 flex items-start gap-3 ${
          isLocked
            ? 'bg-[#fff9e6] border-[#ffe082] text-[#7c5e10]'
            : 'bg-[#e8f4fd] border-[#b6dcfb] text-[#135a96]'
        }`}>
          <span className="text-base leading-none">{isLocked ? '🔒' : '👁️'}</span>
          <div>
            <strong>{isLocked ? 'Profile is currently Private (Locked)' : 'Public Profile Active'}</strong>
            <p className="mt-0.5 opacity-90 text-[12px]">
              {isLocked
                ? 'External visitors can only see your name and profile avatar. Turn "Public" ON in your profile to share your verified skills, projects, and achievements.'
                : 'Visitors will see only your public achievements, verified certifications, skills, and projects marked with the "shared" toggle.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Public Profile Container */}
      <main className="max-w-[780px] mx-auto px-4 sm:px-6 space-y-4">
        {/* Profile Header Card */}
        <div className="bg-white border border-paper-line rounded-card overflow-hidden shadow-card">
          <CoverBand src={profile.cover || null} />

          <div className="px-5 pb-6" style={{ marginTop: '-38px' }}>
            <div className="flex items-end justify-between gap-3">
              <Avatar
                src={avatar}
                name={profile.name}
                size="xl"
              />
              <div className="pb-1">
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#fff0f0] border border-[#f5c6cb] text-[#a94442] text-[11.5px] font-semibold">
                    🔒 Locked Profile
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#e7f6ee] border border-[#a3e0bf] text-[#0f9d58] text-[11.5px] font-semibold">
                    🌐 Verified Public
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3">
              <h1 className="text-[22px] font-display font-bold text-ink-900 leading-tight">
                {profile.name || 'Member'}
              </h1>
              <p className="text-[13.5px] text-graphite-dim mt-0.5">
                {profile.headline || 'Hack2skill Community Member'}
                {profile.org ? <> · {profile.org}</> : null}
              </p>
              {!isLocked && profile.region && (
                <p className="text-[12px] text-graphite-dim mt-1">📍 {profile.region}</p>
              )}
            </div>
          </div>
        </div>

        {/* If Locked, Show Facebook-style locked notice and stop */}
        {isLocked ? (
          <SectionCard>
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-paper rounded-full flex items-center justify-center text-2xl mx-auto border border-paper-line">
                🔒
              </div>
              <h2 className="text-[17px] font-display font-bold text-ink-900">
                {profile.name}&apos;s profile is private
              </h2>
              <p className="text-[13px] text-graphite-dim max-w-md mx-auto leading-relaxed">
                Only basic public information is shared. Full journey timeline, project portfolios, credentials, and achievements are kept private by this member.
              </p>
            </div>
          </SectionCard>
        ) : (
          /* When Public, Show visitor view sections */
          <>
            {/* About */}
            {profile.about && (
              <SectionCard title="About">
                <p className="mt-3 text-[13.5px] text-ink-900 leading-relaxed whitespace-pre-wrap">
                  {profile.about}
                </p>
              </SectionCard>
            )}

            {/* Skills & Domains */}
            {((profile.skills && profile.skills.length > 0) || (profile.domains && profile.domains.length > 0)) && (
              <SectionCard title="Skills & Domains">
                <div className="mt-3 space-y-3">
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-mono uppercase text-graphite-dim font-medium tracking-wider">
                        Core Competencies
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {profile.skills.map(s => (
                          <Pill key={s} variant="default">{s}</Pill>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.domains && profile.domains.length > 0 && (
                    <div className="pt-2 border-t border-paper-line">
                      <span className="text-[11px] font-mono uppercase text-graphite-dim font-medium tracking-wider">
                        Industry Domains
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {profile.domains.map(d => (
                          <Pill key={d} variant="hat">{d}</Pill>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Verified Certifications */}
            {verifiedCerts.length > 0 && (
              <SectionCard title="Verified Hack2skill Credentials">
                <div className="mt-3 space-y-2.5">
                  {verifiedCerts.map(c => (
                    <div
                      key={c.id}
                      className="p-3 rounded-[2px] border border-paper-line bg-paper flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13.5px] font-semibold text-ink-900">{c.title}</h3>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px]">
                            ✓ Verified
                          </span>
                        </div>
                        <p className="text-[11.5px] text-graphite-dim mt-0.5">{c.issuer} · Issued {c.completedDate}</p>
                      </div>
                      <span className="text-xl">🏆</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Public Projects */}
            {publicProjects.length > 0 && (
              <SectionCard title="Featured Projects">
                <div className="mt-3 space-y-3">
                  {publicProjects.map(p => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-[2px] border border-paper-line bg-paper"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className="text-[13.5px] font-bold text-ink-900 leading-snug">{p.title}</h3>
                        <div className="flex items-center gap-3 text-[12px]">
                          {(p.sourceLink || p.link) && (
                            <a
                              href={(p.sourceLink || p.link).startsWith('http') ? (p.sourceLink || p.link) : `https://${p.sourceLink || p.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-signal hover:underline inline-flex items-center gap-0.5 font-medium"
                            >
                              <span>Source ↗</span>
                            </a>
                          )}
                          {p.liveLink && (
                            <a
                              href={p.liveLink.startsWith('http') ? p.liveLink : `https://${p.liveLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-signal hover:underline inline-flex items-center gap-0.5 font-medium"
                            >
                              <span>Live demo ↗</span>
                            </a>
                          )}
                          {p.docsLink && (
                            <a
                              href={p.docsLink.startsWith('http') ? p.docsLink : `https://${p.docsLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-signal hover:underline inline-flex items-center gap-0.5 font-medium"
                            >
                              <span>Docs ↗</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {p.description && (
                        <p className="text-[12.5px] text-graphite-dim mt-1.5 leading-relaxed">
                          {p.description}
                        </p>
                      )}

                      {p.techStack && p.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {p.techStack.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-[11px] bg-white border border-paper-line rounded-[2px] text-ink-900 font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Public Publications */}
            {publicPubs.length > 0 && (
              <SectionCard title="Publications & Research">
                <div className="mt-3 divide-y divide-paper-line">
                  {publicPubs.map(pub => (
                    <div key={pub.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-ink-900">{pub.title}</span>
                        {pub.link && (
                          <a
                            href={pub.link.startsWith('http') ? pub.link : `https://${pub.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11.5px] text-signal hover:underline whitespace-nowrap font-medium"
                          >
                            Paper ↗
                          </a>
                        )}
                      </div>
                      {pub.description && (
                        <p className="text-[12px] text-graphite-dim mt-1 leading-relaxed">
                          {pub.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Public Achievements & Self-added certs */}
            {(publicAchievements.length > 0 || publicSelfCerts.length > 0) && (
              <SectionCard title="Honors & External Certifications">
                <div className="mt-3 divide-y divide-paper-line">
                  {publicAchievements.map(a => (
                    <div key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">🏅</span>
                        <span className="text-[13px] font-bold text-ink-900">{a.title}</span>
                      </div>
                      {a.description && (
                        <p className="text-[12px] text-graphite-dim mt-1 pl-6 leading-relaxed">
                          {a.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {publicSelfCerts.map(sc => (
                    <div key={sc.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px]">📜</span>
                          <span className="text-[13px] font-bold text-ink-900">{sc.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11.5px]">
                          {sc.link && (
                            <a
                              href={sc.link.startsWith('http') ? sc.link : `https://${sc.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-signal hover:underline whitespace-nowrap font-medium"
                            >
                              Verify ↗
                            </a>
                          )}
                          {(sc.photo || sc.proofUrl) && (
                            <button
                              type="button"
                              onClick={() => setViewingPhoto({ title: sc.title, url: sc.photo || sc.proofUrl })}
                              className="text-signal hover:underline whitespace-nowrap font-medium cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>View certificate ↗</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {(sc.org || sc.issueDate) && (
                        <p className="text-[12px] text-graphite-dim mt-0.5 pl-6 leading-relaxed">
                          {[sc.org, sc.issueDate].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {(sc.photo || sc.proofUrl) && (
                        <button
                          type="button"
                          onClick={() => setViewingPhoto({ title: sc.title, url: sc.photo || sc.proofUrl })}
                          className="mt-2 ml-6 block rounded-[2px] border border-paper-line overflow-hidden w-20 h-14 bg-paper hover:opacity-90 cursor-pointer"
                          title="Click to view certificate photo"
                        >
                          <img
                            src={sc.photo || sc.proofUrl}
                            alt={sc.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <SectionCard title="Education">
                <div className="mt-3 space-y-3">
                  {[...profile.education]
                    .sort((a, b) => {
                      if (a.isOngoing && !b.isOngoing) return -1
                      if (!a.isOngoing && b.isOngoing) return 1
                      const yearA = parseInt(a.endYear || a.startYear || 0, 10)
                      const yearB = parseInt(b.endYear || b.startYear || 0, 10)
                      return yearB - yearA
                    })
                    .map(edu => {
                      const degreeText = [edu.degree || edu.title, edu.specialization].filter(Boolean).join(' · ')
                      const instText = [edu.institution || edu.org, edu.boardOrUniversity].filter(Boolean).join(' · ')
                      const timeText = [
                        edu.startYear && edu.endYear ? `${edu.startYear} – ${edu.endYear}` : (edu.endYear || edu.startYear || ''),
                        edu.location,
                      ].filter(Boolean).join(' · ')

                      return (
                        <div key={edu.id} className="py-2 border-b border-paper-line last:border-0">
                          <div className="font-semibold text-[13.5px] text-ink-900">{degreeText}</div>
                          {instText && <div className="text-[12.5px] text-ink-900 mt-0.5">{instText}</div>}
                          {timeText && <div className="text-[11.5px] text-graphite-dim mt-0.5">{timeText}</div>}
                        </div>
                      )
                    })}
                </div>
              </SectionCard>
            )}

            {/* Connected Profiles / Links */}
            {(publicLinks.length > 0 || profile.links) && (
              <SectionCard title="Connected Profiles">
                <div className="mt-3 divide-y divide-paper-line">
                  {publicLinks.length > 0 ? (
                    publicLinks.map(item => (
                      <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <span className="font-semibold text-[13px] text-ink-900">{item.platform}</span>
                        <a
                          href={item.url?.startsWith('http') ? item.url : `https://${item.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12.5px] text-signal hover:underline inline-flex items-center gap-1 truncate max-w-[240px] sm:max-w-xs"
                        >
                          <span className="truncate">{item.url?.replace(/^https?:\/\//i, '')}</span>
                          <span className="text-[12px]">↗</span>
                        </a>
                      </div>
                    ))
                  ) : (
                    <KVRow
                      label="Online Profile"
                      value={
                        <a
                          href={profile.links.startsWith('http') ? profile.links : `https://${profile.links}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-signal hover:underline inline-flex items-center gap-1"
                        >
                          {profile.links}
                          <span className="text-[12px]">↗</span>
                        </a>
                      }
                      last
                    />
                  )}
                </div>
              </SectionCard>
            )}
          </>
        )}
      </main>

      {/* Certificate Photo Viewer Modal for public preview */}
      {viewingPhoto && (
        <Modal
          isOpen={!!viewingPhoto}
          title={viewingPhoto.title || 'Certificate document'}
          subtitle="Certificate image or credential scan."
          onClose={() => setViewingPhoto(null)}
          maxWidth="max-w-2xl"
        >
          <div className="p-4 sm:p-6 flex flex-col items-center">
            <div className="w-full bg-paper border border-paper-line rounded-[2px] p-2 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={viewingPhoto.url}
                alt={viewingPhoto.title}
                className="max-w-full max-h-[66vh] object-contain rounded-[2px]"
              />
            </div>
            <div className="mt-4 flex items-center justify-end w-full pt-3 border-t border-paper-line">
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                className="px-5 py-1.5 text-[13px] font-semibold text-white bg-signal hover:bg-signal-dark rounded-[2px] cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
