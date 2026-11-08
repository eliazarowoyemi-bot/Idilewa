export const VOICE_GRADE_PATHS = [
  { id: 'kindergarten', name: 'Kindergarten', ages: 'Ages 5–6', level: 'beginner', focus: 'Listen for sounds, repeat greetings and name familiar people.', challenge: 'Hear it, say it, remember it.' },
  { id: 'grade-1', name: 'Grade 1', ages: 'Ages 6–7', level: 'beginner', focus: 'Use numbers, names and short phrases in simple exchanges.', challenge: 'Say a phrase with confidence.' },
  { id: 'grade-2', name: 'Grade 2', ages: 'Ages 7–8', level: 'beginner', focus: 'Talk about daily routines, nature and familiar places.', challenge: 'Connect words into a clear thought.' },
  { id: 'grade-3', name: 'Grade 3', ages: 'Ages 8–9', level: 'intermediate', focus: 'Build short conversations and respond to questions.', challenge: 'Keep a conversation moving.' },
  { id: 'grade-4', name: 'Grade 4', ages: 'Ages 9–10', level: 'intermediate', focus: 'Describe family and community traditions with detail.', challenge: 'Explain an idea in your own words.' },
  { id: 'grade-5', name: 'Grade 5', ages: 'Ages 10–11', level: 'intermediate', focus: 'Retell stories and perform longer rhythmic phrases.', challenge: 'Tell a story with expression.' },
  { id: 'grade-6', name: 'Grade 6', ages: 'Ages 11–12', level: 'advanced', focus: 'Interpret proverbs and distinguish literal from figurative meaning.', challenge: 'Explain the wisdom behind a proverb.' },
  { id: 'grade-7', name: 'Grade 7', ages: 'Ages 12–13', level: 'advanced', focus: 'Compare interpretations and support an oral explanation.', challenge: 'Defend an interpretation with evidence.' },
  { id: 'grade-8', name: 'Grade 8', ages: 'Ages 13–14', level: 'advanced', focus: 'Analyse philosophical themes, blessings and cultural context.', challenge: 'Present a nuanced interpretation.' }
];

export function getVoiceGradePath(gradeId) {
  return VOICE_GRADE_PATHS.find((grade) => grade.id === gradeId) || null;
}

export function getVoiceGradeLessonSlice(gradeId, lessons) {
  const grade = getVoiceGradePath(gradeId);
  if (!grade) return lessons;
  const peers = VOICE_GRADE_PATHS.filter((item) => item.level === grade.level);
  const index = peers.findIndex((item) => item.id === gradeId);
  const start = Math.floor((index * lessons.length) / peers.length);
  const end = Math.floor(((index + 1) * lessons.length) / peers.length);
  return lessons.slice(start, end);
}
