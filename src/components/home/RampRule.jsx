export default function RampRule({ reverse = false }) {
  return <hr className={`h-[3px] border-0 ${reverse ? "bg-ramp-rev" : "bg-ramp"}`} />
}
