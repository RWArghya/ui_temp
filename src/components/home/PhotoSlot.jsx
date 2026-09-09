export default function PhotoSlot({ lines }) {
  return (
    <div className="grid aspect-[4/3] place-items-center rounded-btn border border-dashed border-ink-line bg-ink-800 p-2 text-center">
      <span className="font-mono text-[0.58rem] leading-[1.4] tracking-[0.06em] text-ink-dim">
        {lines.map((line, i) => (
          <span key={line}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </span>
    </div>
  )
}
