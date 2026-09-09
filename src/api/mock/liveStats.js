import { mockRequest } from "./mockClient"

/**
 * Backend requirement — see API_REQUIREMENTS.md:
 * GET /api/network/live-stats
 */
export function fetchLiveStats(opts) {
  return mockRequest(
    {
      liveInitiatives: 34,
      submissionsThisWeek: 1208,
      mentorsMapped: 412,
      partnerInstitutes: "10,000+",
      networkStatus: "live",
    },
    opts
  )
}
