import Icon from "../ui/Icon"

export default function WhyUsCard({ icon, title, description }) {
  return (
    <div className="group relative overflow-hidden rounded-card border border-paper-line bg-paper-raised p-6 transition-all duration-200 hover:border-[#cfd4e8] hover:shadow-[0_18px_40px_-26px_rgba(25,17,53,.3)]">
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-ramp transition-transform duration-300 group-hover:scale-x-100" />
      <div className="mb-4 grid h-[34px] w-[34px] place-items-center rounded-btn bg-signal-soft text-signal">
        <Icon name={icon} className="h-[17px] w-[17px]" />
      </div>
      <h3 className="text-[1.02rem] font-bold text-ink-900">{title}</h3>
      <p className="mt-[9px] text-[0.87rem] text-graphite">{description}</p>
    </div>
  )
}
