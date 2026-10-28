import { getSpeechAccent, type VoiceGender } from './speechAccent';

type UtteranceHandler = ((this: SpeechSynthesisUtterance, event: any) => void) | null;
type TaggedUtterance = SpeechSynthesisUtterance & { indianVoiceGender?: VoiceGender };

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeRequest: AbortController | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

function endpoint() {
  return (import.meta.env.VITE_INDIAN_TTS_ENDPOINT as string | undefined)?.trim().replace(/\/$/, '') ?? '';
}

function callHandler(utterance: SpeechSynthesisUtterance, handler: UtteranceHandler, type: string, details: Record<string, unknown> = {}) {
  if (!handler) return;
  const event = { type, target: utterance, currentTarget: utterance, charIndex: 0, charLength: 0, elapsedTime: 0, name: '', utterance, ...details };
  handler.call(utterance, event);
}

export function cancelSpeech() {
  activeRequest?.abort();
  activeRequest = null;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.removeAttribute('src');
    activeAudio.load();
    activeAudio = null;
  }
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
  activeObjectUrl = null;
  activeUtterance = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function pauseSpeech() {
  if (activeAudio) activeAudio.pause();
  else if ('speechSynthesis' in window) window.speechSynthesis.pause();
}

export function resumeSpeech() {
  if (activeAudio) void activeAudio.play().catch(() => {});
  else if ('speechSynthesis' in window) window.speechSynthesis.resume();
}

export function speakUtterance(utterance: SpeechSynthesisUtterance) {
  const api = endpoint();
  if (getSpeechAccent() !== 'en-IN' || !api || !('speechSynthesis' in window)) {
    window.speechSynthesis.speak(utterance);
    return;
  }

  cancelSpeech();
  activeUtterance = utterance;
  const controller = new AbortController();
  activeRequest = controller;
  const tagged = utterance as TaggedUtterance;
  const chunks: { text: string; start: number }[] = [];
  const sourceText = utterance.text;
  let start = 0;
  while (start < sourceText.length) {
    let end = Math.min(start + 2200, sourceText.length);
    if (end < sourceText.length) {
      const boundary = sourceText.lastIndexOf(' ', end);
      if (boundary > start + 1000) end = boundary;
    }
    chunks.push({ text: sourceText.slice(start, end).trim(), start });
    start = end;
  }

  const playChunk = async (index: number) => {
    const chunk = chunks[index];
    const response = await fetch(`${api}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunk.text, gender: tagged.indianVoiceGender ?? 'female', rate: utterance.rate || 1 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Servicio de voz: ${response.status}`);
    const blob = await response.blob();
    if (activeUtterance !== utterance) return;
    activeObjectUrl = URL.createObjectURL(blob);
    const audio = new Audio(activeObjectUrl);
    activeAudio = audio;
    audio.onplaying = () => { if (index === 0) callHandler(utterance, utterance.onstart, 'start'); };
    audio.onended = () => {
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
      activeObjectUrl = null;
      activeAudio = null;
      if (index + 1 < chunks.length) {
        void playChunk(index + 1).catch(handleFailure);
      } else {
        callHandler(utterance, utterance.onend, 'end');
        activeRequest = null;
        activeUtterance = null;
      }
    };
    audio.onerror = () => handleFailure(new Error('No se pudo reproducir el audio.'));
    audio.ontimeupdate = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0 || !utterance.onboundary) return;
      const localIndex = Math.min(chunk.text.length - 1, Math.floor((audio.currentTime / audio.duration) * chunk.text.length));
      const charIndex = chunk.start + localIndex;
      const event = { type: 'boundary', target: utterance, currentTarget: utterance, charIndex, charLength: 1, elapsedTime: audio.currentTime, name: 'word', utterance };
      utterance.onboundary?.call(utterance, event as unknown as SpeechSynthesisEvent);
    };
    await audio.play();
  };

  const handleFailure = (error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    if (activeUtterance !== utterance) return;
    activeRequest = null;
    if (activeAudio) { activeAudio.pause(); activeAudio = null; }
    if (activeObjectUrl) { URL.revokeObjectURL(activeObjectUrl); activeObjectUrl = null; }
    // If the cloud service is unavailable, preserve playback through any local voice.
    activeUtterance = null;
    window.speechSynthesis.speak(utterance);
  };

  void playChunk(0).catch(handleFailure);
}
