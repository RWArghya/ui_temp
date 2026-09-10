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
import { useNavigate, useLocation } from 'react-router-dom'
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
import ConfirmDialog from '../components/profile/ConfirmDialog.jsx'
import EditPersonalDetailsModal from '../components/profile/EditPersonalDetailsModal.jsx'
import EditAboutModal from '../components/profile/EditAboutModal.jsx'
import EditPillsModal from '../components/profile/EditPillsModal.jsx'
import EditEducationModal from '../components/profile/EditEducationModal.jsx'
import EditProjectModal from '../components/profile/EditProjectModal.jsx'
import EditItemModal from '../components/profile/EditItemModal.jsx'
import EditCertModal from '../components/profile/EditCertModal.jsx'
import Modal from '../components/profile/Modal.jsx'
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
  const location = useLocation()

  // ---- data ----
  const { profile: serverProfile, initiatives, loading, error, refetch } = useProfile()

  // ---- local state (mirrors server until real mutations exist) ----
  const [profile,    setProfile]    = useState(location.state?.profile ?? null)
  const [inits,      setInits]      = useState(location.state?.initiatives ?? null)
  const [avatar,     setAvatar]     = useState(location.state?.avatar ?? null)        // base64 dataURL
  const [cover,      setCover]      = useState(location.state?.cover ?? location.state?.profile?.cover ?? null) // base64 dataURL
  const [tab,        setTab]        = useState(location.state?.tab ?? 'overview')
  const [shareOpen,  setShareOpen]  = useState(false)
  const [copyDone,   setCopyDone]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  // ---- Modal states for Overview, Education, Projects, Pubs, Achievements ----
  const [editDetailsOpen, setEditDetailsOpen] = useState(false)
  const [editAboutOpen,   setEditAboutOpen]   = useState(false)
  // editPillsConfig: { field: 'skills' | 'interests' | 'domains', title: string, subtitle: string } | null
  const [editPillsConfig, setEditPillsConfig] = useState(null)
  // editEducationModal: { mode: 'add' } | { mode: 'edit', item } | null
  const [editEducationModal, setEditEducationModal] = useState(null)
  // editProjectModal: { mode: 'add' } | { mode: 'edit', item } | null
  const [editProjectModal, setEditProjectModal] = useState(null)
  // editItemModal: { type: 'publication' | 'achievement', mode: 'add' | 'edit', item } | null
  const [editItemModal, setEditItemModal] = useState(null)
  // editCertModal: { mode: 'add' } | { mode: 'edit', item } | null
  const [editCertModal, setEditCertModal] = useState(null)
  // showAllCerts: boolean — toggle all certificates view inside nested profile block
  const [showAllCerts, setShowAllCerts] = useState(false)
  // viewingPhoto: { title: string, url: string } | null — image viewer modal for certificates
  const [viewingPhoto, setViewingPhoto] = useState(null)

  // ---- inline edit / add / delete state ----
  // editingItem: { field: string, id: string } | null  — which row is being edited
  const [editingItem,    setEditingItem]    = useState(null)
  // addingField: string | null — which section's add form is open
  const [addingField,    setAddingField]    = useState(null)
  // confirmDelete: { field, id, label } | null — pending remove awaiting confirmation
  const [confirmDelete,  setConfirmDelete]  = useState(null)

  // ---- sync server → local once loaded ----
  if (serverProfile && !profile) {
    setProfile(serverProfile)
    setAvatar(serverProfile.avatar)
    setCover(serverProfile.cover || null)
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
  //  COVER PHOTO UPLOAD (canvas resize to max 1200px width)
  // ================================================================
  const handleCoverUpload = useCallback(e => {
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
        const maxW = 1200
        const scale = img.width > maxW ? maxW / img.width : 1
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        const coverData = c.toDataURL('image/jpeg', 0.85)
        setCover(coverData)
        setProfile(p => (p ? { ...p, cover: coverData } : p))
      }
      img.onerror = () => alert("That image couldn't be read.")
      img.src = ev.target.result
    }
    reader.readAsDataURL(f)
  }, [])

  const handleCoverClear = () => {
    setCover(null)
    setProfile(p => (p ? { ...p, cover: null } : p))
  }

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
  //  EDIT / ADD / DELETE HELPERS
  // ================================================================
  /** Open inline edit form for a specific item; close any open add form */
  function startEdit(field, id) {
    setAddingField(null)
    setEditingItem({ field, id })
  }

  /** Cancel edit without saving */
  function cancelEdit() {
    setEditingItem(null)
  }

  /** Save edited values back to local state */
  function saveEdit(field, id, values) {
    setProfile(p => ({
      ...p,
      [field]: (p[field] || []).map(x => x.id === id ? { ...x, ...values } : x),
    }))
    setEditingItem(null)
  }

  /** Toggle add form for a section; close any open edit */
  function openAdd(field) {
    setEditingItem(null)
    setAddingField(f => f === field ? null : field)
  }

  /** Request delete — shows ConfirmDialog; onConfirm calls removeItem */
  function requestDelete(field, id, label) {
    setConfirmDelete({ field, id, label })
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
      {/* Personal details */}
      <SectionCard
        title="Personal details"
        action={
          <button
            type="button"
            id="btn-edit-personal-details"
            onClick={() => setEditDetailsOpen(true)}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Edit personal details"
            aria-label="Edit personal details"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        }
      >
        <div className="mt-4 space-y-0">
          <KVRow label="Full name"    value={profile.name}   />
          <KVRow label="Headline"     value={profile.headline} />
          <KVRow label="Organisation" value={profile.org}    />
          <KVRow label="Region"       value={profile.region} />
          <KVRow label="Email"        value={profile.email}  last />
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard
        title="About"
        action={
          <button
            type="button"
            id="btn-edit-about"
            onClick={() => setEditAboutOpen(true)}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Edit about"
            aria-label="Edit about"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        }
      >
        <div className="mt-4">
          {profile.about ? (
            <p className="text-[13.5px] text-ink-900 leading-relaxed whitespace-pre-wrap">
              {profile.about}
            </p>
          ) : (
            <p className="text-[13px] text-graphite-dim italic">
              Write a short summary about your background, expertise, and what drives you.
            </p>
          )}
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
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-graphite-dim">Active</span>
                  {/* Go to view button — stub; wire to dashboard view when teammate's shell is merged */}
                  <button
                    type="button"
                    id={`btn-go-to-view-${r.key}`}
                    onClick={() => navigate(`/dashboard?view=${r.key}`)}
                    title={`Go to your ${r.label} view`}
                    className={[
                      'inline-flex items-center gap-1 px-2.5 py-[4px] text-[11.5px] font-semibold',
                      'border border-paper-line rounded-[2px] bg-white text-graphite-dim',
                      'hover:border-signal hover:text-signal transition-colors cursor-pointer',
                    ].join(' ')}
                  >
                    Go to view →
                  </button>
                </div>
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
      <SectionCard
        title="Interests"
        action={
          <button
            type="button"
            id="btn-edit-interests"
            onClick={() => setEditPillsConfig({
              field: 'interests',
              title: 'Edit interests',
              subtitle: 'Add or remove topics you are curious about.',
            })}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Edit interests"
            aria-label="Edit interests"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        }
      >
        <div className="flex flex-wrap gap-2 mt-4">
          {(profile.interests ?? []).length > 0
            ? (profile.interests ?? []).map(x => <Pill key={x}>{x}</Pill>)
            : <span className="text-[13px] text-graphite-dim">Nothing added yet</span>
          }
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard
        title="Skills"
        action={
          <button
            type="button"
            id="btn-edit-skills"
            onClick={() => setEditPillsConfig({
              field: 'skills',
              title: 'Edit skills',
              subtitle: 'Add or remove your technical and practical skills.',
            })}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Edit skills"
            aria-label="Edit skills"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        }
      >
        <div className="flex flex-wrap gap-2 mt-4">
          {(profile.skills ?? []).length > 0
            ? (profile.skills ?? []).map(x => <Pill key={x}>{x}</Pill>)
            : <span className="text-[13px] text-graphite-dim">Nothing added yet</span>
          }
        </div>
      </SectionCard>

      {/* Domains */}
      <SectionCard
        title="Domains"
        action={
          <button
            type="button"
            id="btn-edit-domains"
            onClick={() => setEditPillsConfig({
              field: 'domains',
              title: 'Edit domains',
              subtitle: 'Add or remove industry domains you focus on.',
            })}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Edit domains"
            aria-label="Edit domains"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        }
      >
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
  // ---- EDUCATION ----
  // Sort education entries by timeline (most recent first; ongoing at the very top)
  const sortedEducation = [...(profile.education ?? [])].sort((a, b) => {
    if (a.isOngoing && !b.isOngoing) return -1
    if (!a.isOngoing && b.isOngoing) return 1
    const yearA = parseInt(a.endYear || a.startYear || 0, 10)
    const yearB = parseInt(b.endYear || b.startYear || 0, 10)
    return yearB - yearA
  })

  const EducationTab = (
    <SectionCard
      title="Education"
      action={
        <button
          type="button"
          id="btn-add-education"
          onClick={() => setEditEducationModal({ mode: 'add', item: null })}
          className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
          title="Add education"
          aria-label="Add education"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      }
    >
      {sortedEducation.length > 0 ? (
        <div className="mt-4 divide-y divide-paper-line">
          {sortedEducation.map(e => {
            const degreeText = [e.degree || e.title, e.specialization].filter(Boolean).join(' · ')
            const instText = [e.institution || e.org, e.boardOrUniversity].filter(Boolean).join(' · ')
            const timeText = [
              e.startYear && e.endYear ? `${e.startYear} – ${e.endYear}` : (e.endYear || e.startYear || ''),
              e.location,
            ].filter(Boolean).join(' · ')

            return (
              <div key={e.id} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-[20px] flex-none mt-0.5">🎓</span>
                  <div className="min-w-0">
                    <h4 className="text-[13.5px] font-bold text-ink-900 leading-snug">
                      {degreeText || 'Education'}
                    </h4>
                    {instText && (
                      <p className="text-[13px] text-ink-900 mt-0.5">
                        {instText}
                      </p>
                    )}
                    {timeText && (
                      <p className="text-[11.5px] text-graphite-dim mt-0.5">
                        {timeText}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    type="button"
                    onClick={() => setEditEducationModal({ mode: 'edit', item: e })}
                    className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
                    title={`Edit ${degreeText || 'education'}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-[14px] text-graphite-dim">No education added.</p>
          <p className="text-[12px] text-graphite-dim mt-1.5">Add your educational background.</p>
          <button
            type="button"
            onClick={() => setEditEducationModal({ mode: 'add', item: null })}
            className="mt-4 px-4 py-2 text-[13px] font-semibold text-signal border border-signal hover:bg-signal-soft rounded-[2px] cursor-pointer transition-colors"
          >
            + Add Education
          </button>
        </div>
      )}
    </SectionCard>
  )

  // ---- PROJECTS ----
  // ---- PROJECTS ----
  const ProjectsTab = (
    <div className="space-y-4">
      {/* Projects */}
      <SectionCard
        title="Projects"
        action={
          <button
            type="button"
            id="btn-add-project"
            onClick={() => setEditProjectModal({ mode: 'add', item: null })}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Add project"
            aria-label="Add project"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      >
        {(profile.projects ?? []).length > 0 ? (
          <div className="mt-4 divide-y divide-paper-line">
            {(profile.projects ?? []).map(p => (
              <div key={p.id} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-[20px] flex-none mt-0.5">📁</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13.5px] font-bold text-ink-900 leading-snug">
                        {p.title}
                      </h4>
                      {p.shared ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px]">
                          ✓ Shared on public profile
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-paper text-graphite-dim border border-paper-line rounded-[2px]">
                          Private
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-[12.5px] text-graphite-dim mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {/* Tech stack pills */}
                    {p.techStack && p.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.techStack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[11px] bg-paper border border-paper-line rounded-[2px] text-ink-900 font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links row */}
                    {(p.sourceLink || p.liveLink || p.docsLink || p.link) && (
                      <div className="flex items-center gap-3 mt-2 text-[12px]">
                        {(p.sourceLink || p.link) && (
                          <a
                            href={(p.sourceLink || p.link).startsWith('http') ? (p.sourceLink || p.link) : `https://${p.sourceLink || p.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-signal hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>Source code ↗</span>
                          </a>
                        )}
                        {p.liveLink && (
                          <a
                            href={p.liveLink.startsWith('http') ? p.liveLink : `https://${p.liveLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-signal hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>Live demo ↗</span>
                          </a>
                        )}
                        {p.docsLink && (
                          <a
                            href={p.docsLink.startsWith('http') ? p.docsLink : `https://${p.docsLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-signal hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>Docs ↗</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    type="button"
                    onClick={() => setEditProjectModal({ mode: 'edit', item: p })}
                    className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
                    title={`Edit ${p.title}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[14px] text-graphite-dim">No projects added yet.</p>
            <p className="text-[12px] text-graphite-dim mt-1.5">Showcase your technical work.</p>
            <button
              type="button"
              onClick={() => setEditProjectModal({ mode: 'add', item: null })}
              className="mt-3 px-4 py-1.5 text-[13px] font-semibold text-signal border border-signal hover:bg-signal-soft rounded-[2px] cursor-pointer transition-colors"
            >
              + Add Project
            </button>
          </div>
        )}
      </SectionCard>

      {/* Publications */}
      <SectionCard
        title="Publications"
        action={
          <button
            type="button"
            id="btn-add-publication"
            onClick={() => setEditItemModal({ type: 'publication', mode: 'add', item: null })}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Add publication"
            aria-label="Add publication"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      >
        {(profile.publications ?? []).length > 0 ? (
          <div className="mt-4 divide-y divide-paper-line">
            {(profile.publications ?? []).map(p => (
              <div key={p.id} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-[20px] flex-none mt-0.5">📄</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13.5px] font-bold text-ink-900 leading-snug">
                        {p.title}
                      </h4>
                      {p.shared ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px]">
                          ✓ Shared
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-paper text-graphite-dim border border-paper-line rounded-[2px]">
                          Private
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-[12.5px] text-graphite-dim mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {p.link && (
                      <a
                        href={p.link.startsWith('http') ? p.link : `https://${p.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-signal hover:underline text-[12px] mt-1.5 inline-block font-medium"
                      >
                        Paper / Link ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    type="button"
                    onClick={() => setEditItemModal({ type: 'publication', mode: 'edit', item: p })}
                    className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
                    title={`Edit ${p.title}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[14px] text-graphite-dim">No publications added yet.</p>
            <p className="text-[12px] text-graphite-dim mt-1.5">Share your research and papers.</p>
            <button
              type="button"
              onClick={() => setEditItemModal({ type: 'publication', mode: 'add', item: null })}
              className="mt-3 px-4 py-1.5 text-[13px] font-semibold text-signal border border-signal hover:bg-signal-soft rounded-[2px] cursor-pointer transition-colors"
            >
              + Add Publication
            </button>
          </div>
        )}
      </SectionCard>

      {/* Achievements */}
      <SectionCard
        title="Achievements"
        action={
          <button
            type="button"
            id="btn-add-achievement"
            onClick={() => setEditItemModal({ type: 'achievement', mode: 'add', item: null })}
            className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
            title="Add achievement"
            aria-label="Add achievement"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      >
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Highlight hackathon wins, honors, or milestones. Toggle "Share on public profile" to show on your link.
        </p>
        {(profile.achievements ?? []).length > 0 ? (
          <div className="mt-4 divide-y divide-paper-line">
            {[...(profile.achievements ?? [])].reverse().map(a => (
              <div key={a.id} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-[20px] flex-none mt-0.5">🏅</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13.5px] font-bold text-ink-900 leading-snug">
                        {a.title}
                      </h4>
                      {a.shared ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px]">
                          ✓ Shared
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-paper text-graphite-dim border border-paper-line rounded-[2px]">
                          Private
                        </span>
                      )}
                    </div>

                    {a.description && (
                      <p className="text-[12.5px] text-graphite-dim mt-1 leading-relaxed">
                        {a.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    type="button"
                    onClick={() => setEditItemModal({ type: 'achievement', mode: 'edit', item: a })}
                    className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
                    title={`Edit ${a.title}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">Nothing added yet.</p>
        )}
      </SectionCard>
    </div>
  )

  // ---- CERTIFICATES ----
  const earnedCerts  = inits?.completed ?? []
  const pendingCerts = inits?.pending   ?? []
  const totalEarned  = earnedCerts.length
  const totalPending = pendingCerts.length
  // Cap displayed certs to 2 in the tab — user can see all via "Show all"
  const CERT_PREVIEW_LIMIT = 2
  const displayedCerts = earnedCerts.slice(0, CERT_PREVIEW_LIMIT)

  // Reusable Self-added certificates SectionCard for both preview and expanded views
  const SelfAddedCertsSection = (
    <SectionCard
      title="Other certificates added by you"
      action={
        <button
          type="button"
          id="btn-add-cert"
          onClick={() => setEditCertModal({ mode: 'add', item: null })}
          className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
          title="Add certificate"
          aria-label="Add certificate"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      }
    >
      <p className="text-[13px] text-graphite-dim mt-1 mb-4">
        Unverified — credentials earned elsewhere. Turn on "Share on public profile" to include on your public link.
      </p>
      {(profile.selfCerts ?? []).length > 0 ? (
        <div className="mt-4 divide-y divide-paper-line">
          {(profile.selfCerts ?? []).map(c => (
            <div key={c.id} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group">
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-[20px] flex-none mt-0.5">📜</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[13.5px] font-bold text-ink-900 leading-snug">
                      {c.title}
                    </h4>
                    {c.shared ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#e7f6ee] text-[#0f9d58] rounded-[2px]">
                        ✓ Shared on public profile
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-paper text-graphite-dim border border-paper-line rounded-[2px]">
                        Private
                      </span>
                    )}
                  </div>

                  {(c.org || c.issueDate || c.date) && (
                    <p className="text-[12.5px] text-graphite-dim mt-0.5">
                      {[c.org, c.issueDate || c.date].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-1.5 text-[12px] flex-wrap">
                    {c.link && (
                      <a
                        href={c.link.startsWith('http') ? c.link : `https://${c.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-signal hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <span>Credential link ↗</span>
                      </a>
                    )}
                    {(c.photo || c.proofUrl) && (
                      <button
                        type="button"
                        onClick={() => setViewingPhoto({ title: c.title, url: c.photo || c.proofUrl })}
                        className="text-signal hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>🖼️ View certificate image</span>
                      </button>
                    )}
                  </div>

                  {(c.photo || c.proofUrl) && (
                    <button
                      type="button"
                      onClick={() => setViewingPhoto({ title: c.title, url: c.photo || c.proofUrl })}
                      className="mt-2 block rounded-[2px] border border-paper-line overflow-hidden w-20 h-14 bg-paper hover:opacity-90 cursor-pointer"
                      title="Click to view certificate photo"
                    >
                      <img
                        src={c.photo || c.proofUrl}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-none">
                <button
                  type="button"
                  onClick={() => setEditCertModal({ mode: 'edit', item: c })}
                  className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
                  title={`Edit ${c.title}`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-[14px] text-graphite-dim">No certificates added yet.</p>
          <p className="text-[12px] text-graphite-dim mt-1.5">Add external licenses or certificates you have earned.</p>
          <button
            type="button"
            onClick={() => setEditCertModal({ mode: 'add', item: null })}
            className="mt-3 px-4 py-1.5 text-[13px] font-semibold text-signal border border-signal hover:bg-signal-soft rounded-[2px] cursor-pointer transition-colors"
          >
            + Add Certificate
          </button>
        </div>
      )}
    </SectionCard>
  )

  const CertificatesTab = showAllCerts ? (
    <div className="space-y-4">
      {/* Back button header inside nested block */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          id="btn-back-to-certs-summary"
          onClick={() => setShowAllCerts(false)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-signal hover:underline cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to certificates summary</span>
        </button>
        <span className="text-[12px] font-semibold text-graphite-dim">
          All Certificates ({totalEarned + totalPending})
        </span>
      </div>

      {/* Full H2S Verified Credentials list */}
      <SectionCard
        title={
          <span className="flex items-center gap-2 flex-wrap">
            H2S Verified Credentials
            <span className="font-normal text-[13px] text-ink-900">({totalEarned})</span>
          </span>
        }
      >
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Issued automatically the moment an initiative closes — read-only, verifiable credentials.
        </p>
        {earnedCerts.length > 0 ? (
          earnedCerts.map(o => (
            <AchRow
              key={o.id}
              icon=""
              title={o.name}
              subtitle={`${o.org} · Verifiable ID ${o.verifiableId}`}
              verified
              verifiedId={o.verifiableId}
              onView={() => navigate(`/profile/certificate/${o.id}`, {
                state: {
                  cert: o,
                  userName: profile.name,
                  returnTo: { path: '/profile', state: { tab: 'certificates' } },
                },
              })}
            />
          ))
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">
            Nothing yet — certificates appear automatically when an initiative closes.
          </p>
        )}

        {/* Pending certs — shown under the same section, dimmed */}
        {pendingCerts.length > 0 && (
          <div className="pt-4 mt-2 border-t border-paper-line">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-graphite-dim mb-1">
              Pending ({pendingCerts.length})
            </p>
            <p className="text-[12px] text-graphite-dim mb-2">
              These initiatives closed or are in review — your certificate will appear here once issued.
            </p>
            {pendingCerts.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-3 border-b border-paper-line last:border-0 opacity-60">
                <span className="text-[20px]">⏳</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-ink-900">{c.name}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#fff8e7] text-[#b08000] rounded-[2px] uppercase">
                      ⏳ Pending
                    </span>
                  </div>
                  <p className="text-[12px] text-graphite-dim mt-0.5">{c.org}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Self-added certificates */}
      {SelfAddedCertsSection}
    </div>
  ) : (
    <div className="space-y-4">
      {/* H2S Verified (preview of 2) */}
      <SectionCard
        title={
          <span className="flex items-center gap-2 flex-wrap">
            H2S Verified Certificates
            <span className="font-normal text-[13px] text-ink-900">({totalEarned})</span>
            {totalPending > 0 && (
              <span className="font-normal text-[12px] text-graphite-dim/70">{totalPending} pending</span>
            )}
          </span>
        }
      >
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Issued automatically the moment an initiative closes — read-only, never editable.
        </p>
        {displayedCerts.length > 0 ? (
          displayedCerts.map(o => (
            <AchRow
              key={o.id}
              icon=""
              title={o.name}
              subtitle={`${o.org} · Verifiable ID ${o.verifiableId}`}
              verified
              verifiedId={o.verifiableId}
              onView={() => navigate(`/profile/certificate/${o.id}`, {
                state: {
                  cert: o,
                  userName: profile.name,
                  returnTo: { path: '/profile', state: { tab: 'certificates' } },
                },
              })}
            />
          ))
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">
            Nothing yet — certificates appear automatically when an initiative closes.
          </p>
        )}

        {/* LinkedIn-style full-width "Show all certificates" button opening in same nested block */}
        {(totalEarned > 0 || totalPending > 0) && (
          <button
            id="btn-show-all-certs"
            type="button"
            onClick={() => setShowAllCerts(true)}
            className={[
              'w-full mt-4 py-3 text-[13.5px] font-semibold text-graphite-dim',
              'border-t border-paper-line hover:bg-paper transition-colors cursor-pointer',
              'flex items-center justify-center gap-1.5 rounded-b-card -mx-[1px] -mb-[1px]',
            ].join(' ')}
          >
            Show all certificates
            {totalEarned + totalPending > CERT_PREVIEW_LIMIT && (
              <span className="text-[12px] text-graphite-dim/60">({totalEarned + totalPending})</span>
            )}
            <span className="text-[14px]">→</span>
          </button>
        )}
      </SectionCard>

      {/* Self-added */}
      {SelfAddedCertsSection}
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
    <div className="w-full">
      <div className="max-w-[800px] mx-auto pb-12">

        {/* ── Profile header card ── */}
        <div className="bg-white border border-paper-line rounded-card overflow-hidden shadow-[0_1px_2px_rgba(16,18,35,.06),0_8px_24px_-12px_rgba(16,18,35,.18)] mb-6">
          <CoverBand
            src={cover}
            onUpload={handleCoverUpload}
            onClear={handleCoverClear}
          />

          <div className="px-5 pb-5" style={{ marginTop: '-38px' }}>
            {/* avatar + actions row */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              {/* avatar (upload affordance with visible '+' badge) */}
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
                  onClick={() => navigate('/profile/preview', { state: { profile, avatar, initiatives: inits } })}
                  className="mt-2 text-signal hover:underline text-[11.5px] font-medium inline-block cursor-pointer"
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
        <TabBar tabs={TABS} active={tab} onSelect={(newTab) => { setTab(newTab); setShowAllCerts(false); }} />

        {/* ── Tab panel ── */}
        <div
          id={`profile-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`profile-tab-${tab}`}
        >
          {TAB_BODY[tab] ?? null}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title="Remove this entry?"
          message={`"${confirmDelete.label}" will be permanently removed from your profile. This cannot be undone.`}
          confirmLabel="Remove"
          onConfirm={() => {
            removeItem(confirmDelete.field, confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Edit Personal Details Modal */}
      <EditPersonalDetailsModal
        isOpen={editDetailsOpen}
        initialData={{
          name: profile.name || '',
          headline: profile.headline || '',
          org: profile.org || '',
          region: profile.region || '',
          email: profile.email || '',
        }}
        onSave={({ name, headline, org, region }) => {
          setProfile(p => (p ? { ...p, name, headline, org, region } : p))
          setEditDetailsOpen(false)
        }}
        onClose={() => setEditDetailsOpen(false)}
      />

      {/* Edit About Modal */}
      <EditAboutModal
        isOpen={editAboutOpen}
        initialAbout={profile.about || ''}
        onSave={(about) => {
          setProfile(p => (p ? { ...p, about } : p))
          setEditAboutOpen(false)
        }}
        onClose={() => setEditAboutOpen(false)}
      />

      {/* Edit Pills Modal (Reusable for Interests, Skills, Domains) */}
      {editPillsConfig && (
        <EditPillsModal
          isOpen={!!editPillsConfig}
          title={editPillsConfig.title}
          subtitle={editPillsConfig.subtitle}
          initialItems={profile[editPillsConfig.field] || []}
          onSave={(newItems) => {
            updateField(editPillsConfig.field, newItems)
            setEditPillsConfig(null)
          }}
          onClose={() => setEditPillsConfig(null)}
        />
      )}

      {/* Edit / Add Education Modal */}
      {editEducationModal && (
        <EditEducationModal
          isOpen={!!editEducationModal}
          initialData={editEducationModal.mode === 'edit' ? editEducationModal.item : null}
          onSave={(savedItem) => {
            if (editEducationModal.mode === 'add') {
              addItem('education', { ...savedItem, id: uid('edu') })
            } else {
              setProfile(p => ({
                ...p,
                education: (p.education || []).map(x => x.id === savedItem.id ? savedItem : x),
              }))
            }
            setEditEducationModal(null)
          }}
          onDelete={(idToDelete, label) => {
            setEditEducationModal(null)
            requestDelete('education', idToDelete, label || 'Education')
          }}
          onClose={() => setEditEducationModal(null)}
        />
      )}

      {/* Edit / Add Project Modal */}
      {editProjectModal && (
        <EditProjectModal
          isOpen={!!editProjectModal}
          initialData={editProjectModal.mode === 'edit' ? editProjectModal.item : null}
          onSave={(savedItem) => {
            if (editProjectModal.mode === 'add') {
              addItem('projects', { ...savedItem, id: uid('proj') })
            } else {
              setProfile(p => ({
                ...p,
                projects: (p.projects || []).map(x => x.id === savedItem.id ? savedItem : x),
              }))
            }
            setEditProjectModal(null)
          }}
          onDelete={(idToDelete, label) => {
            setEditProjectModal(null)
            requestDelete('projects', idToDelete, label || 'Project')
          }}
          onClose={() => setEditProjectModal(null)}
        />
      )}

      {/* Edit / Add Publication or Achievement Modal */}
      {editItemModal && (
        <EditItemModal
          isOpen={!!editItemModal}
          type={editItemModal.type}
          initialData={editItemModal.mode === 'edit' ? editItemModal.item : null}
          onSave={(savedItem) => {
            const field = editItemModal.type === 'publication' ? 'publications' : 'achievements'
            const prefix = editItemModal.type === 'publication' ? 'pub' : 'ach'
            if (editItemModal.mode === 'add') {
              addItem(field, { ...savedItem, id: uid(prefix) })
            } else {
              setProfile(p => ({
                ...p,
                [field]: (p[field] || []).map(x => x.id === savedItem.id ? savedItem : x),
              }))
            }
            setEditItemModal(null)
          }}
          onDelete={(idToDelete, label) => {
            const field = editItemModal.type === 'publication' ? 'publications' : 'achievements'
            setEditItemModal(null)
            requestDelete(field, idToDelete, label || (editItemModal.type === 'publication' ? 'Publication' : 'Achievement'))
          }}
          onClose={() => setEditItemModal(null)}
        />
      )}

      {/* Edit / Add Self-Added Certificate Modal */}
      {editCertModal && (
        <EditCertModal
          isOpen={!!editCertModal}
          initialData={editCertModal.mode === 'edit' ? editCertModal.item : null}
          onSave={(savedItem) => {
            if (editCertModal.mode === 'add') {
              addItem('selfCerts', { ...savedItem, id: uid('sc') })
            } else {
              setProfile(p => ({
                ...p,
                selfCerts: (p.selfCerts || []).map(x => x.id === savedItem.id ? savedItem : x),
              }))
            }
            setEditCertModal(null)
          }}
          onDelete={(idToDelete, label) => {
            setEditCertModal(null)
            requestDelete('selfCerts', idToDelete, label || 'Certificate')
          }}
          onClose={() => setEditCertModal(null)}
        />
      )}

      {/* Certificate Photo Viewer Modal */}
      {viewingPhoto && (
        <Modal
          isOpen={!!viewingPhoto}
          title={viewingPhoto.title || 'Certificate document'}
          subtitle="Uploaded certificate image or credential scan."
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
            <div className="mt-4 flex items-center justify-between w-full pt-3 border-t border-paper-line">
              <a
                href={viewingPhoto.url}
                download={`${(viewingPhoto.title || 'certificate').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`}
                className="px-3.5 py-1.5 text-[12px] font-semibold text-ink-900 border border-paper-line bg-white hover:bg-paper rounded-[2px] cursor-pointer transition-colors"
              >
                Download certificate
              </a>
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
