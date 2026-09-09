/**
 * Profile page — /profile
 *
 * Standalone page (no sidebar shell). Tabs: Overview, Journey, Education,
 * Projects, Certificates, Contributions, Rewards. Includes:
 *  - Avatar upload (canvas → dataURL)
 *  - Share panel (copies URL to clipboard)
 *  - Private / Public toggle (Facebook-style lock)
 *  - Resume → navigates to /profile/resume
 *  - All add/remove/share CRUD for self-added content
 *  - Loading skeleton, error state, all per-tab empty states
 *  - Responsive (mobile-first)
 */

import { useState, useCallback, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'

// ---- Profile-specific components ----
/* ---- TEAMMATE BOUNDARY: check these before importing your own ---- */
import Avatar        from '../components/profile/Avatar.jsx'
import CoverBand     from '../components/profile/CoverBand.jsx'
import LevelStrip    from '../components/profile/LevelStrip.jsx'
import TabBar        from '../components/profile/TabBar.jsx'
import Pill          from '../components/profile/Pill.jsx'
import AchRow        from '../components/profile/AchRow.jsx'
import InlineAddForm from '../components/profile/InlineAddForm.jsx'
import SectionCard   from '../components/profile/SectionCard.jsx'
import KVRow         from '../components/profile/KVRow.jsx'
import Meter         from '../components/profile/Meter.jsx'
import TimelineItem  from '../components/profile/TimelineItem.jsx'
/* ---- TEAMMATE BOUNDARY END ---- */

// ---- helpers ----
const AVATAR_PX = 256

/** Derive XP level data from raw XP */
function levelFor(xp) {
  const THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2500]
  const idx = THRESHOLDS.findLastIndex(t => xp >= t)
  const level  = idx + 1
  const next   = THRESHOLDS[idx + 1] ?? THRESHOLDS[THRESHOLDS.length - 1] + 500
  const base   = THRESHOLDS[idx]
  const pct    = Math.round(((xp - base) / (next - base)) * 100)
  return { level, next, pct }
}

function shareSlug(name, email) {
  let hash = 0
  const str = email || name || 'user'
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  const slug = (name || 'user').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${slug}-${Math.abs(hash).toString(36).slice(0, 5)}`
}

// ---- tab config ----
const TABS = [
  { key: 'overview',      label: 'Overview'      },
  { key: 'journey',       label: 'Journey'       },
  { key: 'education',     label: 'Education'     },
  { key: 'projects',      label: 'Projects'      },
  { key: 'certificates',  label: 'Certificates'  },
  { key: 'contributions', label: 'Contributions' },
  { key: 'rewards',       label: 'Rewards'       },
]

// ---- ghost button shared style ----
const GHOST_BTN = [
  'inline-flex items-center gap-1.5 px-[11px] py-[5px] text-[12px] font-semibold',
  'border border-paper-line rounded-[2px] bg-white text-ink-900',
  'hover:border-signal hover:text-signal transition-colors cursor-pointer',
  'disabled:opacity-50',
].join(' ')

// ===================================================================
//  PROFILE PAGE
// ===================================================================
export default function Profile() {
  const navigate = useNavigate()

  // ---- data ----
  const { profile: serverProfile, initiatives, loading, error, refetch } = useProfile()

  // ---- local state (mirrors server until real mutations exist) ----
  const [profile,    setProfile]    = useState(null)
  const [inits,      setInits]      = useState(null)
  const [avatar,     setAvatar]     = useState(null)        // base64 dataURL
  const [tab,        setTab]        = useState('overview')
  const [shareOpen,  setShareOpen]  = useState(false)
  const [copyDone,   setCopyDone]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  // ---- sync server → local once loaded ----
  if (serverProfile && !profile) {
    setProfile(serverProfile)
    setAvatar(serverProfile.avatar)
  }
  if (initiatives && !inits) {
    setInits(initiatives)
  }

  // ================================================================
  //  AVATAR UPLOAD  (canvas resize → 256×256 dataURL)
  // ================================================================
  const handleAvatarUpload = useCallback(e => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/^image\//.test(f.type)) {
      alert("That doesn't look like an image file.")
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const c = document.createElement('canvas')
        c.width = c.height = AVATAR_PX
        c.getContext('2d').drawImage(
          img,
          (img.width - side) / 2, (img.height - side) / 2,
          side, side,
          0, 0, AVATAR_PX, AVATAR_PX,
        )
        setAvatar(c.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => alert("That image couldn't be read.")
      img.src = ev.target.result
    }
    reader.readAsDataURL(f)
  }, [])

  const handleAvatarClear = () => setAvatar(null)

  // ================================================================
  //  LOCAL CRUD HELPERS
  // ================================================================
  function updateField(field, value) {
    setProfile(p => ({ ...p, [field]: value }))
  }

  function addItem(field, item) {
    setProfile(p => ({ ...p, [field]: [...(p[field] || []), item] }))
  }

  function removeItem(field, id) {
    setProfile(p => ({ ...p, [field]: (p[field] || []).filter(x => x.id !== id) }))
  }

  function toggleShare(field, id) {
    setProfile(p => ({
      ...p,
      [field]: (p[field] || []).map(x => x.id === id ? { ...x, shared: !x.shared } : x),
    }))
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  }

  // ================================================================
  //  SHARE + PRIVACY
  // ================================================================
  const profileUrl = `https://h2s.io/p/${profile ? shareSlug(profile.name, profile.email) : ''}`

  function handleCopyLink() {
    navigator.clipboard?.writeText(profileUrl).catch(() => {})
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
  }

  function togglePublic() {
    updateField('isPublic', !profile.isPublic)
  }

  // ================================================================
  //  RESUME — navigate to dedicated resume page passing profile data
  // ================================================================
  function openResume() {
    navigate('/profile/resume', { state: { profile, initiatives: inits, avatar } })
  }

  // ================================================================
  //  LOADING / ERROR STATES
  // ================================================================
  if (loading) return <ProfileSkeleton />
  if (error) return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-[22px] font-display font-bold text-ink-900 mb-2">Failed to load profile</h2>
        <p className="text-[14px] text-graphite-dim mb-6">{error}</p>
        <button
          onClick={refetch}
          className="px-5 py-2.5 bg-signal text-white rounded-[2px] text-[13.5px] font-semibold hover:bg-signal-dark cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  )
  if (!profile) return null

  // ================================================================
  //  DERIVED DATA
  // ================================================================
  const certCount = inits?.completed?.length ?? 0
  const xp        = profile.xp + certCount * 50
  const { level, next: xpNext, pct: xpPct } = levelFor(xp)
  const credits   = profile.credits + certCount * 30
  const badges    = profile.badges ?? []

  // ================================================================
  //  TAB BODIES
  // ================================================================

  // ---- OVERVIEW ----
  const OverviewTab = (
    <div className="space-y-4">
      {/* Details */}
      <SectionCard title="Details">
        <div className="mt-4 space-y-0">
          <KVRow label="Email"        value={profile.email}  />
          <KVRow label="Region"       value={profile.region} />
          <KVRow label="Organisation" value={profile.org}    last />
        </div>
      </SectionCard>

      {/* Roles */}
      <SectionCard title="Roles">
        <div className="mt-4 space-y-0">
          {(profile.roles ?? []).length > 0 ? (
            (profile.roles ?? []).map(r => (
              <div key={r.key} className="flex items-center justify-between gap-4 py-3 border-b border-paper-line last:border-0">
                <div className="flex items-center gap-3">
                  <Pill variant={r.primary ? 'hat' : 'default'}>{r.label}</Pill>
                  {r.primary && <span className="text-[11px] text-graphite-dim">your landing view</span>}
                </div>
                <span className="text-[12px] text-graphite-dim">Active</span>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-graphite-dim py-2">Engage with a view and your hat appears here.</p>
          )}
        </div>

        {/* Landing view picker (stub) */}
        <div className="mt-4 pt-3 border-t border-paper-line">
          <p className="text-[10.5px] font-mono font-semibold tracking-widest text-graphite-dim uppercase">Landing view</p>
          <p className="text-[11px] text-graphite-dim mt-1.5 mb-3">Where you arrive after logging in.</p>
          <div className="flex flex-wrap gap-2">
            {['🏠 Dashboard', '📚 Learn', '🏆 Compete', '🛠️ Build'].map(v => {
              const k = v.split(' ')[1].toLowerCase()
              const isOn = profile.landingView === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => updateField('landingView', k)}
                  className={[
                    'px-3.5 py-2 text-[13px] rounded-[2px] border font-medium cursor-pointer transition-colors',
                    isOn
                      ? 'bg-signal text-white border-signal'
                      : 'bg-white text-graphite-dim border-paper-line hover:border-graphite-dim',
                  ].join(' ')}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </div>

        {/* Register as mentor CTA */}
        <div className="mt-4 pt-3 border-t border-paper-line flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-graphite-dim flex-1 min-w-[240px]">
            Experienced enough to guide teams or score submissions? Anyone can register — the H2S team approves mentors.
          </p>
          <button
            type="button"
            className="px-3 py-[5px] text-[12px] font-semibold bg-signal text-white rounded-[2px] hover:bg-signal-dark cursor-pointer"
          >
            Register as a mentor
          </button>
        </div>

        {/* Become a sponsor CTA */}
        <div className="mt-3 pt-3 border-t border-paper-line flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-graphite-dim flex-1 min-w-[240px]">
            Representing an organisation that wants to run a challenge, hire from one, or put up a prize pool?
          </p>
          <a
            href="/sponsor"
            className="px-3 py-[5px] text-[12px] font-bold border-[1.5px] border-violet text-violet bg-violet-soft rounded-[2px] hover:bg-violet hover:text-white transition-colors"
          >
            Become a Sponsor
          </a>
        </div>
      </SectionCard>

      {/* Interests */}
      <SectionCard title="Interests">
        <div className="flex flex-wrap gap-2 mt-4">
          {(profile.interests ?? []).length > 0
            ? (profile.interests ?? []).map(x => <Pill key={x}>{x}</Pill>)
            : <span className="text-[13px] text-graphite-dim">Nothing added yet</span>
          }
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard title="Skills">
        <div className="flex flex-wrap gap-2 mt-4">
          {(profile.skills ?? []).length > 0
            ? (profile.skills ?? []).map(x => <Pill key={x}>{x}</Pill>)
            : <span className="text-[13px] text-graphite-dim">Nothing added yet</span>
          }
        </div>
      </SectionCard>

      {/* Domains */}
      <SectionCard title="Domains">
        <div className="flex flex-wrap gap-2 mt-4">
          {(profile.domains ?? []).length > 0
            ? (profile.domains ?? []).map(x => <Pill key={x} variant="accent">{x}</Pill>)
            : <span className="text-[13px] text-graphite-dim">Nothing added yet</span>
          }
        </div>
      </SectionCard>
    </div>
  )

  // ---- JOURNEY ----
  const hasJourneyItems = (inits?.completed?.length || 0) + (profile.achievements?.length || 0) > 0
  const JourneyTab = (
    <SectionCard title="Your journey">
      <p className="text-[13px] text-graphite-dim mt-1 mb-4">
        Verified certificates, submissions and self-added achievements, in one feed.
      </p>
      {hasJourneyItems ? (
        <div className="relative pl-6 before:content-[''] before:absolute before:left-[6px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-paper-line">
          {(inits?.completed ?? []).map(o => (
            <TimelineItem
              key={o.id}
              variant="done"
              title={`✅ Completed — ${o.name}`}
              subtitle={`${o.org} · H2S Verified Certificate`}
            />
          ))}
          {(profile.achievements ?? []).map(a => (
            <TimelineItem
              key={a.id}
              variant="default"
              title={`🏅 ${a.title}`}
              subtitle="Self-added"
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-[14px] text-graphite-dim">Nothing yet — register for something and it starts here.</p>
        </div>
      )}
    </SectionCard>
  )

  // ---- EDUCATION ----
  const EducationTab = (
    <SectionCard title="Education">
      {(profile.education ?? []).length > 0 ? (
        <div className="mt-4">
          {(profile.education ?? []).map(e => (
            <AchRow
              key={e.id}
              icon="🎓"
              title={e.title}
              subtitle={e.org}
              onRemove={() => removeItem('education', e.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-[14px] text-graphite-dim">No education added.</p>
          <p className="text-[12px] text-graphite-dim mt-1.5">Add your educational background to showcase your academic qualifications.</p>
        </div>
      )}
      <InlineAddForm
        fields={[
          { id: 'title', placeholder: 'e.g. B.Tech, Computer Science', required: true },
          { id: 'org',   placeholder: 'Institution (optional)', required: false },
        ]}
        addLabel="+ Add Education"
        onAdd={({ title, org }) => {
          if (!title.trim()) return
          addItem('education', { id: uid('edu'), title: title.trim(), org: org.trim() })
        }}
      />
    </SectionCard>
  )

  // ---- PROJECTS ----
  const ProjectsTab = (
    <div className="space-y-4">
      {/* Projects */}
      <SectionCard title="Projects">
        {(profile.projects ?? []).length > 0 ? (
          <div className="mt-4">
            {(profile.projects ?? []).map(p => (
              <AchRow
                key={p.id}
                icon="📁"
                title={p.title}
                subtitle={p.link}
                shared={p.shared}
                onShare={() => toggleShare('projects', p.id)}
                onRemove={() => removeItem('projects', p.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[14px] text-graphite-dim">No projects information available.</p>
            <p className="text-[12px] text-graphite-dim mt-1.5">Add your projects to showcase your technical skills.</p>
          </div>
        )}
        <InlineAddForm
          fields={[
            { id: 'title', placeholder: 'Project title',    required: true  },
            { id: 'link',  placeholder: 'Link (optional)',  required: false },
          ]}
          addLabel="+ Add Project"
          onAdd={({ title, link }) => {
            if (!title.trim()) return
            addItem('projects', { id: uid('proj'), title: title.trim(), link: link.trim(), shared: false })
          }}
        />
      </SectionCard>

      {/* Publications */}
      <SectionCard title="Publications">
        {(profile.publications ?? []).length > 0 ? (
          <div className="mt-4">
            {(profile.publications ?? []).map(p => (
              <AchRow
                key={p.id}
                icon="📄"
                title={p.title}
                subtitle={p.link}
                shared={p.shared}
                onShare={() => toggleShare('publications', p.id)}
                onRemove={() => removeItem('publications', p.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[14px] text-graphite-dim">No publications information available.</p>
            <p className="text-[12px] text-graphite-dim mt-1.5">Add your publications to showcase your research.</p>
          </div>
        )}
        <InlineAddForm
          fields={[
            { id: 'title', placeholder: 'Publication title', required: true  },
            { id: 'link',  placeholder: 'Link (optional)',    required: false },
          ]}
          addLabel="+ Add Publication"
          onAdd={({ title, link }) => {
            if (!title.trim()) return
            addItem('publications', { id: uid('pub'), title: title.trim(), link: link.trim(), shared: false })
          }}
        />
      </SectionCard>

      {/* Achievements */}
      <SectionCard title="Achievements">
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Self-added, unverified by definition. Turn on "shared" to include it on your public profile link — off by default.
        </p>
        {(profile.achievements ?? []).length > 0 ? (
          <div>
            {[...(profile.achievements ?? [])].reverse().map(a => (
              <AchRow
                key={a.id}
                icon="🏅"
                title={a.title}
                shared={a.shared}
                onShare={() => toggleShare('achievements', a.id)}
                onRemove={() => removeItem('achievements', a.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">Nothing added yet.</p>
        )}
        <InlineAddForm
          fields={[
            { id: 'title', placeholder: 'e.g. Runner-up — CityHacks 2025', required: true },
          ]}
          addLabel="+ Add"
          onAdd={({ title }) => {
            if (!title.trim()) return
            addItem('achievements', { id: uid('ach'), title: title.trim(), shared: false })
          }}
        />
      </SectionCard>
    </div>
  )

  // ---- CERTIFICATES ----
  const CertificatesTab = (
    <div className="space-y-4">
      {/* H2S Verified */}
      <SectionCard title="H2S Verified Certificates">
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Issued automatically the moment an initiative closes — read-only, never editable.
        </p>
        {(inits?.completed ?? []).length > 0 ? (
          (inits?.completed ?? []).map(o => (
            <AchRow
              key={o.id}
              icon=""
              title={o.name}
              subtitle={`${o.org} · Verifiable ID ${o.verifiableId}`}
              verified
              verifiedId={o.verifiableId}
            />
          ))
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">Nothing yet — certificates appear automatically when an initiative closes.</p>
        )}
      </SectionCard>

      {/* Self-added */}
      <SectionCard title="Other certificates added by you">
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Unverified by definition — earned elsewhere and typed in yourself. Turn on "shared" to include on your public link.
        </p>
        {(profile.selfCerts ?? []).length > 0 ? (
          <div>
            {(profile.selfCerts ?? []).map(c => (
              <AchRow
                key={c.id}
                icon="🎓"
                title={c.title}
                subtitle={c.org}
                shared={c.shared}
                onShare={() => toggleShare('selfCerts', c.id)}
                onRemove={() => removeItem('selfCerts', c.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">Nothing added yet.</p>
        )}
        <InlineAddForm
          fields={[
            { id: 'title', placeholder: 'e.g. AWS Cloud Practitioner', required: true  },
            { id: 'org',   placeholder: 'Issued by (optional)',         required: false },
          ]}
          addLabel="+ Add"
          onAdd={({ title, org }) => {
            if (!title.trim()) return
            addItem('selfCerts', { id: uid('sc'), title: title.trim(), org: org.trim(), shared: false })
          }}
        />
      </SectionCard>
    </div>
  )

  // ---- CONTRIBUTIONS ----
  const ContributionsTab = (
    <SectionCard title="Contributions">
      <div className="mt-4 space-y-3">
        {[
          ['GitHub',       '🐙', 'Connect to showcase your repositories and contribution activity.',       'github'],
          ['StackOverflow', '💬', 'Connect to showcase your reputation and Q&A activity.',                'stackoverflow'],
        ].map(([name, ico, desc, key]) => {
          const connected = !!(profile.contributions?.[key])
          return (
            <div
              key={name}
              className="flex items-center justify-between gap-4 px-3.5 py-3.5 border border-paper-line rounded-[2px]"
            >
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{ico}</span>
                <div>
                  <strong className="text-[13px] text-ink-900">{name}</strong>
                  {connected
                    ? <p className="text-[11px] text-[#0f9d58] mt-0.5">Connected as @{profile.contributions[key]}</p>
                    : <p className="text-[11px] text-graphite-dim mt-0.5">{desc}</p>
                  }
                </div>
              </div>
              {connected ? (
                <Pill variant="ok">✓ Connected</Pill>
              ) : (
                <button
                  type="button"
                  onClick={() => alert(`Connecting ${name} will be available once OAuth is wired.`)}
                  className={GHOST_BTN}
                >
                  Connect
                </button>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )

  // ---- REWARDS ----
  const RewardsTab = (
    <div className="space-y-4">
      {/* Level & XP */}
      <SectionCard title="Level & XP">
        <div className="flex items-center gap-4 mt-4">
          <div className="w-16 h-16 rounded-full flex-none grid place-items-center bg-signal-soft text-signal-dark font-bold text-[20px] font-display">
            {level}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <strong className="text-[13px] text-ink-900">Level {level}</strong>
              <span className="text-[11px] text-graphite-dim">{xp} XP · {Math.max(0, xpNext - xp)} to Level {level + 1}</span>
            </div>
            <Meter pct={xpPct} className="mt-2" />
          </div>
        </div>
      </SectionCard>

      {/* Badges */}
      <SectionCard title="Badges">
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {badges.map(b => (
              <div key={b.id} className="text-center border border-paper-line rounded-[2px] p-3.5">
                <div className="text-[20px]">{b.ico}</div>
                <p className="text-[11px] text-graphite-dim mt-2">{b.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim mt-4 py-4">No badges yet.</p>
        )}
      </SectionCard>

      {/* Credit points */}
      <SectionCard title="Credit points">
        <div className="flex items-center gap-3 mt-4">
          <strong className="text-[26px] text-ink-900">{credits}</strong>
          <span className="text-[14px] text-graphite-dim">credits</span>
        </div>
        <p className="text-[11px] text-graphite-dim mt-4">
          Earned from certificates, submissions and shared achievements. Redeem in the swag store.
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
    contributions: ContributionsTab,
    rewards:       RewardsTab,
  }

  // ================================================================
  //  RENDER
  // ================================================================
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile header card ── */}
        <div className="bg-white border border-paper-line rounded-card overflow-hidden shadow-[0_1px_2px_rgba(16,18,35,.06),0_8px_24px_-12px_rgba(16,18,35,.18)] mb-6">
          <CoverBand />

          <div className="px-5 pb-5" style={{ marginTop: '-38px' }}>
            {/* avatar + actions row */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              {/* avatar (upload affordance) */}
              <Avatar
                src={avatar}
                name={profile.name}
                size="xl"
                onUpload={handleAvatarUpload}
              />

              {/* action buttons */}
              <div className="flex flex-wrap gap-2 pb-1">
                {/* Resume */}
                <button
                  id="btn-resume"
                  type="button"
                  onClick={openResume}
                  className={GHOST_BTN}
                  title="Generate resume"
                >
                  📄 Resume
                </button>

                {/* Share */}
                <button
                  id="btn-share"
                  type="button"
                  onClick={() => setShareOpen(v => !v)}
                  className={GHOST_BTN}
                  title="Share profile link"
                  aria-expanded={shareOpen}
                >
                  🔗 {shareOpen ? 'Hide link' : 'Share'}
                </button>

                {/* Private / Public toggle */}
                <button
                  id="btn-privacy"
                  type="button"
                  onClick={togglePublic}
                  className={[
                    GHOST_BTN,
                    profile.isPublic
                      ? 'border-[#0f9d58] text-[#0f9d58] bg-[#e7f6ee]'
                      : '',
                  ].join(' ')}
                  title={profile.isPublic ? 'Profile is public — click to make private' : 'Profile is private — click to make public'}
                  aria-pressed={profile.isPublic}
                >
                  {profile.isPublic ? '🌐 Public' : '🔒 Private'}
                </button>

                {/* Clear avatar */}
                {avatar && (
                  <button
                    id="btn-clear-avatar"
                    type="button"
                    onClick={handleAvatarClear}
                    className="px-[10px] py-[5px] text-[12px] text-graphite-dim hover:text-ink-900 font-medium cursor-pointer transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* name + headline */}
            <div className="mt-3">
              <h1 className="text-[20px] font-display font-bold text-ink-900 leading-tight">
                {profile.name || 'Add your name'}
              </h1>
              <p className="text-[13px] text-graphite-dim mt-0.5">
                {profile.headline || 'Add a headline'}
                {profile.org ? <> · {profile.org}</> : null}
              </p>
            </div>

            {/* Share panel */}
            {shareOpen && (
              <div className="mt-4 rounded-[2px] border border-paper-line bg-paper px-3.5 py-3 text-[12px]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-mono text-ink-900 break-all">{profileUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1 text-[11px] font-semibold bg-signal text-white rounded-[2px] hover:bg-signal-dark transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copyDone ? '✓ Copied!' : 'Copy link'}
                  </button>
                </div>
                <p className="text-[11px] text-graphite-dim mt-2 leading-relaxed">
                  {profile.isPublic
                    ? 'Public — shows badges, XP, verified certificates, and any item you\'ve marked "shared". Email is never shown.'
                    : 'Private — a visitor sees only your banner, avatar and name. Nothing else, until you switch to Public.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/profile/preview')}
                  className="text-[11px] text-signal mt-2 inline-block hover:underline cursor-pointer"
                >
                  👁 Preview what a visitor sees →
                </button>
              </div>
            )}

            {/* Level strip */}
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
          </div>
        </div>

        {/* ── Tab bar ── */}
        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* ── Tab panel ── */}
        <div
          id={`profile-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`profile-tab-${tab}`}
        >
          {TAB_BODY[tab] ?? null}
        </div>
      </div>
    </div>
  )
}

// ================================================================
//  LOADING SKELETON
// ================================================================
function SkeletonBox({ className = '' }) {
  return (
    <div className={`bg-paper-line rounded animate-pulse ${className}`} aria-hidden="true" />
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border border-paper-line rounded-card overflow-hidden mb-6">
          <SkeletonBox className="h-[110px] w-full rounded-none" />
          <div className="px-5 py-5 space-y-3">
            <div className="flex gap-3">
              <SkeletonBox className="w-[84px] h-[84px] rounded-full -mt-10 border-4 border-white" />
            </div>
            <SkeletonBox className="h-5 w-48" />
            <SkeletonBox className="h-4 w-72" />
            <SkeletonBox className="h-[52px] w-[300px] rounded-card" />
          </div>
        </div>
        {/* Tab skeleton */}
        <div className="flex gap-4 border-b border-paper-line mb-6 pb-0">
          {TABS.map(t => <SkeletonBox key={t.key} className="h-4 w-20 mb-3" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-paper-line rounded-card p-[18px] space-y-3">
              <SkeletonBox className="h-4 w-28" />
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
