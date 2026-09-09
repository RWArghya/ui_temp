const toneClasses = {
  light: "border-paper-line text-graphite-dim",
  dark: "border-ink-line text-ink-dim",
}

export default function EmptyState({ message = "Nothing here yet.", tone = "light", className = "" }) {
  return (
    <div
      className={`col-span-full rounded-card border border-dashed py-10 text-center text-sm ${toneClasses[tone]} ${className}`}
    >
      {message}
    </div>
  )
}
