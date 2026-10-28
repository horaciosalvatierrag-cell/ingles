import { useMemo, useRef, useState } from 'react';
import { phrasalVerbs } from '../data/phrasalVerbs';
import { configureEnglishUtterance } from '../lib/speechAccent';
import { webSearchUrl } from '../lib/webSearch';

type VoicePractice = { id: number; target: string; label: string };

const speakText = (text: string, repetitions = 1) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(Array.from({ length: repetitions }, () => text).join('. '));
  configureEnglishUtterance(utterance);
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column++) {
      const above = previous[column];
      previous[column] = left[row - 1] === right[column - 1]
        ? diagonal
        : Math.min(diagonal + 1, previous[column] + 1, previous[column - 1] + 1);
      diagonal = above;
    }
  }
  return previous[right.length];
}

export default function PhrasalVerbsView() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [page, setPage] = useState(1);
  const [repeatCount, setRepeatCount] = useState(2);
  const [practiceId, setPracticeId] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [voicePractice, setVoicePractice] = useState<VoicePractice | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('');
  const [voiceResult, setVoiceResult] = useState<'success' | 'error' | null>(null);
  const [localPackAvailable, setLocalPackAvailable] = useState(false);
  const [installingPack, setInstallingPack] = useState(false);
  const [packMessage, setPackMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  const pageSize = 20;
  const entries = useMemo(() => phrasalVerbs.filter(item =>
    (level === 'all' || item.level === level) &&
    `${item.phrasal} ${item.meaning} ${item.examples.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  ), [query, level]);
  const current = entries.slice((page - 1) * pageSize, page * pageSize);
  const practice = phrasalVerbs.find(item => item.id === practiceId);

  const startVoicePractice = async (item: typeof phrasalVerbs[number], target: string, label: string) => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort?.();
    setIsListening(false);
    setVoicePractice({ id: item.id, target, label });
    setVoiceTranscript('');
    setVoiceMessage('');
    setVoiceResult(null);
    setPackMessage('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceResult('error');
      setVoiceMessage('Este navegador no ofrece reconocimiento de voz. Prueba con Chrome o Edge actualizado.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceResult('error');
      setVoiceMessage('El micrófono requiere HTTPS o localhost en un navegador actualizado.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setVoiceResult('error');
      setVoiceMessage(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'No hay permiso de micrófono. Habilítalo en la configuración del sitio y vuelve a intentar.'
        : 'No se pudo acceder al micrófono. Comprueba que esté conectado.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    let triedLocal = recognition.processLocally === true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const alternatives = Array.from(event.results?.[0] ?? []).map((result: any) => result.transcript as string);
      const heard = alternatives[0] ?? '';
      const expected = normalize(target);
      const bestMatch = alternatives.sort((a, b) => editDistance(normalize(a), expected) - editDistance(normalize(b), expected))[0] ?? heard;
      const normalizedHeard = normalize(bestMatch);
      const distance = editDistance(normalizedHeard, expected);
      const tolerance = Math.max(1, Math.floor(expected.length * 0.16));
      const heardWords = normalizedHeard.split(' ').filter(Boolean);
      const missedWords = expected.split(' ').filter(word => !heardWords.some(heardWord => editDistance(word, heardWord) <= 1));
      setVoiceTranscript(bestMatch);
      setVoiceResult(distance <= tolerance ? 'success' : 'error');
      setVoiceMessage(distance <= tolerance
        ? `Se reconoció “${bestMatch}”. ¡Bien! La frase coincide con el modelo.`
        : `Se reconoció “${bestMatch}”, pero el modelo es “${target}”. ${missedWords.length ? `Practica especialmente: ${missedWords.join(', ')}.` : 'Escucha el modelo y vuelve a intentarlo con más claridad.'}`);
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'network' && typeof SpeechRecognition.available === 'function' && !triedLocal) {
        SpeechRecognition.available({ langs: ['en-US'], processLocally: true }).then((availability: string) => {
          if (availability === 'available') {
            triedLocal = true;
            recognition.processLocally = true;
            setVoiceMessage('El servicio en línea falló; intentando reconocimiento local del navegador…');
            window.setTimeout(() => { try { setIsListening(true); recognition.start(); } catch { setIsListening(false); setVoiceResult('error'); setVoiceMessage('No se pudo iniciar el reconocimiento local. Puedes volver a intentarlo.'); } }, 300);
            return;
          }
          setLocalPackAvailable(availability === 'downloadable' || availability === 'downloading');
          setVoiceResult('error');
          setVoiceMessage(availability === 'downloadable' || availability === 'downloading'
            ? 'Falló el reconocimiento en línea. Puedes instalar el paquete local de inglés o reintentar con conexión.'
            : 'El reconocimiento de voz no pudo conectarse. Revisa la conexión y vuelve a intentar.');
        }).catch(() => { setVoiceResult('error'); setVoiceMessage('El reconocimiento de voz no pudo conectarse. Revisa la conexión y vuelve a intentar.'); });
      } else {
        setVoiceResult('error');
        setVoiceMessage(event.error === 'no-speech' ? 'No detecté voz. Habla después del tono del navegador y vuelve a intentar.'
          : event.error === 'not-allowed' ? 'El navegador bloqueó el micrófono. Habilita el permiso para este sitio.'
            : event.error === 'network' ? 'El reconocimiento de voz no pudo conectarse. Revisa la conexión y vuelve a intentar.'
              : `No se pudo reconocer la voz (${event.error}). Intenta de nuevo.`);
      }
    };
    recognition.onend = () => setIsListening(false);
    setVoiceMessage('Escuchando… di la expresión en inglés.');
    setVoiceResult(null);
    try { recognition.start(); } catch { setIsListening(false); setVoiceResult('error'); setVoiceMessage('El micrófono ya está ocupado. Espera y vuelve a intentar.'); }
  };

  const installLocalPack = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (typeof SpeechRecognition?.install !== 'function') return;
    setInstallingPack(true);
    setPackMessage('Descargando el modelo de inglés para el reconocimiento local…');
    try {
      const installed = await SpeechRecognition.install({ langs: ['en-US'], processLocally: true });
      setLocalPackAvailable(false);
      setPackMessage(installed ? 'Modelo instalado. Pulsa “Reintentar” para usarlo.' : 'No se pudo instalar el modelo. Comprueba la conexión.');
    } catch {
      setPackMessage('No se pudo instalar el modelo de inglés. Comprueba la conexión del navegador.');
    } finally {
      setInstallingPack(false);
    }
  };

  const startPractice = (item: typeof phrasalVerbs[number]) => {
    setPracticeId(item.id);
    setAnswer('');
  };

  return <div className="space-y-4">
    <section className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-violet-200">VOCABULARIO EN CONTEXTO</p><h2 className="mt-1 text-2xl font-bold text-white">Verbos frasales</h2><p className="mt-1 text-sm text-purple-200">400 expresiones con dos ejemplos como mínimo. Escucha, repite y practica tu pronunciación.</p></div>
        <span className="rounded-full border border-violet-300/20 bg-violet-400/15 px-3 py-1.5 text-sm text-violet-100">{phrasalVerbs.length} expresiones</span>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar expresión o significado…" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <select value={level} onChange={event => { setLevel(event.target.value); setPage(1); }} className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white"><option value="all">Todos los niveles</option><option>A1</option><option>A2</option><option>B1</option></select>
        <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-purple-100">Repetir audio
          <select value={repeatCount} onChange={event => setRepeatCount(Number(event.target.value))} className="rounded-lg bg-white/10 px-2 py-1 text-white"><option value={1}>1 vez</option><option value={2}>2 veces</option><option value={3}>3 veces</option></select>
        </label>
        <button onClick={() => { const item = phrasalVerbs[Math.floor(Math.random() * phrasalVerbs.length)]; startPractice(item); }} className="rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400">🎯 Practicar al azar</button>
      </div>
    </section>

    {practice && <section className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-5">
      <div className="flex justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-violet-200">Reto rápido · {practice.level}</p><h3 className="mt-1 text-xl font-bold text-white">¿Qué significa “{practice.phrasal}”?</h3></div><button onClick={() => setPracticeId(null)} aria-label="Cerrar reto" className="text-white/70">✕</button></div>
      <div className="mt-4 flex flex-wrap gap-2">{[practice.meaning, ...phrasalVerbs.filter(item => item.id !== practice.id).sort((a, b) => Math.abs(a.id - practice.id) - Math.abs(b.id - practice.id)).slice(0, 3).map(item => item.meaning)].sort((a, b) => a.localeCompare(b)).map(option => <button key={option} onClick={() => setAnswer(option)} className={`rounded-xl border px-3 py-2 text-left text-sm ${answer === option ? 'border-violet-300 bg-violet-400/30 text-white' : 'border-white/10 bg-slate-950/20 text-purple-100'}`}>{option}</button>)}</div>
      {answer && <p className={`mt-3 text-sm font-semibold ${answer === practice.meaning ? 'text-emerald-200' : 'text-rose-200'}`}>{answer === practice.meaning ? '¡Correcto! Buen trabajo.' : `Casi. “${practice.phrasal}” significa: ${practice.meaning}.`}</p>}
    </section>}

    {voicePractice && <section className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-200">Práctica de pronunciación · {voicePractice.label}</p><h3 className="mt-1 text-lg font-bold text-white">Di: “{voicePractice.target}”</h3></div><div className="flex gap-2"><button onClick={() => speakText(voicePractice.target, repeatCount)} className="rounded-lg bg-blue-500/30 px-3 py-2 text-sm text-white">🔊 Modelo ×{repeatCount}</button><button disabled={isListening} onClick={() => { const entry = phrasalVerbs.find(item => item.id === voicePractice.id); if (entry) void startVoicePractice(entry, voicePractice.target, voicePractice.label); }} className="rounded-lg bg-violet-500 px-3 py-2 text-sm text-white disabled:opacity-50">{isListening ? '🎙️ Escuchando…' : '🎤 Reintentar'}</button><button onClick={() => { recognitionRef.current?.stop?.(); setVoicePractice(null); setIsListening(false); }} aria-label="Cerrar práctica" className="rounded-lg bg-white/10 px-3 py-2 text-white">✕</button></div></div>
      {voiceMessage && <p className={`mt-3 rounded-xl p-3 text-sm ${voiceResult === 'success' ? 'bg-green-500/10 text-green-200' : voiceResult === 'error' ? 'bg-amber-500/10 text-amber-100' : 'bg-white/5 text-white/80'}`}>{voiceMessage}</p>}
      {voiceTranscript && <p className="mt-2 text-sm text-purple-200">El navegador entendió: <span className="font-semibold text-white">“{voiceTranscript}”</span></p>}
      {localPackAvailable && <button onClick={() => void installLocalPack()} disabled={installingPack} className="mt-3 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{installingPack ? 'Instalando modelo local…' : 'Instalar reconocimiento local en inglés'}</button>}
      {packMessage && <p className="mt-2 text-xs text-blue-100">{packMessage}</p>}
      <p className="mt-2 text-xs text-purple-200/70">La corrección compara la transcripción del navegador con la frase objetivo. La precisión depende del idioma y del servicio de voz disponibles.</p>
    </section>}

    <div className="grid gap-3 lg:grid-cols-2">{current.map(item => <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 transition-colors hover:bg-white/10">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-white">{item.phrasal}</h3><span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-purple-100">{item.level}</span></div><p className="mt-1 text-sm text-violet-200">{item.meaning}</p></div><div className="flex shrink-0 gap-2"><button aria-label={`Escuchar ${item.phrasal}`} onClick={() => speakText(item.phrasal, repeatCount)} className="rounded-lg bg-indigo-400/15 px-3 py-2 text-indigo-100 hover:bg-indigo-400/30">🔊 ×{repeatCount}</button><button aria-label={`Practicar pronunciación de ${item.phrasal}`} onClick={() => void startVoicePractice(item, item.phrasal, 'verbo frasal')} className="rounded-lg bg-violet-500/20 px-3 py-2 text-violet-100 hover:bg-violet-500/30">🎤</button></div></div>
      <div className="mt-3 space-y-2">{item.examples.map((example, index) => <div key={`${item.id}-example-${index}`} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 p-3"><p className="flex-1 border-l-2 border-violet-300/50 pl-3 text-sm leading-relaxed text-white/80"><span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-purple-200">Ej. {index + 1}</span>{example}</p><button aria-label={`Escuchar ejemplo ${index + 1} de ${item.phrasal}`} onClick={() => speakText(example, repeatCount)} className="shrink-0 rounded-lg bg-blue-500/20 px-2 py-1.5 text-xs text-blue-200">🔊</button><button aria-label={`Practicar ejemplo ${index + 1} de ${item.phrasal}`} onClick={() => void startVoicePractice(item, example, `ejemplo ${index + 1}`)} className="shrink-0 rounded-lg bg-violet-500/20 px-2 py-1.5 text-xs text-violet-100">🎤</button></div>)}</div>
      <div className="mt-3 flex justify-end"><button onClick={() => startPractice(item)} className="text-xs font-semibold text-violet-200 hover:text-white">Practicar significado →</button></div>
    </article>)}</div>

    {entries.length === 0 && <div className="rounded-xl bg-white/5 p-8 text-center text-purple-100"><p>No hay expresiones que coincidan. Prueba otra búsqueda o nivel.</p>{query.trim() && <a href={webSearchUrl(`${query} English phrasal verb meaning examples`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Buscar en Internet ↗</a>}</div>}
    {entries.length > pageSize && <div className="flex items-center justify-center gap-4 text-sm text-white"><button disabled={page === 1} onClick={() => setPage(value => value - 1)} className="rounded-lg bg-white/10 px-4 py-2 disabled:opacity-40">← Anterior</button><span>{page} / {Math.ceil(entries.length / pageSize)}</span><button disabled={page >= Math.ceil(entries.length / pageSize)} onClick={() => setPage(value => value + 1)} className="rounded-lg bg-white/10 px-4 py-2 disabled:opacity-40">Siguiente →</button></div>}
    <p className="text-center text-[11px] text-purple-200/70">Datos de verbos frasales bajo CC BY-SA 4.0; consulta la atribución del conjunto en src/data/PHRASAL_VERBS_ATTRIBUTION.md.</p>
  </div>;
}
