// Single source of truth for emotions — colour, emoji, score (for charts)
export const EMOTIONS = [
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#8BCDB5', score: 4 },
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#F6CF7E', score: 5 },
  { id: 'okay', label: 'Okay', emoji: '😐', color: '#9CC3EE', score: 3 },
  { id: 'stressed', label: 'Stressed', emoji: '😣', color: '#F2A995', score: 2 },
  { id: 'anxious', label: 'Anxious', emoji: '😟', color: '#C79AE6', score: 2 },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#8FA3D9', score: 1 },
  { id: 'frustrated', label: 'Frustrated', emoji: '😤', color: '#E98A8A', score: 1 },
]
export const emotionById = (id) => EMOTIONS.find((e) => e.id === id) || EMOTIONS[2]
