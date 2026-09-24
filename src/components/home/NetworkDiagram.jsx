const nodes = [
  [70, 60],
  [340, 52],
  [44, 160],
  [376, 148],
  [96, 250],
  [318, 258],
]

export default function NetworkDiagram() {
  return (
    <svg viewBox="0 0 420 300" className="h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id="rampSvg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b84f5" />
          <stop offset=".5" stopColor="#2f5fe6" />
          <stop offset="1" stopColor="#1e46c4" />
        </linearGradient>
      </defs>
      <g stroke="#c8cde3" strokeWidth="1.2" fill="none">
        {nodes.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M210 150 L${x} ${y}`} />
        ))}
      </g>
      <g fill="#0f1629">
        {nodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="8" />
        ))}
      </g>
      <circle cx="210" cy="150" r="19" fill="url(#rampSvg)" />
      <circle cx="210" cy="150" r="27" fill="none" stroke="url(#rampSvg)" strokeWidth="1" opacity=".45" />
    </svg>
  )
}
