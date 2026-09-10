/* ---- TEAMMATE BOUNDARY: TabBar ----
 * Horizontal scrollable tab bar with active underline indicator.
 * Reusable beyond the profile page.
 * ---- TEAMMATE BOUNDARY END ---- */

/**
 * TabBar — horizontal tab navigation.
 *
 * @param {{ key: string, label: string }[]} tabs
 * @param {string}   active      key of the active tab
 * @param {function} onSelect    (key) => void
 */
export default function TabBar({ tabs, active, onSelect }) {
  return (
    <div
      className="flex gap-1 border-b border-paper-line mb-6 overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label="Profile sections"
    >
      {tabs.map(({ key, label }) => {
        const isActive = key === active
        return (
          <button
            key={key}
            id={`profile-tab-${key}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`profile-panel-${key}`}
            onClick={() => onSelect(key)}
            className={[
              'px-4 py-3 text-[14px] font-medium whitespace-nowrap cursor-pointer',
              'border-b-2 -mb-px transition-colors duration-150',
              isActive
                ? 'text-signal border-signal font-bold'
                : 'text-graphite-dim border-transparent hover:text-ink-900',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
