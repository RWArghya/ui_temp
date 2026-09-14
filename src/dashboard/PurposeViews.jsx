import { useState } from 'react'
import Icon from './Icon'
import { ContinueCard, InitiativeCard } from './Cards'
import { VIEWS, REGIONS, ofPurpose, purposeOpenList, purposeAreasList, purposeModesList, nextStepFor } from './data'

/* ============================================================================
   Ported from prototype_v2/app.html — purposeMain()/purposeFilterBar()/
   purposeGridHTML(). One page component for Learn/Compete/Build; the only
   difference between the three is which `view` key drives it, exactly like
   the prototype. Filter state (`window.__purposeFilters` there) becomes
   local `useState` here — the one thing a DOM-template port always changes.
   ============================================================================ */

const CHIP_TONE = { competing: 'blue', learning: 'green', learncompete: 'amber' }
const PURPOSE_ICO = { competing: 'Trophy', learning: 'BookOpen', learncompete: 'Wrench' }

function FilterBar({ view, filters, setFilters }) {
  const areas = purposeAreasList(view)
  const modes = purposeModesList(view)
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  return (
    <div className="card card-pad">
      <div className="row gap12 wrap">
        <div className="topbar-search grow" style={{ maxWidth: 'none' }}>
          <Icon name="Search" size={16} />
          <input placeholder="Search by name or organiser…" value={filters.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        <select className="select" style={{ width: 'auto' }} value={filters.area} onChange={(e) => set('area', e.target.value)}>
          <option value="all">All areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filters.region} onChange={(e) => set('region', e.target.value)}>
          <option value="all">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="all">Any status</option>
          <option value="live">Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Completed</option>
        </select>
        <select className="select" style={{ width: 'auto' }} value={filters.mode} onChange={(e) => set('mode', e.target.value)}>
          <option value="all">Any format</option>
          {modes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  )
}

function PurposePage({ view, st, sv }) {
  const meta = VIEWS[view]
  const mine = ofPurpose(st, view)
  const [filters, setFilters] = useState({ q: '', area: 'all', region: 'all', status: 'all', mode: 'all' })
  const list = purposeOpenList(view, st, filters)

  return (
    <>
      <div className="row between">
        <div>
          <h1>{meta.label}</h1>
          <p className="small muted mt6">{meta.blurb}</p>
        </div>
        <span className={`icon-chip lg ${CHIP_TONE[view]}`}><Icon name={PURPOSE_ICO[view]} size={24} /></span>
      </div>

      {mine.length ? (
        <div className="mt24">
          <div className="card-head"><h2>In progress</h2></div>
          <div className="grid g3">
            {mine.map(o => <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
          </div>
        </div>
      ) : null}

      <div className="mt24">
        <div className="card-head"><h2>Open for you</h2></div>
        <FilterBar view={view} filters={filters} setFilters={setFilters} />
        <div className="grid g3 mt16">
          {list.length
            ? list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)
            : <div className="card empty-state" style={{ gridColumn: '1/-1' }}><p className="small muted">Nothing matches right now — check back soon.</p></div>}
        </div>
      </div>
    </>
  )
}

export const Learning = (props) => <PurposePage view="learning" {...props} />
export const Competing = (props) => <PurposePage view="competing" {...props} />
export const LearnCompete = (props) => <PurposePage view="learncompete" {...props} />
