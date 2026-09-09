import { useMockQuery } from "../../hooks/useMockQuery"
import { fetchLiveStats } from "../../api/mock/liveStats"

const rows = [
  { key: "liveInitiatives", label: "live initiatives" },
  { key: "submissionsThisWeek", label: "submissions this week" },
  { key: "mentorsMapped", label: "mentors mapped" },
  { key: "partnerInstitutes", label: "partner institutes" },
]

export default function HeroConsole() {
  const { data, loading, error, refetch } = useMockQuery(fetchLiveStats)

  return (
    <div className="overflow-hidden rounded-card bg-ink-900 shadow-[0_24px_60px_-28px_rgba(25,17,53,.55),0_2px_6px_rgba(25,17,53,.12)]">
      <div className="h-[3px] bg-ramp" />
      <div className="flex gap-1.5 border-b border-ink-line px-3.5 py-3">
        <span className="h-[7px] w-[7px] rounded-full bg-ink-line" />
        <span className="h-[7px] w-[7px] rounded-full bg-ink-line" />
        <span className="h-[7px] w-[7px] rounded-full bg-ink-line" />
      </div>
      <div className="p-[18px]">
        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading live network stats">
            {rows.map((r) => (
              <div key={r.key} className="skeleton h-5 w-full bg-ink-800" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-2 text-center">
            <p className="text-[0.83rem] text-ink-text">Couldn't load live stats.</p>
            <button type="button" onClick={refetch} className="btn btn-xs btn-outline mt-2">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {rows.map((r) => (
              <div key={r.key} className="flex items-baseline justify-between py-[7px] text-[0.83rem] text-ink-dim">
                <span>{r.label}</span>
                <b className="font-mono text-[0.92rem] font-semibold text-white-soft">{data[r.key]}</b>
              </div>
            ))}
            <span className="mt-3 inline-flex items-center gap-[7px] font-mono text-[0.68rem] uppercase tracking-[0.13em] text-status">
              <i className="h-1.5 w-1.5 rounded-full bg-status shadow-[0_0_0_3px_rgba(76,156,134,.2)]" />
              network {data.networkStatus}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
