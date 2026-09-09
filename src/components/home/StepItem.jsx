export default function StepItem({ index, title, description }) {
  return (
    <div className="grid grid-cols-[34px_1fr] items-start gap-3.5">
      <div className="grid h-[34px] w-[34px] place-items-center rounded-btn bg-ink-900 font-mono text-[0.82rem] font-semibold text-white">
        {index}
      </div>
      <div>
        <h3 className="text-[0.95rem] font-bold leading-tight text-ink-900">{title}</h3>
        <p className="mt-1.5 text-[0.84rem] text-graphite">{description}</p>
      </div>
    </div>
  )
}
