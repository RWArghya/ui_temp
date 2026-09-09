import { Link } from "react-router-dom"

const footerLinks = [
  { to: "/initiatives", label: "Initiatives" },
  { to: "/enterprise", label: "For enterprise" },
  { to: "/sponsor", label: "Become a sponsor" },
  { to: "/auth?mode=login", label: "Log in" },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-line bg-ink-950 py-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <span className="font-display text-lg font-black text-white-soft">Hack2skill</span>
        <nav className="flex flex-wrap gap-[22px]">
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-[0.83rem] text-ink-text hover:text-brand-blue">
              {link.label}
            </Link>
          ))}
        </nav>
        <span className="font-mono text-[0.7rem] tracking-[0.05em] text-ink-dim">
          © 2026 Hack2skill · ISO 27001 · ISO 9001 · GDPR · IPUF prototype
        </span>
      </div>
    </footer>
  )
}
