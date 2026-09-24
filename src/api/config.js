/**
 * The one place that decides whether this app talks to the real backend.
 *
 * VITE_USE_MOCK === "false"  → call the API
 * anything else, or unset    → mock / localStorage, exactly as before
 *
 * The default is mock on purpose: someone who has not opted in, and CI, both
 * keep the current behaviour without setting anything.
 *
 * Nothing else in the codebase may read import.meta.env.VITE_USE_MOCK — import
 * USE_MOCK from here instead, so flipping modes is one variable and a dev-server
 * restart rather than a search through call sites.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
