import { useState } from 'react'
import { Card, Stat, PageHead, Pill, Empty, Field, Tag } from './ui'
import { S } from './store'
import {
  pwCurrent, pwNext, pwEntries, pwCredits, pwRank, pwStreak, pwSub, pwBoard,
  pwLeaderboard, pwScore, pwFeedback, PW_STORE, PW_CREDITS_PER_DROP, daysUntil, pwDrop,
} from './data'

/* ---- persistence patches (mirror app.js behaviour) ---- */
function joinDropPatch(id) {
  const cur = S.read().pw || {}
  const list = cur.entries || []
  if (list.indexOf(id) !== -1) return { pw: cur }
  list.push(id)
  const ledger = (cur.ledger || []).concat([{ delta: PW_CREDITS_PER_DROP, reason: 'Entered ' + id.replace('pw-', 'drop '), dropId: id, at: new Date().toISOString() }])
  return { pw: Object.assign({}, cur, { entries: list, ledger }) }
}
function submitPatch(dropId, sub) {
  const cur = S.read().pw || {}
  const sc = pwScore(dropId, sub)
  const rec = Object.assign({}, sub, { score: sc, feedback: pwFeedback(sc, sub), at: new Date().toISOString() })
  const subs = Object.assign({}, cur.subs || {})
  subs[dropId] = rec
  const bonus = sc.total >= 85 ? 100 : sc.total >= 70 ? 75 : 40
  const ledger = (cur.ledger || []).concat([{ delta: bonus, reason: 'Scored ' + sc.total + ' on ' + dropId.replace('pw-', 'drop '), dropId, at: new Date().toISOString() }])
  return { pw: Object.assign({}, cur, { subs, ledger }) }
}
function redeemPatch(id) {
  const item = PW_STORE.find(x => x.id === id)
  const cur = S.read().pw || {}
  if (!item || pwCredits(S.read()) < item.cost) return null
  const owned = (cur.owned || []).concat([id])
  const ledger = (cur.ledger || []).concat([{ delta: -item.cost, reason: 'Redeemed ' + item.label, dropId: null, at: new Date().toISOString() }])
  return { pw: Object.assign({}, cur, { owned, ledger }) }
}

const Bar = ({ pct }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-dash-line-soft"><div className="h-full bg-ramp" style={{ width: pct + '%' }} /></div>
)

function Redact({ st, sv }) {
  const [repo, setRepo] = useState('')
  const [url, setUrl] = useState('')
  const [prompts, setPrompts] = useState('')
  const [err, setErr] = useState('')

  const drop = pwCurrent(st)
  const sub = pwSub(drop.id, st)
  const left = daysUntil(drop.closes)
  const pct = Math.max(0, Math.min(100, Math.round(((14 - Math.max(0, left)) / 14) * 100)))

  if (sub) {
    const sc = sub.score
    return (
      <Card title={'Drop ' + drop.no + ' — scored'}>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Tag>AI Evaluation</Tag>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold tabular-nums text-dash-ink">{sc.total}</span>
              <span className="text-sm text-dash-muted">/ 100 · idea {sc.idea} · completeness {sc.done} · economy {sc.econ}</span>
            </div>
          </div>
          <Pill ok>Submitted</Pill>
        </div>
        <div className="my-4"><Bar pct={sc.total} /></div>
        <p className="text-sm text-dash-ink">{sub.feedback}</p>
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0"><span className="text-dash-muted">Repo</span><strong className="text-dash-ink">{sub.repo}</strong></div>
          {sub.url ? <div className="flex items-baseline justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0"><span className="text-dash-muted">Live</span><strong className="text-dash-ink">{sub.url}</strong></div> : null}
          <div className="flex items-baseline justify-between gap-3 border-b border-dash-line-soft py-2 text-sm last:border-0"><span className="text-dash-muted">Prompts</span><strong className="text-dash-ink">{sub.prompts}</strong></div>
        </div>
        <p className="mt-4 text-xs text-dash-faint">Drop {pwNext(st).no} opens {pwNext(st).opens}. Nothing to do until then — that's the point of a fortnight.</p>
      </Card>
    )
  }

  return (
    <Card title={'Drop room — drop ' + drop.no}>
      <div className="mt-4 rounded-card border border-dash-line-soft bg-dash-bg-soft p-4">
        <Tag>The brief</Tag>
        <strong className="mt-1.5 block text-dash-ink">{drop.theme}</strong>
        <p className="mt-2 text-sm text-dash-muted">What's scored is the idea, how far you got, and how economically you got there. Top 3 at the {drop.city} sprint take the cash pool.</p>
      </div>
      <div className="my-4"><Bar pct={pct} /></div>
      <p className="text-xs text-dash-faint">{left > 0 ? left + ' of 14 days left' : 'closing today'}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Repo" placeholder="github.com/you/project" value={repo} onChange={e => setRepo(e.target.value)} />
        <Field label="Live URL (optional)" placeholder="your-thing.vercel.app" value={url} onChange={e => setUrl(e.target.value)} />
      </div>
      <div className="max-w-[200px]">
        <Field label="Prompts used" inputMode="numeric" placeholder="31" value={prompts} onChange={e => setPrompts(e.target.value.replace(/\D/g, ''))} />
      </div>
      <p className="text-xs text-dash-faint">Fewer prompts scores higher on economy. Honour system — we don't read your model history.</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary rounded-btn" onClick={() => {
          const n = parseInt(prompts, 10)
          if (!repo.trim()) { setErr('Add a repo link so the evaluator has something to open.'); return }
          if (!n || n < 1) { setErr('How many prompts did it take? Any honest number is fine.'); return }
          sv(submitPatch(drop.id, { repo: repo.trim(), url: url.trim(), prompts: n }))
        }}>Submit to drop {drop.no}</button>
        <span className="text-xs text-dash-faint">Scored by the platform's AI evaluator, usually within minutes.</span>
      </div>
      {err ? <p className="mt-2.5 text-xs text-dash-live">{err}</p> : null}
    </Card>
  )
}

function DropTab({ st, sv }) {
  const drop = pwCurrent(st)
  const entered = pwEntries(st).indexOf(drop.id) !== -1
  const left = daysUntil(drop.closes)
  if (!entered) {
    return (
      <Card title={'Drop ' + drop.no + ' — ' + drop.theme}>
        {drop.sponsor ? <Pill hat>Sponsored by {drop.sponsor.org}</Pill> : null}
        <p className="mt-2 text-sm text-dash-muted">{drop.sponsor
          ? "A sponsor set this fortnight's theme and put up a cash pool for the top 3."
          : 'Build something usable from a single sustained prompt session. Any stack, any model.'}</p>
        <p className="mt-2 text-xs text-dash-faint">Closes in {left} day{left === 1 ? '' : 's'} · solo · 18+ · India</p>
        <button className="btn btn-primary mt-6 rounded-btn" onClick={() => sv(joinDropPatch(drop.id))}>Enter drop {drop.no}</button>
      </Card>
    )
  }
  return <Redact st={st} sv={sv} />
}

function BoardsTab({ st }) {
  const [scope, setScope] = useState('drop')
  const scopes = [['drop', 'This drop'], ['alltime', 'All-time'], [pwCurrent(st).city, pwCurrent(st).city]]
  const all = pwBoard(scope, st)
  const top = all.slice(0, 10)
  const you = all.find(x => x.you)
  const rows = top.concat(you && top.indexOf(you) === -1 ? [you] : [])
  return (
    <Card title="Boards">
      <div className="mt-4 flex flex-wrap gap-2">
        {scopes.map(([k, l]) => (
          <button key={k} className={'btn btn-sm rounded-btn ' + (scope === k ? 'btn-primary' : 'border border-dash-line-soft bg-transparent text-dash-muted')} onClick={() => setScope(k)}>{l}</button>
        ))}
      </div>
      <div className="mt-2">
        {rows.length ? rows.map(x => (
          <div className={`flex items-center gap-3 border-b border-dash-line-soft py-2.5 text-sm last:border-0 ${x.you ? 'bg-dash-warn-soft px-2' : ''}`} key={x.name}>
            <span className="w-7 font-mono text-dash-muted">{x.rank}</span>
            <span className="min-w-0 flex-1 truncate text-dash-ink">{x.name}{x.you ? <span className="text-xs text-dash-faint"> (you)</span> : ''}</span>
            <span className="text-dash-muted">{x.credits} credits</span>
          </div>
        )) : <Empty msg="No submissions on this board yet." />}
      </div>
    </Card>
  )
}

function HistoryTab({ st }) {
  const ids = pwEntries(st).slice().reverse()
  return (
    <Card title="Your drops">
      {ids.length ? ids.map(id => {
        const no = Number(id.replace('pw-', ''))
        const s = pwSub(id, st)
        const theme = pwDrop(no - 1).theme
        return (
          <div className="flex items-center gap-3 border-b border-dash-line-soft py-2.5 text-sm last:border-0" key={id}>
            <span className="w-7 font-mono text-dash-muted">{no}</span>
            <span className="min-w-0 flex-1 truncate text-dash-ink">{theme}</span>
            <span className="text-dash-muted">{s ? 'scored ' + s.score.total : 'entered · not submitted'}</span>
          </div>
        )
      }) : <Empty msg="You haven't entered a drop yet. They come round every fortnight." />}
    </Card>
  )
}

function CreditsTab({ st, sv }) {
  const bal = pwCredits(st)
  const owned = S.read().pw?.owned || []
  const ledger = S.read().pw?.ledger || []
  const earned = ledger.filter(e => e.delta > 0).reduce((n, e) => n + e.delta, 0)
  const spent = -ledger.filter(e => e.delta < 0).reduce((n, e) => n + e.delta, 0)
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <Card title="Balance"><div className="text-4xl font-extrabold text-dash-ink">{bal}<span className="text-xs font-normal text-dash-faint"> credits</span></div></Card>
        <Card title="Earned"><div className="flex items-center justify-between py-1 text-sm"><span className="text-dash-ink">entries + scores</span><span className="font-semibold text-dash-ok">+{earned}</span></div></Card>
        <Card title="Spent"><div className="flex items-center justify-between py-1 text-sm"><span className="text-dash-ink">swag</span><span className="text-dash-muted">{spent}</span></div></Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Ledger">
          {ledger.length ? ledger.slice().reverse().map((e, i) => (
            <div className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2.5 text-sm last:border-0" key={i}>
              <span className="min-w-0 flex-1 truncate text-dash-ink">{e.reason}</span>
              <span className={e.delta > 0 ? 'font-semibold text-dash-ok' : 'text-dash-muted'}>{e.delta > 0 ? '+' : ''}{e.delta}</span>
            </div>
          )) : <p className="mt-4 text-sm text-dash-muted">Nothing yet — entering a drop is the first line.</p>}
        </Card>
        <Card title="Swag store">
          {PW_STORE.map(i => {
            const has = owned.indexOf(i.id) !== -1
            const can = bal >= i.cost
            return (
              <div className="flex items-center justify-between gap-3 border-b border-dash-line-soft py-2.5 text-sm last:border-0" key={i.id}>
                <span className="min-w-0 flex-1 truncate text-dash-ink">{i.label}</span>
                {has ? <Pill ok>Yours</Pill>
                  : can ? <button className="btn btn-primary btn-sm rounded-btn" onClick={() => { const p = redeemPatch(i.id); if (p) sv(p) }}>{i.cost} ⚡</button>
                       : <Pill warn>{i.cost}</Pill>}
              </div>
            )
          })}
          {(() => {
            const nextUnlock = PW_STORE.find(i => owned.indexOf(i.id) === -1 && bal < i.cost)
            if (!nextUnlock) return null
            const gap = nextUnlock.cost - bal
            const drops = Math.ceil(gap / PW_CREDITS_PER_DROP)
            return <p className="mt-4 text-xs text-dash-faint">{gap} more credits — about {drops} drop{drops === 1 ? '' : 's'} — unlocks the {nextUnlock.label.toLowerCase()}.</p>
          })()}
        </Card>
      </div>
    </>
  )
}

export default function Arena({ st, sv }) {
  const [tab, setTab] = useState('drop')
  const drop = pwCurrent(st)
  const tabs = [['drop', 'This drop'], ['boards', 'Boards'], ['history', 'Your drops'], ['credits', 'Credits & swag']]

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">🎮 Arena</h2>
        <p className="text-sm text-dash-muted">PromptWars — every drop you've entered, where you stand, and what your credits buy.</p>
      </PageHead>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat n={pwCredits(st)} label="Prompt Credits" />
        <Stat n={pwRank(st) ? '#' + pwRank(st) : '—'} label={pwRank(st) ? 'Rank this drop' : 'Unranked — enter to appear'} />
        <Stat n={pwStreak(st)} label="Drop streak" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto">
        {tabs.map(([t, l]) => (
          <button
            key={t}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === t ? 'bg-brand-violet font-bold text-white' : 'border border-dash-line-soft bg-white text-dash-muted hover:text-dash-ink'
            }`}
            onClick={() => setTab(t)}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === 'drop' ? <DropTab st={st} sv={sv} />
        : tab === 'boards' ? <BoardsTab st={st} />
        : tab === 'history' ? <HistoryTab st={st} />
        : <CreditsTab st={st} sv={sv} />}
    </>
  )
}