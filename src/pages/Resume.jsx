/**
 * Resume — /profile/resume
 *
 * Professional LaTeX / Overleaf-styled resume builder and printable template.
 * Matches references/ipuf/resume_template.tex exact layout, colors, and structure.
 * Features:
 *  - Step 1: Interactive Resume Customizer (Section & Item reordering + include/exclude toggles)
 *  - Step 2: Professional Overleaf Resume Sheet (Left-aligned, #284696 heading colors, clean section rules)
 *  - Export LaTeX (.tex) button downloading standard, compilable LaTeX code
 *  - Print / Save as PDF (@media print optimized)
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'
import ResumeCustomizer from '../components/profile/ResumeCustomizer.jsx'
import { generateLatexResume, downloadLatexFile } from '../utils/latexGenerator.js'

export default function Resume() {
  const navigate = useNavigate()
  const location = useLocation()
  const resumeRef = useRef(null)

  // Use passed state if available, else fetch via hook
  // Use passed state if available, else fetch via hook
  const { profile: fetchedProfile, initiatives } = useProfile()
  const profile = location.state?.profile || fetchedProfile
  const inits = location.state?.initiatives || initiatives

  // Resume configuration state (uses passed config or default)
  const [config, setConfig] = useState(location.state?.config || {
    sectionOrder: ['skills', 'projects', 'education', 'certifications', 'achievements'],
    includedSections: {
      skills: true,
      projects: true,
      education: true,
      certifications: true,
      achievements: true,
    },
    customItems: {},
  })

  // View mode: default to 'preview'
  const [viewMode, setViewMode] = useState('preview')

  // Initialize customItems if not provided in location.state
  useEffect(() => {
    if (profile && (!config.customItems || Object.keys(config.customItems).length === 0)) {
      const allCerts = [
        ...(profile.selfCerts || []).map(c => ({ ...c, _included: true })),
        ...(inits?.completed || []).map(c => ({
          id: `init-${c.id}`,
          title: c.name,
          org: c.org || 'Hack2skill',
          date: c.issuedOn || '',
          verifiableId: c.verifiableId,
          credentialUrl: c.credentialUrl || c.link || '',
          _included: true,
        })),
      ]

      // Build ordered header link items from connectedProfiles
      const profileLinks = (profile.connectedProfiles || []).map(p => ({
        ...p,
        _included: true,
      }))

      setConfig(prev => ({
        ...prev,
        customItems: {
          skills: profile.skills || [],
          projects: (profile.projects || []).map(p => ({ ...p, _included: true })),
          education: (profile.education || []).map(e => ({ ...e, _included: true })),
          certifications: allCerts,
          achievements: (profile.achievements || []).map(a => ({ ...a, _included: true })),
          links: profileLinks,
        },
      }))
    }
  }, [profile, inits, config.customItems])

  if (!profile) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-graphite-dim">Loading profile and resume builder...</p>
        </div>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportLatex = () => {
    const texCode = generateLatexResume(config, profile)
    const sanitizedName = (profile.name || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')
    downloadLatexFile(`${sanitizedName}_Resume`, texCode)
  }

  // If in customize mode, show the nested configuration and reorder card screen
  if (viewMode === 'customize') {
    return (
      <div className="min-h-screen bg-paper pb-20">
        <ResumeCustomizer
          profile={profile}
          initiatives={inits}
          config={config}
          onChangeConfig={setConfig}
          onGenerate={() => setViewMode('preview')}
          onBack={() => navigate('/profile')}
        />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  //  COMPILED OVERLEAF LATEX RESUME SHEET VIEW
  // -------------------------------------------------------------------------
  const { sectionOrder, includedSections, customItems } = config

  // Build ordered header links: phone + email + location first, then profile links in customized order
  const headerLinks = []
  if (profile.phone) {
    headerLinks.push({ label: profile.phone, href: `tel:${profile.phone.replace(/[^0-9+]/g, '')}` })
  }
  if (profile.email) {
    headerLinks.push({ label: profile.email, href: `mailto:${profile.email}` })
  }
  if (profile.region) {
    headerLinks.push({ label: profile.region, href: null })
  }
  // Connected profiles in their customized order, filtered to included only
  const connectedProfiles = (customItems.links || profile.connectedProfiles || [])
  connectedProfiles
    .filter(p => p._included !== false)
    .forEach(p => {
      const url = (p.url || '').startsWith('http') ? p.url : `https://${p.url}`
      headerLinks.push({ label: p.platform, href: url })
    })

  return (
    <div className="min-h-screen bg-[#525659] text-[#111] antialiased pb-20">
      {/* ── Print & Font Style Tag ── */}
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/computer-modern');

        .latex-doc {
          font-family: 'Computer Modern Serif', 'Latin Modern Roman', 'CMU Serif', 'Times New Roman', serif;
          color: #000000;
          line-height: 1.32;
        }

        .latex-smallcaps {
          font-variant: small-caps;
          letter-spacing: 0.02em;
        }

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
            margin: 1.2cm;
            size: letter;
          }
        }
      `}</style>

      {/* ── Top Floating Toolbar (Hidden when printing) ── */}
      <div className="no-print sticky top-0 z-40 bg-[#323639] border-b border-[#212529] px-4 py-2.5 shadow-md text-white font-sans">
        <div className="max-w-[800px] mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <button
              id="btn-edit-structure"
              type="button"
              onClick={() => navigate('/profile', { state: { customizingResume: true, resumeConfig: config, profile, initiatives: inits } })}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-[3px] bg-[#424649] hover:bg-[#4f5357] text-gray-100 transition-colors cursor-pointer"
            >
              ← Edit / Reorder
            </button>
            <button
              id="btn-back-to-profile"
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-[3px] bg-[#424649] hover:bg-[#4f5357] text-gray-100 transition-colors cursor-pointer"
            >
              Profile
            </button>
            <span className="text-[11.5px] text-gray-400 hidden sm:inline ml-1">
              LaTeX Standard 11pt Template
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-export-latex"
              type="button"
              onClick={handleExportLatex}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-[3px] bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors shadow-sm cursor-pointer"
              title="Download compilable .tex file"
            >
              📥 Export LaTeX (.tex)
            </button>
            <button
              id="btn-print-resume"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold rounded-[3px] bg-signal hover:bg-signal-dark text-white transition-colors shadow-sm cursor-pointer"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Printable Paper Sheet Container ── */}
      <div className="max-w-[800px] mx-auto px-2 sm:px-4 pt-5">
        <div
          ref={resumeRef}
          className="resume-sheet latex-doc bg-white mx-auto shadow-xl px-8 py-7 sm:px-10 sm:py-9 border border-gray-300 min-h-[1050px]"
        >
          {/* 1. Header — LaTeX \Huge \scshape candidate name, left-aligned, pure text hyperlinks */}
          <header className="mb-2">
            <h1 className="latex-smallcaps text-[19px] font-medium text-[#284696] leading-none mb-1" style={{ fontWeight: 500 }}>
              {profile.name || 'Candidate Name'}
            </h1>

            {/* Contact details line — LaTeX \footnotesize, accent/link color, pure text hyperlinks */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[10.5px] text-[#222] leading-tight">
              {headerLinks.map((link, idx) => (
                <span key={idx} className="inline-flex items-center">
                  {idx > 0 && <span className="text-[#999] mr-2">•</span>}
                  {link.href ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#007acc] underline hover:text-[#284696] transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <span>{link.label}</span>
                  )}
                </span>
              ))}
            </div>
          </header>

          {/* 2. Render Sections based on customized order and inclusion */}
          <div className="space-y-2.5">
            {sectionOrder.map((secKey) => {
              if (!includedSections[secKey]) return null

              // ── TECHNICAL SKILLS ──
              if (secKey === 'skills') {
                const skills = customItems.skills || profile.skills || []
                const domains = profile.domains || []
                const interests = profile.interests || []
                if (skills.length === 0 && domains.length === 0) return null

                return (
                  <section key={secKey} className="section-block">
                    {/* LaTeX \large\bfseries\scshape heading with 0.4pt hairline rule */}
                    <div className="border-b border-[#c8c8c8] pb-0.5 mb-1.5">
                      <h2 className="latex-smallcaps text-[12px] font-semibold text-[#284696] leading-snug">
                        Technical Skills
                      </h2>
                    </div>

                    <ul className="space-y-0.5 text-[10.5px] leading-[1.38] text-[#111]">
                      {skills.length > 0 && (
                        <li className="flex items-start">
                          <span className="text-[7px] leading-[15px] mr-1.5 select-none text-[#333]">●</span>
                          <div>
                            <span className="font-bold">Core Technologies & Languages:</span> {skills.join(', ')}
                          </div>
                        </li>
                      )}
                      {domains.length > 0 && (
                        <li className="flex items-start">
                          <span className="text-[7px] leading-[15px] mr-1.5 select-none text-[#333]">●</span>
                          <div>
                            <span className="font-bold">Specialized Domains:</span> {domains.join(', ')}
                          </div>
                        </li>
                      )}
                      {interests.length > 0 && (
                        <li className="flex items-start">
                          <span className="text-[7px] leading-[15px] mr-1.5 select-none text-[#333]">●</span>
                          <div>
                            <span className="font-bold">Areas of Focus:</span> {interests.join(', ')}
                          </div>
                        </li>
                      )}
                    </ul>
                  </section>
                )
              }

              // ── TECHNICAL PROJECTS ──
              if (secKey === 'projects') {
                const projects = (customItems.projects || profile.projects || []).filter(p => p._included !== false)
                if (projects.length === 0) return null

                return (
                  <section key={secKey} className="section-block">
                    <div className="border-b border-[#c8c8c8] pb-0.5 mb-1.5">
                      <h2 className="latex-smallcaps text-[12px] font-semibold text-[#284696] leading-snug">
                        Technical Projects
                      </h2>
                    </div>

                    <div className="space-y-2">
                      {projects.map((proj) => {
                        const links = []
                        if (proj.sourceCodeUrl) {
                          links.push({ label: 'GitHub', url: proj.sourceCodeUrl })
                        } else if (proj.link) {
                          links.push({
                            label: 'GitHub',
                            url: proj.link.startsWith('http') ? proj.link : `https://${proj.link}`,
                          })
                        }
                        if (proj.demoUrl) {
                          links.push({ label: 'Live Demo', url: proj.demoUrl })
                        }
                        if (proj.videoUrl) {
                          links.push({ label: 'Demo Video', url: proj.videoUrl })
                        }
                        if (proj.publicationUrl) {
                          links.push({ label: 'Publication', url: proj.publicationUrl })
                        }
                        if (proj.docsUrl) {
                          links.push({ label: 'Documentation', url: proj.docsUrl })
                        }

                        const techStackStr = Array.isArray(proj.techStack)
                          ? proj.techStack.join(', ')
                          : (proj.techStack || '')

                        const descBullets = (proj.description || '')
                          .split(/\r?\n/)
                          .map(s => s.trim())
                          .filter(Boolean)

                        return (
                          <div key={proj.id} className="project-item">
                            {/* Project Title + Text Hyperlinks — FAAngPath style: medium weight */}
                            <div className="flex items-baseline flex-wrap gap-x-1 text-[10.5px] leading-tight">
                              <span className="font-semibold text-[#284696]">{proj.title}</span>
                              {links.map((link, lIdx) => (
                                <span key={lIdx} className="text-[#555]">
                                  {' | '}
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#007acc] underline hover:text-[#284696]"
                                  >
                                    {link.label}
                                  </a>
                                </span>
                              ))}
                            </div>

                            {/* Tech stack subtitle — small italic */}
                            {techStackStr && (
                              <div className="text-[9.5px] italic text-[#555] leading-tight mt-0.5">
                                {techStackStr}
                              </div>
                            )}

                            {/* Bullets */}
                            <ul className="space-y-0.5 text-[10.5px] leading-[1.38] text-[#111] mt-0.5">
                              {descBullets.length > 0 ? (
                                descBullets.map((bullet, bIdx) => (
                                  <li key={bIdx} className="flex items-start">
                                    <span className="text-[7px] leading-[15px] mr-1.5 select-none text-[#333]">●</span>
                                    <div>{bullet}</div>
                                  </li>
                                ))
                              ) : (
                                <li className="flex items-start">
                                  <span className="text-[7px] leading-[15px] mr-1.5 select-none text-[#333]">●</span>
                                  <div>Implemented core features, architecture, and verification.</div>
                                </li>
                              )}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              }

              // ── EDUCATION ──
              if (secKey === 'education') {
                const educations = (customItems.education || profile.education || []).filter(e => e._included !== false)
                if (educations.length === 0) return null

                return (
                  <section key={secKey} className="section-block">
                    <div className="border-b border-[#c8c8c8] pb-0.5 mb-1.5">
                      <h2 className="latex-smallcaps text-[12px] font-semibold text-[#284696] leading-snug">
                        Education
                      </h2>
                    </div>

                    <div className="space-y-2">
                      {educations.map((edu) => {
                        const inst = edu.institution || edu.org || 'Institution'
                        const timeRange = edu.isOngoing
                          ? `${edu.startYear || ''} – Present`
                          : (edu.startYear && edu.endYear ? `${edu.startYear} – ${edu.endYear}` : (edu.endYear || edu.startYear || ''))
                        
                        const degreePart = [edu.degree, edu.specialization].filter(Boolean).join(' in ') || edu.title || 'Degree'
                        // Right side of line 2: location only (city/country), not university name
                        const locPart = edu.location || ''

                        return (
                          <div key={edu.id} className="education-item">
                            {/* Line 1: Institution (Left, bold #284696) & Timeline (Right, bold #284696) */}
                            <div className="flex justify-between items-baseline text-[10.5px] leading-tight font-semibold text-[#284696]">
                              <span>{inst}</span>
                              <span>{timeRange}</span>
                            </div>

                            {/* Line 2: Degree (Left, italic) & Location only (Right, italic) */}
                            <div className="flex justify-between items-baseline text-[9.5px] italic text-[#555] leading-tight mt-0.5">
                              <span>{degreePart}</span>
                              {locPart && <span>{locPart}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              }

              // ── CERTIFICATIONS ──
              if (secKey === 'certifications') {
                const certs = (customItems.certifications || []).filter(c => c._included !== false)
                if (certs.length === 0) return null

                return (
                  <section key={secKey} className="section-block">
                    <div className="border-b border-[#c8c8c8] pb-0.5 mb-1.5">
                      <h2 className="latex-smallcaps text-[12px] font-semibold text-[#284696] leading-snug">
                        Certifications
                      </h2>
                    </div>

                    <div className="space-y-1.5">
                      {certs.map((c) => {
                        const org = c.org || c.issuer || 'Issuing Organization'
                        const date = c.date || c.issuedOn || ''
                        const title = c.title || c.name || 'Certificate'
                        const certLink = c.credentialUrl || c.link || ''

                        return (
                          <div key={c.id} className="cert-item">
                            <div className="flex justify-between items-baseline text-[10.5px] leading-tight font-semibold text-[#284696]">
                              <div className="flex items-baseline gap-1 flex-wrap">
                                <span>{title}</span>
                                {certLink && (
                                  <span className="font-normal text-[#555]">
                                    {' | '}
                                    <a
                                      href={certLink.startsWith('http') ? certLink : `https://${certLink}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#007acc] underline hover:text-[#284696]"
                                    >
                                      View Certificate
                                    </a>
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-[#555] flex-none ml-2">{date}</span>
                            </div>
                            <div className="text-[9.5px] italic text-[#555] leading-tight mt-0.5">
                              <span>{org}</span>
                              {c.verifiableId && (
                                <>
                                  {' '}· ID: <span className="not-italic font-mono text-[#444]">{c.verifiableId}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              }

              // ── HONORS & ACHIEVEMENTS ──
              if (secKey === 'achievements') {
                const achievements = (customItems.achievements || profile.achievements || []).filter(a => a._included !== false)
                if (achievements.length === 0) return null

                return (
                  <section key={secKey} className="section-block">
                    <div className="border-b border-[#c8c8c8] pb-0.5 mb-1.5">
                      <h2 className="latex-smallcaps text-[12px] font-semibold text-[#284696] leading-snug">
                        Honors & Achievements
                      </h2>
                    </div>

                    <ul className="space-y-0.5 text-[10.5px] leading-[1.38] text-[#111]">
                      {achievements.map((ach) => (
                        <li key={ach.id} className="flex items-start">
                          <span className="text-[7px] leading-[15px] mr-1.5 select-none text-[#333]">●</span>
                          <div>
                            <span className="font-bold">{ach.title}</span>
                            {ach.description ? `: ${ach.description}` : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              }

              return null
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
