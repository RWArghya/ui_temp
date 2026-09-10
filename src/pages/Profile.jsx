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
import EditHeadlineModal from '../components/profile/EditHeadlineModal.jsx'
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
  const [editHeadlineOpen, setEditHeadlineOpen] = useState(false)

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
            editingItem?.field === 'education' && editingItem?.id === e.id ? (
              <div key={e.id} className="py-3 border-b border-paper-line">
                <p className="text-[11.5px] text-graphite-dim mb-2">Editing: <strong>{e.title}</strong></p>
                <InlineAddForm
                  fields={[
                    { id: 'title', placeholder: 'e.g. B.Tech, Computer Science', required: true },
                    { id: 'org',   placeholder: 'Institution (optional)', required: false },
                  ]}
                  addLabel="Save Education"
                  submitLabel="Save Changes"
                  initialValues={e}
                  onAdd={values => saveEdit('education', e.id, values)}
                  onCancel={cancelEdit}
                />
              </div>
            ) : (
              <AchRow
                key={e.id}
                icon="🎓"
                title={e.title}
                subtitle={e.org}
                onEdit={() => startEdit('education', e.id)}
                onRemove={() => requestDelete('education', e.id, e.title)}
              />
            )
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-[14px] text-graphite-dim">No education added.</p>
          <p className="text-[12px] text-graphite-dim mt-1.5">Add your educational background.</p>
        </div>
      )}
      {/* Add form — collapsed by default, expands on button click */}
      <InlineAddForm
        fields={[
          { id: 'title', placeholder: 'e.g. B.Tech, Computer Science', required: true },
          { id: 'org',   placeholder: 'Institution (optional)', required: false },
        ]}
        addLabel="+ Add Education"
        collapsible
        onAdd={({ title, org }) => {
          if (!title.trim()) return
          addItem('education', { id: uid('edu'), title: title.trim(), org: org.trim() })
          setAddingField(null)
        }}
        onCancel={() => setAddingField(null)}
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
              editingItem?.field === 'projects' && editingItem?.id === p.id ? (
                <div key={p.id} className="py-3 border-b border-paper-line">
                  <p className="text-[11.5px] text-graphite-dim mb-2">Editing: <strong>{p.title}</strong></p>
                  <InlineAddForm
                    fields={[
                      { id: 'title', placeholder: 'Project title', required: true },
                      { id: 'link',  placeholder: 'Link (optional)', required: false },
                    ]}
                    addLabel="Save Project"
                    submitLabel="Save Changes"
                    initialValues={p}
                    onAdd={values => saveEdit('projects', p.id, values)}
                    onCancel={cancelEdit}
                  />
                </div>
              ) : (
                <AchRow
                  key={p.id}
                  icon="📁"
                  title={p.title}
                  subtitle={p.link}
                  shared={p.shared}
                  onShare={() => toggleShare('projects', p.id)}
                  onEdit={() => startEdit('projects', p.id)}
                  onRemove={() => requestDelete('projects', p.id, p.title)}
                />
              )
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[14px] text-graphite-dim">No projects added yet.</p>
            <p className="text-[12px] text-graphite-dim mt-1.5">Showcase your technical work.</p>
          </div>
        )}
        <InlineAddForm
          fields={[
            { id: 'title', placeholder: 'Project title',   required: true  },
            { id: 'link',  placeholder: 'Link (optional)', required: false },
          ]}
          addLabel="+ Add Project"
          collapsible
          onAdd={({ title, link }) => {
            if (!title.trim()) return
            addItem('projects', { id: uid('proj'), title: title.trim(), link: link.trim(), shared: false })
          }}
          onCancel={() => {}}
        />
      </SectionCard>

      {/* Publications */}
      <SectionCard title="Publications">
        {(profile.publications ?? []).length > 0 ? (
          <div className="mt-4">
            {(profile.publications ?? []).map(p => (
              editingItem?.field === 'publications' && editingItem?.id === p.id ? (
                <div key={p.id} className="py-3 border-b border-paper-line">
                  <p className="text-[11.5px] text-graphite-dim mb-2">Editing: <strong>{p.title}</strong></p>
                  <InlineAddForm
                    fields={[
                      { id: 'title', placeholder: 'Publication title', required: true },
                      { id: 'link',  placeholder: 'Link (optional)',    required: false },
                    ]}
                    addLabel="Save Publication"
                    submitLabel="Save Changes"
                    initialValues={p}
                    onAdd={values => saveEdit('publications', p.id, values)}
                    onCancel={cancelEdit}
                  />
                </div>
              ) : (
                <AchRow
                  key={p.id}
                  icon="📄"
                  title={p.title}
                  subtitle={p.link}
                  shared={p.shared}
                  onShare={() => toggleShare('publications', p.id)}
                  onEdit={() => startEdit('publications', p.id)}
                  onRemove={() => requestDelete('publications', p.id, p.title)}
                />
              )
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[14px] text-graphite-dim">No publications added yet.</p>
            <p className="text-[12px] text-graphite-dim mt-1.5">Share your research and papers.</p>
          </div>
        )}
        <InlineAddForm
          fields={[
            { id: 'title', placeholder: 'Publication title', required: true  },
            { id: 'link',  placeholder: 'Link (optional)',    required: false },
          ]}
          addLabel="+ Add Publication"
          collapsible
          onAdd={({ title, link }) => {
            if (!title.trim()) return
            addItem('publications', { id: uid('pub'), title: title.trim(), link: link.trim(), shared: false })
          }}
          onCancel={() => {}}
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
              editingItem?.field === 'achievements' && editingItem?.id === a.id ? (
                <div key={a.id} className="py-3 border-b border-paper-line">
                  <p className="text-[11.5px] text-graphite-dim mb-2">Editing: <strong>{a.title}</strong></p>
                  <InlineAddForm
                    fields={[
                      { id: 'title', placeholder: 'e.g. Runner-up — CityHacks 2025', required: true },
                    ]}
                    addLabel="Save Achievement"
                    submitLabel="Save Changes"
                    initialValues={a}
                    onAdd={values => saveEdit('achievements', a.id, values)}
                    onCancel={cancelEdit}
                  />
                </div>
              ) : (
                <AchRow
                  key={a.id}
                  icon="🏅"
                  title={a.title}
                  shared={a.shared}
                  onShare={() => toggleShare('achievements', a.id)}
                  onEdit={() => startEdit('achievements', a.id)}
                  onRemove={() => requestDelete('achievements', a.id, a.title)}
                />
              )
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">Nothing added yet.</p>
        )}
        <InlineAddForm
          fields={[
            { id: 'title', placeholder: 'e.g. Runner-up — CityHacks 2025', required: true },
          ]}
          addLabel="+ Add Achievement"
          collapsible
          onAdd={({ title }) => {
            if (!title.trim()) return
            addItem('achievements', { id: uid('ach'), title: title.trim(), shared: false })
          }}
          onCancel={() => {}}
        />
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

  const CertificatesTab = (
    <div className="space-y-4">
      {/* H2S Verified */}
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

        {/* LinkedIn-style full-width "Show all certificates" button */}
        {(totalEarned > 0 || totalPending > 0) && (
          <button
            id="btn-show-all-certs"
            type="button"
            onClick={() => navigate('/profile/certificates', { state: { profile, initiatives: inits, avatar } })}
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
      <SectionCard title="Other certificates added by you">
        <p className="text-[13px] text-graphite-dim mt-1 mb-4">
          Unverified — earned elsewhere. Add a link or upload an image as proof. Turn on "shared" to include on your public link.
        </p>
        {(profile.selfCerts ?? []).length > 0 ? (
          <div>
            {(profile.selfCerts ?? []).map(c => (
              editingItem?.field === 'selfCerts' && editingItem?.id === c.id ? (
                <div key={c.id} className="py-3 border-b border-paper-line">
                  <p className="text-[11.5px] text-graphite-dim mb-2">Editing: <strong>{c.title}</strong></p>
                  <InlineAddForm
                    fields={[
                      { id: 'title',    placeholder: 'Certificate name',              required: true  },
                      { id: 'org',      placeholder: 'Issued by (optional)',           required: false },
                      { id: 'link',     placeholder: 'Certificate link (optional)',    required: false, type: 'url',  newRow: true },
                      { id: 'proofUrl', placeholder: 'Add certificate image',          required: false, type: 'file' },
                    ]}
                    addLabel="Save Certificate"
                    submitLabel="Save Changes"
                    initialValues={c}
                    onAdd={values => saveEdit('selfCerts', c.id, values)}
                    onCancel={cancelEdit}
                  />
                </div>
              ) : (
                <AchRow
                  key={c.id}
                  icon="🎓"
                  title={c.title}
                  subtitle={[c.org, c.link].filter(Boolean).join(' · ')}
                  shared={c.shared}
                  onShare={() => toggleShare('selfCerts', c.id)}
                  onEdit={() => startEdit('selfCerts', c.id)}
                  onRemove={() => requestDelete('selfCerts', c.id, c.title)}
                />
              )
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-graphite-dim py-4">Nothing added yet.</p>
        )}
        <InlineAddForm
          fields={[
            { id: 'title',    placeholder: 'Certificate name',             required: true  },
            { id: 'org',      placeholder: 'Issued by (optional)',          required: false },
            { id: 'link',     placeholder: 'Certificate link (optional)',   required: false, type: 'url',  newRow: true },
            { id: 'proofUrl', placeholder: 'Add certificate image',         required: false, type: 'file' },
          ]}
          addLabel="+ Add Certificate"
          collapsible
          onAdd={({ title, org, link, proofUrl }) => {
            if (!title.trim()) return
            addItem('selfCerts', { id: uid('sc'), title: title.trim(), org: org.trim(), link: link.trim(), proofUrl: proofUrl || null, shared: false })
          }}
          onCancel={() => {}}
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

            {/* name + headline with edit button */}
            <div className="mt-3">
              <h1 className="text-[20px] font-display font-bold text-ink-900 leading-tight">
                {profile.name || 'Add your name'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 group">
                <p className="text-[13px] text-graphite-dim">
                  {profile.headline || 'Add a headline'}
                  {profile.org ? <> · {profile.org}</> : null}
                </p>
                <button
                  id="btn-edit-headline"
                  type="button"
                  onClick={() => setEditHeadlineOpen(true)}
                  className="p-1 rounded-[4px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors inline-flex items-center justify-center"
                  title="Edit headline and organization"
                  aria-label="Edit headline and organization"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              </div>
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

      {/* Edit Headline / Intro Modal (LinkedIn-style popup) */}
      <EditHeadlineModal
        isOpen={editHeadlineOpen}
        initialHeadline={profile.headline || ''}
        initialOrg={profile.org || ''}
        onSave={({ headline, org }) => {
          setProfile(p => (p ? { ...p, headline, org } : p))
          setEditHeadlineOpen(false)
        }}
        onClose={() => setEditHeadlineOpen(false)}
      />
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
