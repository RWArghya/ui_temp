import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import { InitiativeCard, InitiativeRow, ProfileProgress } from './Cards'
import { activeList, recommendedList, nextStepFor, savedList, recentViews, byId, profileScore } from './data'
import useMedia from '../hooks/useMedia'

/* ============================================================================
   Home + the list pages that hang off it.
   Home reads top to bottom as: status band (overview + profile completion),
   Continue (a work list), Recommended (browse cards; rows on phones).
   "View all" swaps only the main column (sidebar stays mounted) via
   go('activity') / go('recommended').
   ============================================================================ */

export function EmptyState({ ico, title, msg, cta }) {
  return (
    <div className="empty-state">
      <span className="icon-chip lg blue"><Icon name={ico} size={24} /></span>
      {title ? <h3 className="mt8">{title}</h3> : null}
      <p className="small muted" style={{ maxWidth: 360 }}>{msg}</p>
      {cta}
    </div>
  )
}

/* One row of cards. Columns come from CSS (.dash-cards-row); this only works
   out how many fit so the row shows exactly that many — the rest are one
   "View all" away. */
function SingleRowGrid({ items, renderCard, minColWidth = 240, gap = 16 }) {
  const containerRef = useRef(null)
  const [cols, setCols] = useState(3)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setCols(Math.max(1, Math.floor((w + gap) / (minColWidth + gap))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [minColWidth, gap])

  return <div ref={containerRef} className="dash-cards-row">{items.slice(0, cols).map(renderCard)}</div>
}

/* title + count + "View all" — shared by Home and every list page */
export function SectionHeader({ title, count, icon, onViewAll, viewAllLabel = 'View all' }) {
  return (
    <div className="sec-head">
      <div className="sec-head-l">
        {icon ? <Icon name={icon} size={18} /> : null}
        <h2>{title}</h2>
        {count != null ? <span className="sec-count">{count}</span> : null}
      </div>
      {onViewAll ? <button type="button" className="link-more" onClick={onViewAll}>{viewAllLabel} <Icon name="ArrowRight" size={13} /></button> : null}
    </div>
  )
}

export function Home({ st, sv, go }) {
  const phone = useMedia('(max-width: 520px)')
  const active = activeList(st)
  const recs = recommendedList(st)

  const learnActive = active.filter(o => o.purpose === 'learning')
  const buildActive = active.filter(o => o.purpose === 'learncompete')
  const competeActive = active.filter(o => o.purpose === 'competing')

  /* shortcuts into My Activity — a quiet row of numbers, not four tiles */
  const stats = [
    { title: 'Total Ongoing', value: active.length, subtext: 'All active tracks', icon: 'Activity', to: [] },
    { title: 'Courses Enrolled', value: learnActive.length, subtext: 'Masterclasses & cohorts', icon: 'GraduationCap', to: [null, 'learning'] },
    { title: 'Build Challenges', value: buildActive.length, subtext: 'Prototypes in dev', icon: 'Wrench', to: [null, 'learncompete'] },
    { title: 'Hackathons', value: competeActive.length, subtext: 'Active competitions', icon: 'Trophy', to: [null, 'competing'] },
  ]

  return (
    <div className="dash-home">
      <div className="band-w">
        <section className={`band${profileScore(st).pct < 100 ? ' has-pz' : ''}`}>
          <nav className="dash-stats" aria-label="Overview">
            {stats.map(s => (
              <button key={s.title} type="button" className="dash-stat" onClick={() => go('activity', ...s.to)}>
                <b>{s.value}</b>
                <span className="dash-stat-label"><Icon name={s.icon} size={14} />{s.title}</span>
                <small>{s.subtext}</small>
              </button>
            ))}
          </nav>
          <ProfileProgress st={st} />
        </section>
      </div>

      <section aria-label="Continue where you left off">
        <SectionHeader title="Continue where you left off" count={`${active.length} ongoing`} onViewAll={active.length ? () => go('activity') : null} />
        {active.length ? (
          <div className="init-list">
            {active.slice(0, phone ? 3 : 4).map(o => <InitiativeRow key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
          </div>
        ) : (
          <EmptyState ico="Compass" title="No data yet" msg="It looks like there's nothing here right now. Start exploring, join an initiative or enroll in a course to get started."
            cta={<button type="button" className="btn btn-primary mt12" onClick={() => go('recommended')}>Explore initiatives <Icon name="ArrowRight" size={14} /></button>} />
        )}
      </section>

      <section aria-label="Recommended for you">
        <SectionHeader title="Recommended for you" count={`${recs.length} available`} onViewAll={recs.length ? () => go('recommended') : null} />
        {recs.length ? (
          phone ? (
            <div className="init-list">
              {recs.slice(0, 3).map(o => <InitiativeRow key={o.id} o={o} st={st} sv={sv} compact />)}
            </div>
          ) : (
            <SingleRowGrid items={recs} renderCard={o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />} />
          )
        ) : (
          <EmptyState ico="Sparkles" title="No recommendations available yet" msg="Check back soon for personalized recommendations based on your interests." />
        )}
      </section>
    </div>
  )
}

export function Continuing({ st, sv }) {
  const active = activeList(st)
  return (
    <>
      <p className="small muted mb16">{active.length} initiative{active.length === 1 ? '' : 's'} you're actively working on.</p>
      {active.length ? (
        <div className="init-list">
          {active.map(o => <InitiativeRow key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
        </div>
      ) : (
        <EmptyState ico="Compass" title="Nothing in progress yet" msg="Join an initiative or enrol in a course to see it here." />
      )}
    </>
  )
}

/* one track of the Recommended page: Learn / Build / Compete */
const TRACKS = [
  { key: 'learning', title: 'Learn', icon: 'BookOpen', blurb: 'Recommended masterclasses, cohorts, and skill-building programs.', empty: 'No learning recommendations at this time.', cta: 'Browse Learn catalog' },
  { key: 'learncompete', title: 'Build', icon: 'Wrench', blurb: 'Hands-on problem statements and practical challenges to build working prototypes.', empty: 'No build recommendations at this time.', cta: 'Browse Build challenges' },
  { key: 'competing', title: 'Compete', icon: 'Trophy', blurb: 'Competitive hackathons and prize challenges open for registration.', empty: 'No compete recommendations at this time.', cta: 'Browse Compete hackathons' },
]

export function Recommended({ st, sv, go }) {
  const recs = recommendedList(st)
  return (
    <div className="dash-home">
      <p className="small muted">
        {(st.interests || []).length || st.region
          ? 'Curated recommendations matched to ' + [...(st.interests || []).slice(0, 3), st.region].filter(Boolean).join(', ')
          : 'Personalized initiatives, challenges, and hackathons organized by track.'}
      </p>

      {TRACKS.map(t => {
        const items = recs.filter(o => o.purpose === t.key)
        return (
          <section key={t.key} aria-label={t.title}>
            <SectionHeader title={t.title} icon={t.icon} count={items.length} onViewAll={() => go(t.key)} viewAllLabel="Explore catalog" />
            <p className="sec-blurb">{t.blurb}</p>
            {items.length ? (
              <div className="grid g3">
                {items.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
              </div>
            ) : (
              <div className="empty-state">
                <p className="small muted">{t.empty}</p>
                <button type="button" onClick={() => go(t.key)} className="btn btn-outline btn-sm mt-3">{t.cta}</button>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
export function Saved({ st, sv, go }) {
  const list = savedList(st).map(byId).filter(Boolean)
  return (
    <>
      <p className="small muted mb16">{list.length} {list.length === 1 ? 'initiative' : 'initiatives'} saved</p>
      {list.length ? (
        <div className="grid g3">
          {list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
        </div>
      ) : (
        <EmptyState ico="Bookmark" title="Nothing saved yet" msg="Tap the bookmark on any initiative to keep it here."
          cta={<a className="btn btn-primary mt12" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>Browse initiatives</a>} />
      )}
    </>
  )
}
export function Recent({ st, sv, go }) {
  const list = recentViews(st).map(byId).filter(Boolean)
  return (
    <>
      <p className="small muted mb16">Recently viewed · {list.length} {list.length === 1 ? 'initiative' : 'initiatives'}</p>
      {list.length ? (
        <div className="grid g3">
          {list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}
        </div>
      ) : (
        <EmptyState ico="Clock" title="Nothing viewed yet" msg="Initiatives you open will show up here."
          cta={<a className="btn btn-primary mt12" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>Browse initiatives</a>} />
      )}
    </>
  )
}
