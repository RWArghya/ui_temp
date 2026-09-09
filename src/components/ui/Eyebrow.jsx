const toneClasses = {
  paper: "text-signal",
  dark: "text-ink-dim",
  brand: "text-[#b39bdd]",
}

export default function Eyebrow({ tone = "paper", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-[9px] font-mono text-[0.68rem] font-semibold tracking-[0.16em] uppercase before:content-['//'] before:opacity-50 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
