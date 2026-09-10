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
    {
      id: 'ach-1',
      title: 'Runner-up — CityHacks 2025',
      description: 'Awarded 2nd place among 120+ teams for building an AI-powered urban traffic rerouting simulator.',
      shared: true,
    },
    {
      id: 'ach-2',
      title: 'Best ML Paper — IIT Delhi Tech Fest 2025',
      description: 'Selected as the outstanding machine learning submission for work on sparse attention mechanisms.',
      shared: false,
    },
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
    {
      id: 'proj-1',
      title: 'AgentChat — LLM-powered support agent',
      description: 'An autonomous agent that triages customer queries, searches vector embeddings for documentation, and responds with cited sources.',
      techStack: ['Python', 'React', 'FastAPI', 'LangChain', 'OpenAI'],
      sourceLink: 'github.com/aarav-sharma/agentchat',
      liveLink: 'https://agentchat.demo.app',
      docsLink: 'https://agentchat.demo.app/docs',
      link: 'github.com/aarav-sharma/agentchat',
      shared: true,
    },
    {
      id: 'proj-2',
      title: 'DietML — dietary recommendation engine',
      description: 'Personalized meal and macronutrient optimization based on biometric inputs and lifestyle preferences.',
      techStack: ['Python', 'PyTorch', 'FastAPI'],
      sourceLink: 'github.com/aarav-sharma/dietml',
      liveLink: '',
      docsLink: '',
      link: 'github.com/aarav-sharma/dietml',
      shared: false,
    },
  ],
  publications: [
    {
      id: 'pub-1',
      title: 'Grounded RAG for Medical Q&A (EMNLP 2025 Workshop)',
      description: 'Investigating hallucination reduction techniques in medical language models using retrieved clinical guidelines and verification steps.',
      link: 'arxiv.org/abs/2025.12345',
      shared: true,
    },
  ],
  selfCerts: [
    { id: 'sc-1', title: 'AWS Cloud Practitioner', org: 'Amazon Web Services', issueDate: '2024', link: 'https://aws.amazon.com/verification', photo: '', shared: true },
    { id: 'sc-2', title: 'TensorFlow Developer Certificate', org: 'Google', issueDate: '2023', link: '', photo: '', shared: false },
    {
      id: 'sc-3',
      title: 'Infosys Springboard — Cloud & Java Development',
      org: 'Infosys Springboard',
      issueDate: 'October 2024',
      link: '',
      photo: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550" width="800" height="550">
  <rect width="800" height="550" fill="#fdfbf7" stroke="#007cc3" stroke-width="12" rx="8"/>
  <rect x="20" y="20" width="760" height="510" fill="none" stroke="#d4af37" stroke-width="2" stroke-dasharray="8 4"/>
  <text x="400" y="90" font-family="sans-serif" font-size="28" font-weight="bold" fill="#007cc3" text-anchor="middle" letter-spacing="2">INFOSYS SPRINGBOARD</text>
  <text x="400" y="125" font-family="serif" font-size="16" fill="#666" text-anchor="middle" font-style="italic">Certificate of Completion</text>
  <line x1="280" y1="145" x2="520" y2="145" stroke="#d4af37" stroke-width="2"/>
  <text x="400" y="200" font-family="sans-serif" font-size="15" fill="#555" text-anchor="middle">This is proudly presented to</text>
  <text x="400" y="250" font-family="sans-serif" font-size="30" font-weight="bold" fill="#111" text-anchor="middle">Aarav Sharma</text>
  <text x="400" y="300" font-family="sans-serif" font-size="15" fill="#555" text-anchor="middle">for successfully completing the specialized industry course on</text>
  <text x="400" y="340" font-family="sans-serif" font-size="22" font-weight="bold" fill="#007cc3" text-anchor="middle">Full Stack Cloud &amp; Java Development</text>
  <text x="400" y="380" font-family="sans-serif" font-size="14" fill="#777" text-anchor="middle">Issued on: October 2024 · Verification Code: INFY-SB-2024-8839</text>
  <circle cx="160" cy="460" r="32" fill="#007cc3" opacity="0.1"/>
  <text x="160" y="466" font-family="sans-serif" font-size="12" font-weight="bold" fill="#007cc3" text-anchor="middle">VERIFIED</text>
  <line x1="560" y1="465" x2="680" y2="465" stroke="#333" stroke-width="1.5"/>
  <text x="620" y="485" font-family="sans-serif" font-size="13" font-weight="bold" fill="#333" text-anchor="middle">Authorized Signatory</text>
</svg>
`)}`,
      shared: true,
    },
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
