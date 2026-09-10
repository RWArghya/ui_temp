import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, PageHead, Field, Kv } from './ui'
import { byId, RUBRIC, bagFor, submissionArtifact, SELF_KEY } from './data'

export default function Evaluate({ st, sv, go }) {
  const [sp] = useSearchParams()
  const id = sp.get('id')
  const o = byId(id)
  const [r, setR] = useState({})
  if (!o) return <PageHead title="Evaluation" />
  const team = bagFor(st, 'teams', o.id, null) || 'solo'
  const art = bagFor(st, 'submission', o.id, null) || submissionArtifact(o.id, team, o)
  const key = SELF_KEY(id)
  const existing = (st.scores || {})[key]
  const total = RUBRIC.reduce((n, k) => n + (Number(r[k]) || 0), 0)

  return (
    <>
      <PageHead>
        <h2 className="mb-1.5">Evaluate {o.name}</h2>
        <p className="text-sm text-dash-muted">Score your own artifact against the rubric. Honest feedback closes the loop.</p>
      </PageHead>
      <Card title={art.title}>
        <Kv k="Repo" v={<strong className="text-dash-ink">{art.repo}</strong>} />
        {art.demo ? <Kv k="Demo" v={<a className="text-signal hover:underline" href={art.demo} target="_blank" rel="noopener">watch →</a>} /> : null}
        <p className="mt-2 text-sm text-dash-muted">{art.notes}</p>
      </Card>
      {existing ? (
        <Card title="Your scores" className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-dash-line-soft"><div className="h-full bg-ramp" style={{ width: existing.total * 20 + '%' }} /></div>
          <p className="mt-1 text-xs text-dash-faint">{existing.total} / 50</p>
          {RUBRIC.map(k => <Kv key={k} k={k} v={existing[k] + ' / 10'} />)}
          <Link className="btn btn-ghost mt-2 rounded-btn border border-dash-line-soft" to={'/dashboard?view=' + (o.purpose === 'competing' ? 'competing' : 'learning')}>Back to dashboard</Link>
        </Card>
      ) : (
        <Card title="Rubric — self score" className="mt-4">
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            {RUBRIC.map(k => (
              <div key={k} className="flex flex-col">
                <label className="text-sm text-dash-ink">{k}</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={10} step={1} className="range range-primary range-xs flex-1" value={r[k] || 0} onChange={e => setR({ ...r, [k]: Number(e.target.value) })} />
                  <span className="w-10 text-right text-xs text-dash-muted">{r[k] || 0} / 10</span>
                </div>
              </div>
            ))}
          </div>
          <Field textarea label="What you'd do differently (optional)" value={r.note || ''} onChange={e => setR({ ...r, note: e.target.value })} />
          <p className="text-xs text-dash-faint">Total: <strong className="text-dash-ink">{total}</strong> / 50</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary rounded-btn" disabled={!RUBRIC.every(k => Number(r[k]) > 0)} onClick={() => {
              const scores = Object.assign({}, st.scores || {})
              scores[key] = { team, total, ...RUBRIC.reduce((o, k) => (o[k] = Number(r[k]), o), {}), note: r.note || '', at: new Date().toISOString() }
              sv({ scores })
            }}>Submit self-evaluation</button>
            <span className="text-sm text-dash-muted">Earning a certificate requires a passing self-eval.</span>
          </div>
        </Card>
      )}
    </>
  )
}