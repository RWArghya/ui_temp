/**
 * Mock: GET /api/initiatives?userId=me
 *
 * Returns initiatives the current user is registered for (active + completed).
 * Swap for: api.get('/initiatives', { params: { userId: 'me' } }).then(r => r.data)
 */
import { mockRequest } from './mockClient.js'

export const MOCK_USER_INITIATIVES = {
  /** Completed (past) — user gets certificates for these */
  completed: [
    {
      id: 'inspire-26',
      name: 'Inspire Hackathon 2026',
      org: 'Hack2skill',
      purpose: 'competing',
      status: 'past',
      deadline: '2026-05-18',
      submitted: true,
      verifiableId: 'H2S-INSPIR-11618',
    },
    {
      id: 'code-future',
      name: 'Code for Future',
      org: 'Hack2skill × EU partners',
      purpose: 'competing',
      status: 'past',
      deadline: '2026-04-22',
      submitted: false,
      verifiableId: 'H2S-CODEFU-11640',
    },
  ],
  /** Active (registered, not yet ended) */
  active: [
    {
      id: 'genai-academy',
      name: 'Gen AI Academy — Cohort 12',
      org: 'Hack2skill × Google Cloud',
      purpose: 'learning',
      status: 'live',
      deadline: '2026-08-30',
      progress: { done: 4, total: 8 },
    },
    {
      id: 'agentic-bootcamp',
      name: 'Agentic AI Bootcamp',
      org: 'Hack2skill',
      purpose: 'learning',
      status: 'live',
      deadline: '2026-09-08',
      progress: { done: 1, total: 7 },
    },
  ],
  /** Submissions the user made */
  submittedIds: ['inspire-26'],
}

export function fetchUserInitiatives() {
  return mockRequest(MOCK_USER_INITIATIVES, { delay: 600 })
}
