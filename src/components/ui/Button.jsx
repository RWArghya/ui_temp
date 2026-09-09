import { Link } from "react-router-dom"
import Icon from "./Icon"

const variantClasses = {
  signal: "bg-signal text-white border-signal hover:bg-signal-dark hover:border-signal-dark",
  violet: "bg-transparent text-violet border-violet hover:bg-violet hover:text-white",
  onDark: "bg-transparent text-white-soft border-ink-line hover:border-brand-blue hover:bg-brand-blue/15",
}

const sizeClasses = {
  default: "px-5 py-[11px] text-[0.9rem]",
  lg: "px-[30px] py-[15px] text-[0.98rem]",
}

/**
 * Renders a <Link> when `to` is set, a plain <a> when `href` is set,
 * otherwise a <button>. `loading` disables the control and swaps the
 * icon for a daisyUI spinner.
 */
export default function Button({
  to,
  href,
  variant = "signal",
  size = "default",
  icon,
  disabled = false,
  loading = false,
  className = "",
  children,
  type = "button",
  ...props
}) {
  const classes = [
    "inline-flex items-center justify-center gap-[9px] rounded-btn border font-semibold whitespace-nowrap",
    "transition-colors duration-200 ease-out cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(" ")

  const content = (
    <>
      {loading && <span className="loading loading-spinner loading-xs" aria-hidden="true" />}
      <span>{children}</span>
      {icon && !loading && <Icon name={icon} className="w-[15px] h-[15px]" />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled} {...props}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
}
