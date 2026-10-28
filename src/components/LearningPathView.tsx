import { useEffect, useMemo, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { configureEnglishUtterance } from '../lib/speechAccent';
import { speakUtterance, cancelSpeech, pauseSpeech, resumeSpeech } from '../lib/indianSpeech';
import { loadLearningProgress, saveActivityProgress, type LearningProgress } from '../lib/learningProgress';
import { getEstimatedWordIndex, getSpeechWordRanges } from '../lib/speechTiming';
import { getUnitActivitiesComplete, learningUnits } from '../learning/curriculum';
import { learningLevels, learningSkillLabels, type LearningLevel, type LearningSkill, type LearningUnit } from '../learning/types';

const skills: LearningSkill[] = ['grammar', 'reading', 'listening', 'speaking'];
const levelNames: Record<LearningLevel, string> = { A1: 'Principiante', A2: 'Elemental', B1: 'Intermedio', B2: 'Intermedio alto', C1: 'Avanzado' };

function TextBlock({ text }: { text: string }) {
  return <div className="space-y-3 whitespace-pre-line text-base leading-8 text-slate-800">{text}</div>;
}

function Quiz({
  unit, skill, progress, onComplete,
}: {
  unit: LearningUnit;
  skill: 'grammar' | 'reading' | 'listening';
  progress: LearningProgress;
  onComplete: (score: number, maxScore: number) => void;
}) {
  const questions = skill === 'grammar' ? unit.activities.grammar.exercises : skill === 'reading' ? unit.activities.reading.questions : unit.activities.listening.questions;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [questionPage, setQuestionPage] = useState(0);
  const saved = progress.units[unit.id]?.activities[skill];
  const score = questions.reduce((sum, question) => sum + (answers[question.id] === question.answerIndex ? 1 : 0), 0);
  const pageSize = skill === 'grammar' ? 5 : questions.length;
  const pageCount = Math.ceil(questions.length / pageSize);
  const visibleQuestions = questions.slice(questionPage * pageSize, (questionPage + 1) * pageSize);

  useEffect(() => { setAnswers({}); setSubmitted(false); setQuestionPage(0); }, [unit.id, skill]);

  return <div className="space-y-5">
    {skill === 'grammar' && <>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5"><h3 className="font-bold text-slate-900">Explicación · {unit.activities.grammar.exercises.length} ejercicios</h3><p className="mt-2 leading-7 text-slate-700">{unit.activities.grammar.explanationEs}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{unit.activities.grammar.examples.map((example, index) => <div key={index} className="rounded-xl border border-blue-100 bg-white p-3"><p className="font-semibold text-slate-900">{example.english}</p><p className="mt-1 text-sm text-slate-600">{example.spanish}</p></div>)}</div></div>
      <Vocabulary unit={unit} />
    </>}
    {skill === 'reading' && <><div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"><p className="mb-3 text-sm font-semibold text-blue-700">Texto de lectura · {unit.level}</p><TextBlock text={unit.activities.reading.text} /></div><Vocabulary unit={unit} /></>}
    {skill === 'listening' && <>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
        <h3 className="font-bold text-slate-900">{unit.activities.listening.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{unit.activities.listening.audio.kind === 'speech-synthesis' ? unit.activities.listening.audio.voiceNoteEs : `Audio: ${unit.activities.listening.audio.attribution}`}</p>
        {unit.activities.listening.audio.kind === 'speech-synthesis' && <SpeechControls transcript={unit.activities.listening.audio.transcript} />}
        {unit.activities.listening.audio.kind === 'file' && <audio className="mt-3 w-full" controls preload="none" src={unit.activities.listening.audio.src} />}
      </div>
      <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold text-slate-800">Mostrar transcripción</summary><div className="mt-4"><TextBlock text={unit.activities.listening.audio.transcript} /></div></details>
    </>}
    {skill === 'grammar' && <p className="text-sm font-semibold text-slate-700" aria-live="polite">Bloque {questionPage + 1} de {pageCount} · preguntas {questionPage * pageSize + 1}–{Math.min((questionPage + 1) * pageSize, questions.length)} de {questions.length}</p>}
    <div className="space-y-4">{visibleQuestions.map((question, index) => <fieldset key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4"><legend className="px-1 font-semibold leading-6 text-slate-900">{questionPage * pageSize + index + 1}. {question.prompt}</legend><div className="mt-3 grid gap-2">{question.options.map((option, optionIndex) => {
      const selected = answers[question.id] === optionIndex;
      const isCorrect = submitted && optionIndex === question.answerIndex;
      const isWrongSelection = submitted && selected && !isCorrect;
      return <button key={`${question.id}-${optionIndex}`} type="button" aria-pressed={selected} onClick={() => { setAnswers(current => ({ ...current, [question.id]: optionIndex })); setSubmitted(false); }} className={`rounded-xl border px-3 py-3 text-left text-sm leading-6 transition-colors ${isCorrect ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : isWrongSelection ? 'border-red-500 bg-red-50 text-red-900' : selected ? 'border-blue-600 bg-blue-50 text-blue-950' : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50'}`}>
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-bold">{String.fromCharCode(65 + optionIndex)}</span>{option}
      </button>;
    })}</div>{submitted && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700"><strong>Explicación:</strong> {question.explanationEs}</p>}</fieldset>)}</div>
    <div className="flex flex-wrap items-center gap-3">
      {questionPage > 0 && <button type="button" onClick={() => setQuestionPage(page => page - 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">← Anterior</button>}
      {questionPage < pageCount - 1 && <button type="button" onClick={() => setQuestionPage(page => page + 1)} className="rounded-xl border border-blue-300 bg-white px-4 py-3 font-semibold text-blue-800 hover:bg-blue-50">Siguiente bloque →</button>}
      {questionPage === pageCount - 1 && !submitted && <button type="button" disabled={Object.keys(answers).length !== questions.length} onClick={() => { setSubmitted(true); onComplete(score, questions.length); }} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">Revisar respuestas ({questions.length})</button>}
      {submitted && <button type="button" onClick={() => { setAnswers({}); setSubmitted(false); setQuestionPage(0); }} className="rounded-xl border border-blue-300 bg-white px-5 py-3 font-semibold text-blue-800 hover:bg-blue-50">Repetir actividad</button>}
      {submitted && <p role="status" aria-live="polite" className="font-semibold text-slate-800">Resultado: {score} de {questions.length}{score >= Math.round(questions.length * 0.75) ? ' · Actividad superada' : ' · Revisa las explicaciones y vuelve a intentarlo'}</p>}
      {!submitted && saved?.completed && <p className="text-sm text-slate-600">Último resultado guardado: {saved.score}/{saved.maxScore}</p>}
    </div>
  </div>;
}

function Vocabulary({ unit }: { unit: LearningUnit }) {
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadMeanings = async (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!event.currentTarget.open || loaded || loading) return;
    setLoading(true);
    try {
      const { dictionaryWords } = await import('../data/dictionary');
      const next: Record<string, string> = {};
      for (const item of unit.vocabulary) {
        const match = dictionaryWords.find(word => word.word.toLowerCase() === item.term.toLowerCase());
        if (match) next[item.term] = match.meaning;
      }
      setMeanings(next);
      setLoaded(true);
    } catch {
      setMeanings({});
    } finally {
      setLoading(false);
    }
  };
  return <details onToggle={loadMeanings} className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold text-slate-800">Vocabulario y expresiones</summary>{unit.vocabulary.length ? <><p className="mt-2 text-xs text-slate-500">{loading ? 'Cargando traducciones…' : ''}</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{unit.vocabulary.map(item => <li key={`${item.term}-${item.meaningEs}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-800">{item.kind === 'expression' ? 'Expresión' : 'Palabra'}</span><strong className="text-slate-900">{item.term}</strong><span className="text-slate-600"> — {item.kind === 'expression' ? item.meaningEs : meanings[item.term] ?? (loaded ? 'Consulta el Diccionario para ver su significado.' : 'Abre esta sección para cargar la traducción.')}</span></li>)}</ul></> : <p className="mt-3 text-sm text-slate-600">El glosario de esta actividad se está preparando.</p>}</details>;
}

function SpeechControls({ transcript }: { transcript: string }) {
  const [state, setState] = useState<'idle' | 'playing' | 'paused' | 'unavailable'>('idle');
  const [currentWord, setCurrentWord] = useState(0);
  const fallbackTimerRef = useRef<number | null>(null);
  const receivedBoundaryRef = useRef(false);
  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentWordRef = useRef(0);
  const resumeAfterSeekRef = useRef(false);
  const words = useMemo(() => getSpeechWordRanges(transcript), [transcript]);
  const clearTimer = () => { if (fallbackTimerRef.current !== null) window.clearInterval(fallbackTimerRef.current); fallbackTimerRef.current = null; };
  useEffect(() => () => { activeUtteranceRef.current = null; clearTimer(); cancelSpeech(); }, []);
  const play = (requestedWord = currentWordRef.current) => {
    if (!('speechSynthesis' in window)) { setState('unavailable'); return; }
    const startWord = Math.max(0, Math.min(words.length - 1, requestedWord));
    const charOffset = words[startWord]?.start ?? 0;
    const localWords = words.slice(startWord).map(word => ({ ...word, start: word.start - charOffset, end: word.end - charOffset }));
    cancelSpeech();
    clearTimer();
    receivedBoundaryRef.current = false;
    elapsedRef.current = 0;
    pausedRef.current = false;
    const utterance = new SpeechSynthesisUtterance(transcript.slice(charOffset));
    configureEnglishUtterance(utterance);
    utterance.rate = 0.88;
    activeUtteranceRef.current = utterance;
    currentWordRef.current = startWord;
    setCurrentWord(startWord);
    utterance.onstart = () => {
      if (activeUtteranceRef.current !== utterance) return;
      setState('playing');
      fallbackTimerRef.current = window.setInterval(() => {
        if (activeUtteranceRef.current !== utterance || receivedBoundaryRef.current) return;
        if (!pausedRef.current) elapsedRef.current += 0.08;
        const index = startWord + getEstimatedWordIndex(localWords, elapsedRef.current, utterance.rate);
        currentWordRef.current = index;
        setCurrentWord(index);
      }, 80);
    };
    utterance.onboundary = event => {
      if (activeUtteranceRef.current !== utterance || !Number.isFinite(event.charIndex)) return;
      const isWordBoundary = !event.name || event.name === 'word';
      const charIndex = event.charIndex + charOffset;
      let low = 0;
      let high = words.length - 1;
      while (low <= high) {
        const middle = (low + high) >> 1;
        if (charIndex < words[middle].start) high = middle - 1;
        else if (charIndex >= words[middle].end) low = middle + 1;
        else {
          if (isWordBoundary) { receivedBoundaryRef.current = true; clearTimer(); }
          currentWordRef.current = middle;
          setCurrentWord(middle);
          return;
        }
      }
      if (isWordBoundary) { receivedBoundaryRef.current = true; clearTimer(); }
      const index = Math.max(startWord, Math.min(low, words.length - 1));
      currentWordRef.current = index;
      setCurrentWord(index);
    };
    utterance.onend = () => { if (activeUtteranceRef.current !== utterance) return; clearTimer(); setState('idle'); };
    utterance.onerror = () => { if (activeUtteranceRef.current !== utterance) return; clearTimer(); setState('unavailable'); };
    speakUtterance(utterance);
  };
  const togglePause = () => {
    if (state === 'paused') { pausedRef.current = false; resumeSpeech(); setState('playing'); }
    else { pausedRef.current = true; pauseSpeech(); setState('paused'); }
  };
  const stop = () => { activeUtteranceRef.current = null; cancelSpeech(); clearTimer(); setState('idle'); };
  const seekToWord = (index: number) => {
    const bounded = Math.max(0, Math.min(words.length - 1, index));
    if ((state === 'playing' || state === 'paused') && !resumeAfterSeekRef.current) {
      resumeAfterSeekRef.current = state === 'playing';
      activeUtteranceRef.current = null;
      cancelSpeech();
      clearTimer();
      pausedRef.current = false;
      setState('idle');
    }
    currentWordRef.current = bounded;
    setCurrentWord(bounded);
  };
  const finishSeek = () => {
    if (!resumeAfterSeekRef.current) return;
    resumeAfterSeekRef.current = false;
    play(currentWordRef.current);
  };
  return <div className="mt-3 flex flex-wrap gap-2" aria-label="Controles de narración">
    <button type="button" onClick={() => play()} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"><Volume2 size={18} aria-hidden="true" />Escuchar desde aquí</button>
    {state === 'idle' && <button type="button" onClick={() => { currentWordRef.current = 0; setCurrentWord(0); play(0); }} className="rounded-xl border border-blue-300 bg-white px-4 py-3 font-semibold text-blue-800">↺ Desde el inicio</button>}
    {(state === 'playing' || state === 'paused') && <><button type="button" onClick={togglePause} className="rounded-xl border border-blue-300 bg-white px-4 py-3 font-semibold text-blue-800">{state === 'paused' ? 'Reanudar' : 'Pausar'}</button><button type="button" onClick={stop} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700">Detener</button></>}
    <span className="sr-only" role="status" aria-live="polite">{state === 'playing' ? 'Reproduciendo narración' : state === 'paused' ? 'Narración en pausa' : state === 'unavailable' ? 'La síntesis de voz no está disponible en este navegador' : ''}</span>
    <label className="basis-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800" htmlFor="course-listening-seek">Posición · palabra {currentWord + 1} de {words.length}<input id="course-listening-seek" type="range" min={0} max={Math.max(0, words.length - 1)} step={1} value={currentWord} aria-valuetext={`Palabra ${currentWord + 1} de ${words.length}: ${transcript.slice(words[currentWord]?.start ?? 0, words[currentWord]?.end ?? 0)}`} onChange={event => seekToWord(Number(event.target.value))} onPointerUp={finishSeek} onKeyUp={finishSeek} className="mt-2 block h-3 w-full cursor-pointer accent-blue-700" /><span className="mt-1 flex justify-between text-xs text-slate-500"><span>Inicio</span><span>Arrastra para volver o adelantar</span><span>Final</span></span></label>
    <p className="basis-full rounded-xl bg-white p-3 text-base leading-8 text-slate-800" aria-label="Transcripción de la narración">{transcript}</p>
    {state === 'unavailable' && <p className="basis-full text-sm text-amber-800">La síntesis de voz no está disponible; puedes usar la transcripción y continuar con las preguntas.</p>}
  </div>;
}

function Speaking({ unit, onComplete, saved }: { unit: LearningUnit; onComplete: (score: number, maxScore: number) => void; saved?: { score: number | null; maxScore: number | null } }) {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { setScores({}); setSubmitted(false); }, [unit.id]);
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  return <div className="space-y-5">
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5"><p className="text-sm font-bold uppercase tracking-wide text-blue-800">Situación comunicativa</p><p className="mt-2 leading-7 text-slate-800">{unit.activities.speaking.situationEs}</p><h3 className="mt-4 font-bold text-slate-900">Habla en inglés sobre estas preguntas:</h3><ol className="mt-2 list-inside list-decimal space-y-2 text-slate-800">{unit.activities.speaking.prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ol></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><h3 className="font-bold text-slate-900">Modelo para estudiar</h3><p className="mt-2 text-lg leading-7 text-slate-900">{unit.activities.speaking.modelAnswer.english}</p><p className="mt-2 text-sm leading-6 text-slate-600">{unit.activities.speaking.modelAnswer.spanishSupport}</p><p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950">No se graba ni se envía tu voz. Practica en voz alta y evalúa tu intento con la rúbrica; no se simula reconocimiento automático.</p></section>
    <section className="space-y-3"><h3 className="font-bold text-slate-900">Rúbrica de autoevaluación · 0 a 2 puntos</h3>{unit.activities.speaking.rubric.map((criterion, index) => <fieldset key={criterion.criterion} className="rounded-xl border border-slate-200 bg-white p-4"><legend className="px-1 font-semibold text-slate-900">{criterion.criterion}</legend><p className="text-sm leading-6 text-slate-600">{criterion.descriptionEs}</p><div className="mt-3 flex flex-wrap gap-2">{[0, 1, 2].map(value => <button key={value} type="button" aria-pressed={scores[index] === value} onClick={() => { setScores(current => ({ ...current, [index]: value })); setSubmitted(false); }} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${scores[index] === value ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-blue-50'}`}>{value} · {value === 0 ? 'Aún no' : value === 1 ? 'En progreso' : 'Sí'}</button>)}</div></fieldset>)}</section>
    <div className="flex flex-wrap items-center gap-3">{!submitted ? <button disabled={Object.keys(scores).length !== unit.activities.speaking.rubric.length} onClick={() => { onComplete(total, unit.activities.speaking.rubric.length * 2); setSubmitted(true); }} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">Guardar autoevaluación</button> : <button onClick={() => { setScores({}); setSubmitted(false); }} className="rounded-xl border border-blue-300 bg-white px-5 py-3 font-semibold text-blue-800">Repetir autoevaluación</button>}{submitted && <p role="status" aria-live="polite" className="font-semibold text-slate-800">Autoevaluación guardada: {total} de 8 puntos.</p>}{!submitted && saved?.score !== null && saved?.score !== undefined && <p className="text-sm text-slate-600">Última autoevaluación: {saved.score}/{saved.maxScore}</p>}</div>
  </div>;
}

export default function LearningPathView() {
  const [level, setLevel] = useState<LearningLevel>('A1');
  const [unitId, setUnitId] = useState('a1-unit-01');
  const [skill, setSkill] = useState<LearningSkill>('grammar');
  const [progress, setProgress] = useState<LearningProgress>(() => loadLearningProgress());
  const [storageWarning, setStorageWarning] = useState(false);
  const units = useMemo(() => learningUnits.filter(unit => unit.level === level), [level]);
  const unit = learningUnits.find(item => item.id === unitId) ?? learningUnits[0];
  const completedActivities = Object.values(progress.units).reduce((sum, item) => sum + Object.values(item.activities).filter(activity => activity?.completed).length, 0);
  const totalActivities = learningUnits.length * skills.length;
  const unitProgress = progress.units[unit.id]?.activities ?? {};

  useEffect(() => { setUnitId(`${level.toLowerCase()}-unit-01`); setSkill('grammar'); }, [level]);
  useEffect(() => () => window.speechSynthesis?.cancel(), [unit.id, skill]);

  const complete = (activitySkill: LearningSkill, score: number, maxScore: number) => {
    const result = saveActivityProgress(progress, unit.id, activitySkill, { score, maxScore });
    setProgress(result.progress);
    setStorageWarning(!result.persisted);
  };
  const selectLevel = (next: LearningLevel) => { setLevel(next); };

  return <div className="mx-auto max-w-6xl space-y-5 pb-6">
    <header className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-700">Ruta de aprendizaje · A1–C1</p><h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Inglés paso a paso</h2><p className="mt-2 max-w-3xl leading-6 text-slate-600">Diez unidades por nivel integran Grammar, Reading, Listening y Speaking. El contenido del curso es una propuesta didáctica alineada al CEFR.</p></div><div className="min-w-36 rounded-xl bg-blue-50 px-4 py-3"><p className="text-xs font-semibold text-blue-800">Progreso guardado aquí</p><p className="mt-1 text-xl font-bold text-slate-900">{completedActivities}/{totalActivities}</p><p className="text-xs text-slate-600">actividades completadas</p></div></div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Progreso total del curso" aria-valuemin={0} aria-valuemax={totalActivities} aria-valuenow={completedActivities}><div className="h-full bg-blue-700 transition-all" style={{ width: `${completedActivities / totalActivities * 100}%` }} /></div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5" role="group" aria-label="Seleccionar nivel">{learningLevels.map(item => <button key={item} type="button" aria-pressed={level === item} onClick={() => selectLevel(item)} className={`rounded-xl border px-3 py-3 text-left ${level === item ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-blue-50'}`}><span className="block font-bold">{item}</span><span className={`text-xs ${level === item ? 'text-blue-100' : 'text-slate-600'}`}>{levelNames[item]}</span></button>)}</div>
    </header>

    <section className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{level} · Unidades</h3><span className="text-xs text-slate-600">{units.filter(item => getUnitActivitiesComplete(item, progress.units[item.id]?.activities ?? {})).length}/10 completas</span></div><nav className="mt-3 grid max-h-[440px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-1" aria-label={`Unidades del nivel ${level}`}>{units.map(item => {
        const activities = progress.units[item.id]?.activities ?? {};
        const completeCount = skills.filter(name => activities[name]?.completed).length;
        const selected = item.id === unit.id;
        return <button key={item.id} type="button" aria-current={selected ? 'step' : undefined} onClick={() => { setUnitId(item.id); setSkill('grammar'); }} className={`rounded-xl border px-3 py-3 text-left ${selected ? 'border-blue-700 bg-blue-50 ring-1 ring-blue-700' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold leading-5 text-slate-900">{item.title}</span><span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{completeCount}/4</span></span><span className="mt-1 block text-xs text-slate-600">{item.activities.reading.title}</span></button>;
      })}</nav></aside>

      <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{unit.level} · Unidad {unit.unitNumber}</p><h3 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{unit.title.replace(/^\d+\. /, '')}</h3><ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-6 text-slate-700">{unit.objectives.map(objective => <li key={objective}>{objective}</li>)}</ul><p className="mt-2 text-sm text-slate-700"><strong>Gramática:</strong> {unit.grammarTopics.join(' · ')}</p><p className="mt-1 text-sm text-slate-700"><strong>Evaluación:</strong> {unit.evaluationCriteria.join(' ')}</p></div>
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Actividades de la unidad">{skills.map(item => {
          const saved = unitProgress[item];
          return <button key={item} type="button" role="tab" id={`learning-tab-${item}`} aria-selected={skill === item} aria-controls="learning-panel" onClick={() => setSkill(item)} onKeyDown={event => {
            const currentIndex = skills.indexOf(item);
            const nextIndex = event.key === 'ArrowRight' ? (currentIndex + 1) % skills.length
              : event.key === 'ArrowLeft' ? (currentIndex - 1 + skills.length) % skills.length
              : event.key === 'Home' ? 0 : event.key === 'End' ? skills.length - 1 : -1;
            if (nextIndex < 0) return;
            event.preventDefault();
            const nextSkill = skills[nextIndex];
            setSkill(nextSkill);
            document.getElementById(`learning-tab-${nextSkill}`)?.focus();
          }} className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold ${skill === item ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-blue-50'}`}>{learningSkillLabels[item]}{saved?.completed ? ' ✓' : ''}</button>;
        })}</div>
        <div id="learning-panel" role="tabpanel" aria-labelledby={`learning-tab-${skill}`}>
          {skill === 'grammar' && <Quiz key={`${unit.id}-grammar`} unit={unit} skill="grammar" progress={progress} onComplete={(score, max) => complete('grammar', score, max)} />}
          {skill === 'reading' && <Quiz key={`${unit.id}-reading`} unit={unit} skill="reading" progress={progress} onComplete={(score, max) => complete('reading', score, max)} />}
          {skill === 'listening' && <Quiz key={`${unit.id}-listening`} unit={unit} skill="listening" progress={progress} onComplete={(score, max) => complete('listening', score, max)} />}
          {skill === 'speaking' && <Speaking key={`${unit.id}-speaking`} unit={unit} saved={unitProgress.speaking} onComplete={(score, max) => complete('speaking', score, max)} />}
        </div>
      </article>
    </section>
    {storageWarning && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950">El navegador bloqueó el almacenamiento local. El progreso de esta sesión se mantiene mientras la página esté abierta, pero no quedará guardado al salir.</p>}
    <p className="text-center text-xs leading-5 text-slate-600">El progreso se conserva en este navegador y dispositivo. No se guardan grabaciones de voz. La narración usa síntesis de voz local del navegador cuando está disponible.</p>
  </div>;
}
