import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from './Icon'
import TabBar from '../components/profile/TabBar'
import { InitiativeRow } from './Cards'
import { EmptyState } from './HomeViews'
import { activeList, nextStepFor } from './data'

/* My Activity — everything in progress, by track. Same list shape as Home's
   Continue block; the tabs are the same shortcuts Home's overview cells open. */
const VALID_TABS = ['all', 'learning', 'learncompete', 'competing']

export default function MyActivity({ st, sv, go }) {
  const [sp, setSp] = useSearchParams()
  const active = activeList(st)
  const by = (purpose) => active.filter(o => o.purpose === purpose)

  const tabParam = sp.get('tab')
  const [tab, setTab] = useState(tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'all')

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== tab) setTab(tabParam)
  }, [tabParam])

  const handleSelectTab = (newTab) => {
    setTab(newTab)
    const nextSp = new URLSearchParams(sp)
    if (newTab === 'all') nextSp.delete('tab')
    else nextSp.set('tab', newTab)
    setSp(nextSp, { replace: true })
  }

  const panels = {
    all: {
      label: 'All', items: active,
      blurb: `Showing all ${active.length} active initiatives across Learn, Build, and Compete.`,
      empty: { title: 'No initiatives currently in progress.', msg: 'Enroll in a course, join a hackathon, or start a challenge to get started.', cta: 'Explore recommended initiatives', to: 'recommended', primary: true },
    },
    learning: {
      label: 'Learn', icon: 'BookOpen', items: by('learning'),
      blurb: 'Masterclasses, cohorts, and skill-building programs currently in progress.',
      link: 'Explore Learn catalog',
      empty: { title: 'No learning programs currently in progress.', msg: 'Browse masterclasses, cohorts, and skill-building courses.', cta: 'Browse Learn catalog', to: 'learning' },
    },
    learncompete: {
      label: 'Build', icon: 'Wrench', items: by('learncompete'),
      blurb: 'Hands-on project statements, prototypes, and practical challenges you are developing.',
      link: 'Explore Build catalog',
      empty: { title: 'No build initiatives currently in progress.', msg: 'Pick a real-world problem statement and build a working prototype.', cta: 'Browse Build challenges', to: 'learncompete' },
    },
    competing: {
      label: 'Compete', icon: 'Trophy', items: by('competing'),
      blurb: 'Hackathons, prize challenges, and live competitive tournaments.',
      link: 'Explore Compete catalog',
      empty: { title: 'No active competitions currently in progress.', msg: 'Join competitive hackathons, form squads, and compete for prizes.', cta: 'Browse Compete hackathons', to: 'competing' },
    },
  }

  const tabs = VALID_TABS.map(key => {
    const p = panels[key]
    return {
      key,
      label: (
        <span className="flex items-center gap-2">
          {p.icon ? <Icon name={p.icon} size={14} /> : null}
          <span>{p.label}</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${tab === key ? 'bg-signal text-white' : 'bg-dash-line-soft text-dash-ink'}`}>
            {p.items.length}
          </span>
        </span>
      ),
    }
  })

  const cur = panels[tab]

  return (
    <div>
      <p className="small muted mb16">
        All your in-progress initiatives, bootcamps, and hackathons organized by track.
      </p>

      <TabBar tabs={tabs} active={tab} onSelect={handleSelectTab} ariaLabel="Activity tracks" idPrefix="activity-tab" />

      <div id={`activity-panel-${tab}`} role="tabpanel" aria-labelledby={`activity-tab-${tab}`} className="mt16">
        <div className="sec-head">
          <p className="small muted">{cur.blurb}</p>
          {cur.link ? <button type="button" className="link-more" onClick={() => go(cur.empty.to)}>{cur.link} <Icon name="ArrowRight" size={13} /></button> : null}
        </div>
        {cur.items.length ? (
          <div className="init-list">
            {cur.items.map(o => <InitiativeRow key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />)}
          </div>
        ) : (
          <EmptyState ico="Compass" title={cur.empty.title} msg={cur.empty.msg}
            cta={<button type="button" className={`btn ${cur.empty.primary ? 'btn-primary' : 'btn-outline'} btn-sm mt12`} onClick={() => go(cur.empty.to)}>{cur.empty.cta}</button>} />
        )}
      </div>
    </div>
  )
}
