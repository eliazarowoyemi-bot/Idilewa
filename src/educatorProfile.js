const EDUCATOR_COUNTRIES = new Set(['United Kingdom', 'Nigeria', 'Ghana', 'United States', 'Canada', 'Other']);
const EDUCATOR_TIME_ZONES = new Set([
  'Europe/London', 'Africa/Lagos', 'Africa/Accra',
  'America/New_York', 'America/Los_Angeles', 'other',
]);
const EDUCATOR_SUBJECTS = new Set([
  'Yorùbá', 'Igbo', 'Hausa', 'Arabic', 'Kiswahili',
  'Mathematics', 'English', 'Science', 'Coding', 'Other',
]);
const EDUCATOR_EXPERIENCE = new Set(['Less than 1 year', '1–3 years', '4–7 years', '8+ years']);

export function normalizeEducatorProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Complete your tutor profile before creating an account.');
  }
  const country = typeof value.country === 'string' ? value.country.trim() : '';
  const timeZone = typeof value.timeZone === 'string' ? value.timeZone.trim() : '';
  const teachingSubject = typeof value.teachingSubject === 'string' ? value.teachingSubject.trim() : '';
  const teachingExperience = typeof value.teachingExperience === 'string' ? value.teachingExperience.trim() : '';
  if (value.qualifications !== undefined && typeof value.qualifications !== 'string') {
    throw new Error('Qualifications and experience must be entered as text.');
  }
  const qualifications = typeof value.qualifications === 'string' ? value.qualifications.trim() : '';

  if (!EDUCATOR_COUNTRIES.has(country)) throw new Error('Choose a country from the list.');
  if (!EDUCATOR_TIME_ZONES.has(timeZone)) throw new Error('Choose a time zone from the list.');
  if (!EDUCATOR_SUBJECTS.has(teachingSubject)) throw new Error('Choose your main teaching subject.');
  if (!EDUCATOR_EXPERIENCE.has(teachingExperience)) throw new Error('Choose your teaching experience.');
  if (qualifications.length > 600) throw new Error('Qualifications and experience must be 600 characters or fewer.');

  return { country, timeZone, teachingSubject, teachingExperience, qualifications };
}
