/* ---- TEAMMATE BOUNDARY: LevelStrip ----
 * Compact level/XP/badges/credits strip shown inside the profile card header.
 * Clickable — passes onClick to navigate to the Rewards tab.
 * ---- TEAMMATE BOUNDARY END ---- */

import Meter from './Meter.jsx'

/**
 * LevelStrip — glanceable level + XP bar + badge count + credits.
 *
 * @param {number} level
 * @param {number} xp
 * @param {number} xpNext   XP needed for next level
 * @param {number} xpPct    0–100
 * @param {number} badgeCount
 * @param {number} credits
 * @param {function} onClick
 */
export default function LevelStrip({ level, xp, xpNext, xpPct, badgeCount, credits, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      id="profile-level-strip"
      className={[
        'flex items-center gap-3 max-w-[340px]',
        'border border-paper-line rounded-card px-3.5 py-2.5 cursor-pointer',
        'hover:border-signal hover:shadow-sm transition-all duration-150 text-left w-full',
      ].join(' ')}
      aria-label={`Level ${level} — click to see Rewards`}
    >
      {/* Level badge */}
      <div
        className={[
          'w-[38px] h-[38px] rounded-full flex-none grid place-items-center',
          'bg-signal-soft text-signal-dark font-bold text-[13px] font-display',
        ].join(' ')}
        aria-hidden="true"
      >
        {level}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-ink-900 leading-tight">
          Level {level} · {badgeCount} badge{badgeCount !== 1 ? 's' : ''} · {credits} credits
        </p>
        <Meter pct={xpPct} className="mt-1.5 max-w-[160px]" />
        <p className="text-[11px] text-graphite-dim mt-1">
          {xp} XP · {Math.max(0, xpNext - xp)} to Level {level + 1}
        </p>
      </div>

      <span className="text-[13px] text-graphite-dim" aria-hidden="true">→</span>
    </button>
  )
}
