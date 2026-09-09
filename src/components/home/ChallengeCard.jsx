import { Link } from "react-router-dom"

export default function ChallengeCard({ tag, title, description, href }) {
  return (
    <Link
      to={href}
      className="block rounded-card border border-ink-line bg-ink-800 p-5 transition-all duration-200 hover:-translate-y-[3px] hover:border-brand-indigo"
    >
      <span className="mb-4 inline-block rounded-btn border border-ink-line px-2 py-[3px] font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#b39bdd]">
        {tag}
      </span>
      <h3 className="text-[0.98rem] font-bold text-white-soft">{title}</h3>
      <p className="mt-[9px] text-[0.83rem] leading-[1.55] text-ink-dim">{description}</p>
    </Link>
  )
}
