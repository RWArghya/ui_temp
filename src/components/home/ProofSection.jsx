import Eyebrow from "../ui/Eyebrow"
import QuoteCard from "./QuoteCard"
import LoadingState from "../ui/LoadingState"
import ErrorState from "../ui/ErrorState"
import EmptyState from "../ui/EmptyState"
import { useMockQuery } from "../../hooks/useMockQuery"
import { fetchTestimonials } from "../../api/mock/testimonials"

export default function ProofSection() {
  const { data, loading, error, refetch } = useMockQuery(fetchTestimonials)

  return (
    <section className="border-y border-paper-line bg-paper-raised py-24">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-[640px]">
          <Eyebrow tone="paper">Proof, not promises</Eyebrow>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.7rem,1.4rem+1.5vw,2.5rem)] font-extrabold text-ink-900">
            Don't just take our word
            <br />
            for it — take theirs.
          </h2>
          <p className="mt-4 text-[0.9rem] text-graphite-dim">
            These three slots mark where verified sponsor, innovator and partner-institute quotes will run.
            Nothing here proves anything until they land.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {loading && <LoadingState count={3} className="h-[190px] rounded-card" />}
          {!loading && error && <ErrorState message="Couldn't load testimonials." onRetry={refetch} />}
          {!loading && !error && data?.length === 0 && <EmptyState message="No testimonials yet." />}
          {!loading && !error && data?.map((q) => <QuoteCard key={q.id} {...q} />)}
        </div>
      </div>
    </section>
  )
}
