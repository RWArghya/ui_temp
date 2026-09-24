/**
 * Mock: GET /api/v1/profile/me
 *
 * Returns the authenticated user's full profile.
 * Swap for: import { getProfile } from '../client.js'
 */
import { mockRequest } from './mockClient.js'

export const MOCK_PROFILE = {
  id: 'usr-aarav-001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@iitd.ac.in',
  phone: '+91 98765 43210',
  headline: 'Software Engineer | Distributed Systems & GenAI',
  about: 'Final-year Computer Science undergraduate at IIT Delhi with deep expertise in scalable backend architectures, high-throughput distributed systems, and applied Generative AI. Proven track record architecting microservices handling 40,000+ daily requests at sub-100ms latencies, author of peer-reviewed NLP research at EMNLP workshops, and winner of national-tier hackathons. Ranked in the top 1.5% globally on LeetCode (Knight, 2180+ rating).',
  org: 'IIT Delhi',
  region: 'New Delhi, India',
  joinedDate: 'January 2026',
  createdAt: '2026-01-15',
  avatar: null,           // null = initials; base64 dataURL when set
  isPublic: true,         // public visibility toggle
  links: 'github.com/aarav-sharma',
  resume: 'aarav_sharma_faang_resume.pdf',
  skills: [
    'Python',
    'Go',
    'C++',
    'TypeScript',
    'FastAPI',
    'Node.js',
    'PyTorch',
    'Docker',
    'Kubernetes',
    'AWS',
    'Redis',
    'PostgreSQL',
    'gRPC',
    'Kafka',
  ],
  interests: ['AI / GenAI', 'Cloud Systems', 'Distributed Computing', 'Competitive Programming'],
  domains: ['Distributed Systems', 'Generative AI & LLMs', 'Cloud Infrastructure', 'High-Throughput Backends'],
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
      title: '1st Place Winner — Smart India Hackathon 2025 (Govt. of India)',
      description: 'Built an autonomous real-time emergency vehicle route-clearing system using edge computer vision and IoT signal synchronization, selected #1 out of 2,400+ nationwide teams.',
      shared: true,
    },
    {
      id: 'ach-2',
      title: 'Grand Prize Winner — National GenAI Hackathon 2025',
      description: 'Awarded ₹3,00,000 grand prize among 850+ teams for building an autonomous zero-shot code migration engine converting legacy monoliths to idiomatic Go microservices.',
      shared: true,
    },
    {
      id: 'ach-3',
      title: 'LeetCode Knight (Rating: 2,180+ — Top 1.5% Globally)',
      description: 'Solved 800+ algorithmic problems across dynamic programming, graph theory, advanced data structures, and distributed concurrency.',
      shared: true,
    },
    {
      id: 'ach-4',
      title: 'ACM-ICPC Asia Regional Finalist 2024',
      description: 'Secured Rank 14 at the Amritapuri Regional Onsite Contest representing Indian Institute of Technology Delhi.',
      shared: true,
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      institution: 'Indian Institute of Technology Delhi (IIT Delhi)',
      boardOrUniversity: 'IIT Delhi',
      location: 'New Delhi, India',
      startYear: '2022',
      endYear: '2026',
      isOngoing: true,
      title: 'B.Tech in Computer Science & Engineering',
      org: 'Indian Institute of Technology Delhi',
      gpa: '9.4 / 10.0',
    },
    {
      id: 'edu-2',
      degree: 'Senior Secondary (Class XII)',
      specialization: 'Science (PCM with Computer Science)',
      institution: 'Delhi Public School, R.K. Puram',
      boardOrUniversity: 'CBSE',
      location: 'New Delhi, India',
      startYear: '2020',
      endYear: '2022',
      isOngoing: false,
      title: 'All India Senior School Certificate Examination (CBSE XII)',
      org: 'Delhi Public School, R.K. Puram',
      gpa: '98.2%',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'HyperScale RAG — Distributed Vector Search & Query Engine',
      description: 'Architected an enterprise RAG query engine handling 40,000+ daily queries with sub-95ms P99 retrieval latency.\nImplemented hybrid semantic search combining BM25 sparse retrieval and BGE-large dense embeddings with Reciprocal Rank Fusion (RRF), improving recall by 38%.\nEngineered a multi-tier caching layer with Redis cluster, cutting redundant LLM embedding calls by 62% and saving $1,400/mo in inference compute costs.\nBuilt real-time document ingestion pipelines with Kafka and Celery workers, chunking and indexing 1.2M+ technical documentation pages.',
      techStack: ['Python', 'FastAPI', 'PyTorch', 'Milvus', 'Redis', 'Docker', 'AWS'],
      sourceCodeUrl: 'https://github.com/aarav-sharma/hyperscale-rag',
      demoUrl: 'https://hyperscale-rag.demo.dev',
      docsUrl: 'https://hyperscale-rag.demo.dev/docs',
      link: 'github.com/aarav-sharma/hyperscale-rag',
      shared: true,
    },
    {
      id: 'proj-2',
      title: 'KubeFlow-Mesh — High-Performance eBPF Service Mesh',
      description: 'Developed a lightweight sidecar service mesh in Go leveraging eBPF for zero-copy TCP socket tracing, capping proxy latency under 0.8ms.\nEngineered client-side load balancing with consistent hashing and dynamic circuit-breaking, eliminating cascading failures during load spikes.\nDesigned distributed tracing and Prometheus metric exporters, visualizing real-time topology and latency percentiles across 50+ microservices.',
      techStack: ['Go', 'gRPC', 'Kubernetes', 'eBPF', 'Prometheus', 'Grafana'],
      sourceCodeUrl: 'https://github.com/aarav-sharma/kubeflow-mesh',
      demoUrl: 'https://mesh-dash.demo.dev',
      docsUrl: '',
      link: 'github.com/aarav-sharma/kubeflow-mesh',
      shared: true,
    },
    {
      id: 'proj-3',
      title: 'FlashKV — High-Throughput Persistent Key-Value Store',
      description: 'Implemented an ACID-compliant, log-structured merge-tree (LSM) storage engine in C++20 optimized for write-intensive workloads.\nEngineered a lock-free SkipList memtable and multi-threaded background compaction pipeline, sustaining 180,000 writes/sec on NVMe storage.\nIntegrated Block-based SSTable storage with Snappy compression and Bloom filters, bypassing 94% of unnecessary disk seeks on point queries.',
      techStack: ['C++', 'LSM-Tree', 'POSIX', 'Google Test', 'Benchmark'],
      sourceCodeUrl: 'https://github.com/aarav-sharma/flash-kv',
      demoUrl: '',
      docsUrl: '',
      link: 'github.com/aarav-sharma/flash-kv',
      shared: true,
    },
  ],
  publications: [
    {
      id: 'pub-1',
      title: 'Grounded RAG for Medical Q&A: Mitigating Hallucinations with Self-Verification Pipelines',
      description: 'Published in EMNLP 2025 Workshop. Proposed a verifiable multi-hop reasoning framework for domain-specific LLMs, reducing clinical hallucination rates by 41% on PubMedQA benchmark.',
      link: 'https://arxiv.org/abs/2025.12345',
      shared: true,
    },
  ],
  selfCerts: [
    {
      id: 'sc-1',
      title: 'AWS Certified Solutions Architect – Associate',
      org: 'Amazon Web Services (AWS)',
      issueDate: '2024',
      link: 'https://aws.amazon.com/verification',
      photo: '',
      shared: true,
    },
    {
      id: 'sc-2',
      title: 'Google Cloud Professional Data Engineer',
      org: 'Google Cloud',
      issueDate: '2024',
      link: 'https://cloud.google.com/certification',
      photo: '',
      shared: true,
    },
    {
      id: 'sc-3',
      title: 'Certified Kubernetes Application Developer (CKAD)',
      org: 'Cloud Native Computing Foundation (CNCF)',
      issueDate: '2024',
      link: 'https://www.cncf.io/certification/ckad/',
      photo: '',
      shared: true,
    },
    {
      id: 'sc-4',
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
  connectedProfiles: [
    {
      id: 'link-1',
      platform: 'GitHub',
      url: 'https://github.com/aarav-sharma',
      shared: true,
    },
    {
      id: 'link-2',
      platform: 'LinkedIn',
      url: 'https://linkedin.com/in/aarav-sharma-cse',
      shared: true,
    },
    {
      id: 'link-3',
      platform: 'LeetCode',
      url: 'https://leetcode.com/u/aarav_sharma',
      shared: true,
    },
    {
      id: 'link-4',
      platform: 'Developer Portfolio',
      url: 'https://aarav-sharma.dev',
      shared: true,
    },
  ],
  contributions: {
    github: 'aarav-sharma',
    stackoverflow: null,
  },
  // XP / level / badges
  xp: 780,
  level: 5,
  credits: 360,
  badges: [
    { id: 'b1', ico: 'Rocket', label: 'First submission' },
    { id: 'b2', ico: 'BookOpen', label: 'Active learner' },
    { id: 'b3', ico: 'Trophy', label: 'Hackathon winner' },
    { id: 'b4', ico: 'Star', label: 'Profile complete' },
  ],
  promptCredits: 250,
  promptStreak: 7,
}

/** Simulate GET /api/v1/profile/me */
export function fetchProfile() {
  return mockRequest(MOCK_PROFILE, { delay: 700 })
}

/** Simulate PATCH /api/v1/profile/me */
export function updateProfile(patch) {
  return mockRequest({ ...MOCK_PROFILE, ...patch }, { delay: 400 })
}
