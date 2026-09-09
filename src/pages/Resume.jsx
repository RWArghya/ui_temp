/**
 * Resume — /profile/resume
 *
 * Overleaf / LaTeX-styled printable resume template generated from
 * the user's profile data (education, projects, certs, skills, contributions).
 * Includes:
 *  - Overleaf academic template aesthetic (Computer Modern / Latin Modern serif styling, clean section rules)
 *  - Top utility toolbar with "← Back to Profile" and "🖨️ Print / Save PDF" buttons
 *  - Print-optimized CSS (@media print) for clean, multi-page paper output
 */

import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'

export default function Resume() {
  const navigate = useNavigate()
  const location = useLocation()
  const resumeRef = useRef(null)

  // Use passed state if available, else fetch via hook
  const { profile: fetchedProfile, initiatives } = useProfile()
  const profile = location.state?.profile || fetchedProfile
  const inits = location.state?.initiatives || initiatives

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#525659] flex items-center justify-center p-8 text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-gray-300">Compiling Overleaf Resume Template...</p>
        </div>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  // Derive roles/headline
  const primaryRole = profile.roles?.find(r => r.primary)?.label || 'Learner & Developer'
  const verifiedCerts = inits?.completed || []

  return (
    <div className="min-h-screen bg-[#525659] text-[#111] font-serif antialiased pb-20">
      {/* ── Print Media Style Tag ── */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .resume-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            border: none !important;
          }
          @page {
            margin: 1.5cm;
            size: letter;
          }
        }
      `}</style>

      {/* ── Top Floating Toolbar (Hidden when printing) ── */}
      <div className="no-print sticky top-0 z-40 bg-[#323639] border-b border-[#212529] px-4 py-3 shadow-md text-white">
        <div className="max-w-[850px] mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-from-resume"
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-sans font-medium rounded-[3px] bg-[#424649] hover:bg-[#4f5357] text-gray-100 transition-colors cursor-pointer"
            >
              ← Back to Profile
            </button>
            <span className="text-[12px] font-sans text-gray-400 hidden sm:inline">
              Overleaf LaTeX CV Template · Generated from Live Profile
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-print-resume"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-sans font-semibold rounded-[3px] bg-signal hover:bg-signal-dark text-white transition-colors shadow-sm cursor-pointer"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Document Container ── */}
      <div className="max-w-[850px] mx-auto px-2 sm:px-4 pt-6">
        {/* Paper Sheet (Letter format look) */}
        <div
          ref={resumeRef}
          className="resume-sheet bg-white mx-auto shadow-2xl p-8 sm:p-14 border border-gray-200 min-h-[1050px]"
          style={{ fontFamily: '"Computer Modern", "Latin Modern Roman", "Times New Roman", Times, serif' }}
        >
          {/* 1. Header */}
          <header className="text-center pb-3 mb-4">
            <h1 className="text-[28px] sm:text-[32px] font-normal tracking-wide text-black uppercase mb-1">
              {profile.name || 'Candidate Name'}
            </h1>
            <p className="text-[14px] italic text-gray-700 mb-2">
              {profile.headline || primaryRole}
              {profile.org ? ` — ${profile.org}` : ''}
            </p>

            {/* Contact details line */}
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[12px] sm:text-[13px] text-gray-800 border-t border-b border-gray-300 py-1.5 font-sans">
              {profile.email && (
                <span>
                  <a href={`mailto:${profile.email}`} className="text-blue-800 hover:underline">
                    {profile.email}
                  </a>
                </span>
              )}
              {profile.region && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{profile.region}</span>
                </>
              )}
              {profile.links && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>
                    <a
                      href={profile.links.startsWith('http') ? profile.links : `https://${profile.links}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-800 hover:underline"
                    >
                      {profile.links}
                    </a>
                  </span>
                </>
              )}
              {profile.contributions?.github && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>
                    <a
                      href={`https://github.com/${profile.contributions.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-800 hover:underline"
                    >
                      github.com/{profile.contributions.github}
                    </a>
                  </span>
                </>
              )}
            </div>
          </header>

          {/* 2. Education */}
          {profile.education && profile.education.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[15px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
                Education
              </h2>
              <div className="space-y-2">
                {profile.education.map(edu => (
                  <div key={edu.id} className="flex justify-between items-baseline text-[13px]">
                    <div>
                      <span className="font-bold text-black">{edu.org || 'Institution'}</span>
                      <div className="italic text-gray-800 text-[12.5px]">{edu.title}</div>
                    </div>
                    <span className="text-[12px] text-gray-600 italic">Expected / Completed</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Skills */}
          {((profile.skills && profile.skills.length > 0) || (profile.domains && profile.domains.length > 0)) && (
            <section className="mb-4">
              <h2 className="text-[15px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
                Technical Skills & Areas of Focus
              </h2>
              <div className="text-[12.5px] space-y-1">
                {profile.skills && profile.skills.length > 0 && (
                  <p>
                    <span className="font-bold">Core Technologies: </span>
                    {profile.skills.join(', ')}
                  </p>
                )}
                {profile.interests && profile.interests.length > 0 && (
                  <p>
                    <span className="font-bold">Interests & Specializations: </span>
                    {profile.interests.join(', ')}
                  </p>
                )}
                {profile.domains && profile.domains.length > 0 && (
                  <p>
                    <span className="font-bold">Industry Domains: </span>
                    {profile.domains.join(', ')}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* 4. Projects */}
          {profile.projects && profile.projects.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[15px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
                Featured Projects
              </h2>
              <div className="space-y-2.5">
                {profile.projects.map(proj => (
                  <div key={proj.id} className="text-[13px]">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-black">{proj.title}</span>
                      {proj.link && (
                        <a
                          href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11.5px] text-blue-800 hover:underline font-sans"
                        >
                          {proj.link}
                        </a>
                      )}
                    </div>
                    <ul className="list-disc list-inside text-[12px] text-gray-800 mt-0.5 space-y-0.5 pl-1">
                      <li>Designed and implemented full lifecycle architecture with responsive UI and production integrations.</li>
                      <li>Collaborated in community initiatives and verified code quality standards.</li>
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Publications & Research */}
          {profile.publications && profile.publications.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[15px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
                Publications & Preprints
              </h2>
              <div className="space-y-1.5 text-[12.5px]">
                {profile.publications.map(pub => (
                  <div key={pub.id} className="flex justify-between items-baseline">
                    <span className="italic">{pub.title}</span>
                    {pub.link && (
                      <a
                        href={pub.link.startsWith('http') ? pub.link : `https://${pub.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11.5px] text-blue-800 hover:underline font-sans ml-2"
                      >
                        [Paper Link]
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Certifications & Credentials */}
          {(verifiedCerts.length > 0 || (profile.selfCerts && profile.selfCerts.length > 0)) && (
            <section className="mb-4">
              <h2 className="text-[15px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
                Certifications & Verified Credentials
              </h2>
              <div className="space-y-1.5 text-[12.5px]">
                {verifiedCerts.map(cert => (
                  <div key={cert.id} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold">{cert.title}</span>
                      <span className="text-gray-600 text-[12px]"> — {cert.issuer} (Verified)</span>
                    </div>
                    <span className="text-[12px] text-gray-500 font-sans">{cert.completedDate}</span>
                  </div>
                ))}
                {profile.selfCerts?.map(sc => (
                  <div key={sc.id} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold">{sc.title}</span>
                      <span className="text-gray-600 text-[12px]"> — {sc.org}</span>
                    </div>
                    <span className="text-[12px] text-gray-500 font-sans">Credential</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Honors & Awards */}
          {profile.achievements && profile.achievements.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[15px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
                Honors & Achievements
              </h2>
              <ul className="list-disc list-inside text-[12.5px] text-gray-800 space-y-1">
                {profile.achievements.map(ach => (
                  <li key={ach.id}>
                    <span className="font-semibold text-black">{ach.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 8. Open Source & Community Engagement */}
          <section className="mb-2">
            <h2 className="text-[15px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
              Community & Continuous Learning
            </h2>
            <div className="text-[12.5px] text-gray-800 space-y-1">
              <p>
                <span className="font-bold">Platform Rank & XP: </span>
                Level {profile.level || 1} ({profile.xp || 0} XP earned through verified submissions and hackathons).
              </p>
              {profile.contributions?.github ? (
                <p>
                  <span className="font-bold">Open Source Contributions: </span>
                  Active open source contributor at github.com/{profile.contributions.github}.
                </p>
              ) : (
                <p>
                  <span className="font-bold">Repositories & Code: </span>
                  Portfolio and project source code available via {profile.links || 'GitHub'}.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
