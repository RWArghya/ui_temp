import { Link } from "react-router-dom"

export default function ProgramCard({ slug, title, description, outcome }) {
  return (
    <Link
      to={`/customer-register?program=${slug}`}
      className="flex flex-col gap-2 rounded-card border border-paper-line bg-paper-raised p-5 transition-all duration-200 hover:border-brand-indigo hover:shadow-[0_16px_36px_-24px_rgba(25,17,53,.32)]"
    >
      <h3 className="text-[0.96rem] font-bold text-ink-900">{title}</h3>
      <p className="text-[0.84rem] text-graphite">{description}</p>
      <span className="mt-auto border-t border-dashed border-paper-line pt-3 font-mono text-[0.72rem] text-signal">
        {outcome}
      </span>
    </Link>
  )
}
