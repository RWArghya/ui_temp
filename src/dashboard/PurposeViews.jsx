import { useState } from 'react'
import Icon from './Icon'
import { InitiativeCard } from './Cards'
import { REGIONS, purposeOpenList, purposeAreasList, purposeModesList } from './data'

/* ============================================================================
   Ported from prototype_v2/app.html — purposeMain()/purposeFilterBar()/
   purposeGridHTML(). One page component for Learn/Compete/Build; the only
   difference between the three is which `view` key drives it, exactly like
   the prototype. Filter state (`window.__purposeFilters` there) becomes
   local `useState` here — the one thing a DOM-template port always changes.
   ============================================================================ */

function FilterBar({ view, filters, setFilters }) {
  const areas = purposeAreasList(view)
  const modes = purposeModesList(view)
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  return (
    <div className="filter-bar">
      <div className="filter-search">
        <Icon name="Search" size={15} />
        <input
          placeholder="Search by name"
          value={filters.q}
          onChange={(e) => set('q', e.target.value)}
        />
      </div>
      <div className="filter-selects">
        <select className="filter-select" value={filters.area} onChange={(e) => set('area', e.target.value)}>
          <option value="all">All areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="filter-select" value={filters.region} onChange={(e) => set('region', e.target.value)}>
          <option value="all">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="filter-select" value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="all">Any status</option>
          <option value="live">Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Completed</option>
        </select>
        <select className="filter-select" value={filters.mode} onChange={(e) => set('mode', e.target.value)}>
          <option value="all">Any format</option>
          {modes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  )
}

function PurposePage({ view, st, sv }) {
  const [filters, setFilters] = useState({ q: '', area: 'all', region: 'all', status: 'all', mode: 'all' })
  const list = purposeOpenList(view, st, filters)

  return (
    <>
      <FilterBar view={view} filters={filters} setFilters={setFilters} />
      <div className="grid g3 mt16">
        {list.length
          ? list.map(o => <InitiativeCard key={o.id} o={o} st={st} sv={sv} />)
          : <div className="empty-state" style={{ gridColumn: '1/-1' }}><p className="small muted">Nothing matches right now — check back soon.</p></div>}
      </div>
    </>
  )
}

export const Learning = (props) => <PurposePage view="learning" {...props} />
export const Competing = (props) => <PurposePage view="competing" {...props} />
export const LearnCompete = (props) => <PurposePage view="learncompete" {...props} />
