/**
 * Mock: GET /api/profile/me
 *
 * Returns the authenticated user's full profile.
 * Swap for: api.get('/profile/me').then(r => r.data)
 */
import { mockRequest } from './mockClient.js'

export const MOCK_PROFILE = {
  id: 'usr-aarav-001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@iitd.ac.in',
  headline: 'Final-year CSE · ML enthusiast',
  about: 'Final-year Computer Science student at IIT Delhi with a strong interest in Machine Learning, Generative AI, and distributed systems. Passionate about participating in hackathons and building practical open-source projects.',
  org: 'IIT Delhi',
  region: 'India — North',
  avatar: null,           // null = initials; base64 dataURL when set
  isPublic: false,        // privacy toggle — false = locked profile (like FB)
  links: 'github.com/aarav-sharma',
  resume: null,
  skills: ['Python', 'React', 'ML / DL', 'Node.js'],
  interests: ['AI / GenAI', 'Agentic AI', 'Cloud'],
  domains: ['HealthTech', 'FinTech'],
  // Roles the user holds
  roles: [
    { key: 'competing',   label: '🏆 Competitor',  primary: false },
    { key: 'learning',    label: '📚 Learner',      primary: true  },
  ],
  landingView: 'learning',
  // Self-added content
  achievements: [
    { id: 'ach-1', title: 'Runner-up — CityHacks 2025', shared: true },
    { id: 'ach-2', title: 'Best ML Paper — IIT Delhi Tech Fest 2025', shared: false },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      institution: 'IIT Delhi',
      boardOrUniversity: 'IIT Delhi',
      location: 'New Delhi, India',
      startYear: '2022',
      endYear: '2026',
      isOngoing: true,
      title: 'B.Tech, Computer Science & Engineering',
      org: 'IIT Delhi',
    },
    {
      id: 'edu-2',
      degree: 'Senior Secondary (Class XII)',
      specialization: 'Science (PCM)',
      institution: 'Delhi Public School, R.K. Puram',
      boardOrUniversity: 'CBSE',
      location: 'New Delhi, India',
      startYear: '2020',
      endYear: '2022',
      isOngoing: false,
      title: 'Senior Secondary (CBSE, Science)',
      org: 'Delhi Public School, R.K. Puram',
    },
  ],
  projects: [
    { id: 'proj-1', title: 'AgentChat — LLM-powered support agent', link: 'github.com/aarav-sharma/agentchat', shared: true },
    { id: 'proj-2', title: 'DietML — dietary recommendation engine', link: 'github.com/aarav-sharma/dietml', shared: false },
  ],
  publications: [
    { id: 'pub-1', title: 'Grounded RAG for Medical Q&A (EMNLP 2025 Workshop)', link: 'arxiv.org/abs/2025.12345', shared: true },
  ],
  selfCerts: [
    { id: 'sc-1', title: 'AWS Cloud Practitioner', org: 'Amazon Web Services', shared: true },
    { id: 'sc-2', title: 'TensorFlow Developer Certificate', org: 'Google', shared: false },
  ],
  contributions: {
    github: null,         // null = not connected; string = username when connected
    stackoverflow: null,
  },
  // XP / level / badges — derived on frontend from verifiedCerts count
  xp: 340,
  level: 3,
  credits: 180,
  badges: [
    { id: 'b1', ico: '🚀', label: 'First submission' },
    { id: 'b2', ico: '📚', label: 'Active learner' },
  ],
  // Prompt Wars
  promptCredits: 150,
  promptStreak: 2,
}

/** Simulate GET /api/profile/me */
export function fetchProfile() {
  return mockRequest(MOCK_PROFILE, { delay: 700 })
}

/** Simulate PATCH /api/profile/me */
export function updateProfile(patch) {
  return mockRequest({ ...MOCK_PROFILE, ...patch }, { delay: 400 })
}
