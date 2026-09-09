const toneClasses = {
  ink: { value: "text-ink-900", label: "text-graphite-dim" },
  onDark: { value: "text-white-soft", label: "text-ink-dim" },
  signal: { value: "text-signal", label: "text-graphite-dim" },
}

const sizeClasses = {
  sm: "text-[1.15rem]",
  md: "text-[1.35rem]",
  lg: "text-[1.45rem]",
  xl: "text-[1.5rem]",
}

export default function StatItem({ value, label, tone = "ink", size = "md" }) {
  const t = toneClasses[tone]
  return (
    <div>
      <span className={`block font-mono font-semibold ${sizeClasses[size]} ${t.value}`}>{value}</span>
      <span className={`block text-[0.78rem] mt-[3px] ${t.label}`}>{label}</span>
    </div>
  )
}
