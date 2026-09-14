const SECTIONS = [
  {
    title: "What we collect",
    body: "Account details you give us at signup (name, email, region), profile information you choose to add (headline, skills, interests, resume, links to GitHub/LinkedIn), and activity on the platform — initiatives you register for, submissions, and mentor applications.",
  },
  {
    title: "How we use it",
    body: "To run your account, match you with relevant initiatives, show your progress, and let sponsors and mentors evaluate submissions you choose to make. We never sell profile data to third parties.",
  },
  {
    title: "Who can see your profile",
    body: "By default your profile is private. You control visibility in Settings → Privacy — making it public lets sponsors and mentors browsing the talent pool find you; it stays off until you turn it on.",
  },
  {
    title: "Data retention",
    body: "We keep account data for as long as your account is active. You can request a full export or permanent deletion of your account from Settings at any time.",
  },
  {
    title: "Cookies",
    body: "We use only the cookies required to keep you signed in — no third-party ad-tracking cookies.",
  },
  {
    title: "Contact",
    body: "Questions about this policy or your data: privacy@hack2skill.com.",
  },
]

export default function Privacy() {
  return (
    <main className="mx-auto max-w-[820px] px-4 py-20 sm:px-6 lg:px-8">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.13em] text-graphite-dim">Legal</p>
      <h1 className="mt-2 font-display text-3xl font-black text-ink-900 sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-graphite">Last updated 12 September 2026. This is a prototype policy — final legal copy should be reviewed by counsel before launch.</p>

      <div className="mt-10 flex flex-col gap-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-bold text-ink-900">{s.title}</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-graphite">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
