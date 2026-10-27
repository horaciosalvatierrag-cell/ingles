export type SpeechAccent = 'en-US' | 'en-GB' | 'en-IN';
export type VoiceGender = 'male' | 'female';

export const speechAccents: { value: SpeechAccent; label: string }[] = [
  { value: 'en-US', label: 'Americano' },
  { value: 'en-GB', label: 'Británico' },
  { value: 'en-IN', label: 'Indio' },
];

const storageKey = 'english-learning-speech-accent';
let currentAccent: SpeechAccent = 'en-US';

export function getSpeechAccent(): SpeechAccent {
  if (typeof window === 'undefined') return currentAccent;
  try {
    const saved = window.sessionStorage.getItem(storageKey);
    if (speechAccents.some(accent => accent.value === saved)) currentAccent = saved as SpeechAccent;
  } catch {
    // Keep the in-memory accent when browser storage is unavailable.
  }
  return currentAccent;
}

export function setSpeechAccent(accent: SpeechAccent) {
  currentAccent = accent;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(storageKey, accent);
  } catch {
    // The selection remains active for this page even if storage is blocked.
  }
}

export function configureEnglishUtterance(utterance: SpeechSynthesisUtterance, gender?: VoiceGender) {
  const accent = getSpeechAccent();
  utterance.lang = accent;

  if (!('speechSynthesis' in window)) return;
  const normalizeLocale = (locale: string) => locale.toLowerCase().replace(/_/g, '-');
  const locale = normalizeLocale(accent);
  const voices = window.speechSynthesis.getVoices();
  const accentVoices = voices.filter(voice => {
    const voiceLocale = normalizeLocale(voice.lang);
    return voiceLocale === locale || voiceLocale.startsWith(`${locale}-`);
  });

  const genderPattern = gender === 'male'
    ? /\b(male|david|mark|guy|james|daniel|george|christopher|ryan|andrew|thomas|alex)\b/i
    : gender === 'female'
      ? /\b(female|zira|samantha|jenny|aria|ava|michelle|susan|karen)\b/i
      : null;
  const selectedVoice = (genderPattern && accentVoices.find(voice => genderPattern.test(`${voice.name} ${voice.voiceURI}`)))
    || accentVoices[0];
  if (selectedVoice) utterance.voice = selectedVoice;
}
