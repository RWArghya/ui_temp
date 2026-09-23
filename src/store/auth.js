const KEY = "h2s_auth";

const defaults = {
  account: null,
  name: "",
  email: "",
  onboarded: false,
  primary: null,
};

function weakHash(s) {
  let h = 5381
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h
}

// First visitor gets a seeded demo account so "Log in" works out of the box.
// Swap these for a real credential flow once the backend exists.
const DEMO = {
  account: {
    name: "Aarav Sharma",
    email: "demo@hack2skill.com",
    mobile: "+91 98765 43210",
    pw: weakHash("demo1234"),
    verified: true,
    onboarded: true,
    created: "2026-01-01",
  },
  name: "Aarav Sharma",
  email: "demo@hack2skill.com",
  onboarded: true,
};

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const base = raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
    if (!base.account) {
      return { ...base, ...DEMO }
    }
    return base
  } catch {
    return { ...defaults, ...DEMO }
  }
}

function save(patch) {
  const prev = read();
  const next = { ...prev, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function clear() {
  localStorage.removeItem(KEY);
}

/* Settings → Account & Security's "Change password" reads/writes the same
   account.pw hash Auth.jsx's login screen checks against, so a changed
   password actually takes effect on the next login — not a separate,
   disconnected form. */
function changePassword(currentPw, newPw) {
  const st = read()
  if (!st.account) return { ok: false, error: "No account found." }
  if (weakHash(currentPw) !== st.account.pw) return { ok: false, error: "Current password is incorrect." }
  if (!newPw || newPw.length < 8) return { ok: false, error: "New password must be at least 8 characters." }
  save({ account: { ...st.account, pw: weakHash(newPw) } })
  return { ok: true }
}

// Settings' Danger zone (deactivate/delete) uses this to re-check identity
// before an irreversible-ish action, the same hash changePassword checks.
function verifyPassword(pw) {
  const st = read()
  return !!st.account && weakHash(pw) === st.account.pw
}

export const authStore = { read, save, clear, changePassword, verifyPassword };
