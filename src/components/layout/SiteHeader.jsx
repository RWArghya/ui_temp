import { Link } from "react-router-dom"
import Button from "../ui/Button"

/**
 * No logo.png/logo-white.png assets were provided with the design — using
 * a text wordmark until real brand assets are supplied. TBD.
 */
export default function SiteHeader({ onOpenExplore }) {
  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[66px] max-w-[1180px] items-center gap-7 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="block shrink-0">
          <span className="font-display text-xl font-black text-ink-900">Hack2skill</span>
        </a>
        <nav className="ml-3.5 hidden gap-6 md:flex">
          <a href="#why-us" className="text-[0.88rem] font-medium text-graphite hover:text-signal">
            Why us
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-3.5">
          <Link to="/auth?mode=login" className="text-[0.88rem] font-medium text-graphite hover:text-signal">
            Log in
          </Link>
          <Button variant="signal" icon="arrow-right" onClick={onOpenExplore}>
            Explore
          </Button>
        </div>
      </div>
    </header>
  )
}
