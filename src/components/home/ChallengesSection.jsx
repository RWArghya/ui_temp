import { Link } from "react-router-dom"
import Eyebrow from "../ui/Eyebrow"
import ChallengeCard from "./ChallengeCard"
import LoadingState from "../ui/LoadingState"
import ErrorState from "../ui/ErrorState"
import EmptyState from "../ui/EmptyState"
import { useMockQuery } from "../../hooks/useMockQuery"
import { fetchFlagshipChallenges } from "../../api/mock/challenges"

export default function ChallengesSection() {
  const { data, loading, error, refetch } = useMockQuery(fetchFlagshipChallenges)

  return (
    <section className="bg-ink-900 py-24 text-ink-text">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="dark">What's live right now</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,1.4rem+1.5vw,2.5rem)] font-extrabold text-white-soft">
              Flagship Innovation Challenges
            </h2>
          </div>
          <Link
            to="/initiatives"
            className="font-mono text-[0.76rem] tracking-[0.08em] text-brand-blue hover:text-white-soft"
          >
            See all initiatives →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {loading && <LoadingState count={4} className="h-[168px] rounded-card bg-ink-800" />}
          {!loading && error && (
            <ErrorState tone="dark" message="Couldn't load challenges." onRetry={refetch} />
          )}
          {!loading && !error && data?.length === 0 && (
            <EmptyState tone="dark" message="No flagship challenges are live right now." />
          )}
          {!loading && !error && data?.map((c) => <ChallengeCard key={c.id} {...c} />)}
        </div>
      </div>
    </section>
  )
}
