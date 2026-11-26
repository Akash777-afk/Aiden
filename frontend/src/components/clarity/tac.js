import { uid } from '../../utils/id'

export const THOUGHT_PROMPTS = [
  { key: 'happening', label: 'What is happening?', placeholder: 'Describe the situation in a few sentences', required: true },
  { key: 'thinking', label: 'What am I thinking?', placeholder: 'The thoughts running through your mind' },
  { key: 'feeling', label: 'What am I feeling?', placeholder: 'e.g. anxious, excited, torn' },
  { key: 'assumptions', label: 'What assumptions am I making?', placeholder: 'Things you’re treating as true but haven’t checked' },
  { key: 'worry', label: 'What is worrying me?', placeholder: 'The outcome you most fear' },
]

export const CONSEQUENCE_FIELDS = [
  { key: 'benefits', label: 'Potential benefits', kind: 'benefit', color: '#5FA98D' },
  { key: 'risks', label: 'Potential risks', kind: 'risk', color: '#E98A8A' },
  { key: 'short', label: 'Short-term outcomes', kind: 'short', color: '#4C8DBF' },
  { key: 'long', label: 'Long-term outcomes', kind: 'long', color: '#8B72C7' },
  { key: 'uncertainties', label: 'Uncertainties', kind: 'uncertain', color: '#E9A86B' },
]

export const ACTION_SUGGESTIONS = ['Discuss the issue', 'Explore alternatives', 'Wait and reassess', 'Seek advice']

export function emptyDraft() {
  return {
    id: uid('d'),
    title: '',
    thoughts: { happening: '', thinking: '', feeling: '', assumptions: '', worry: '' },
    actions: [],
    chosen: null,
    reflection: '',
    extraNodes: [],
    extraEdges: [],
    positions: {},
  }
}

export function newAction(label) {
  return { id: uid('a'), label, benefits: '', risks: '', short: '', long: '', uncertainties: '', rating: 3 }
}

// Demo "AI-assisted" reflections — rule-based placeholders until the AI backend exists.
export function demoThoughtInsight(t) {
  const out = []
  if (t.assumptions?.trim()) out.push(`You noted an assumption: “${t.assumptions.trim().slice(0, 80)}”. What evidence supports it — and what evidence doesn’t?`)
  else out.push('Try naming one assumption. Decisions often feel heavier because of beliefs we haven’t checked.')
  if (t.feeling?.trim()) out.push(`Feeling “${t.feeling.trim().slice(0, 40)}” is understandable. Feelings are information, not instructions.`)
  if (t.worry?.trim()) out.push('For your worry: what’s the most likely outcome, not just the worst one?')
  return out
}

export function demoReflection(d) {
  const chosen = d.actions.find((a) => a.id === d.chosen)
  if (!chosen) return 'Choose the option that feels most aligned to see a reflection.'
  const others = d.actions.filter((a) => a.id !== d.chosen).map((a) => a.label)
  return `You’re leaning towards “${chosen.label}”.${chosen.benefits ? ` Its main upside, in your words: ${chosen.benefits.trim()}` : ''}${chosen.risks ? ` A risk to plan for: ${chosen.risks.trim()}` : ''}${others.length ? ` You also weighed ${others.map((o) => `“${o}”`).join(', ')}, which shows you considered alternatives carefully.` : ''} Remember: these are possibilities, not predictions — you can revisit this decision as you learn more.`
}
