import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import { InitiativeCard, ContinueCard } from './Cards'
import { activeList, recommendedList, nextStepFor, savedList, recentViews, byId } from './data'

/* ============================================================================
   Ported from prototype_v2/app.html — homeMain()/continuingMain()/
   recommendedMain(). "View all" swaps only this main column (sidebar/rail
   stay mounted) via `go('continuing')`/`go('recommended')`, Flipkart-style —
   not a full route navigation with its own header.
   ============================================================================ */

function EmptyState({ ico, title, msg, cta }) {
  return (
    <div className="empty-state">
      <span className="icon-chip lg blue"><Icon name={ico} size={24} /></span>
      {title ? <h3 className="mt8">{title}</h3> : null}
      <p className="small muted" style={{ maxWidth: 360 }}>{msg}</p>
      {cta}
    </div>
  )
}

function SingleRowGrid({ items, renderCard, minColWidth = 240, gap = 16 }) {
  const containerRef = useRef(null)
  const [cols, setCols] = useState(3)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) {
        const calculated = Math.max(1, Math.floor((w + gap) / (minColWidth + gap)))
        setCols(calculated)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [minColWidth, gap])

  const visible = items.slice(0, cols)

  return (
    <div
      ref={containerRef}
      className="dash-cards-row"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: `${gap}px`,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {visible.map(renderCard)}
    </div>
  )
}

export function Home({ st, sv, go }) {
  const active = activeList(st)
  const recs = recommendedList(st)
  return (
    <>


      <div>
        <div className="card-head">
          <h2>Continue where you left off</h2>
          {active.length ? <a className="link-more" style={{ cursor: 'pointer' }} onClick={() => go('activity')}>View all <Icon name="ArrowRight" size={13} /></a> : null}
        </div>
        {active.length ? (
          <SingleRowGrid
            items={active}
            renderCard={o => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />}
          />
        ) : (
          <EmptyState ico="Compass" title="No data yet" msg="It looks like there's nothing here right now. Start exploring, join an initiative or enroll in a course to get started."
            cta={<a className="btn btn-primary mt12" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>Explore initiatives <Icon name="ArrowRight" size={14} /></a>} />
        )}
      </div>

      <div className="mt24">
        <div className="card-head">
          <h2>Recommended for you</h2>
          {recs.length ? <a className="link-more" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>View all <Icon name="ArrowRight" size={13} /></a> : null}
        </div>
        {recs.length ? (
          <SingleRowGrid
            items={recs}
            renderCard={o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />}
          />
        ) : (
          <EmptyState ico="Sparkles" title="No recommendations available yet" msg="Check back soon for personalized recommendations based on your interests." />
        )}
      </div>
    </>
  )
}

export function Continuing({ st, sv, go }) {
  const active = activeList(st)
  return (
    <>
      <p className="small muted mb16">{active.length} initiative{active.length === 1 ? '' : 's'} you're actively working on.</p>
      {active.length ? (
        <div className="grid g3">
          {active.map(o => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
        </div>
      ) : (
        <EmptyState ico="Compass" title="Nothing in progress yet" msg="Join an initiative or enrol in a course to see it here." />
      )}
    </>
  )
}
export function Recommended({ st, sv, go }) {
  const recs = recommendedList(st)

  const learnItems = recs.filter(o => o.purpose === 'learning')
  const buildItems = recs.filter(o => o.purpose === 'learncompete')
  const competeItems = recs.filter(o => o.purpose === 'competing')

  return (
    <div className="space-y-8">
      <div>
        <p className="small muted">
          {(st.interests || []).length || st.region
            ? 'Curated recommendations matched to ' + [...(st.interests || []).slice(0, 3), st.region].filter(Boolean).join(', ')
            : 'Personalized initiatives, challenges, and hackathons organized by track.'}
        </p>
      </div>

      {/* 1. Learn Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-dash-line-soft pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <h2 className="text-[17px] font-bold text-dash-ink">Learn</h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-dash-line-soft text-dash-ink">
              {learnItems.length}
            </span>
          </div>
          <a
            className="link-more text-[12.5px] cursor-pointer"
            onClick={() => go('learning')}
          >
            Explore catalog <Icon name="ArrowRight" size={13} />
          </a>
        </div>
        <p className="text-[12.5px] text-dash-muted">
          Recommended masterclasses, cohorts, and skill-building programs.
        </p>

        {learnItems.length ? (
          <div className="grid g3 mt-3">
            {learnItems.map(o => (
              <InitiativeCard key={o.id} o={o} st={st} sv={sv} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-2">
            <p className="text-[13px] text-dash-muted">No learning recommendations at this time.</p>
            <button
              type="button"
              onClick={() => go('learning')}
              className="btn btn-outline btn-sm mt-3"
            >
              Browse Learn catalog
            </button>
          </div>
        )}
      </section>

      {/* 2. Build Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-dash-line-soft pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <h2 className="text-[17px] font-bold text-dash-ink">Build</h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-dash-line-soft text-dash-ink">
              {buildItems.length}
            </span>
          </div>
          <a
            className="link-more text-[12.5px] cursor-pointer"
            onClick={() => go('learncompete')}
          >
            Explore catalog <Icon name="ArrowRight" size={13} />
          </a>
        </div>
        <p className="text-[12.5px] text-dash-muted">
          Hands-on problem statements and practical challenges to build working prototypes.
        </p>

        {buildItems.length ? (
          <div className="grid g3 mt-3">
            {buildItems.map(o => (
              <InitiativeCard key={o.id} o={o} st={st} sv={sv} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-2">
            <p className="text-[13px] text-dash-muted">No build recommendations at this time.</p>
            <button
              type="button"
              onClick={() => go('learncompete')}
              className="btn btn-outline btn-sm mt-3"
            >
              Browse Build challenges
            </button>
          </div>
        )}
      </section>

      {/* 3. Compete Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-dash-line-soft pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h2 className="text-[17px] font-bold text-dash-ink">Compete</h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-dash-line-soft text-dash-ink">
              {competeItems.length}
            </span>
          </div>
          <a
            className="link-more text-[12.5px] cursor-pointer"
            onClick={() => go('competing')}
          >
            Explore catalog <Icon name="ArrowRight" size={13} />
          </a>
        </div>
        <p className="text-[12.5px] text-dash-muted">
          Competitive hackathons and prize challenges open for registration.
        </p>

        {competeItems.length ? (
          <div className="grid g3 mt-3">
            {competeItems.map(o => (
              <InitiativeCard key={o.id} o={o} st={st} sv={sv} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-2">
            <p className="text-[13px] text-dash-muted">No compete recommendations at this time.</p>
            <button
              type="button"
              onClick={() => go('competing')}
              className="btn btn-outline btn-sm mt-3"
            >
              Browse Compete hackathons
            </button>
          </div>
        )}
      </section>
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
          {list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} cta="View" />)}
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
          {list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} cta="View" />)}
        </div>
      ) : (
        <EmptyState ico="Clock" title="Nothing viewed yet" msg="Initiatives you open will show up here."
          cta={<a className="btn btn-primary mt12" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>Browse initiatives</a>} />
      )}
    </>
  )
}
