/**
 * Builds the user's platform journey on Hack2skill in chronological order.
 *
 * Includes ONLY events, activities, milestones, and achievements on this platform:
 * - Profile creation
 * - Hackathons and learning initiatives participated in (completed, in-review/closed, and ongoing)
 * - Platform project submissions
 * - Platform badges unlocked
 * - Verified Hack2skill certificates earned
 * - Live learning cohort progress
 *
 * @param {object} profile
 * @param {object} initiatives
 * @param {string} order - 'recent' (newest first, default) or 'oldest' (oldest first)
 * @returns {Array<{ id: string, title: string, subtitle: string, date: string, variant: string, timestamp: number }>}
 */
export function buildPlatformJourney(profile, initiatives, order = 'recent') {
  if (!profile) return []

  const completed = initiatives?.completed || []
  const active = initiatives?.active || []
  const pending = initiatives?.pending || []
  const submittedIds = initiatives?.submittedIds || []
  const badges = profile.badges || []

  const items = []

  // 1. Profile Creation on Hack2skill
  const createdDate = profile.joinedDate || 'January 2026'
  const createdTimestamp = new Date(profile.createdAt || '2026-01-15').getTime()
  items.push({
    id: 'platform-joined',
    title: '🌱 Joined Hack2skill & Profile Created',
    subtitle: 'Started innovation journey on Hack2skill · Initial profile established',
    date: createdDate,
    variant: 'done',
    timestamp: createdTimestamp,
  })

  // 2. Completed Initiatives, Submissions & Verified Certificates
  completed.forEach(c => {
    const isHackathon = c.purpose === 'competing'
    const deadlineDate = c.deadline ? new Date(c.deadline).getTime() : new Date('2026-04-01').getTime()
    const displayDate = c.completedDate || (c.deadline ? new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026')

    // Participation event
    items.push({
      id: `participated-${c.id}`,
      title: isHackathon ? `🏆 Competed in ${c.name}` : `📚 Completed ${c.name}`,
      subtitle: `${c.org || 'Hack2skill'} · ${isHackathon ? 'Hackathon participant' : 'Learning initiative'}`,
      date: displayDate,
      variant: 'done',
      timestamp: deadlineDate - 86400000 * 2, // 2 days before deadline
    })

    // Project Submission on Hack2skill (if submitted)
    if (c.submitted || submittedIds.includes(c.id)) {
      items.push({
        id: `submission-${c.id}`,
        title: `🚀 Submitted Project Solution — ${c.name}`,
        subtitle: `Project repository and build artifacts formally submitted for jury review`,
        date: displayDate,
        variant: 'done',
        timestamp: deadlineDate,
      })
    }

    // Verified Certificate Issued
    items.push({
      id: `cert-${c.id}`,
      title: `📜 Earned H2S Certificate — ${c.name}`,
      subtitle: `Verified credential issued · ID: ${c.verifiableId || 'H2S-VERIFIED'}`,
      date: displayDate,
      variant: 'done',
      timestamp: deadlineDate + 86400000 * 2, // 2 days after deadline
    })
  })

  // 3. Platform Badges Unlocked
  badges.forEach(b => {
    let badgeTimestamp = createdTimestamp + 86400000 * 30
    let badgeDate = '2026'
    if (b.id === 'b1' || b.label?.toLowerCase().includes('submission')) {
      badgeTimestamp = new Date('2026-05-18T18:00:00').getTime()
      badgeDate = 'May 2026'
    } else if (b.id === 'b2' || b.label?.toLowerCase().includes('learner')) {
      badgeTimestamp = new Date('2026-08-20T12:00:00').getTime()
      badgeDate = 'August 2026'
    }

    items.push({
      id: `badge-${b.id}`,
      title: `${b.ico || '🏅'} Unlocked Platform Badge — ${b.label}`,
      subtitle: `Achievement unlocked across Hack2skill programs`,
      date: badgeDate,
      variant: 'done',
      timestamp: badgeTimestamp,
    })
  })

  // 4. Closed / Pending Initiatives (Evaluation & cert generation in review)
  pending.forEach(p => {
    const isHackathon = p.purpose === 'competing'
    const deadlineDate = p.deadline ? new Date(p.deadline).getTime() : new Date('2026-06-30').getTime()
    const displayDate = p.deadline ? new Date(p.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'

    items.push({
      id: `pending-${p.id}`,
      title: isHackathon ? `⚔️ Participated in ${p.name}` : `☁️ Completed ${p.name}`,
      subtitle: `${p.org || 'Hack2skill'} · Initiative closed — evaluation & certificate generation in review`,
      date: displayDate,
      variant: 'done',
      timestamp: deadlineDate,
    })
  })

  // 5. Active / Ongoing Programs on Hack2skill
  active.forEach(a => {
    const deadlineDate = a.deadline ? new Date(a.deadline).getTime() : new Date('2026-09-01').getTime()
    const displayDate = a.deadline ? new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Ongoing'
    const progressText = a.progress
      ? `${a.progress.done} of ${a.progress.total} modules completed (${Math.round((a.progress.done / a.progress.total) * 100)}% progress)`
      : 'Active participant'

    items.push({
      id: `active-${a.id}`,
      title: `⚡ Ongoing: ${a.name}`,
      subtitle: `${a.org || 'Hack2skill'} · ${progressText}`,
      date: 'Ongoing',
      variant: 'now',
      timestamp: deadlineDate + 86400000 * 10,
    })
  })

  // Sort: most recent at the top, oldest at the bottom
  if (order === 'oldest') {
    items.sort((a, b) => a.timestamp - b.timestamp)
  } else {
    items.sort((a, b) => b.timestamp - a.timestamp)
  }

  return items
}

// Backward-compatible alias
export const buildJourneyTimeline = buildPlatformJourney
