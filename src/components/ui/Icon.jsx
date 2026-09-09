const paths = {
  template: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0114 0v2" />
    </>
  ),
  star: <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
  network: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M9 20l3-3 3 3M12 15v5" />
    </>
  ),
  "arrow-right": <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
}

export default function Icon({ name, className = "w-4 h-4" }) {
  const content = paths[name]
  if (!content) return null

  const isArrow = name === "arrow-right"
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={isArrow ? 1.7 : 2}
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  )
}
