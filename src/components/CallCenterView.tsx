import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, CheckCircle2, Clock3, Headphones, Lightbulb, Mic, MicOff, Pause, Play, RotateCcw, Send, ShieldCheck, Square, Volume2 } from 'lucide-react';
import { callCenterScenarios, type CallCenterScenario } from '../data/callCenter';
import { configureEnglishUtterance } from '../lib/speechAccent';
import { speakUtterance, cancelSpeech, pauseSpeech, resumeSpeech } from '../lib/indianSpeech';
import { callCenterTopics, correctTechnicalEnglish, generateLocalAgentReply, getLocalHint, type AgentCorrection, type CorrectionTiming, type HelpLanguage } from '../lib/callCenterAgent';
import type { LearningLevel, ChoiceExercise } from '../learning/types';

type Screen = 'home' | 'guided' | 'agent';
type Stage = 'vocabulary' | 'listening' | 'speaking' | 'grammar' | 'evaluation';
type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';
type ActivityKey = Exclude<Stage, 'evaluation'>;
type SavedProgress = { version: 1; completed: Partial<Record<LearningLevel, { score: number; finishedAt: string; activities: Record<ActivityKey, boolean> }>> };
const progressKey = 'ingles.call-center-progress.v1';
const emptyProgress: SavedProgress = { version: 1, completed: {} };
const sessionSeconds = 20 * 60;
const stageOrder: Stage[] = ['vocabulary', 'listening', 'speaking', 'grammar', 'evaluation'];
const stageLabels: Record<Stage, string> = { vocabulary: 'Vocabulario · 0–3 min', listening: 'Listening · 3–8 min', speaking: 'Speaking · 8–15 min', grammar: 'Gramática · 15–18 min', evaluation: 'Evaluación · 18–20 min' };

function loadProgress(): SavedProgress {
  if (typeof window === 'undefined') return emptyProgress;
  try {
    const raw = window.localStorage.getItem(progressKey);
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    if (parsed.version === 1 && parsed.completed && typeof parsed.completed === 'object') return { version: 1, completed: parsed.completed };
    window.localStorage.setItem(`${progressKey}.backup`, raw);
  } catch { /* The lesson remains usable when local storage is disabled. */ }
  return emptyProgress;
}
function saveProgress(progress: SavedProgress) {
  try { window.localStorage.setItem(progressKey, JSON.stringify(progress)); return true; } catch { return false; }
}
function grade(questions: ChoiceExercise[], answers: Record<string, number>) { return questions.reduce((count, item) => count + (answers[item.id] === item.answerIndex ? 1 : 0), 0); }
function formatTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }

export default function CallCenterView() {
  const [screen, setScreen] = useState<Screen>('home');
  const [levelFilter, setLevelFilter] = useState<'all' | LearningLevel>('all');
  const [scenarioId, setScenarioId] = useState<LearningLevel | null>(null);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState<Stage>('vocabulary');
  const [activityDone, setActivityDone] = useState<Record<ActivityKey, boolean>>({ vocabulary: false, listening: false, speaking: false, grammar: false });
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, number>>({});
  const [grammarAnswers, setGrammarAnswers] = useState<Record<string, number>>({});
  const [listeningResult, setListeningResult] = useState<number | null>(null);
  const [grammarResult, setGrammarResult] = useState<number | null>(null);
  const [speakingDraft, setSpeakingDraft] = useState('');
  const [speakingResponses, setSpeakingResponses] = useState<string[]>([]);
  const [selfRatings, setSelfRatings] = useState<string[]>([]);
  const [progress, setProgress] = useState<SavedProgress>(loadProgress);
  const [savedNotice, setSavedNotice] = useState('');
  const [speechLine, setSpeechLine] = useState(-1);
  const [speechPaused, setSpeechPaused] = useState(false);
  const speechIndexRef = useRef(-1);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scenario = callCenterScenarios.find(item => item.id === scenarioId) ?? null;
  const visibleScenarios = useMemo(() => levelFilter === 'all' ? callCenterScenarios : callCenterScenarios.filter(item => item.id === levelFilter), [levelFilter]);

  useEffect(() => {
    if (status !== 'running') return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => () => {
    cancelSpeech();
    currentUtteranceRef.current = null;
  }, []);

  const stopAudio = () => {
    cancelSpeech();
    currentUtteranceRef.current = null;
    speechIndexRef.current = -1;
    setSpeechLine(-1);
    setSpeechPaused(false);
  };

  const speakLine = (index: number) => {
    if (!scenario || !('speechSynthesis' in window)) return;
    if (index >= scenario.transcript.length) { stopAudio(); return; }
    speechIndexRef.current = index;
    setSpeechLine(index);
    setSpeechPaused(false);
    const line = scenario.transcript[index];
    const utterance = new SpeechSynthesisUtterance(line.english);
    configureEnglishUtterance(utterance, line.speaker === 'agent' ? 'male' : 'female');
    utterance.rate = scenario.id === 'A1' ? 0.78 : scenario.id === 'A2' ? 0.84 : 0.94;
    utterance.onend = () => { if (speechIndexRef.current === index) speakLine(index + 1); };
    utterance.onerror = () => { if (speechIndexRef.current === index) stopAudio(); };
    currentUtteranceRef.current = utterance;
    speakUtterance(utterance);
  };

  const startAudio = () => {
    if (speechPaused) { resumeSpeech(); setSpeechPaused(false); return; }
    if (speechLine >= 0) return;
    speakLine(0);
  };

  const resetSession = (nextScenario: CallCenterScenario) => {
    stopAudio();
    setScenarioId(nextScenario.id);
    setElapsed(0);
    setStage('vocabulary');
    setActivityDone({ vocabulary: false, listening: false, speaking: false, grammar: false });
    setListeningAnswers({}); setGrammarAnswers({}); setListeningResult(null); setGrammarResult(null);
    setSpeakingDraft(''); setSpeakingResponses([]); setSelfRatings([]); setSavedNotice('');
    setStatus('idle'); setScreen('guided');
  };

  const markActivity = (item: ActivityKey) => setActivityDone(current => ({ ...current, [item]: true }));

  const finishSession = () => {
    if (!scenario) return;
    stopAudio();
    const vocabUsed = new Set(speakingResponses.join(' ').toLowerCase().match(/[a-z][a-z'-]*/g) ?? []);
    const vocabScore = scenario.vocabulary.filter(item => vocabUsed.has(item.term.toLowerCase())).length;
    const clearResponses = Math.min(scenario.speakingPrompts.length, speakingResponses.filter(item => item.trim().split(/\s+/).length >= 5).length);
    const score = Math.round(
      (listeningResult ?? 0) / scenario.listeningQuestions.length * 30 +
      (grammarResult ?? 0) / scenario.grammar.exercises.length * 30 +
      vocabScore / scenario.vocabulary.length * 20 +
      clearResponses / Math.max(1, scenario.speakingPrompts.length) * 20
    );
    const next: SavedProgress = { version: 1, completed: { ...progress.completed, [scenario.id]: { score, finishedAt: new Date().toISOString(), activities: { ...activityDone } } } };
    setProgress(next);
    setSavedNotice(saveProgress(next) ? 'El avance se guardó solo en este dispositivo.' : 'No se pudo guardar el avance en este navegador; puedes consultar este resultado mientras permanezca abierta la página.');
    setStage('evaluation'); setStatus('finished');
  };

  return <section className="mx-auto max-w-6xl space-y-5" aria-labelledby="call-center-title">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <p className="text-sm font-semibold text-blue-700">INGLÉS PARA SERVICIO Y SOPORTE TIC</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="call-center-title" className="text-2xl font-bold text-slate-900">Call Center</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Practica atención telefónica, soporte técnico y comunicación de incidentes desde A1 hasta C1.</p></div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800"><ShieldCheck size={14} /> Práctica segura · sin credenciales</span>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Secciones de Call Center">
        {(['home', 'guided', 'agent'] as Screen[]).map((item, index) => <button key={item} type="button" onClick={() => { setScreen(item); if (item !== 'guided' || status === 'finished') stopAudio(); }} aria-current={screen === item ? 'page' : undefined} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${screen === item ? 'bg-blue-700 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-blue-50'}`}>{['Inicio', 'Diálogos guiados', 'Agente de práctica'][index]}</button>)}
      </nav>
    </header>

    {screen === 'home' && <div className="grid gap-4 md:grid-cols-2">
      <button type="button" onClick={() => setScreen('guided')} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-400 hover:bg-blue-50/50"><span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700"><BookOpen /></span><h3 className="mt-3 text-lg font-bold text-slate-900">Diálogos guiados</h3><p className="mt-1 text-sm leading-6 text-slate-700">Cinco sesiones sin IA externa con guion bilingüe, audio del navegador, comprensión, Speaking y gramática.</p><p className="mt-3 text-xs font-semibold text-blue-800">A1 · A2 · B1 · B2 · C1 · 20 minutos objetivo</p></button>
      <button type="button" onClick={() => setScreen('agent')} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-400 hover:bg-blue-50/50"><span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700"><Headphones /></span><h3 className="mt-3 text-lg font-bold text-slate-900">Conversación con agente inteligente</h3><p className="mt-1 text-sm leading-6 text-slate-700">Prueba el modo local de demostración para ensayar diagnósticos TIC con contexto y correcciones limitadas.</p><p className="mt-3 text-xs font-semibold text-amber-800">IA por texto y voz: pendiente de un servicio seguro</p></button>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 md:col-span-2">Por seguridad, los ejercicios nunca piden contraseñas, códigos MFA, datos de clientes ni información confidencial. El micrófono solo se activa al pulsar su botón; no se guardan grabaciones.</p>
    </div>}

    {screen === 'guided' && !scenario && <GuidedCatalog items={visibleScenarios} filter={levelFilter} onFilter={setLevelFilter} progress={progress} onChoose={resetSession} />}
    {screen === 'guided' && scenario && <GuidedSession
      scenario={scenario} status={status} elapsed={elapsed} stage={stage} onStage={setStage} onBack={() => { stopAudio(); setScenarioId(null); setStatus('idle'); }} onStart={() => setStatus('running')} onPause={() => { if (speechLine >= 0) { pauseSpeech(); setSpeechPaused(true); } setStatus('paused'); }} onResume={() => { if (speechPaused) { resumeSpeech(); setSpeechPaused(false); } setStatus('running'); }} onFinish={finishSession} onRepeat={() => resetSession(scenario)}
      activityDone={activityDone} markActivity={markActivity} listeningAnswers={listeningAnswers} setListeningAnswers={setListeningAnswers} listeningResult={listeningResult} setListeningResult={setListeningResult} grammarAnswers={grammarAnswers} setGrammarAnswers={setGrammarAnswers} grammarResult={grammarResult} setGrammarResult={setGrammarResult}
      speakingDraft={speakingDraft} setSpeakingDraft={setSpeakingDraft} speakingResponses={speakingResponses} setSpeakingResponses={setSpeakingResponses} selfRatings={selfRatings} setSelfRatings={setSelfRatings} speechLine={speechLine} speechPaused={speechPaused} startAudio={startAudio} pauseAudio={()=>{pauseSpeech();setSpeechPaused(true);}} playLine={speakLine} stopAudio={stopAudio} progressMessage={savedNotice} />}
    {screen === 'agent' && <SmartAgentDemo />}
  </section>;
}

function GuidedCatalog({ items, filter, onFilter, progress, onChoose }: { items: CallCenterScenario[]; filter: 'all' | LearningLevel; onFilter: (value: 'all' | LearningLevel) => void; progress: SavedProgress; onChoose: (item: CallCenterScenario) => void }) {
  return <div className="space-y-4">
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-xl font-bold text-slate-900">Diálogos guiados · 20 min objetivo</h3><p className="mt-1 text-sm text-slate-600">Vocabulario, Listening, Speaking, gramática contextual y evaluación. Puedes continuar después de los 20 minutos.</p></div><label className="text-sm font-medium text-slate-700">Filtrar nivel <select value={filter} onChange={event => onFilter(event.target.value as 'all' | LearningLevel)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="all">Todos</option>{callCenterScenarios.map(item => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label></div></section>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => { const saved = progress.completed[item.id]; return <article key={item.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-2"><span className="rounded-lg bg-blue-100 px-2.5 py-1 text-sm font-bold text-blue-900">{item.id}</span>{saved && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800"><CheckCircle2 size={14} /> Resultado {saved.score}/100</span>}</div><h4 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h4><p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p><div className="mt-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Objetivos</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-5 text-slate-700">{item.objectives.map(goal => <li key={goal}>{goal}</li>)}</ul></div><p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600"><Clock3 size={14} /> 20 min · puedes continuar si necesitas más tiempo</p><button type="button" onClick={() => onChoose(item)} className="mt-auto rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{saved ? 'Repetir / practicar de nuevo' : 'Comenzar sesión'}</button></article>; })}</div>
  </div>;
}

type SessionProps = {
  scenario: CallCenterScenario; status: SessionStatus; elapsed: number; stage: Stage; onStage: (stage: Stage) => void; onBack: () => void; onStart: () => void; onPause: () => void; onResume: () => void; onFinish: () => unknown; onRepeat: () => void;
  activityDone: Record<ActivityKey, boolean>; markActivity: (key: ActivityKey) => void; listeningAnswers: Record<string, number>; setListeningAnswers: (value: Record<string, number>) => void; listeningResult: number | null; setListeningResult: (value: number | null) => void; grammarAnswers: Record<string, number>; setGrammarAnswers: (value: Record<string, number>) => void; grammarResult: number | null; setGrammarResult: (value: number | null) => void;
  speakingDraft: string; setSpeakingDraft: (value: string) => void; speakingResponses: string[]; setSpeakingResponses: (value: string[]) => void; selfRatings: string[]; setSelfRatings: (value: string[]) => void; speechLine: number; speechPaused: boolean; startAudio: () => void; pauseAudio: () => void; playLine: (index: number) => void; stopAudio: () => void; progressMessage: string;
};

function GuidedSession(props: SessionProps) {
  const { scenario, status, elapsed, stage, onStage, onBack, onStart, onPause, onResume, onFinish, onRepeat, activityDone, markActivity, listeningAnswers, setListeningAnswers, listeningResult, setListeningResult, grammarAnswers, setGrammarAnswers, grammarResult, setGrammarResult, speakingDraft, setSpeakingDraft, speakingResponses, setSpeakingResponses, selfRatings, setSelfRatings, speechLine, speechPaused, startAudio, pauseAudio, playLine, stopAudio, progressMessage } = props;
  const [dialogueVisible, setDialogueVisible] = useState(true);
  const [report, setReport] = useState<{score:number;vocabScore:number;clearResponses:number}|null>(null);
  const [activityMessage, setActivityMessage] = useState('');
  const isFinished = status === 'finished';
  const late = elapsed >= sessionSeconds;
  const vocabUsed = new Set(speakingResponses.join(' ').toLowerCase().match(/[a-z][a-z'-]*/g) ?? []);
  const usedTerms = scenario.vocabulary.filter(item => vocabUsed.has(item.term.toLowerCase()));
  const visiblePrompts = scenario.speakingPrompts;
  const markDone = (key: ActivityKey) => { markActivity(key); setActivityMessage('Actividad registrada en esta sesión.'); };

  const finish = () => {
    const vocabScore = usedTerms.length;
    const clearResponses = Math.min(visiblePrompts.length, speakingResponses.filter(item => item.trim().split(/\s+/).length >= 5).length);
    const score = Math.round((listeningResult ?? 0) / scenario.listeningQuestions.length * 30 + (grammarResult ?? 0) / scenario.grammar.exercises.length * 30 + vocabScore / scenario.vocabulary.length * 20 + clearResponses / Math.max(1, visiblePrompts.length) * 20);
    setReport({score,vocabScore,clearResponses});
    onFinish();
  };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><button type="button" onClick={onBack} className="mb-2 text-sm font-semibold text-blue-800 hover:underline">← Volver a diálogos</button><h3 className="text-xl font-bold text-slate-900">{scenario.id} · {scenario.title}</h3><p className="mt-1 text-sm text-slate-600">{scenario.situation}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-xl px-3 py-2 font-mono text-lg font-bold ${late ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-900'}`} aria-live="off">{formatTime(elapsed)} <span className="font-sans text-xs">/ 20:00</span></span>{late && <span className="text-xs font-semibold text-amber-900">Objetivo cumplido; puedes continuar sin límite.</span>}{status === 'idle' && <button type="button" onClick={onStart} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white"><Play size={16} /> Iniciar</button>}{status === 'running' && <button type="button" onClick={onPause} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-800"><Pause size={16} /> Pausar</button>}{status === 'paused' && <button type="button" onClick={onResume} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white"><Play size={16} /> Reanudar</button>}{!isFinished && status !== 'idle' && <button type="button" onClick={finish} className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 font-semibold text-blue-900"><Square size={15} /> Finalizar</button>}{isFinished && <button type="button" onClick={onRepeat} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white"><RotateCcw size={16} /> Repetir</button>}</div></div>

    {status === 'idle' && <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950" role="status">La sesión está lista. Al iniciarla comenzará el temporizador visible de 20 minutos objetivo.</p>}{status === 'paused' && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">Sesión pausada. El temporizador se reanuda cuando pulses “Reanudar”.</p>}
    <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold text-slate-900">Progreso de actividades</h4><span className="text-xs text-slate-600">{Object.values(activityDone).filter(Boolean).length}/4 registradas</span></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" role="tablist" aria-label="Actividades de la sesión">{stageOrder.map(item => <button key={item} type="button" role="tab" aria-selected={stage === item} onClick={() => onStage(item)} className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold ${stage === item ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{item !== 'evaluation' && activityDone[item] ? '✓ ' : ''}{stageLabels[item]}</button>)}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Actividades completadas" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Object.values(activityDone).filter(Boolean).length}><div className="h-full bg-blue-700 transition-all" style={{width:`${Object.values(activityDone).filter(Boolean).length * 25}%`}} /></div></div>

    {stage === 'vocabulary' && <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div><p className="text-sm font-semibold text-blue-800">MINUTOS 0–3 · LEE Y PRACTICA</p><h4 className="mt-1 text-lg font-bold text-slate-900">Vocabulario técnico</h4><p className="mt-1 text-sm text-slate-600">Lee cada término, escucha su pronunciación y piensa en una situación en la que lo usarías.</p></div><ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{scenario.vocabulary.map(item => <li key={item.term} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"><span><strong className="block text-sm text-slate-900">{item.term}</strong><span className="text-xs text-slate-600">{item.meaning}</span></span><button type="button" onClick={() => {const utterance=new SpeechSynthesisUtterance(item.term);configureEnglishUtterance(utterance);speakUtterance(utterance);}} aria-label={`Escuchar ${item.term}`} className="rounded-lg p-2 text-blue-800 hover:bg-blue-100"><Volume2 size={17}/></button></li>)}</ul><button type="button" onClick={() => markDone('vocabulary')} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white">Marcar vocabulario practicado</button></article>}

    {stage === 'listening' && <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-blue-800">MINUTOS 3–8 · LISTENING</p><h4 className="mt-1 text-lg font-bold text-slate-900">Escucha y comprensión</h4><p className="mt-1 text-sm text-slate-600">La voz se genera en el navegador. La disponibilidad y el acento dependen de las voces instaladas.</p></div><div className="flex gap-2"><button type="button" onClick={startAudio} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white"><Play size={15}/> {speechPaused?'Reanudar':'Escuchar'}</button><button type="button" onClick={pauseAudio} disabled={speechLine<0||speechPaused} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"><Pause size={15} className="inline"/> Pausa</button><button type="button" onClick={stopAudio} disabled={speechLine<0} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"><Square size={14} className="inline"/> Detener</button></div></div><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={dialogueVisible} onChange={event => setDialogueVisible(event.target.checked)} /> Mostrar transcripción</label>{dialogueVisible && <div className="max-h-[440px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3" aria-label="Transcripción completa del diálogo">{scenario.transcript.map((line,index)=><div key={`${index}-${line.speaker}`} className={`rounded-xl p-3 ${speechLine===index?'border border-blue-500 bg-blue-50':'border border-transparent bg-white'}`}><p className="text-[11px] font-bold uppercase tracking-wide text-blue-800">{line.speaker==='agent'?'Agente de soporte':'Usuario'}</p><p className="mt-1 font-medium text-slate-900">{line.english}</p><p className="mt-1 text-sm text-slate-600">{line.spanish}</p></div>)}</div>}<QuestionSet title="Preguntas de comprensión" questions={scenario.listeningQuestions} answers={listeningAnswers} setAnswers={setListeningAnswers} result={listeningResult} setResult={setListeningResult} onResult={value=>{if(value!==null)markDone('listening');}} /></article>}

    {stage === 'speaking' && <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div><p className="text-sm font-semibold text-blue-800">MINUTOS 8–15 · SPEAKING</p><h4 className="mt-1 text-lg font-bold text-slate-900">Simulación de atención</h4><p className="mt-1 text-sm text-slate-600">Contesta en voz alta y, si quieres, escribe una nota breve. No se graba el audio. La respuesta escrita sirve para registrar la práctica, no para calificar tu pronunciación.</p></div><ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-800">{visiblePrompts.map((prompt,index)=><li key={prompt}><span>{prompt}</span>{speakingResponses[index] && <p className="mt-1 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-900">Respuesta registrada: {speakingResponses[index]}</p>}</li>)}</ol><details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer font-semibold text-slate-800">Ver una respuesta modelo</summary><p className="mt-2 text-sm leading-6 text-slate-700">{scenario.speakingModel}</p></details><form onSubmit={event=>{event.preventDefault();if(!speakingDraft.trim())return;setSpeakingResponses([...speakingResponses,speakingDraft.trim()]);setSpeakingDraft('');markDone('speaking');}} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="call-center-speaking-note">Respuesta o nota de Speaking</label><input id="call-center-speaking-note" value={speakingDraft} onChange={event=>setSpeakingDraft(event.target.value)} placeholder="Escribe una nota de tu respuesta (opcional)…" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"/><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white"><Send size={16}/> Registrar respuesta</button></form><details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer font-semibold text-slate-800">Rúbrica de autoevaluación oral</summary><ul className="mt-2 space-y-2">{['Expliqué el problema con claridad.','Hice preguntas para confirmar el alcance.','Usé términos técnicos del nivel.','Cerré con una acción o resumen.'].map(item=><li key={item}><label className="flex gap-2 text-sm text-slate-700"><input type="checkbox" checked={selfRatings.includes(item)} onChange={event=>setSelfRatings(event.target.checked?[...selfRatings,item]:selfRatings.filter(value=>value!==item))}/>{item}</label></li>)}</ul><p className="mt-2 text-xs text-slate-600">La rúbrica es autoevaluación y no se convierte en una puntuación automática.</p></details><div className="rounded-xl bg-blue-50 p-3"><p className="text-xs font-bold uppercase text-blue-900">Frases útiles de esta llamada</p><ul className="mt-2 grid gap-1 sm:grid-cols-2">{scenario.usefulExpressions.map(item=><li key={item} className="text-sm text-slate-800">{item}</li>)}</ul></div></article>}

    {stage === 'grammar' && <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div><p className="text-sm font-semibold text-blue-800">MINUTOS 15–18 · GRAMÁTICA CONTEXTUAL</p><h4 className="mt-1 text-lg font-bold text-slate-900">{scenario.grammar.name}</h4><p className="mt-2 text-sm leading-6 text-slate-700">{scenario.grammar.explanation}</p><ul className="mt-3 grid gap-2 sm:grid-cols-3">{scenario.grammar.examples.map(example=><li key={example} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800">{example}</li>)}</ul></div><QuestionSet title="Ejercicios de gramática" questions={scenario.grammar.exercises} answers={grammarAnswers} setAnswers={setGrammarAnswers} result={grammarResult} setResult={setGrammarResult} onResult={value=>{if(value!==null)markDone('grammar');}} /></article>}

    {stage === 'evaluation' && <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div><p className="text-sm font-semibold text-blue-800">MINUTOS 18–20 · EVALUACIÓN</p><h4 className="mt-1 text-lg font-bold text-slate-900">Resumen de la sesión</h4><p className="mt-1 text-sm text-slate-600">El resultado solo es un indicador de práctica: comprensión y gramática usan respuestas verificables; vocabulario y claridad se miden a partir de tus notas escritas.</p></div>{report ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Puntaje de práctica" value={`${report.score}/100`}/><Metric label="Comprensión" value={listeningResult===null?'Sin completar':`${listeningResult}/${scenario.listeningQuestions.length}`}/><Metric label="Gramática" value={grammarResult===null?'Sin completar':`${grammarResult}/${scenario.grammar.exercises.length}`}/><Metric label="Vocabulario técnico" value={`${report.vocabScore}/${scenario.vocabulary.length} términos en notas`}/><Metric label="Claridad escrita" value={`${report.clearResponses}/${visiblePrompts.length} respuestas de 5+ palabras`}/><Metric label="Autoevaluación oral" value={`${selfRatings.length}/4 criterios`}/><Metric label="Fluidez oral" value="No medida"/></div><p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-950">El puntaje asigna 30% a comprensión, 30% a gramática, 20% al vocabulario objetivo incluido en tus notas y 20% a registrar respuestas de al menos cinco palabras. No evalúa voz, pronunciación ni exactitud libre del inglés.</p><div><h5 className="font-bold text-slate-900">Cinco expresiones útiles</h5><ul className="mt-2 grid gap-2 sm:grid-cols-2">{scenario.usefulExpressions.map(item=><li key={item} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{item}</li>)}</ul></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><strong>Siguiente práctica:</strong> {report.score<70?'Repite Listening y revisa las explicaciones de gramática antes de volver a intentar.':'Repite la sesión e intenta responder con más vocabulario técnico y preguntas de confirmación.'}</div><p role="status" className="text-xs text-slate-600">{progressMessage}</p></> : <><p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{activityDone.vocabulary?'✓':'○'} Vocabulario · {activityDone.listening?'✓':'○'} Listening {listeningResult!==null?`(${listeningResult}/${scenario.listeningQuestions.length})`:''} · {activityDone.speaking?'✓':'○'} Speaking · {activityDone.grammar?'✓':'○'} Gramática {grammarResult!==null?`(${grammarResult}/${scenario.grammar.exercises.length})`:''}</p><button type="button" onClick={finish} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">Finalizar y calcular resumen verificable</button></>}</article>}

    {activityMessage && <p role="status" className="sr-only">{activityMessage}</p>}
    {isFinished && stage !== 'evaluation' && <button type="button" onClick={()=>onStage('evaluation')} className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 font-semibold text-blue-900">Ver evaluación</button>}
  </div>;
}

function Metric({label,value}:{label:string;value:string}) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-600">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>; }

function QuestionSet({ title, questions, answers, setAnswers, result, setResult, onResult }: { title:string; questions:ChoiceExercise[]; answers:Record<string,number>; setAnswers:(value:Record<string,number>)=>void; result:number|null; setResult:(value:number|null)=>void; onResult:(value:number|null)=>void }) {
  const submit = () => { const score=grade(questions,answers); setResult(score); onResult(score); };
  return <fieldset className="space-y-3"><legend className="font-bold text-slate-900">{title}</legend>{questions.map((question,index)=><div key={question.id} className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-semibold text-slate-900">{index+1}. {question.prompt}</p><div className="mt-2 grid gap-2">{question.options.map((option,optionIndex)=><label key={option} className="flex items-start gap-2 rounded-lg p-2 text-sm text-slate-800 hover:bg-slate-50"><input type="radio" name={question.id} checked={answers[question.id]===optionIndex} disabled={result!==null} onChange={()=>setAnswers({...answers,[question.id]:optionIndex})}/>{option}</label>)}</div>{result!==null&&<p className={`mt-2 rounded-lg p-2 text-xs leading-5 ${answers[question.id]===question.answerIndex?'bg-emerald-50 text-emerald-900':'bg-amber-50 text-amber-950'}`}><strong>{answers[question.id]===question.answerIndex?'Correcto.':'Revisa esta respuesta.'}</strong> {question.explanationEs}{answers[question.id]!==question.answerIndex&&<span> Respuesta: {question.options[question.answerIndex]}</span>}</p>}</div>)}<div className="flex flex-wrap items-center gap-3"><button type="button" disabled={result!==null||questions.some(item=>answers[item.id]===undefined)} onClick={submit} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50">Revisar ({Object.keys(answers).length}/{questions.length})</button>{result!==null&&<><p role="status" className="text-sm font-semibold text-slate-800">Resultado: {result}/{questions.length}</p><button type="button" onClick={()=>{setAnswers({});setResult(null);onResult(null);}} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">Intentar de nuevo</button></>}</div></fieldset>;
}

type ChatMessage = { role: 'agent' | 'user' | 'correction' | 'system'; text: string; correction?: AgentCorrection };

function SmartAgentDemo() {
  const [level,setLevel]=useState<LearningLevel>('B1');
  const [topic,setTopic]=useState(callCenterTopics[0]);
  const [mode,setMode]=useState<'text'|'voice'>('text');
  const [correctionTiming,setCorrectionTiming]=useState<CorrectionTiming>('turn');
  const [helpLanguage,setHelpLanguage]=useState<HelpLanguage>('Español');
  const [messages,setMessages]=useState<ChatMessage[]>([{role:'agent',text:'Hello. This is a local, rule-based practice demonstration, not an AI service. Tell me what technical issue you are experiencing.'}]);
  const [draft,setDraft]=useState('');
  const [pendingCorrections,setPendingCorrections]=useState<AgentCorrection[]>([]);
  const [deferredCorrections,setDeferredCorrections]=useState<AgentCorrection[]>([]);
  const [sessionReport,setSessionReport]=useState(false);
  const [correctionsPresented,setCorrectionsPresented]=useState(false);
  const [voiceState,setVoiceState]=useState<'idle'|'listening'|'unavailable'>('idle');
  const [voiceError,setVoiceError]=useState('');
  const recognitionRef=useRef<any>(null);
  const userMessages=messages.filter(item=>item.role==='user').map(item=>item.text);
  const wordsUsed=new Set(userMessages.join(' ').toLowerCase().match(/[a-z][a-z'-]*/g)??[]);
  const topicVocabulary:Record<string,string[]>={
    'Help Desk':['ticket','user','issue','service','support'],Windows:['windows','update','task','system','screen'],Linux:['linux','server','process','permission','terminal'],Redes:['network','wifi','dns','vpn','router'],AWS:['aws','region','instance','cloud','service'],'Ciberseguridad':['security','mfa','account','alert','access'],'Cloud computing':['cloud','service','region','availability','workload'],'Bases de datos':['database','query','backup','table','connection'],'Servicios TIC':['incident','sla','service','impact','team']
  };
  const coveredTerms=(topicVocabulary[topic]??[]).filter(term=>wordsUsed.has(term));

  useEffect(()=>()=>{recognitionRef.current?.stop?.();cancelSpeech();},[]);

  const speakReply=(text:string)=>{if(!('speechSynthesis'in window))return;const utterance=new SpeechSynthesisUtterance(text);configureEnglishUtterance(utterance);utterance.rate=level==='A1'?0.82:level==='A2'?0.88:0.96;speakUtterance(utterance);};
  const submitText=(event?:FormEvent)=>{
    event?.preventDefault();const text=draft.trim();if(!text)return;
    const correction=correctTechnicalEnglish(text);
    const reply=generateLocalAgentReply({topic,level,history:userMessages,message:text});
    const next:ChatMessage[]=[{role:'user',text}];
    if(correction&&correctionTiming==='immediate')next.push({role:'correction',text:'',correction});
    next.push({role:'agent',text:reply});
    if(correction&&correctionTiming==='turn')next.push({role:'correction',text:'',correction});
    setMessages(current=>[...current,...next]);
    if(correction){setPendingCorrections(current=>[...current,correction]);if(correctionTiming==='session')setDeferredCorrections(current=>[...current,correction]);}
    setDraft('');setSessionReport(false);
    if(mode==='voice')speakReply(reply);
  };

  const requestVoice=async()=>{
    setVoiceError('');
    const SpeechRecognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SpeechRecognition||!navigator.mediaDevices?.getUserMedia){setVoiceState('unavailable');setVoiceError('Este navegador no ofrece reconocimiento de voz. Cambia a texto; el resto de la práctica local sigue disponible.');return;}
    try{
      const permission=await navigator.mediaDevices.getUserMedia({audio:true});permission.getTracks().forEach(track=>track.stop());
      const recognition=new SpeechRecognition();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
      recognition.onstart=()=>setVoiceState('listening');recognition.onresult=(event:any)=>{const phrase=event.results?.[0]?.[0]?.transcript?.trim();if(phrase)setDraft(value=>value?`${value} ${phrase}`:phrase);};
      recognition.onerror=(event:any)=>{setVoiceState('idle');setVoiceError(event.error==='not-allowed'?'Permiso de micrófono denegado. Puedes seguir por texto.':'El reconocimiento del navegador no pudo conectarse. Puedes seguir por texto.');};
      recognition.onend=()=>setVoiceState('idle');recognitionRef.current=recognition;recognition.start();
    }catch(cause){setVoiceState('idle');const name=cause instanceof DOMException?cause.name:'';setVoiceError(name==='NotAllowedError'?'No se concedió permiso de micrófono. Puedes seguir por texto.':'No se pudo activar el micrófono. Puedes seguir por texto.');}
  };

  const reset=()=>{recognitionRef.current?.stop?.();cancelSpeech();setMessages([{role:'agent',text:`Hello. This is a local, rule-based practice demonstration for ${topic}, not an AI service. Tell me what technical issue you are experiencing.`}]);setPendingCorrections([]);setDeferredCorrections([]);setCorrectionsPresented(false);setDraft('');setSessionReport(false);setVoiceError('');setVoiceState('idle');};
  const finish=()=>{if(correctionTiming==='session'&&deferredCorrections.length&&!correctionsPresented){setMessages(current=>[...current,{role:'system',text:'Correcciones recopiladas al finalizar:'},...deferredCorrections.map(correction=>({role:'correction' as const,text:'',correction}))]);setCorrectionsPresented(true);}setSessionReport(true);};
  const hint=()=>{const message=getLocalHint(topic,level,helpLanguage);setMessages(current=>[...current,{role:'system',text:message}]);if(mode==='voice')speakReply(message);};

  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
    <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-blue-800">CONVERSACIÓN CON AGENTE INTELIGENTE</p><h3 className="mt-1 text-xl font-bold text-slate-900">Agente de práctica TIC</h3><p className="mt-1 text-sm leading-5 text-slate-700">Demostración local basada en reglas, contexto del chat y expresiones del tema. No es un modelo de IA ni envía tus mensajes a un agente externo.</p></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-950">DEMOSTRACIÓN LOCAL · SIN IA</span></div>
      <div className="flex flex-wrap gap-2"><label className="text-xs font-semibold text-slate-700">Nivel <select value={level} onChange={event=>setLevel(event.target.value as LearningLevel)} className="ml-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900">{callCenterScenarios.map(item=><option key={item.id}>{item.id}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Tema <select value={topic} onChange={event=>setTopic(event.target.value as typeof topic)} className="ml-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900">{callCenterTopics.map(item=><option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Modalidad local <select value={mode} onChange={event=>setMode(event.target.value as 'text'|'voice')} className="ml-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900"><option value="text">Texto</option><option value="voice">Voz del navegador</option></select></label></div>
      <div className="flex flex-wrap items-end gap-2"><label className="text-xs font-semibold text-slate-700">Correcciones <select value={correctionTiming} onChange={event=>setCorrectionTiming(event.target.value as CorrectionTiming)} className="ml-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900"><option value="immediate">Inmediatas</option><option value="turn">Después de cada intervención</option><option value="session">Al terminar la sesión</option></select></label><label className="text-xs font-semibold text-slate-700">Idioma de ayuda <select value={helpLanguage} onChange={event=>setHelpLanguage(event.target.value as HelpLanguage)} className="ml-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900"><option>Español</option><option>English</option></select></label><button type="button" onClick={reset} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><RotateCcw size={14}/> Nueva conversación</button></div>
      <div className="max-h-[520px] min-h-[300px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3" aria-live="polite" aria-label="Transcripción de la conversación">{messages.map((item,index)=><div key={`${index}-${item.role}`} className={`flex ${item.role==='user'?'justify-end':'justify-start'}`}><article className={`max-w-[92%] rounded-2xl p-3 text-sm leading-6 ${item.role==='user'?'bg-blue-700 text-white':item.role==='correction'?'border border-amber-300 bg-amber-50 text-amber-950':item.role==='system'?'border border-blue-200 bg-blue-50 text-blue-950':'border border-slate-200 bg-white text-slate-900'}`}><p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">{item.role==='user'?'Tú':item.role==='correction'?'Corrección':item.role==='system'?'Pista':'Agente local de demostración'}</p>{item.correction?<><p><span className="line-through">{item.correction.original}</span></p><p className="font-semibold">{item.correction.corrected}</p><p className="mt-1 text-xs">{helpLanguage==='Español'?item.correction.explanationEs:explanationInEnglish(item.correction.explanationEs)}</p></>:<p>{item.text}</p>}{item.role==='agent'&&<button type="button" onClick={()=>speakReply(item.text)} aria-label="Escuchar respuesta del agente" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:underline"><Volume2 size={14}/> Escuchar con voz del navegador</button>}</article></div>)}</div>
      <form onSubmit={submitText} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="call-center-agent-input">Describe el problema en inglés</label><input id="call-center-agent-input" value={draft} onChange={event=>setDraft(event.target.value)} maxLength={1200} placeholder="Describe el problema en inglés…" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"/><button type="submit" disabled={!draft.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"><Send size={16}/> Enviar</button>{mode==='voice'&&<button type="button" onClick={()=>voiceState==='listening'?recognitionRef.current?.stop?.():void requestVoice()} aria-label={voiceState==='listening'?'Detener micrófono':'Dictar respuesta'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800">{voiceState==='listening'?<MicOff size={17}/>:<Mic size={17}/>} {voiceState==='listening'?'Detener':'Dictar'}</button>}</form>
      {voiceError&&<p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{voiceError}</p>}{voiceState==='listening'&&<p role="status" className="text-xs text-blue-900">Escuchando con el navegador; revisa la transcripción antes de enviarla.</p>}
      <div className="flex flex-wrap gap-2"><button type="button" onClick={hint} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><Lightbulb size={14}/> Necesito una pista</button><button type="button" onClick={finish} disabled={!userMessages.length} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Terminar y evaluar la práctica</button></div>
      {sessionReport&&<article className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4" role="status"><h4 className="font-bold text-blue-950">Resumen medible de la demostración</h4><p className="text-sm leading-6 text-blue-950">Intervenciones escritas: {userMessages.length}. Respuestas de cinco palabras o más: {userMessages.filter(item=>item.split(/\s+/).length>=5).length}. Términos del tema usados en los mensajes: {coveredTerms.length}/{(topicVocabulary[topic]??[]).length} ({coveredTerms.join(', ')||'ninguno detectado'}). Correcciones detectadas por reglas locales: {pendingCorrections.length}.</p><p className="text-xs leading-5 text-blue-900">No se calcula nivel de inglés, comprensión semántica, pronunciación ni fluidez. Este resumen no procede de una IA ni de una evaluación certificada.</p></article>}
      <p className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">Privacidad: el dictado requiere permiso y el proveedor del navegador puede procesar el audio según sus propias condiciones. Si el acento indio usa un endpoint configurado, la voz neural envía a Azure Speech el texto de la respuesta del agente. El chat permanece en memoria; esta aplicación no guarda grabaciones ni envía mensajes a un servicio de IA.</p>
    </section>
    <aside className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><h4 className="font-bold text-slate-900">Integraciones de IA</h4><p className="mt-1 text-sm leading-5 text-slate-600">Estas opciones no se activan con solo GitHub Pages. Requieren configurar un servidor intermediario seguro.</p><div className="mt-3 space-y-2"><div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-semibold text-amber-950">IA por texto · Pendiente</p><p className="mt-1 text-xs leading-5 text-amber-900">Necesita un backend o función serverless que proteja la clave y aplique controles de uso.</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-semibold text-amber-950">IA por voz · Pendiente</p><p className="mt-1 text-xs leading-5 text-amber-900">Realtime por WebRTC necesita que un servidor cree una sesión o clave efímera; nunca se expondrá una clave estándar al navegador.</p></div></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><h4 className="font-bold text-slate-900">Contexto de esta conversación</h4><p className="mt-1 text-sm text-slate-600">El modo local utiliza el tema seleccionado, tus mensajes previos y palabras técnicas para formular preguntas de diagnóstico y seguimiento.</p><p className="mt-3 text-sm font-semibold text-slate-800">Tema: {topic} · Nivel de vocabulario: {level}</p><p className="mt-1 text-xs leading-5 text-slate-600">El modo local es una demostración basada en reglas. Para respuestas abiertas y semánticas se requiere configurar IA externa.</p></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><h4 className="font-bold text-slate-900">Vocabulario observado</h4><div className="mt-2 flex flex-wrap gap-2">{(topicVocabulary[topic]??[]).map(term=><span key={term} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coveredTerms.includes(term)?'bg-emerald-100 text-emerald-900':'bg-slate-100 text-slate-600'}`}>{coveredTerms.includes(term)?'✓ ':'○ '}{term}</span>)}</div><p className="mt-2 text-xs leading-5 text-slate-600">Solo busca coincidencias de palabras exactas en texto; no determina si se usaron correctamente.</p></section>
    </aside>
  </div>;
}

function explanationInEnglish(explanation:string) {
  const mapping:Record<string,string>={
    'Para describir un problema que ocurre ahora, usa be + verbo en -ing: “isn’t working”.':'To describe a problem happening now, use be + verb-ing: “isn’t working”.',
    'En este contexto se dice “connect to the internet”; internet suele llevar el artículo the.':'In this context, say “connect to the internet”; internet usually takes the article “the”.',
    'Para expresar que no puedes establecer una conexión, usa “can’t + verbo base”: “can’t connect”.':'To say you are unable to establish a connection, use “can’t + base verb”: “can’t connect”.',
    'Con un sujeto singular de tercera persona se usa “doesn’t” y el verbo base “work”.':'With a singular third-person subject, use “doesn’t” and the base verb “work”.',
    'Usa “an” antes del sonido vocálico inicial de “error”.':'Use “an” before the initial vowel sound in “error”.',
    '“Agree” es un verbo; no se combina con “am”.':'“Agree” is a verb; do not combine it with “am”.'
  };
  const translated = explanation.split(/(?<=\.)\s+/).map(item=>mapping[item]).filter(Boolean);
  return translated.length ? translated.join(' ') : 'Review the corrected sentence and compare its verb form and word order.';
}
