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

export const authStore = { read, save, clear };
