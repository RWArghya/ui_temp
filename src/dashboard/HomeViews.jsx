import Icon from './Icon'
import { InitiativeCard, ContinueCard } from './Cards'
import { activeList, recommendedList, nextStepFor, savedList, recentViews, byId } from './data'

/* ============================================================================
   Ported from prototype_v2/app.html — homeMain()/continuingMain()/
   recommendedMain(). "View all" swaps only this main column (sidebar/rail
   stay mounted) via `go('continuing')`/`go('recommended')`, Flipkart-style —
   not a full route navigation with its own header.
   ============================================================================ */

function EmptyCard({ ico, title, msg, cta }) {
  return (
    <div className="card empty-state">
      <span className="icon-chip lg blue"><Icon name={ico} size={24} /></span>
      {title ? <h3 className="mt8">{title}</h3> : null}
      <p className="small muted" style={{ maxWidth: 360 }}>{msg}</p>
      {cta}
    </div>
  )
}

export function Home({ st, sv, go }) {
  const active = activeList(st)
  const recs = recommendedList(st)
  return (
    <>
      <div className="rounded-banner">
        <div>
          <div className="xs bold" style={{ letterSpacing: '.06em', color: 'var(--primary)' }}>WELCOME BACK</div>
          <h1 className="mt6">{st.profile?.name || st.name || 'there'} 👋</h1>
          <p className="small muted mt8">Build your skills, complete initiatives, and grow your career.</p>
        </div>
        <span className="icon-chip lg purple" style={{ width: 72, height: 72, flexShrink: 0 }}><Icon name="Sparkles" size={32} /></span>
      </div>

      <div className="mt24">
        <div className="card-head">
          <h2>Continue where you left off</h2>
          {active.length ? <a className="link-more" style={{ cursor: 'pointer' }} onClick={() => go('continuing')}>View all <Icon name="ArrowRight" size={13} /></a> : null}
        </div>
        {active.length ? (
          <div className="grid g3">
            {active.slice(0, 3).map(o => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
          </div>
        ) : (
          <EmptyCard ico="Compass" title="No data yet" msg="It looks like there's nothing here right now. Start exploring, join an initiative or enroll in a course to get started."
            cta={<a className="btn btn-primary mt12" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>Explore initiatives <Icon name="ArrowRight" size={14} /></a>} />
        )}
      </div>

      <div className="mt24">
        <div className="card-head">
          <h2>Recommended for you</h2>
          {recs.length ? <a className="link-more" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>View all <Icon name="ArrowRight" size={13} /></a> : null}
        </div>
        {recs.length ? (
          <div className="grid g3">{recs.slice(0, 3).map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)}</div>
        ) : (
          <EmptyCard ico="Sparkles" title="No recommendations available yet" msg="Check back soon for personalized recommendations based on your interests." />
        )}
      </div>
    </>
  )
}

export function Continuing({ st, sv, go }) {
  const active = activeList(st)
  return (
    <>
      <a className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }} onClick={() => go('home')}><Icon name="ArrowLeft" size={14} /> Dashboard</a>
      <h1 className="mt12">Continue where you left off</h1>
      <p className="small muted mt6">{active.length} initiative{active.length === 1 ? '' : 's'} you're actively working on.</p>
      <div className="grid g3 mt20">
        {active.length ? active.map(o => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)
          : <div className="card empty-state" style={{ gridColumn: '1/-1' }}><p className="small muted">Nothing in progress yet.</p></div>}
      </div>
    </>
  )
}
export function Recommended({ st, sv, go }) {
  const recs = recommendedList(st)
  return (
    <>
      <a className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }} onClick={() => go('home')}><Icon name="ArrowLeft" size={14} /> Dashboard</a>
      <h1 className="mt12">Recommended for you</h1>
      <p className="small muted mt6">
        {(st.interests || []).length || st.region ? 'Matched to ' + [...(st.interests || []).slice(0, 3), st.region].filter(Boolean).join(', ') : 'Popular right now'}.
      </p>
      <div className="grid g3 mt20">
        {recs.length ? recs.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)
          : <div className="card empty-state" style={{ gridColumn: '1/-1' }}><p className="small muted">Nothing to recommend yet.</p></div>}
      </div>
    </>
  )
}
export function Saved({ st, sv, go }) {
  const list = savedList(st).map(byId).filter(Boolean)
  return (
    <>
      <h1>Saved initiatives</h1>
      <p className="small muted mt6">{list.length} saved</p>
      <div className="grid g3 mt20">
        {list.length ? list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} cta="View" />)
          : <EmptyCard ico="Bookmark" title="Nothing saved yet" msg="Tap the bookmark on any initiative to keep it here."
              cta={<a className="btn btn-primary mt12" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>Browse initiatives</a>} />}
      </div>
    </>
  )
}
export function Recent({ st, sv, go }) {
  const list = recentViews(st).map(byId).filter(Boolean)
  return (
    <>
      <h1>Recently viewed</h1>
      <p className="small muted mt6">{list.length} viewed recently</p>
      <div className="grid g3 mt20">
        {list.length ? list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} cta="View" />)
          : <EmptyCard ico="Clock" title="Nothing viewed yet" msg="Initiatives you open will show up here."
              cta={<a className="btn btn-primary mt12" style={{ cursor: 'pointer' }} onClick={() => go('recommended')}>Browse initiatives</a>} />}
      </div>
    </>
  )
}
