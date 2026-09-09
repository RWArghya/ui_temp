import { mockRequest } from "./mockClient"

/**
 * Backend requirement — see API_REQUIREMENTS.md:
 * GET /api/testimonials
 * Each slot is either "pending" (no verified quote yet — render the
 * placeholder copy) or "published" (render the real quote/author).
 */
export function fetchTestimonials(opts) {
  return mockRequest(
    [
      {
        id: "sponsor",
        status: "pending",
        placeholder: "A quote from a sponsor's post-program feedback survey about outreach quality and talent fit.",
        role: "Sponsor · Fortune 500 technology company",
      },
      {
        id: "innovator",
        status: "pending",
        placeholder: "A quote from an innovator about landing an offer, a mentor, or a shipped project through H2S.",
        role: "Innovator · Winner, 2026 cohort",
      },
      {
        id: "institute",
        status: "pending",
        placeholder: "A quote from a partner institute about placement or upskilling outcomes for their students.",
        role: "Partner institute · Placement cell",
      },
    ],
    opts
  )
}
