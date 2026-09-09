import { mockRequest } from "./mockClient"

/**
 * Backend requirement — see API_REQUIREMENTS.md:
 * GET /api/initiatives?flagship=true
 */
export function fetchFlagshipChallenges(opts) {
  return mockRequest(
    [
      {
        id: "icc-next-in",
        tag: "Flagship",
        title: "ICC 'Next In' Global Hackathon",
        description: "Global cricket-tech innovation challenge run with the ICC.",
        href: "/initiatives",
      },
      {
        id: "ntpc-hackathon",
        tag: "Flagship",
        title: "NTPC Hackathon",
        description: "Energy-sector innovation challenge with NTPC.",
        href: "/initiatives",
      },
      {
        id: "gen-ai-academy",
        tag: "Flagship",
        title: "Gen AI Academy",
        description: "Cohort-based applied GenAI bootcamp and build track.",
        href: "/initiatives",
      },
      {
        id: "uipath-rpadc",
        tag: "Flagship",
        title: "UiPath RPADC",
        description: "Robotic process automation development challenge with UiPath.",
        href: "/initiatives",
      },
    ],
    opts
  )
}
