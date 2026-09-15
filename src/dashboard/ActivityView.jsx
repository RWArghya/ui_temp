import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from './Icon'
import TabBar from '../components/profile/TabBar'
import { ContinueCard } from './Cards'
import { activeList, nextStepFor } from './data'

export default function MyActivity({ st, sv, go }) {
  const [sp, setSp] = useSearchParams()
  const active = activeList(st)

  const learnItems = active.filter(o => o.purpose === 'learning')
  const buildItems = active.filter(o => o.purpose === 'learncompete')
  const competeItems = active.filter(o => o.purpose === 'competing')

  const tabParam = sp.get('tab')
  const validTabs = ['all', 'learning', 'learncompete', 'competing']
  const [tab, setTab] = useState(tabParam && validTabs.includes(tabParam) ? tabParam : 'all')

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== tab) {
      setTab(tabParam)
    }
  }, [tabParam])

  const handleSelectTab = (newTab) => {
    setTab(newTab)
    const nextSp = new URLSearchParams(sp)
    if (newTab === 'all') {
      nextSp.delete('tab')
    } else {
      nextSp.set('tab', newTab)
    }
    setSp(nextSp, { replace: true })
  }

  const tabs = [
    {
      key: 'all',
      label: (
        <span className="flex items-center gap-2">
          <span>All</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${
            tab === 'all'
              ? 'bg-signal text-white'
              : 'bg-dash-line-soft text-dash-ink'
          }`}>
            {active.length}
          </span>
        </span>
      ),
    },
    {
      key: 'learning',
      label: (
        <span className="flex items-center gap-2">
          <span>📚 Learn</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${
            tab === 'learning'
              ? 'bg-signal text-white'
              : 'bg-dash-line-soft text-dash-ink'
          }`}>
            {learnItems.length}
          </span>
        </span>
      ),
    },
    {
      key: 'learncompete',
      label: (
        <span className="flex items-center gap-2">
          <span>🛠️ Build</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${
            tab === 'learncompete'
              ? 'bg-signal text-white'
              : 'bg-dash-line-soft text-dash-ink'
          }`}>
            {buildItems.length}
          </span>
        </span>
      ),
    },
    {
      key: 'competing',
      label: (
        <span className="flex items-center gap-2">
          <span>🏆 Compete</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${
            tab === 'competing'
              ? 'bg-signal text-white'
              : 'bg-dash-line-soft text-dash-ink'
          }`}>
            {competeItems.length}
          </span>
        </span>
      ),
    },
  ]

  return (
    <div>
      <p className="small muted mb16">
        All your in-progress initiatives, bootcamps, and hackathons organized by track.
      </p>

      {/* 4-Tab Horizontal Navigation */}
      <TabBar
        tabs={tabs}
        active={tab}
        onSelect={handleSelectTab}
        ariaLabel="Activity tracks"
        idPrefix="activity-tab"
      />

      {/* Tab Panels */}
      <div id={`activity-panel-${tab}`} role="tabpanel" aria-labelledby={`activity-tab-${tab}`}>
        {/* 1. All Track */}
        {tab === 'all' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-dash-line-soft pb-2">
              <p className="text-[12.5px] text-dash-muted">
                Showing all {active.length} active initiatives across Learn, Build, and Compete.
              </p>
            </div>
            {active.length ? (
              <div className="grid g3">
                {active.map(o => (
                  <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-4">
                <p className="text-[14px] text-dash-muted font-medium">No initiatives currently in progress.</p>
                <p className="text-[12.5px] text-dash-muted mt-1">Enroll in a course, join a hackathon, or start a challenge to get started.</p>
                <button
                  type="button"
                  onClick={() => go('recommended')}
                  className="btn btn-primary btn-sm mt-4"
                >
                  Explore recommended initiatives
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Learn Track */}
        {tab === 'learning' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-dash-line-soft pb-2">
              <p className="text-[12.5px] text-dash-muted">
                Masterclasses, cohorts, and skill-building programs currently in progress.
              </p>
              <a
                className="link-more text-[12.5px] cursor-pointer"
                onClick={() => go('learning')}
              >
                Explore Learn catalog <Icon name="ArrowRight" size={13} />
              </a>
            </div>
            {learnItems.length ? (
              <div className="grid g3">
                {learnItems.map(o => (
                  <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-4">
                <p className="text-[14px] text-dash-muted font-medium">No learning programs currently in progress.</p>
                <p className="text-[12.5px] text-dash-muted mt-1">Browse masterclasses, cohorts, and skill-building courses.</p>
                <button
                  type="button"
                  onClick={() => go('learning')}
                  className="btn btn-outline btn-sm mt-4"
                >
                  Browse Learn catalog
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Build Track */}
        {tab === 'learncompete' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-dash-line-soft pb-2">
              <p className="text-[12.5px] text-dash-muted">
                Hands-on project statements, prototypes, and practical challenges you are developing.
              </p>
              <a
                className="link-more text-[12.5px] cursor-pointer"
                onClick={() => go('learncompete')}
              >
                Explore Build catalog <Icon name="ArrowRight" size={13} />
              </a>
            </div>
            {buildItems.length ? (
              <div className="grid g3">
                {buildItems.map(o => (
                  <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-4">
                <p className="text-[14px] text-dash-muted font-medium">No build initiatives currently in progress.</p>
                <p className="text-[12.5px] text-dash-muted mt-1">Pick a real-world problem statement and build a working prototype.</p>
                <button
                  type="button"
                  onClick={() => go('learncompete')}
                  className="btn btn-outline btn-sm mt-4"
                >
                  Browse Build challenges
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Compete Track */}
        {tab === 'competing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-dash-line-soft pb-2">
              <p className="text-[12.5px] text-dash-muted">
                Hackathons, prize challenges, and live competitive tournaments.
              </p>
              <a
                className="link-more text-[12.5px] cursor-pointer"
                onClick={() => go('competing')}
              >
                Explore Compete catalog <Icon name="ArrowRight" size={13} />
              </a>
            </div>
            {competeItems.length ? (
              <div className="grid g3">
                {competeItems.map(o => (
                  <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-4">
                <p className="text-[14px] text-dash-muted font-medium">No active competitions currently in progress.</p>
                <p className="text-[12.5px] text-dash-muted mt-1">Join competitive hackathons, form squads, and compete for prizes.</p>
                <button
                  type="button"
                  onClick={() => go('competing')}
                  className="btn btn-outline btn-sm mt-4"
                >
                  Browse Compete hackathons
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
