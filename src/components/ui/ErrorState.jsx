const toneClasses = {
  light: "border-paper-line bg-paper-raised text-graphite",
  dark: "border-ink-line bg-ink-800 text-ink-text",
}

export default function ErrorState({ message = "Something went wrong.", onRetry, tone = "light", className = "" }) {
  return (
    <div
      role="alert"
      className={`col-span-full flex flex-col items-center gap-3 rounded-card border py-10 text-center ${toneClasses[tone]} ${className}`}
    >
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-sm btn-outline">
          Retry
        </button>
      )}
    </div>
  )
}
