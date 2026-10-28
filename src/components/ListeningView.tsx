import { useEffect, useMemo, useRef, useState } from 'react';
import { listeningStories } from '../data/listeningStories';
import { additionalListeningActivities } from '../data/additionalListeningActivities';
import { configureEnglishUtterance } from '../lib/speechAccent';
import { speakUtterance, cancelSpeech } from '../lib/indianSpeech';
import { getEstimatedWordIndex, getSpeechWordRanges } from '../lib/speechTiming';

const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const allListeningActivities = [...listeningStories, ...additionalListeningActivities];
const practiceSteps = [
  { minutes: 3, title: 'Primera escucha', detail: 'Escucha sin leer para captar la idea general.' },
  { minutes: 5, title: 'Escucha con texto', detail: 'Lee y marca mentalmente las palabras nuevas.' },
  { minutes: 5, title: 'Vocabulario', detail: 'Busca en contexto cinco expresiones que quieras recordar.' },
  { minutes: 7, title: 'Shadowing', detail: 'Reproduce cada párrafo y repite en voz alta imitando ritmo y entonación.' },
  { minutes: 5, title: 'Escucha activa', detail: 'Vuelve a escuchar sin mirar el texto y reconstruye los detalles.' },
  { minutes: 5, title: 'Comprensión', detail: 'Responde las preguntas y revisa las respuestas.' },
];

export default function ListeningView() {
  const [level, setLevel] = useState<(typeof levels)[number]>('A1');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showText, setShowText] = useState(true);
  const [highlightedWord, setHighlightedWord] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const fallbackTimerRef = useRef<number | null>(null);
  const receivedWordBoundaryRef = useRef(false);
  const story = allListeningActivities.find(item => item.id === storyId);
  const text = useMemo(() => story?.paragraphs.join(' ') ?? '', [story]);
  const wordRanges = useMemo(() => getSpeechWordRanges(text), [text]);
  const paragraphWordOffsets = useMemo(() => {
    let offset = 0;
    return story?.paragraphs.map(paragraph => {
      const paragraphOffset = offset;
      offset += paragraph.match(/\S+/g)?.length ?? 0;
      return paragraphOffset;
    }) ?? [];
  }, [story]);

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current !== null) window.clearInterval(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  };

  useEffect(() => () => { clearFallbackTimer(); cancelSpeech(); }, []);
  useEffect(() => { cancelSpeech(); clearFallbackTimer(); setPlaying(false); setHighlightedWord(-1); setAnswers({}); setResult(null); setCompletedSteps([]); }, [storyId]);

  const play = (rate: number) => {
    if (!story || !('speechSynthesis' in window)) return;
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    configureEnglishUtterance(utterance);
    utterance.rate = rate;
    receivedWordBoundaryRef.current = false;
    utterance.onstart = () => {
      setPlaying(true);
      setHighlightedWord(0);
      clearFallbackTimer();
      const startedAt = performance.now();
      fallbackTimerRef.current = window.setInterval(() => {
        if (receivedWordBoundaryRef.current || wordRanges.length < 2) return;
        const elapsedSeconds = (performance.now() - startedAt) / 1000;
        setHighlightedWord(getEstimatedWordIndex(wordRanges, elapsedSeconds, rate));
      }, 100);
    };
    utterance.onboundary = event => {
      if (typeof event.charIndex !== 'number' || !wordRanges.length) return;
      const isWordBoundary = !event.name || event.name === 'word';
      let low = 0;
      let high = wordRanges.length - 1;
      while (low <= high) {
        const middle = (low + high) >> 1;
        const range = wordRanges[middle];
        if (event.charIndex < range.start) high = middle - 1;
        else if (event.charIndex >= range.end) low = middle + 1;
        else {
          if (isWordBoundary) {
            receivedWordBoundaryRef.current = true;
            clearFallbackTimer();
          }
          setHighlightedWord(middle);
          return;
        }
      }
      const nearestWord = Math.min(low, wordRanges.length - 1);
      if (isWordBoundary) {
        receivedWordBoundaryRef.current = true;
        clearFallbackTimer();
      }
      setHighlightedWord(nearestWord);
    };
    utterance.onend = () => { clearFallbackTimer(); setPlaying(false); setHighlightedWord(-1); };
    utterance.onerror = () => { clearFallbackTimer(); setPlaying(false); setHighlightedWord(-1); };
    speakUtterance(utterance);
  };

  if (storyId && story) return <div className="space-y-4">
    <button onClick={() => { cancelSpeech(); setStoryId(null); }} className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">← Todas las historias</button>
    <section className="rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-sky-300/15 px-2.5 py-1 text-xs font-semibold text-sky-100">Nivel {story.level}</span><h2 className="mt-3 text-2xl font-bold text-white">{story.title}</h2><p className="mt-1 text-sm text-purple-200">{story.summary}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setShowText(value => !value)} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white">{showText ? '🙈 Ocultar texto' : '📖 Mostrar texto'}</button><button disabled={playing} onClick={() => play(0.78)} className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">🐢 Lento</button><button disabled={playing} onClick={() => play(1)} className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">▶ Escuchar</button>{playing && <button onClick={() => { cancelSpeech(); setPlaying(false); setHighlightedWord(-1); }} className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white">⏹ Detener</button>}</div></div>
      {showText && <div className="listening-transcript mt-5 space-y-4 rounded-xl p-4 sm:p-6">{story.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph.split(/\s+/).filter(Boolean).map((word, wordIndex) => { const absoluteIndex = (paragraphWordOffsets[paragraphIndex] ?? 0) + wordIndex; return <span key={wordIndex} className={highlightedWord === absoluteIndex ? 'listening-word-active rounded px-1 font-bold ring-2' : ''}>{word}{' '}</span>; })}</p>)}</div>}
    </section>
    <section className="rounded-2xl border border-sky-200/10 bg-sky-300/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h3 className="font-bold text-white">Ruta guiada · 30 minutos</h3><p className="text-xs text-sky-100/75">Marca cada actividad al terminarla · {completedSteps.reduce((total, index) => total + practiceSteps[index].minutes, 0)} / 30 min planeados</p></div>
        <div className="h-2 w-36 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${completedSteps.reduce((total, index) => total + practiceSteps[index].minutes, 0) / 30 * 100}%` }} /></div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{practiceSteps.map((step, index) => <button key={step.title} onClick={() => setCompletedSteps(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index])} className={`rounded-xl border p-3 text-left ${completedSteps.includes(index) ? 'border-emerald-300/30 bg-emerald-400/10' : 'border-white/10 bg-black/10'}`}><span className="text-[11px] font-bold text-sky-200">{String(step.minutes).padStart(2, '0')} MIN · {completedSteps.includes(index) ? '✓ COMPLETADO' : 'PENDIENTE'}</span><p className="mt-1 text-sm font-semibold text-white">{step.title}</p><p className="mt-1 text-xs leading-relaxed text-purple-100/75">{step.detail}</p></button>)}</div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-slate-950/20 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-bold text-white">Comprensión</h3><p className="text-sm text-purple-200">Responde después de escuchar la historia.</p></div><button onClick={() => { if (Object.keys(answers).length < story.questions.length) return; setResult(story.questions.reduce((score, question, index) => score + (answers[index] === question.answer ? 1 : 0), 0)); }} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Revisar respuestas</button></div><div className="mt-4 space-y-4">{story.questions.map((question, questionIndex) => <fieldset key={question.prompt} className="rounded-xl border border-white/10 p-4"><legend className="px-1 text-sm font-semibold text-white">{questionIndex + 1}. {question.prompt}</legend><div className="mt-2 flex flex-wrap gap-2">{question.options.map((option, optionIndex) => <button key={option} onClick={() => { setAnswers(value => ({ ...value, [questionIndex]: optionIndex })); setResult(null); }} className={`rounded-lg border px-3 py-2 text-left text-sm ${answers[questionIndex] === optionIndex ? 'border-sky-200 bg-sky-400/20 text-white' : 'border-white/10 bg-white/5 text-purple-100'}`}>{option}</button>)}</div></fieldset>)}</div>{result !== null && <p className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-center font-semibold text-emerald-100">Resultado: {result} de {story.questions.length} correctas{result === story.questions.length ? ' · ¡Excelente!' : ' · Escucha otra vez y vuelve a intentarlo.'}</p>}</section>
    <p className="text-center text-xs text-purple-200/70">Consejo: escucha una vez sin leer, otra con el texto y después responde. La voz depende de las voces instaladas en tu navegador.</p>
  </div>;

  const levelStories = allListeningActivities.filter(item => item.level === level);
  return <div className="space-y-4">
    <section className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:p-5"><p className="text-sm font-semibold text-sky-200">ESCUCHA · COMPRENDE · REPITE</p><h2 className="mt-1 text-2xl font-bold text-white">Listening por niveles</h2><p className="mt-1 text-sm text-purple-200">50 actividades con narración, resaltado palabra por palabra, velocidad ajustable y preguntas de comprensión.</p><div className="mt-4 flex flex-wrap gap-2">{levels.map(item => <button key={item} onClick={() => setLevel(item)} aria-pressed={level === item} className={`rounded-xl px-4 py-2 text-sm font-semibold ${level === item ? 'bg-sky-500 text-white' : 'bg-white/10 text-purple-100 hover:bg-white/20'}`}>{item}</button>)}</div><p className="mt-3 text-xs font-semibold text-slate-600">Nivel {level} · {levelStories.length} actividades</p></section>
    <div className="grid gap-3 md:grid-cols-2">{levelStories.map((item, index) => <button key={item.id} onClick={() => { setStoryId(item.id); setAnswers({}); setResult(null); }} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 text-left transition-colors hover:bg-white/10 sm:p-5"><div className="flex items-center justify-between"><span className="rounded-full bg-sky-300/15 px-2.5 py-1 text-xs font-semibold text-sky-100">{item.level} · Actividad {index + 1}</span><span className="text-xl">🎧</span></div><h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3><p className="mt-1 text-sm text-purple-200">{item.summary}</p><p className="mt-4 text-xs text-white/60">{item.questions.length} preguntas de comprensión · Abrir actividad →</p></button>)}</div>
    <p className="rounded-xl border border-sky-200/10 bg-sky-300/5 p-4 text-xs leading-relaxed text-sky-100/80">Cada nivel tiene diez actividades. Puedes escuchar la narración varias veces, ajustar la velocidad, seguir el resaltado y responder cuatro preguntas en cada historia.</p>
  </div>;
}
