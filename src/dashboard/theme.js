/* Light/dark for the dashboard only. Not `data-theme`: daisyUI owns that
   attribute and would re-skin the marketing site too. Applied on import so
   the first paint is already right; the choice is the user's, else the OS's. */
const KEY = 'h2s_theme'
const root = document.documentElement

function saved() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export const getTheme = () => root.dataset.dashTheme || 'light'

export function setTheme(t) {
  root.dataset.dashTheme = t
  try { localStorage.setItem(KEY, t) } catch { /* private mode — the choice just won't persist */ }
}

root.dataset.dashTheme = saved() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
