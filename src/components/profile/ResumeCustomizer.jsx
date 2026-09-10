import { useState } from 'react'
import SectionCard from './SectionCard.jsx'

export default function ResumeCustomizer({
  profile,
  initiatives,
  config,
  onChangeConfig,
  onGenerate,
  onBack,
}) {
  const {
    sectionOrder = ['skills', 'projects', 'education', 'certifications', 'achievements'],
    includedSections = {
      skills: true,
      projects: true,
      education: true,
      certifications: true,
      achievements: true,
    },
    customItems = {},
  } = config

  // Track which sections are expanded in the UI
  const [expandedSections, setExpandedSections] = useState({
    headerLinks: true,
    projects: true,
    education: true,
    skills: false,
    certifications: false,
    achievements: false,
  })

  // Drag states
  const [draggedSecIndex, setDraggedSecIndex] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [draggedLinkIndex, setDraggedLinkIndex] = useState(null)

  const toggleExpand = (secKey) => {
    setExpandedSections(prev => ({ ...prev, [secKey]: !prev[secKey] }))
  }

  const toggleSectionInclusion = (secKey) => {
    onChangeConfig({
      ...config,
      includedSections: {
        ...includedSections,
        [secKey]: !includedSections[secKey],
      },
    })
  }

  const toggleItemInclusion = (sectionKey, itemId) => {
    const items = (customItems[sectionKey] || []).map(item => {
      if (item.id === itemId) {
        return { ...item, _included: item._included === false ? true : false }
      }
      return item
    })
    onChangeConfig({
      ...config,
      customItems: {
        ...customItems,
        [sectionKey]: items,
      },
    })
  }

  // Toggle include/exclude of a header link (connected profile)
  const toggleLinkInclusion = (linkId) => {
    const links = (customItems.links || []).map(link =>
      link.id === linkId ? { ...link, _included: link._included === false ? true : false } : link
    )
    onChangeConfig({ ...config, customItems: { ...customItems, links } })
  }

  // Reorder connected profile links via drag
  const moveLinkItem = (fromIndex, toIndex) => {
    const links = [...(customItems.links || [])]
    if (toIndex < 0 || toIndex >= links.length) return
    const [moved] = links.splice(fromIndex, 1)
    links.splice(toIndex, 0, moved)
    onChangeConfig({ ...config, customItems: { ...customItems, links } })
  }

  // Move item within section via drag & drop
  const moveItem = (sectionKey, fromIndex, toIndex) => {
    const items = [...(customItems[sectionKey] || [])]
    if (toIndex < 0 || toIndex >= items.length) return
    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved)
    onChangeConfig({
      ...config,
      customItems: {
        ...customItems,
        [sectionKey]: items,
      },
    })
  }

  // Section metadata
  const SECTION_META = {
    skills: {
      title: 'Technical Skills',
      desc: 'Languages, frameworks, databases, and tools',
      getItems: () => customItems.skills || profile?.skills || [],
    },
    projects: {
      title: 'Technical Projects',
      desc: 'Titles, repositories, demo links, tech stacks, and bullet descriptions',
      getItems: () => customItems.projects || profile?.projects || [],
    },
    education: {
      title: 'Education',
      desc: 'Degrees, institutions, timelines, boards/universities, and locations',
      getItems: () => customItems.education || profile?.education || [],
    },
    certifications: {
      title: 'Certifications',
      desc: 'Verified credentials and certificates',
      getItems: () => customItems.certifications || [
        ...(profile?.selfCerts || []),
        ...(initiatives?.completed || []).map(c => ({
          id: `cert-${c.id}`,
          title: c.name,
          org: c.org || 'Hack2skill',
          date: c.issuedOn || '',
          verifiableId: c.verifiableId,
          link: c.link || '',
        })),
      ],
    },
    achievements: {
      title: 'Honors & Achievements',
      desc: 'Milestones, awards, and recognitions',
      getItems: () => customItems.achievements || profile?.achievements || [],
    },
  }

  return (
    <SectionCard
      title="Resume Structure & Preview"
      action={
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              id="btn-back-from-customizer"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold text-graphite-dim border border-paper-line rounded-[2px] bg-white hover:bg-paper cursor-pointer transition-colors"
            >
              ← Back to Profile
            </button>
          )}
          <button
            type="button"
            id="btn-generate-resume-top"
            onClick={onGenerate}
            className="px-4 py-1 text-[12px] font-semibold text-white bg-signal hover:bg-signal-dark rounded-[2px] cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1"
          >
            Generate Resume →
          </button>
        </div>
      }
    >
      <p className="text-[13px] text-graphite-dim mt-1 mb-4">
        Hold and drag the <span className="font-mono font-bold text-ink-900">≡</span> handle to reorder sections or individual items. Use the checkboxes to include or exclude specific entries from your resume.
      </p>

      {/* ── HEADER LINKS PANEL ── */}
      <div className="mb-3 border border-paper-line rounded-[2px]">
        {/* Header Row */}
        <div className="p-3 sm:px-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-[13.5px] font-bold text-ink-900">Header Links</span>
            <span className="px-1.5 py-0.5 text-[10.5px] font-semibold bg-paper text-graphite-dim border border-paper-line rounded-[2px]">
              {(customItems.links || []).filter(l => l._included !== false).length} shown
            </span>
            <span className="text-[11px] text-graphite-dim hidden sm:inline">(phone · email · location are always shown)</span>
          </div>
          <button
            type="button"
            onClick={() => toggleExpand('headerLinks')}
            className="p-1 rounded-[2px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors flex-none"
            title={expandedSections.headerLinks ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-150 ${expandedSections.headerLinks ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Expandable Link List */}
        {expandedSections.headerLinks && (
          <div className="px-3 pb-3 pt-0.5 bg-paper/20 border-t border-paper-line">
            {(customItems.links || []).length === 0 ? (
              <p className="text-[11.5px] text-graphite-dim mt-2">No connected profiles added yet. Add them in the Links tab of your profile.</p>
            ) : (
              <div className="space-y-1.5 mt-2">
                {(customItems.links || []).map((link, lIdx) => {
                  const isChecked = link._included !== false
                  return (
                    <div
                      key={link.id || lIdx}
                      draggable
                      onDragStart={() => setDraggedLinkIndex(lIdx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (draggedLinkIndex !== null && draggedLinkIndex !== lIdx) {
                          moveLinkItem(draggedLinkIndex, lIdx)
                          setDraggedLinkIndex(null)
                        }
                      }}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[2px] border bg-white transition-colors ${
                        isChecked ? 'border-paper-line' : 'border-paper-line/50 opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Drag handle */}
                        <button
                          type="button"
                          className="cursor-grab active:cursor-grabbing text-graphite-dim hover:text-ink-900 p-0.5 flex-none"
                          title="Hold and drag to reorder"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="7" x2="20" y2="7" />
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <line x1="4" y1="17" x2="20" y2="17" />
                          </svg>
                        </button>
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLinkInclusion(link.id)}
                          className="w-3.5 h-3.5 rounded border-paper-line text-signal focus:ring-signal cursor-pointer flex-none"
                        />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-ink-900 leading-snug">{link.platform}</p>
                          <p className="text-[11px] text-graphite-dim truncate">{link.url}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sections List */}
      <div className="divide-y divide-paper-line border border-paper-line rounded-[2px]">
        {sectionOrder.map((secKey, index) => {
          const meta = SECTION_META[secKey]
          if (!meta) return null

          const isIncluded = Boolean(includedSections[secKey])
          const isExpanded = Boolean(expandedSections[secKey])
          const items = meta.getItems()
          const includedCount = Array.isArray(items)
            ? items.filter(it => it._included !== false).length
            : items.length

          return (
            <div
              key={secKey}
              draggable
              onDragStart={() => setDraggedSecIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedSecIndex !== null && draggedSecIndex !== index) {
                  const newOrder = [...sectionOrder]
                  const [moved] = newOrder.splice(draggedSecIndex, 1)
                  newOrder.splice(index, 0, moved)
                  onChangeConfig({ ...config, sectionOrder: newOrder })
                  setDraggedSecIndex(null)
                }
              }}
              className={`transition-colors ${
                isIncluded ? 'bg-white' : 'bg-paper/40 opacity-60'
              }`}
            >
              {/* Section Header Row */}
              <div className="p-3 sm:px-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Drag Handle (3 horizontal lines) */}
                  <button
                    type="button"
                    title="Drag to reorder section"
                    aria-label="Drag to reorder section"
                    className="cursor-grab active:cursor-grabbing p-0.5 text-graphite-dim hover:text-ink-900 flex-none"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="7" x2="20" y2="7" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="17" x2="20" y2="17" />
                    </svg>
                  </button>

                  {/* Include / Exclude Checkbox */}
                  <input
                    type="checkbox"
                    checked={isIncluded}
                    onChange={() => toggleSectionInclusion(secKey)}
                    className="w-4 h-4 rounded border-paper-line text-signal focus:ring-signal cursor-pointer"
                    title={isIncluded ? 'Exclude section' : 'Include section'}
                  />

                  {/* Section Title & Info */}
                  <div
                    className="min-w-0 cursor-pointer select-none flex items-center gap-2 flex-wrap"
                    onClick={() => toggleExpand(secKey)}
                  >
                    <span className="text-[13.5px] font-bold text-ink-900">
                      {meta.title}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10.5px] font-semibold bg-paper text-graphite-dim border border-paper-line rounded-[2px]">
                      {includedCount} included
                    </span>
                  </div>
                </div>

                {/* Parent Section Header: Only the Expand/Collapse Arrow */}
                <button
                  type="button"
                  onClick={() => toggleExpand(secKey)}
                  className="p-1 rounded-[2px] text-graphite-dim hover:text-ink-900 hover:bg-paper cursor-pointer transition-colors flex-none"
                  title={isExpanded ? 'Collapse section' : 'Expand section'}
                  aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {/* Nested Items when expanded */}
              {isExpanded && Array.isArray(items) && items.length > 0 && (
                <div className="px-3 pb-3 pt-0.5 bg-paper/20 border-t border-paper-line">
                  <div className="space-y-1.5 mt-2">
                    {items.map((it, itIdx) => {
                      const isItemChecked = it._included !== false

                      let primaryText = it.title || it.degree || it.name || it
                      let secondaryText = ''
                      let extraBadge = ''

                      if (secKey === 'education') {
                        primaryText = [it.degree, it.specialization].filter(Boolean).join(' in ') || it.title
                        secondaryText = [it.institution || it.org, it.boardOrUniversity, it.location].filter(Boolean).join(' · ')
                        extraBadge = it.isOngoing
                          ? `${it.startYear || ''} – Ongoing`
                          : (it.startYear && it.endYear ? `${it.startYear} – ${it.endYear}` : '')
                      } else if (secKey === 'projects') {
                        primaryText = it.title
                        secondaryText = Array.isArray(it.techStack) ? it.techStack.join(', ') : it.techStack
                        if (it.sourceCodeUrl || it.link) extraBadge = 'Source attached'
                      } else if (secKey === 'certifications') {
                        primaryText = it.title || it.name
                        secondaryText = it.org || it.issuer
                        extraBadge = it.date || ''
                      } else if (secKey === 'achievements') {
                        primaryText = it.title
                        secondaryText = it.description
                      }

                      return (
                        <div
                          key={it.id || itIdx}
                          draggable
                          onDragStart={() => setDraggedItem({ sectionKey: secKey, index: itIdx })}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedItem && draggedItem.sectionKey === secKey && draggedItem.index !== itIdx) {
                              moveItem(secKey, draggedItem.index, itIdx)
                              setDraggedItem(null)
                            }
                          }}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[2px] border bg-white transition-colors ${
                            isItemChecked
                              ? 'border-paper-line'
                              : 'border-paper-line/50 opacity-40 bg-paper/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Drag handle */}
                            <button
                              type="button"
                              className="cursor-grab active:cursor-grabbing text-graphite-dim hover:text-ink-900 p-0.5 flex-none"
                              title="Hold and drag to reorder"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="7" x2="20" y2="7" />
                                <line x1="4" y1="12" x2="20" y2="12" />
                                <line x1="4" y1="17" x2="20" y2="17" />
                              </svg>
                            </button>

                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isItemChecked}
                              onChange={() => toggleItemInclusion(secKey, it.id)}
                              className="w-3.5 h-3.5 rounded border-paper-line text-signal focus:ring-signal cursor-pointer flex-none"
                            />

                            <div className="min-w-0">
                              <p className="text-[12.5px] font-semibold text-ink-900 leading-snug truncate">
                                {primaryText}
                              </p>
                              {secondaryText && (
                                <p className="text-[11px] text-graphite-dim truncate mt-0.5">
                                  {secondaryText}
                                </p>
                              )}
                            </div>
                          </div>

                          {extraBadge && (
                            <span className="text-[11px] text-graphite-dim flex-none hidden sm:inline-block">
                              {extraBadge}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Generate Action */}
      <div className="mt-4 pt-3 border-t border-paper-line flex items-center justify-between gap-3">
        <span className="text-[12px] text-graphite-dim">
          Finished customizing your resume?
        </span>
        <button
          type="button"
          id="btn-generate-resume-bottom"
          onClick={onGenerate}
          className="px-4 py-1.5 text-[12.5px] font-semibold text-white bg-signal hover:bg-signal-dark rounded-[2px] cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1"
        >
          Generate Resume →
        </button>
      </div>
    </SectionCard>
  )
}
