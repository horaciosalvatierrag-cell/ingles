import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { findAccentVoice } from '../lib/speechAccent';

const MAX_WORDS = 1500;
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu;

type PlaybackState = 'idle' | 'speaking' | 'paused';

function getWordMatches(value: string) {
  return [...value.matchAll(WORD_PATTERN)];
}

function limitWords(value: string) {
  const matches = getWordMatches(value);
  if (matches.length <= MAX_WORDS) return { text: value, truncated: false };
  const lastAllowedWord = matches[MAX_WORDS - 1];
  return { text: value.slice(0, (lastAllowedWord.index ?? 0) + lastAllowedWord[0].length), truncated: true };
}

function splitForSpeech(value: string) {
  const chunks: string[] = [];
  const sentences = value.match(/[^.!?\n]+[.!?\n]*/g) ?? [value];
  let current = '';
  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) continue;
    if (current && `${current} ${part}`.length > 1800) {
      chunks.push(current);
      current = '';
    }
    if (part.length > 1800) {
      const words = part.split(/\s+/);
      for (const word of words) {
        if (current && `${current} ${word}`.length > 1800) {
          chunks.push(current);
          current = '';
        }
        current = current ? `${current} ${word}` : word;
      }
    } else {
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export default function TextToSpeechView() {
  const [text, setText] = useState('');
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [rate, setRate] = useState(1);
  const [voiceName, setVoiceName] = useState('');
  const [message, setMessage] = useState('');
  const [truncated, setTruncated] = useState(false);
  const runId = useRef(0);
  const words = useMemo(() => getWordMatches(text).length, [text]);

  useEffect(() => {
    const updateVoice = () => setVoiceName(findAccentVoice('en-US')?.name ?? 'Voz en-US no detectada');
    updateVoice();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.addEventListener('voiceschanged', updateVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoice);
  }, []);

  useEffect(() => () => {
    runId.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const stop = () => {
    runId.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlayback('idle');
  };

  const handleTextChange = (value: string) => {
    const result = limitWords(value);
    setText(result.text);
    setTruncated(result.truncated);
    setMessage(result.truncated ? `El texto se recortó al límite de ${MAX_WORDS.toLocaleString()} palabras.` : '');
    if (playback !== 'idle') stop();
  };

  const play = () => {
    if (!text.trim()) {
      setMessage('Pega o escribe un texto en inglés para escucharlo.');
      return;
    }
    if (!('speechSynthesis' in window)) {
      setMessage('Este navegador no ofrece lectura de texto. Prueba con una versión reciente de Chrome, Edge o Safari.');
      return;
    }

    runId.current += 1;
    const thisRun = runId.current;
    window.speechSynthesis.cancel();
    const chunks = splitForSpeech(text);
    let remaining = chunks.length;
    setMessage('');
    setPlayback('speaking');

    chunks.forEach(chunk => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      const voice = findAccentVoice('en-US');
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (runId.current !== thisRun) return;
        remaining -= 1;
        if (remaining === 0) setPlayback('idle');
      };
      utterance.onerror = event => {
        if (runId.current !== thisRun || event.error === 'canceled' || event.error === 'interrupted') return;
        runId.current += 1;
        window.speechSynthesis.cancel();
        setPlayback('idle');
        setMessage('No se pudo reproducir la voz. Comprueba que el navegador tenga una voz inglesa instalada.');
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setPlayback('paused');
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setPlayback('speaking');
  };

  return (
    <section className="mx-auto max-w-4xl space-y-5" aria-labelledby="text-to-speech-title">
      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="rounded-xl bg-blue-500/20 p-3 text-blue-100"><Volume2 aria-hidden="true" /></span>
          <div>
            <h2 id="text-to-speech-title" className="text-xl font-bold text-white sm:text-2xl">Escuchar mi texto</h2>
            <p className="mt-1 text-sm text-blue-100">Pega un texto en inglés y escúchalo con pronunciación estadounidense.</p>
          </div>
        </div>

        <label htmlFor="read-aloud-text" className="mb-2 block text-sm font-semibold text-white">Texto para escuchar</label>
        <textarea
          id="read-aloud-text"
          value={text}
          onChange={event => handleTextChange(event.target.value)}
          placeholder="Paste or write your English text here…"
          rows={12}
          spellCheck
          lang="en-US"
          className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-base leading-7 text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/50"
          aria-describedby="read-aloud-count read-aloud-voice"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span id="read-aloud-count" aria-live="polite" className={words >= MAX_WORDS ? 'font-semibold text-amber-200' : 'text-blue-100'}>
            {words.toLocaleString()} / {MAX_WORDS.toLocaleString()} palabras
          </span>
          <span id="read-aloud-voice" className="text-blue-100">Voz: {voiceName}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Controles de reproducción">
          <button type="button" onClick={play} disabled={playback !== 'idle' || words === 0} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            <Play size={18} aria-hidden="true" /> Escuchar
          </button>
          {playback === 'speaking' && <button type="button" onClick={pause} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 font-semibold text-white hover:bg-white/25"><Pause size={18} aria-hidden="true" /> Pausar</button>}
          {playback === 'paused' && <button type="button" onClick={resume} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 font-semibold text-white hover:bg-white/25"><Play size={18} aria-hidden="true" /> Reanudar</button>}
          {playback !== 'idle' && <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded-xl bg-rose-600/90 px-4 py-2.5 font-semibold text-white hover:bg-rose-500"><Square size={16} aria-hidden="true" /> Detener</button>}
          <button type="button" onClick={() => { stop(); setText(''); setTruncated(false); setMessage(''); }} disabled={!text} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">
            <RotateCcw size={17} aria-hidden="true" /> Limpiar
          </button>
        </div>

        <label htmlFor="read-aloud-rate" className="mt-6 block text-sm font-semibold text-white">Velocidad: {rate.toFixed(2)}×</label>
        <input id="read-aloud-rate" type="range" min="0.7" max="1.2" step="0.05" value={rate} onChange={event => setRate(Number(event.target.value))} className="mt-2 block h-3 w-full cursor-pointer accent-blue-400" />

        <p role="status" aria-live="polite" className={`mt-4 min-h-6 text-sm ${message ? 'text-amber-100' : 'text-blue-100'}`}>
          {message || (truncated ? `El texto está limitado a ${MAX_WORDS.toLocaleString()} palabras.` : 'La voz se genera en tu navegador. La disponibilidad y el timbre dependen de las voces instaladas.')}
        </p>
      </div>
    </section>
  );
}
