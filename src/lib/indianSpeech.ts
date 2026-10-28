import { configureEnglishUtterance, getSpeechAccent, type VoiceGender } from './speechAccent';
import { getSpeechCharIndexAtProgress, getSpeechWordRanges } from './speechTiming';

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
  if ('speechSynthesis' in window) {
    const synthesis = window.speechSynthesis;
    // Do not reset an empty queue immediately before a user starts audio.
    if (activeUtterance || synthesis.speaking || synthesis.pending || synthesis.paused) synthesis.cancel();
  }
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
  const canUseBrowserVoice = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speakLocally = () => {
    if (!canUseBrowserVoice) {
      callHandler(utterance, utterance.onerror, 'error', { error: 'not-allowed' });
      return;
    }

    // Start synchronously in the click/input event. Deferring speech with a
    // timer can lose browser audio activation and leave the whole app silent.
    activeUtterance = utterance;
    try {
      window.speechSynthesis.getVoices();
      const tagged = utterance as TaggedUtterance;
      configureEnglishUtterance(utterance, tagged.indianVoiceGender);
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch {
      activeUtterance = null;
      callHandler(utterance, utterance.onerror, 'error', { error: 'audio-busy' });
    }
    utterance.addEventListener('end', () => {
      if (activeUtterance === utterance) activeUtterance = null;
    }, { once: true });
    utterance.addEventListener('error', () => {
      if (activeUtterance === utterance) activeUtterance = null;
    }, { once: true });
  };

  if (getSpeechAccent() !== 'en-IN' || !api) {
    speakLocally();
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
    const rawChunk = sourceText.slice(start, end);
    const trimmedChunk = rawChunk.trim();
    const leadingWhitespace = rawChunk.length - rawChunk.trimStart().length;
    chunks.push({ text: trimmedChunk, start: start + leadingWhitespace });
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
    const chunkRanges = getSpeechWordRanges(chunk.text);
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
      const localIndex = getSpeechCharIndexAtProgress(chunkRanges, audio.currentTime / audio.duration);
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
    speakLocally();
  };

  void playChunk(0).catch(handleFailure);
}
