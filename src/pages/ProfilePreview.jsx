/**
 * ProfilePreview — /profile/preview
 *
 * Public preview sub-page showing exactly what a public visitor sees
 * when visiting the user's share URL. Replicates the layout and tabs of /profile.
 * Honors `isPublic` (Facebook-style profile lock):
 *  - When isPublic === false: shows locked state card (banner, avatar, name, locked notice, personal details)
 *  - When isPublic === true: shows exact profile header (cover, avatar, name, headline, level strip)
 *    and tabs (Overview, Journey, Education, Projects, Certificates, Links, Rewards)
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'

/* ---- TEAMMATE BOUNDARY: Profile Preview Components ---- */
import Avatar from '../components/profile/Avatar.jsx'
import CoverBand from '../components/profile/CoverBand.jsx'
import LevelStrip from '../components/profile/LevelStrip.jsx'
import TabBar from '../components/profile/TabBar.jsx'
import SectionCard from '../components/profile/SectionCard.jsx'
import Pill from '../components/profile/Pill.jsx'
import KVRow from '../components/profile/KVRow.jsx'
import Modal from '../components/profile/Modal.jsx'
import TimelineItem from '../components/profile/TimelineItem.jsx'
import { buildPlatformJourney } from '../utils/journeyBuilder.js'
/* ---- TEAMMATE BOUNDARY END ---- */

// Tab config matching /profile
const TABS = [
  { key: 'overview',      label: 'Overview'      },
  { key: 'journey',       label: 'Journey'       },
  { key: 'education',     label: 'Education'     },
  { key: 'projects',      label: 'Projects'      },
  { key: 'certificates',  label: 'Certificates'  },
  { key: 'links',         label: 'Links'         },
  { key: 'rewards',       label: 'Rewards'       },
]

function levelFor(xp) {
  const THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2500]
  const idx = THRESHOLDS.findLastIndex(t => xp >= t)
  const level  = idx + 1
  const next   = THRESHOLDS[idx + 1] ?? THRESHOLDS[THRESHOLDS.length - 1] + 500
  const base   = THRESHOLDS[idx]
  const pct    = Math.round(((xp - base) / (next - base)) * 100)
  return { level, next, pct }
}

export default function ProfilePreview() {
  const navigate = useNavigate()
  const location = useLocation()

  // Use state passed from Profile page if available, else load from hook
  const { profile: fetchedProfile, initiatives } = useProfile()
  const profile = location.state?.profile || fetchedProfile
  const avatar = location.state?.avatar ?? profile?.avatar ?? null
  const cover = location.state?.cover ?? profile?.cover ?? null

  const [tab, setTab] = useState('overview')
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
  const publicSelfCerts = (profile.selfCerts || [])
    .filter(c => c.shared)
    .sort((a, b) => {
      const parseDate = item => {
        if (!item) return 0
        const d = item.issueDate || item.date || ''
        return new Date(d.length === 4 ? `${d}-01-01` : d).getTime() || 0
      }
      return parseDate(b) - parseDate(a)
    })
  const publicPubs = (profile.publications || []).filter(p => p.shared)
  const publicLinks = (profile.connectedProfiles || []).filter(l => l.shared !== false)
  const verifiedCerts = initiatives?.completed || []

  // Gamification metrics matching /profile
  const certCount = verifiedCerts.length
  const xp = (profile.xp || 0) + certCount * 50
  const { level, next: xpNext, pct: xpPct } = levelFor(xp)
  const credits = (profile.credits || 0) + certCount * 30
  const badges = profile.badges ?? []

  // ---- TAB BODIES ----

  // 1. OVERVIEW
  const OverviewTab = (
    <div className="space-y-4">
      {/* About */}
      {profile.about && (
        <SectionCard title="About">
          <p className="mt-3 text-[13.5px] text-ink-900 leading-relaxed whitespace-pre-wrap">
            {profile.about}
          </p>
        </SectionCard>
      )}

      {/* Roles */}
      {(profile.roles ?? []).length > 0 && (
        <SectionCard title="Roles">
          <div className="mt-3 space-y-0">
            {profile.roles.map(r => (
              <div key={r.key} className="flex items-center justify-between gap-4 py-2.5 border-b border-paper-line last:border-0">
                <div className="flex items-center gap-2.5">
                  <Pill variant={r.primary ? 'hat' : 'default'}>{r.label}</Pill>
                  {r.primary && <span className="text-[11px] text-graphite-dim">Primary role</span>}
                </div>
                <span className="text-[11.5px] text-graphite-dim font-medium">Active Member</span>
              </div>
            ))}
          </div>
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

      {/* Personal Details Card at the very bottom */}
      <SectionCard title="Personal Details">
        <div className="mt-3 space-y-0">
          {[
            { label: 'Full Name', value: profile.name },
            { label: 'Headline', value: profile.headline },
            { label: 'Organisation', value: profile.org },
            { label: 'Region / Location', value: profile.region },
            ...(profile.email ? [{ label: 'Email', value: profile.email }] : []),
          ].map((item, idx, arr) => (
            <KVRow
              key={item.label}
              label={item.label}
              value={item.value}
              last={idx === arr.length - 1}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  )

  // 2. JOURNEY (Platform journey from profile creation to ongoing: most recent on top)
  const journeyTimeline = buildPlatformJourney(profile, initiatives, 'recent')
  const JourneyTab = (
    <div className="space-y-4">
      <SectionCard
        title="Your Platform Journey"
        action={
          <span className="text-[11px] font-mono text-graphite-dim font-medium bg-paper border border-paper-line px-2 py-0.5 rounded-[2px] inline-flex items-center gap-1">
            <span>⚡</span> Most recent on top
          </span>
        }
      >
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Verified platform journey — ordered with most recent milestones and active initiatives at the top, down to profile creation at the bottom.
        </p>
        {journeyTimeline.length > 0 ? (
          <div className="relative pl-6 before:content-[''] before:absolute before:left-[6px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-paper-line space-y-1">
            {journeyTimeline.map(item => (
              <TimelineItem
                key={item.id}
                variant={item.variant}
                title={item.title}
                subtitle={item.subtitle}
                date={item.date}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim mt-3 py-3">No platform journey milestones recorded yet.</p>
        )}
      </SectionCard>
    </div>
  )

  // 3. EDUCATION
  const EducationTab = (
    <div className="space-y-4">
      <SectionCard title="Education">
        {profile.education && profile.education.length > 0 ? (
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
                  <div key={edu.id} className="py-2.5 border-b border-paper-line last:border-0">
                    <div className="font-semibold text-[13.5px] text-ink-900">{degreeText}</div>
                    {instText && <div className="text-[12.5px] text-ink-900 mt-0.5">{instText}</div>}
                    {timeText && <div className="text-[11.5px] text-graphite-dim mt-0.5">{timeText}</div>}
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim mt-3 py-3">No education history listed.</p>
        )}
      </SectionCard>
    </div>
  )

  // 4. PROJECTS
  const ProjectsTab = (
    <div className="space-y-4">
      <SectionCard title="Featured Projects">
        {publicProjects.length > 0 ? (
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
        ) : (
          <p className="text-[13px] text-graphite-dim mt-3 py-3">No public projects shared yet.</p>
        )}
      </SectionCard>

      {/* Publications */}
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
    </div>
  )

  // 5. CERTIFICATES
  const CertificatesTab = (
    <div className="space-y-4">
      {/* Verified Hack2skill Certificates */}
      <SectionCard title="Verified Hack2skill Certificates">
        <p className="text-[13px] text-graphite-dim mt-1 mb-3">
          Earned credentials verified cryptographically and issued by Hack2skill.
        </p>
        {verifiedCerts.length > 0 ? (
          <div className="space-y-2.5">
            {verifiedCerts.map(c => (
              <div
                key={c.id}
                className="p-3 rounded-[2px] border border-paper-line bg-paper flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13.5px] font-semibold text-ink-900">
                      {c.name || c.title || 'Hack2skill Certificate'}
                    </h3>
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px]">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-[11.5px] text-graphite-dim mt-0.5">
                    {[c.org || c.issuer || 'Hack2skill', c.completedDate ? `Issued ${c.completedDate}` : '', c.verifiableId ? `ID: ${c.verifiableId}` : ''].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/certificate/${c.id}`, {
                      state: {
                        cert: c,
                        userName: profile?.name,
                        returnTo: { path: '/profile/preview', state: { profile, avatar, initiatives } },
                      },
                    })}
                    className="text-signal hover:underline text-[12px] font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title="View certificate"
                  >
                    <span>View ↗</span>
                  </button>
                  <span className="text-xl">🏆</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim py-2">No verified certificates issued yet.</p>
        )}
      </SectionCard>

      {/* External Certifications & Honors */}
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
    </div>
  )

  // 6. LINKS
  const LinksTab = (
    <div className="space-y-4">
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
            <p className="text-[13px] text-graphite-dim py-2">No external links shared.</p>
          )}
        </div>
      </SectionCard>
    </div>
  )

  // 7. REWARDS
  const RewardsTab = (
    <div className="space-y-4">
      <SectionCard title="Earned Badges">
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {badges.map(b => (
              <div
                key={b.id}
                className="p-3.5 border border-paper-line rounded-[2px] bg-paper text-center flex flex-col items-center justify-center"
              >
                <div className="text-3xl mb-1.5">{b.ico}</div>
                <strong className="text-[12.5px] text-ink-900 font-semibold">{b.label}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim mt-3 py-3">No badges earned yet.</p>
        )}
      </SectionCard>

      <SectionCard title="Credit Points">
        <div className="flex items-center gap-3 mt-3">
          <strong className="text-[26px] text-ink-900">{credits}</strong>
          <span className="text-[14px] text-graphite-dim">credits</span>
        </div>
        <p className="text-[11px] text-graphite-dim mt-3">
          Earned from certificates, submissions, and shared achievements across Hack2skill.
        </p>
      </SectionCard>
    </div>
  )

  const TAB_BODY = {
    overview:      OverviewTab,
    journey:       JourneyTab,
    education:     EducationTab,
    projects:      ProjectsTab,
    certificates:  CertificatesTab,
    links:         LinksTab,
    rewards:       RewardsTab,
  }

  return (
    <div className="min-h-screen bg-paper text-ink-900 pb-16">
      {/* Top sticky banner for owner navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-paper-line px-4 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-[800px] mx-auto flex items-center justify-between flex-wrap gap-2 text-[12.5px]">
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
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 pt-5">
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
                : 'Visitors see your badges, XP, verified certificates, and public items matching your profile layout.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Public Profile Container matching /profile max-w-[800px] */}
      <main className="max-w-[800px] mx-auto px-4 sm:px-6">
        {/* Profile Header Card replicating /profile */}
        <div className="bg-white border border-paper-line rounded-card overflow-hidden shadow-[0_1px_2px_rgba(16,18,35,.06),0_8px_24px_-12px_rgba(16,18,35,.18)] mb-6">
          <CoverBand src={cover} />

          <div className="px-5 pb-5" style={{ marginTop: '-38px' }}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Avatar
                src={avatar}
                name={profile.name}
                size="xl"
              />
            </div>

            <div className="mt-3">
              <h1 className="text-[20px] font-display font-bold text-ink-900 leading-tight">
                {profile.name || 'Member'}
              </h1>
              <p className="text-[13px] text-graphite-dim mt-0.5">
                {profile.headline || 'Hack2skill Community Member'}
                {profile.org ? <> · {profile.org}</> : null}
              </p>
              {profile.region && (
                <p className="text-[12px] text-graphite-dim mt-1">📍 {profile.region}</p>
              )}
            </div>

            {/* Level strip replicating /profile (shown in public mode) */}
            {!isLocked && (
              <div className="mt-4">
                <LevelStrip
                  level={level}
                  xp={xp}
                  xpNext={xpNext}
                  xpPct={xpPct}
                  badgeCount={badges.length}
                  credits={credits}
                  onClick={() => setTab('rewards')}
                />
              </div>
            )}
          </div>
        </div>

        {/* If Locked, Show only the private profile notice card */}
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
                Only basic public information is shared. Full journey timeline, project portfolios, certificates, personal details, and achievements are kept private by this member.
              </p>
            </div>
          </SectionCard>
        ) : (
          /* When Public, Show the same tabbed structure as /profile */
          <>
            {/* Tab bar */}
            <TabBar tabs={TABS} active={tab} onSelect={setTab} />

            {/* Tab panel */}
            <div
              id={`preview-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`profile-tab-${tab}`}
            >
              {TAB_BODY[tab] ?? null}
            </div>
          </>
        )}
      </main>

      {/* Certificate Photo Viewer Modal */}
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
