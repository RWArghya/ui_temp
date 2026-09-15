import { useState } from 'react'
import {
  byId, daysLeft, deadlineText, profileScore, mentorStatus, mentorRoleLabel,
  approvedChallenges, selfCerts,
} from './data'

/* Deterministic keyword routing, NOT an LLM — mirrors support.js. Its value
   is answering from the SAME state the dashboard renders, not a generic FAQ.
   A trimmed subset of the reference's ~30-entry knowledge base, scoped to
   what this dashboard actually implements. */
const STARTERS_INNOVATOR = ['What should I do next?', 'When is my next deadline?', 'Where are my certificates?']
const STARTERS_MENTOR = ['What should I do next?', 'Why is my queue empty?', 'Am I approved yet?']

function nextDeadline(st) {
  const live = (st.registered || []).map(byId).filter(o => o && o.status !== 'past')
    .sort((a, b) => daysLeft(a.deadline) - daysLeft(b.deadline))
  return live[0] || null
}

function escalate() {
  const id = '#H2S-' + (24000 + Math.floor(Math.random() * 900))
  return { text: `Raised ticket ${id} with the H2S team, along with this conversation for context. Someone replies within one working day.` }
}

function answer(text, st, mode) {
  const hit = (re) => re.test(text)

  if (hit(/raise a ticket/i)) return escalate()

  if (hit(/what (should i|do i) do|what.?s next|next step|where do i start|stuck|help me|now what/i)) {
    if (mode === 'mentor') {
      const ms = mentorStatus(st)
      if (ms === 'none') return { text: 'Apply first from your Mentor view. An H2S reviewer looks at it within 2–3 working days.' }
      if (ms === 'pending' || ms === 'info') return { text: "Nothing to do yet — your application is under review. Everything else on your account stays open." }
      const approved = approvedChallenges(st)
      if (!approved.length) return { text: "Request a challenge from your Mentor view — once an Enabler maps it, submissions start routing to you." }
      return { text: 'Check your Evaluation queue in the sidebar — that names exactly what is waiting on your score.' }
    }
    const reg = st.registered || []
    if (!reg.length) return { text: "You haven't joined anything yet. Pick something from Compete, Learn or Build and register — it's free." }
    return { text: 'Open My Dashboard — "Pick up where you left off" always names your next real step.' }
  }

  if (hit(/deadline|due date|when.*(due|close|end)|how long.*left/i)) {
    const o = nextDeadline(st)
    if (!o) {
      return { text: (st.registered || []).length
        ? "Everything you're registered for has already closed."
        : "You're not registered for anything yet, so nothing's due." }
    }
    return { text: `Your next deadline is ${o.name} — ${deadlineText(o).toLowerCase()}.` }
  }

  if (hit(/certificate|certif/i)) {
    const n = selfCerts(st).length
    return n
      ? { text: `You have ${n} certificate${n === 1 ? '' : 's'}. They're issued automatically the moment an initiative closes — nothing to request.` }
      : { text: "Certificates are issued automatically once an initiative you joined closes. You don't have any yet." }
  }

  if (hit(/my profile|profile.*(complete|strength|percent)|how complete/i)) {
    const { pct, missing } = profileScore(st)
    if (pct >= 100) return { text: 'Your profile is 100% complete. Nothing left to do.' }
    return { text: `Your profile is ${pct}% complete. Still missing: ${missing.map(m => m.label.toLowerCase()).join(', ')}.` }
  }

  if (hit(/mentor|evaluat|judge|become.*(mentor|jury)/i)) {
    const ms = mentorStatus(st)
    if (ms === 'approved') return { text: `You're an approved ${mentorRoleLabel(st).toLowerCase()}. Requested challenges route submissions to you once an Enabler confirms the mapping.` }
    if (ms === 'pending') return { text: 'Your mentor application is under review. Typical turnaround is 2–3 working days.' }
    if (ms === 'info') return { text: 'A reviewer asked for more information — open your Mentor view to update and resubmit.' }
    return { text: 'Anyone can apply to mentor — switch to Mentor from the "View as" bar at the bottom of the screen.' }
  }

  if (hit(/free|cost|price|pay|charge|fee/i)) {
    return { text: 'Everything is free for innovators, always. Sponsors fund the platform; you never pay to enter, submit or get certified.' }
  }

  if (hit(/register|sign ?up|join|how.*take part|participate/i)) {
    return { text: 'Pick anything from Compete, Learn or Build in the sidebar and hit Register — free, immediate, no application.' }
  }

  if (hit(/human|person|talk to (someone|a human)|agent|escalate|support team/i)) return escalate()

  if (hit(/hello|^hi\b|^hey|good (morning|afternoon|evening)/i)) {
    return { text: 'Hi. Ask me anything about your account — deadlines, certificates, profile or mentor status. I can see your dashboard, so the answers are about you.' }
  }

  return { text: "I don't know that one, and I'd rather not guess. Want me to raise a ticket with the H2S team?", chips: ['Raise a ticket'] }
}

export default function SupportBot({ st, sv, mode = 'innovator' }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [chips, setChips] = useState(mode === 'mentor' ? STARTERS_MENTOR : STARTERS_INNOVATOR)
  const log = st.chat || []

  const push = (m) => sv({ chat: [...(st.chat || []), m] })

  function send(text) {
    if (!text || !text.trim()) return
    push({ from: 'me', text })
    setInput('')
    setChips([])
    setTyping(true)
    setTimeout(() => {
      const r = answer(text, st, mode)
      setTyping(false)
      push({ from: 'bot', text: r.text })
      setChips(r.chips || (mode === 'mentor' ? STARTERS_MENTOR : STARTERS_INNOVATOR))
    }, 420)
  }

  function toggle() {
    setOpen((o) => !o)
    if (!open && !log.length) {
      push({ from: 'bot', text: "Hi — I'm the H2S assistant. I can see your dashboard, so ask me about your deadlines, certificates, profile or mentor status. If I don't know, I'll put you through to a person." })
    }
  }

  return (
    <>
      <button
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        onClick={toggle}
        className="fixed bottom-5 right-5 z-50 grid h-[54px] w-[54px] place-items-center rounded-full bg-ramp text-2xl text-white shadow-lg transition hover:-translate-y-0.5 hover:scale-105"
      >
        <span className="relative">
          {open ? '✕' : '💬'}
          {!open && !log.length ? (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-dash-live" />
          ) : null}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="H2S support"
          className="fixed bottom-[86px] right-5 z-50 flex h-[520px] max-h-[calc(100vh-120px)] w-[370px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-card border border-dash-line-soft bg-white shadow-2xl"
        >
          <div className="flex items-center gap-2.5 bg-ink-900 px-4 py-3.5">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-brand-violet text-xs font-bold text-white">H2</span>
            <div className="min-w-0 flex-1">
              <strong className="block text-[13.5px] text-white">H2S Support</strong>
              <span className="block text-[11px] text-white/45">Answers from your account · replies instantly</span>
            </div>
            <button className="text-white/45 hover:text-white" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-dash-bg-soft p-4">
            {log.map((m, i) => (
              <div
                key={i}
                className={`w-fit max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                  m.from === 'bot'
                    ? 'rounded-bl-[4px] border border-dash-line-soft bg-white text-dash-ink'
                    : 'ml-auto rounded-br-[4px] bg-signal text-white'
                }`}
              >
                {m.text}
              </div>
            ))}
            {typing ? (
              <div className="flex w-fit gap-1 rounded-2xl rounded-bl-[4px] border border-dash-line-soft bg-white px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-graphite-dim/40" style={{ animationDelay: i * 0.15 + 's' }} />
                ))}
              </div>
            ) : null}
          </div>

          {chips.length ? (
            <div className="flex flex-wrap gap-1.5 bg-dash-bg-soft px-4 pb-2.5">
              {chips.map((c) => (
                <button key={c} className="rounded-btn border border-dash-line-soft bg-white px-2.5 py-1.5 text-xs text-dash-ink hover:border-signal hover:text-signal" onClick={() => send(c)}>
                  {c}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex gap-2 border-t border-dash-line-soft bg-white p-3"
            onSubmit={(e) => { e.preventDefault(); send(input) }}
          >
            <input
              className="flex-1 rounded-btn border border-dash-line-soft px-3.5 py-2.5 text-[13.5px] text-dash-ink outline-none focus:border-signal"
              placeholder="Ask about your account…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-signal text-white hover:bg-signal-dark" aria-label="Send">➤</button>
          </form>
        </div>
      ) : null}
    </>
  )
}
