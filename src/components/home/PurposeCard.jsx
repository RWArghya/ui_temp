import { Link } from "react-router-dom"

export default function PurposeCard({ title, description, to, tag, wide = false, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`block rounded-card border border-paper-line bg-paper p-[18px] transition-colors duration-150 hover:border-signal hover:bg-signal-soft ${
        wide ? "col-span-full" : ""
      }`}
    >
      <b className="block font-display text-[1.02rem] text-ink-900">{title}</b>
      <span className="mt-1.5 block text-[0.84rem] text-graphite">{description}</span>
      {tag && (
        <span className="mt-3 inline-block rounded-btn bg-violet-soft px-[9px] py-1 font-mono text-[0.6rem] tracking-[0.13em] uppercase text-violet">
          {tag}
        </span>
      )}
    </Link>
  )
}
