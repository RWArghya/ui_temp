const SECTIONS = [
  {
    title: "Using the platform",
    body: "You must be at least 16 years old and provide accurate information when registering. You're responsible for activity under your account.",
  },
  {
    title: "Initiatives, prizes, and submissions",
    body: "Prize amounts, eligibility, and deadlines shown on an initiative are set by the organising sponsor, not Hack2skill. Submissions must be your own original work (or your team's) produced within the stated window.",
  },
  {
    title: "Mentors and evaluators",
    body: "Anyone approved as a mentor or evaluator agrees to keep every submission they review confidential and to declare any conflict of interest before scoring.",
  },
  {
    title: "Certificates",
    body: "Certificates issued through the platform reflect participation or completion as recorded by Hack2skill and the organising sponsor at the time of issue.",
  },
  {
    title: "Account suspension",
    body: "We may suspend accounts for plagiarism, harassment, or misuse of the mentor/evaluator role. You'll be notified and can appeal.",
  },
  {
    title: "Changes to these terms",
    body: "We'll post updates here and notify active users of material changes before they take effect.",
  },
]

export default function Terms() {
  return (
    <main className="mx-auto max-w-[820px] px-4 py-20 sm:px-6 lg:px-8">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.13em] text-graphite-dim">Legal</p>
      <h1 className="mt-2 font-display text-3xl font-black text-ink-900 sm:text-4xl">Terms of Service</h1>
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
