/* ---- TEAMMATE BOUNDARY: CoverBand ----
 * Gradient cover strip at the top of the profile card.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * CoverBand — the brand-gradient banner behind the profile photo.
 */
export default function CoverBand() {
  return (
    <div
      className="h-[110px] w-full"
      style={{
        background: 'linear-gradient(135deg, #1548b7 0%, #3f1d80 100%)',
      }}
      aria-hidden="true"
    />
  )
}
