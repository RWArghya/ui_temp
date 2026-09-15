import Icon from './Icon'
import { ContinueCard } from './Cards'
import { activeList, nextStepFor } from './data'

export default function MyActivity({ st, sv, go }) {
  const active = activeList(st)

  const learnItems = active.filter(o => o.purpose === 'learning')
  const buildItems = active.filter(o => o.purpose === 'learncompete')
  const competeItems = active.filter(o => o.purpose === 'competing')

  return (
    <div className="space-y-8">
      <div>
        <h1>My activity</h1>
        <p className="small muted mt6">
          All your in-progress initiatives, bootcamps, and hackathons organized by track.
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
          Masterclasses, cohorts, and skill-building programs currently in progress.
        </p>

        {learnItems.length ? (
          <div className="grid g3 mt-3">
            {learnItems.map(o => (
              <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-2">
            <p className="text-[13px] text-dash-muted">No learning programs currently in progress.</p>
            <button
              type="button"
              onClick={() => go('learning')}
              className="btn btn-outline btn-sm mt-3"
            >
              Browse Learn programs
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
          Hands-on project statements, prototypes, and practical challenges you are developing.
        </p>

        {buildItems.length ? (
          <div className="grid g3 mt-3">
            {buildItems.map(o => (
              <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-2">
            <p className="text-[13px] text-dash-muted">No build initiatives currently in progress.</p>
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
          Hackathons, prize challenges, and live competitive tournaments.
        </p>

        {competeItems.length ? (
          <div className="grid g3 mt-3">
            {competeItems.map(o => (
              <ContinueCard key={o.id} o={o} st={st} sv={sv} next={nextStepFor(o, st)} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[2px] border border-dashed border-dash-line text-center bg-dash-surface/50 my-2">
            <p className="text-[13px] text-dash-muted">No active competitions currently in progress.</p>
            <button
              type="button"
              onClick={() => go('competing')}
              className="btn btn-outline btn-sm mt-3"
            >
              Browse Competitions
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
