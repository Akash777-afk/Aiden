// DEMONSTRATION responses for the AIDEN companion. No AI model is connected in Phase 1.
// Replies are chosen by simple keyword matching to illustrate tone and flow.

export const GUIDED_STARTERS = [
  { id: 'g1', label: 'Help me understand my emotions', icon: 'Heart' },
  { id: 'g2', label: 'I want to organize my thoughts', icon: 'ListTree' },
  { id: 'g3', label: 'I feel overwhelmed', icon: 'CloudRain' },
  { id: 'g4', label: 'Help me reflect', icon: 'Sparkles' },
  { id: 'g5', label: 'Help me prepare for a difficult conversation', icon: 'MessagesSquare' },
  { id: 'g6', label: 'I need a different perspective', icon: 'Compass' },
]

export const QUICK_PROMPTS = ['I had a stressful day', 'I can’t switch off at night', 'Help me plan tomorrow', 'I’m feeling low']

export const PERSONAL_CONTEXT = [
  { id: 'ctx1', label: 'Prefers short, practical suggestions', on: true },
  { id: 'ctx2', label: 'Walking helps on stressful days', on: true },
  { id: 'ctx3', label: 'Working on a consistent bedtime', on: true },
  { id: 'ctx4', label: 'Upcoming review meeting at work', on: false },
]

const RULES = [
  {
    match: /(crisis|suicid|kill myself|end my life|self.?harm|hurt myself)/i,
    crisis: true,
    reply:
      "I'm really glad you told me. You deserve support right now from a real person. If you are in India, you can call Tele-MANAS on 14416 (free, 24×7), or 112 in an emergency. Would you like me to show you more support options? I'm here with you while you reach out.",
  },
  {
    match: /(overwhelm|too much|can'?t cope|drowning)/i,
    reply:
      "That sounds like a lot to hold at once. Let's make it smaller together.\n\nFirst, one slow breath — in for 4, out for 6.\n\nNow, if you had to list everything on your mind, what's the one thing that feels heaviest right now?",
    actions: [{ label: 'Try a 1-minute breathing reset', to: '/pause/breathe' }],
  },
  {
    match: /(understand.*emotion|what am i feeling|emotion)/i,
    reply:
      "Let's explore it gently. Feelings often come in layers.\n\n• What happened just before you noticed this feeling?\n• Where do you feel it in your body — chest, stomach, shoulders?\n• If it had a name, would it be closer to worry, sadness, frustration or something else?",
    actions: [{ label: 'Log a check-in', to: '/pulse' }],
  },
  {
    match: /(organi[sz]e|thoughts|messy|scattered|plan)/i,
    reply:
      "Let's sort things into three buckets:\n\n1. **Can act on today**\n2. **Can act on later**\n3. **Outside my control**\n\nTell me what's on your mind, one item at a time, and I'll help you place each one.",
    actions: [{ label: 'Open TAC Method', to: '/clarity/new' }],
  },
  {
    match: /(reflect|look back|journal)/i,
    reply:
      "A short reflection can be really grounding. Try these:\n\n• What gave me energy today?\n• What drained it?\n• What's one thing I'd like to carry into tomorrow?",
    actions: [{ label: 'Write in Journal', to: '/journal' }],
  },
  {
    match: /(difficult conversation|confront|talk to (my|him|her|them)|argument)/i,
    reply:
      "Preparing helps. Let's shape it together:\n\n1. **What outcome do you hope for?**\n2. **What's the one thing you most want them to understand?**\n3. Start with an 'I' statement — e.g. \"I've been feeling… when…\"\n\nWho is the conversation with, and what's it about?",
  },
  {
    match: /(perspective|stuck|another way|different view)/i,
    reply:
      "Let's try stepping outside the situation for a moment.\n\nIf a close friend described this exact situation to you, what would you tell them? And how might you see this a year from now?",
  },
  {
    match: /(sleep|can'?t switch off|insomnia|night)/i,
    reply:
      "Racing thoughts at night are really common. A couple of things that may help:\n\n• Write tomorrow's worries down with one next step each — then 'park' them.\n• Try a slow-exhale breath or a calm soundscape.\n\nWould you like me to open the Overthinking-at-night ritual?",
    actions: [{ label: 'Open Sleep rituals', to: '/sleep' }],
  },
  {
    match: /(stress|stressed|pressure|deadline|work)/i,
    reply:
      "It sounds like today asked a lot of you. You mentioned before that walking helps on stressful days *(demo memory)*.\n\nWhat part of today is still sitting with you the most?",
    personal: true,
  },
  {
    match: /(sad|low|down|lonely|empty)/i,
    reply:
      "I'm sorry you're feeling low. That's a heavy feeling, and it makes sense to want some support.\n\nWould it help to talk about what's been happening, or would you prefer something gentle to do right now?",
    actions: [
      { label: 'Talk to a professional', to: '/connect' },
      { label: 'Calm Moments', to: '/pause' },
    ],
  },
  {
    match: /(happy|good|great|grateful|win)/i,
    reply: "That's lovely to hear! 🌱 What made it feel good? Noticing what helps is how we build more of it.",
  },
]

const FALLBACKS = [
  "Thank you for sharing that. Can you tell me a little more about what's on your mind?",
  "I'm listening. What feels most important about this for you?",
  "That makes sense. How has this been affecting you day to day?",
]

let fb = 0
export function demoReply(text, mode) {
  const rule = RULES.find((r) => r.match.test(text))
  if (rule) {
    let reply = rule.reply
    if (rule.personal && mode !== 'personal') reply = reply.replace(/ You mentioned before[^.]*\.\)?\*?/, '').replace('*(demo memory)*', '')
    return { text: reply, actions: rule.actions || [], crisis: !!rule.crisis }
  }
  return { text: FALLBACKS[fb++ % FALLBACKS.length], actions: [] }
}

export function seedConversations() {
  const now = Date.now()
  return [
    {
      id: 'conv1',
      title: 'Feeling stretched at work',
      mode: 'personal',
      updatedAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
      messages: [
        { id: 'm1', role: 'user', text: 'Work has been really intense this week.', at: new Date(now - 1000 * 60 * 60 * 20).toISOString() },
        {
          id: 'm2',
          role: 'ai',
          text: 'That sounds draining. Last week you said evening walks helped you reset *(demo memory)*. Have you had a chance to get one in?',
          at: new Date(now - 1000 * 60 * 60 * 20 + 4000).toISOString(),
        },
        { id: 'm3', role: 'user', text: 'Not really, I keep working late.', at: new Date(now - 1000 * 60 * 60 * 20 + 60000).toISOString() },
        {
          id: 'm4',
          role: 'ai',
          text: 'That’s understandable when things pile up. Would a small boundary help — like a 15-minute walk before you open the laptop again in the evening?',
          at: new Date(now - 1000 * 60 * 60 * 20 + 64000).toISOString(),
        },
      ],
    },
    {
      id: 'conv2',
      title: 'Preparing to talk to my sister',
      mode: 'guided',
      updatedAt: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      messages: [
        { id: 'm1', role: 'user', text: 'Help me prepare for a difficult conversation', at: new Date(now - 1000 * 60 * 60 * 72).toISOString() },
        { id: 'm2', role: 'ai', text: 'Preparing helps. What outcome do you hope for from this conversation?', at: new Date(now - 1000 * 60 * 60 * 72 + 3000).toISOString() },
      ],
    },
  ]
}
