export const primaryPurposeOptions = [
  {
    id: "learning",
    title: "Learn",
    description: "Bootcamps, workshops and masterclasses.",
    to: "/initiatives?purpose=learning",
  },
  {
    id: "competing",
    title: "Compete",
    description: "Join hackathons — build, submit, win.",
    to: "/initiatives?purpose=competing",
  },
  {
    id: "learncompete",
    title: "Build",
    description: "Learn the fundamentals, then compete on a real problem statement.",
    to: "/initiatives?purpose=learncompete",
    wide: true,
  },
]

export const secondaryPurposeOptions = [
  {
    id: "mentor",
    title: "Mentor",
    description: "Guide teams and judge submissions on live challenges.",
    to: "/auth?intent=mentor",
    tag: "Approval required",
  },
  {
    id: "sponsor",
    title: "Sponsor",
    description: "Run a hackathon, challenge or hiring drive.",
    to: "/sponsor",
  },
]
