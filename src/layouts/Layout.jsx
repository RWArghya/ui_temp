import { useCallback, useRef } from "react"
import { Outlet } from "react-router-dom"
import SiteHeader from "../components/layout/SiteHeader"
import SiteFooter from "../components/layout/SiteFooter"
import ExploreOverlay from "../components/home/ExploreOverlay"

/**
 * Owns the Explore intent-picker modal so the header, hero and closing
 * band — siblings, not parent/child — can all trigger it. Pages reach
 * `openExplore` via useOutletContext().
 */
export default function Layout() {
  const dialogRef = useRef(null)

  const openExplore = useCallback(() => dialogRef.current?.showModal(), [])
  const closeExplore = useCallback(() => dialogRef.current?.close(), [])

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader onOpenExplore={openExplore} />
      <Outlet context={{ openExplore }} />
      <SiteFooter />
      <ExploreOverlay ref={dialogRef} onClose={closeExplore} />
    </div>
  )
}
