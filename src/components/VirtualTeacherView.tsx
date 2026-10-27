import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Camera, CameraOff, Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { configureEnglishUtterance } from '../lib/speechAccent';

const topics = [
  { id: 'introductions', label: 'Presentaciones', icon: '👋', prompt: 'Tell me a little about yourself. Where are you from?' },
  { id: 'family', label: 'Familia y amigos', icon: '👨‍👩‍👧', prompt: 'Who are the people you spend the most time with?' },
  { id: 'daily-life', label: 'Rutina diaria', icon: '☀️', prompt: 'What does a typical weekday look like for you?' },
  { id: 'food', label: 'Comida', icon: '🍽️', prompt: 'What is a dish you enjoy, and how is it made?' },
  { id: 'travel', label: 'Viajes', icon: '🧳', prompt: 'Tell me about a place you would like to visit.' },
  { id: 'work', label: 'Trabajo y estudios', icon: '💼', prompt: 'What are you learning or working on these days?' },
  { id: 'hobbies', label: 'Pasatiempos', icon: '🎨', prompt: 'What do you like to do in your free time?' },
  { id: 'technology', label: 'Tecnología', icon: '💻', prompt: 'Which technology makes your everyday life easier?' },
  { id: 'health', label: 'Salud y bienestar', icon: '🌿', prompt: 'What helps you relax after a busy day?' },
  { id: 'future', label: 'Planes y metas', icon: '🚀', prompt: 'What is one goal you hope to reach this year?' },
];

type Turn = { speaker: 'teacher' | 'student'; text: string };

function replyToStudent(text: string, topic: typeof topics[number]) {
  const normalized = text.toLowerCase();
  if (normalized.includes('because')) return 'Great use of “because.” Can you tell me a little more about that reason?';
  if (normalized.includes('yesterday') || normalized.includes('last week')) return 'Nice, you used the past tense to talk about a past experience. What happened next?';
  if (normalized.includes('tomorrow') || normalized.includes('next year') || normalized.includes('will ')) return 'That sounds like an exciting plan. What is the first step you will take?';
  if (text.trim().split(/\s+/).length < 5) return 'Good start. Try adding one detail with “because,” “and,” or “but.” ' + topic.prompt;
  return 'Thanks for sharing that. I understood your main idea. Could you explain one detail a little more? ' + topic.prompt;
}

export default function VirtualTeacherView() {
  const [topicId, setTopicId] = useState(topics[0].id);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micStatus, setMicStatus] = useState('Micrófono sin solicitar');
  const [cameraStatus, setCameraStatus] = useState('Cámara sin solicitar');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const topic = topics.find(item => item.id === topicId) ?? topics[0];

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    window.speechSynthesis?.cancel();
  }, []);

  const openTopic = (id: string) => {
    const selected = topics.find(item => item.id === id) ?? topics[0];
    setTopicId(id);
    setTurns([{ speaker: 'teacher', text: selected.prompt }]);
    setDraft('');
    setError('');
  };

  const requestMicrophone = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite solicitar el micrófono. Usa un navegador actualizado en HTTPS o localhost.');
      setMicStatus('No disponible');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('Permiso concedido');
      return true;
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : '';
      setMicStatus(name === 'NotAllowedError' ? 'Permiso denegado' : 'No se pudo acceder');
      setError(name === 'NotAllowedError' ? 'El acceso al micrófono fue bloqueado. Cambia el permiso en la configuración del sitio.' : 'No se encontró un micrófono disponible.');
      return false;
    }
  };

  const listen = async () => {
    if (listening) { recognitionRef.current?.stop?.(); setListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('El reconocimiento de voz no está disponible en este navegador. Puedes escribir tu respuesta.'); return; }
    if (!(await requestMicrophone())) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) setDraft(value => value ? `${value} ${transcript}` : transcript);
    };
    recognition.onerror = (event: any) => { setListening(false); setError(event.error === 'not-allowed' ? 'El navegador bloqueó el permiso del micrófono.' : event.error === 'network' ? 'El servicio de reconocimiento de voz del navegador no pudo conectarse. Puedes continuar escribiendo.' : 'No pude reconocer la voz. Intenta de nuevo o escribe tu respuesta.'); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setListening(false); setError('El micrófono ya está en uso. Espera un momento y vuelve a intentar.'); }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const response = replyToStudent(text, topic);
    setTurns(value => [...value, { speaker: 'student', text }, { speaker: 'teacher', text: response }]);
    setDraft('');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(response);
      configureEnglishUtterance(utterance);
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleCamera = async () => {
    setError('');
    if (cameraOn) {
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      setCameraStatus('Cámara apagada');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) { setError('Este navegador no permite usar la cámara. Usa un navegador actualizado en HTTPS o localhost.'); setCameraStatus('No disponible'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setCameraStatus('Cámara activa en este dispositivo');
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : '';
      setCameraStatus(name === 'NotAllowedError' ? 'Permiso denegado' : 'No se pudo acceder');
      setError(name === 'NotAllowedError' ? 'El acceso a la cámara fue bloqueado. Cambia el permiso en la configuración del sitio.' : 'No se encontró una cámara disponible.');
    }
  };

  return <div className="space-y-4">
    <section className="rounded-2xl border border-white/10 bg-white/10 p-5"><p className="text-sm font-semibold text-fuchsia-200">PRÁCTICA ORAL GUIADA</p><h2 className="mt-1 text-2xl font-bold text-white">Profesor virtual</h2><p className="mt-1 text-sm text-purple-200">Elige un tema, responde por voz o texto y recibe preguntas de seguimiento para ampliar tus respuestas en inglés.</p></section>
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"><h3 className="mb-3 text-sm font-bold text-white">Elige un tema</h3><div className="grid grid-cols-2 gap-2 xl:grid-cols-1">{topics.map(item => <button key={item.id} onClick={() => openTopic(item.id)} className={`rounded-xl px-3 py-2.5 text-left text-sm ${topicId === item.id ? 'bg-fuchsia-500/30 text-white ring-1 ring-fuchsia-200/30' : 'bg-white/5 text-purple-100 hover:bg-white/10'}`}><span className="mr-2">{item.icon}</span>{item.label}</button>)}</div></aside>
      <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/20 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-white">Conversación: {topic.label}</h3><p className="text-xs text-purple-200">Contesta con una frase completa para practicar.</p></div><div className="flex gap-2"><button onClick={listen} aria-label={listening ? 'Detener micrófono' : 'Responder con micrófono'} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white ${listening ? 'bg-rose-500 animate-pulse' : 'bg-fuchsia-500 hover:bg-fuchsia-400'}`}>{listening ? <MicOff size={16} /> : <Mic size={16} />}{listening ? 'Detener' : 'Hablar'}</button><button onClick={toggleCamera} aria-label={cameraOn ? 'Apagar cámara' : 'Activar cámara'} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400">{cameraOn ? <CameraOff size={16} /> : <Camera size={16} />}{cameraOn ? 'Apagar video' : 'Video opcional'}</button></div></div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-white/5 px-2.5 py-1 text-purple-100">🎙 {micStatus}</span><span className="rounded-full bg-white/5 px-2.5 py-1 text-purple-100">📹 {cameraStatus}</span></div>
        {cameraOn && <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black"><video ref={videoRef} autoPlay muted playsInline className="aspect-video max-h-64 w-full object-cover" /></div>}
        <div className="mt-4 max-h-[420px] min-h-60 space-y-3 overflow-y-auto rounded-xl bg-black/15 p-3" aria-live="polite">{turns.map((turn, index) => <div key={`${index}-${turn.speaker}`} className={`flex ${turn.speaker === 'student' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${turn.speaker === 'student' ? 'bg-indigo-500/40 text-white' : 'border border-white/10 bg-white/10 text-purple-50'}`}><p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">{turn.speaker === 'student' ? 'Tú' : 'Profesor'}</p>{turn.text}{turn.speaker === 'teacher' && <button onClick={() => { const utterance = new SpeechSynthesisUtterance(turn.text); configureEnglishUtterance(utterance); window.speechSynthesis.speak(utterance); }} aria-label="Volver a escuchar" className="ml-2 inline-flex text-indigo-200"><Volume2 size={15} /></button>}</div></div>)}</div>
        <form onSubmit={submit} className="mt-3 flex gap-2"><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Escribe tu respuesta en inglés…" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400" /><button type="submit" disabled={!draft.trim()} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"><Send size={16} />Enviar</button></form>
        {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100">{error}</p>}
        <p className="mt-3 text-[11px] leading-relaxed text-purple-200/65">El micrófono convierte tu voz en texto con el reconocimiento de voz del navegador. El video solo se muestra en este dispositivo; no se graba ni se envía. Las respuestas del profesor usan guiones locales de práctica, no un servicio de IA conectado.</p>
      </section>
    </div>
  </div>;
}
