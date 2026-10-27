import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { regularVerbs } from './data/regularVerbs';
import { irregularVerbs } from './data/irregularVerbs';
import { dialogues } from './data/dialogues';
import { pastParticiple } from './data/verbForms';

const DialogueView = lazy(() => import('./components/DialogueView'));
const DictionaryView = lazy(() => import('./components/DictionaryView'));
const PhrasalVerbsView = lazy(() => import('./components/PhrasalVerbsView'));
const ListeningView = lazy(() => import('./components/ListeningView'));
const VirtualTeacherView = lazy(() => import('./components/VirtualTeacherView'));

type VerbType = 'regular' | 'irregular';
type FeedbackType = 'success' | 'error' | 'neutral' | null;
type Verb = typeof regularVerbs[0] | typeof irregularVerbs[0];
type AppSection = 'verbs' | 'levelContent' | 'dialogues' | 'dictionary' | 'phrasal' | 'listening' | 'teacher';
type Level = 'verbs' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'dialogues' | 'dictionary' | 'phrasal' | 'listening' | 'teacher';

interface LevelInfo {
  id: Level;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const levels: LevelInfo[] = [
  { id: 'verbs', name: 'Verbos', description: '300 regulares · 160 irregulares', icon: '📘', color: 'from-blue-500 to-sky-600' },
  { id: 'A1', name: 'Nivel A1', description: 'Principiante', icon: '🌱', color: 'from-green-400 to-green-600' },
  { id: 'A2', name: 'Nivel A2', description: 'Elemental', icon: '🌿', color: 'from-teal-400 to-teal-600' },
  { id: 'B1', name: 'Nivel B1', description: 'Intermedio', icon: '🌳', color: 'from-blue-400 to-blue-600' },
  { id: 'B2', name: 'Nivel B2', description: 'Intermedio Alto', icon: '⭐', color: 'from-purple-400 to-purple-600' },
  { id: 'C1', name: 'Nivel C1', description: 'Avanzado', icon: '🏆', color: 'from-yellow-400 to-orange-600' },
  { id: 'phrasal', name: 'Verbos frasales', description: '400 expresiones', icon: '🔗', color: 'from-violet-400 to-fuchsia-600' },
  { id: 'dialogues', name: 'Diálogos', description: 'Conversaciones', icon: '💬', color: 'from-pink-400 to-rose-600' },
  { id: 'listening', name: 'Listening', description: '5 historias A1–C1', icon: '🎧', color: 'from-sky-400 to-blue-600' },
  { id: 'teacher', name: 'Profesor virtual', description: '10 temas · voz y video', icon: '🎙️', color: 'from-fuchsia-400 to-purple-600' },
  { id: 'dictionary', name: 'Diccionario', description: '1390+ palabras', icon: '📖', color: 'from-indigo-400 to-blue-600' },
];

function App() {
  const [activeLevel, setActiveLevel] = useState<Level>('verbs');
  const [appSection, setAppSection] = useState<AppSection>('verbs');
  const [verbType, setVerbType] = useState<VerbType>('regular');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeVerb, setActiveVerb] = useState<Verb | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [manualAttempt, setManualAttempt] = useState('');
  const [manualCheck, setManualCheck] = useState(false);
  const [localPackAvailable, setLocalPackAvailable] = useState(false);
  const [installingLocalPack, setInstallingLocalPack] = useState(false);
  const [localPackMessage, setLocalPackMessage] = useState('');
  const [currentWord, setCurrentWord] = useState<'infinitive' | 'past' | 'participle'>('infinitive');
  const [speechRate, setSpeechRate] = useState(0.8);
  const [showTranslations, setShowTranslations] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [quizVerb, setQuizVerb] = useState<Verb | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDialogue, setSelectedDialogue] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const itemsPerPage = 20;

  const currentVerbList = verbType === 'regular' ? regularVerbs : irregularVerbs;
  const activeTargetWord = activeVerb
    ? currentWord === 'infinitive' ? activeVerb.infinitive : currentWord === 'past' ? activeVerb.pastSimple : pastParticiple(activeVerb)
    : quizVerb?.pastSimple ?? '';

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;
    }
  }, []);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // Text-to-Speech
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      utterance.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      // Priorizar voces americanas (en-US)
      const englishVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Female'))
        || voices.find(v => v.lang === 'en-US')
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    }
  }, [speechRate]);

  // Levenshtein distance
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };

  // Speech Recognition
  const startListening = useCallback(async () => {
    setLocalPackMessage('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setFeedback('error');
      setFeedbackMessage('El micrófono requiere un navegador actualizado y una conexión segura (HTTPS o localhost).');
      setManualCheck(true);
      return;
    }
    try {
      const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setFeedback('error');
      setFeedbackMessage(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'El permiso de micrófono está bloqueado. Habilítalo en la configuración del sitio.'
        : 'No se pudo acceder al micrófono. Comprueba que esté conectado y vuelve a intentar.');
      setManualCheck(true);
      return;
    }
    if (!recognitionRef.current) {
      setFeedback('error');
      setFeedbackMessage('Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
      setManualCheck(true);
      return;
    }
    const recognition = recognitionRef.current;
    const RecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition.onresult = (event: any) => {
      const results = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(event.results[0][i].transcript.toLowerCase().trim());
      }
      const bestMatch = results[0];
      setUserTranscript(bestMatch);
      const targetWord = activeTargetWord;
      const targetWords = targetWord.split('/').map(w => w.trim().toLowerCase());
      const isCorrect = results.some((r: string) => {
        const normalized = r.replace(/[^a-z]/g, '');
        return targetWords.some(tw => {
          const target = tw.replace(/[^a-z]/g, '');
          return normalized === target || levenshteinDistance(normalized, target) <= 1;
        });
      });
      const confidence = event.results[0][0].confidence;
      if (isCorrect) {
        setFeedback('success');
        setFeedbackMessage(`¡Excelente! 🎉 Pronunciaste "${targetWord}" correctamente.`);
      } else if (confidence > 0.5) {
        setFeedback('error');
        setFeedbackMessage(`Escuché "${bestMatch}". Intenta decir "${targetWord}" más claramente.`);
      } else {
        setFeedback('error');
        setFeedbackMessage(`No pude entender bien. Intenta decir "${targetWord}" de nuevo.`);
      }
      setIsListening(false);
      setManualCheck(false);
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'no-speech') setFeedbackMessage('No detecté tu voz. Habla más fuerte.');
      else if (event.error === 'not-allowed') setFeedbackMessage('Permiso de micrófono denegado.');
      else if (event.error === 'network') {
        setFeedbackMessage('No se pudo conectar al reconocimiento en línea. Comprobando si este navegador puede reconocer voz localmente…');
        if (typeof RecognitionClass?.available === 'function') {
          RecognitionClass.available({ langs: ['en-US'], processLocally: true }).then((availability: string) => {
            if (availability === 'available') {
              recognition.processLocally = true;
              setFeedback('neutral');
              setFeedbackMessage('El servicio en línea no responde. Reintentando con el modelo local del navegador…');
              window.setTimeout(() => {
                try { setIsListening(true); recognition.start(); }
                catch { setIsListening(false); setManualCheck(true); setFeedback('error'); setFeedbackMessage('No pude iniciar el reconocimiento local. Puedes revisar tu respuesta por escrito.'); }
              }, 300);
              return;
            }
            setLocalPackAvailable(availability === 'downloadable' || availability === 'downloading');
            setFeedback('error');
            setManualCheck(true);
            setFeedbackMessage(availability === 'downloadable' || availability === 'downloading'
              ? 'El servicio en línea no responde. Puedes instalar el paquete de inglés para reconocimiento local, o usar la práctica escrita.'
              : 'El servicio en línea no responde y este navegador no tiene reconocimiento local disponible. Usa la práctica escrita o revisa tu conexión.');
          }).catch(() => {
            setFeedback('error');
            setManualCheck(true);
            setFeedbackMessage('Chrome no pudo conectar con el servicio de voz. Revisa tu conexión o usa la práctica escrita de abajo.');
          });
        } else {
          setManualCheck(true);
          setFeedbackMessage('Chrome no pudo conectar con el servicio de voz. Revisa tu conexión o usa la práctica escrita de abajo.');
        }
      }
      else setFeedbackMessage(`Error: ${event.error}`);
      setFeedback('error');
    };
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    setFeedback(null);
    setManualCheck(false);
    setManualAttempt('');
    setFeedbackMessage('');
    setUserTranscript('');
    try { recognition.start(); } catch (e) { setIsListening(false); }
  }, [activeVerb, currentWord, quizVerb]);

  // Filter verbs
  const filteredVerbs = currentVerbList.filter(verb =>
    verb.infinitive.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verb.pastSimple.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verb.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVerbs.length / itemsPerPage);
  const paginatedVerbs = filteredVerbs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getRandomQuizVerb = () => {
    const randomIndex = Math.floor(Math.random() * currentVerbList.length);
    setQuizVerb(currentVerbList[randomIndex]);
    setFeedback(null);
    setFeedbackMessage('');
    setUserTranscript('');
    setManualAttempt('');
    setManualCheck(false);
  };

  const switchVerbType = (type: VerbType) => {
    setVerbType(type);
    setSearchTerm('');
    setCurrentPage(1);
    setActiveVerb(null);
    setQuizMode(false);
    setFeedback(null);
    setManualCheck(false);
  };

  const checkManualAttempt = () => {
    const normalized = manualAttempt.toLowerCase().replace(/[^a-z]/g, '');
    const expectedForms = activeTargetWord.split('/').map(word => word.trim().toLowerCase().replace(/[^a-z]/g, ''));
    if (!normalized) return;
    const correct = expectedForms.some(word => normalized === word || levenshteinDistance(normalized, word) <= 1);
    setUserTranscript(manualAttempt);
    setFeedback(correct ? 'success' : 'error');
    setFeedbackMessage(correct
      ? 'La respuesta escrita coincide. Este modo no puede evaluar la pronunciación.'
      : `Por escrito escucho “${manualAttempt}”; la forma esperada es “${activeTargetWord}”. Este modo no evalúa pronunciación.`);
  };

  const installLocalEnglishPack = async () => {
    const RecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (typeof RecognitionClass?.install !== 'function') return;
    setInstallingLocalPack(true);
    setLocalPackMessage('Descargando el paquete de reconocimiento en inglés…');
    try {
      const installed = await RecognitionClass.install({ langs: ['en-US'], processLocally: true });
      setLocalPackAvailable(false);
      if (installed && recognitionRef.current) recognitionRef.current.processLocally = true;
      setLocalPackMessage(installed ? 'Paquete instalado. Pulsa “Reintentar micrófono” para practicar sin conexión.' : 'No se pudo instalar el paquete. Revisa la conexión y vuelve a intentar.');
    } catch {
      setLocalPackMessage('No se pudo instalar el paquete. Comprueba la conexión del navegador.');
    } finally {
      setInstallingLocalPack(false);
    }
  };

  const handleLevelSelect = (level: Level) => {
    setActiveLevel(level);
    if (level === 'dialogues') {
      setAppSection('dialogues');
    } else if (level === 'dictionary') {
      setAppSection('dictionary');
    } else if (level === 'phrasal') {
      setAppSection('phrasal');
    } else if (level === 'listening') {
      setAppSection('listening');
    } else if (level === 'teacher') {
      setAppSection('teacher');
    } else if (level === 'verbs') {
      setAppSection('verbs');
    } else {
      setAppSection('levelContent');
    }
    setSidebarOpen(false);
  };

  return (
    <div className="windows-theme min-h-screen bg-gradient-to-br from-[#0a1427] via-[#132b4b] to-[#252545] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Vertical Menu */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } flex flex-col overflow-y-auto`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h1 className="text-lg font-bold text-white">Inglés Americano</h1>
              <p className="text-purple-300 text-xs">Aprendizaje</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 lg:hidden text-white/60 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Levels Menu */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-purple-300 text-xs font-medium uppercase tracking-wider px-3 mb-2">Menú principal</p>
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelSelect(level.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                activeLevel === level.id
                  ? `bg-gradient-to-r ${level.color} text-white shadow-lg`
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl">{level.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{level.name}</p>
                <p className={`text-xs truncate ${activeLevel === level.id ? 'text-white/80' : 'text-white/40'}`}>
                  {level.description}
                </p>
              </div>
              {activeLevel === level.id && (
                <span className="w-2 h-2 bg-white rounded-full flex-shrink-0"></span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-purple-200 text-xs">📊 Contenido</p>
            <p className="text-white text-sm font-bold">{regularVerbs.length + irregularVerbs.length} verbos</p>
            <p className="text-purple-300 text-xs">400 verbos frasales</p>
            <p className="text-purple-300 text-xs">{dialogues.length} diálogos</p>
            <p className="text-purple-300 text-xs">5 historias · 10 temas</p>
            <p className="text-purple-300 text-xs">1390+ palabras</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {levels.find(l => l.id === activeLevel)?.icon}
                    {levels.find(l => l.id === activeLevel)?.name}
                  </h2>
                  <p className="text-purple-300 text-xs hidden sm:block">
                    {levels.find(l => l.id === activeLevel)?.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {appSection === 'verbs' && (
                  <button
                    onClick={() => { if (!quizMode) getRandomQuizVerb(); setQuizMode(!quizMode); }}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                      quizMode ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    🎯 Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-3 md:px-6 py-4 overflow-y-auto">
          {appSection === 'levelContent' && (
            <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm md:p-8">
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">{levels.find(item => item.id === activeLevel)?.description}</span>
              <h2 className="mt-4 text-2xl font-bold text-white">Contenido del nivel {activeLevel}</h2>
              {activeLevel === 'B1' ? (
                <p className="mt-3 leading-relaxed text-purple-200">Este espacio queda disponible para incorporar contenido B1 de otro tipo. La práctica general de verbos ahora está en la opción independiente <strong className="text-white">Verbos</strong>.</p>
              ) : (
                <p className="mt-3 leading-relaxed text-purple-200">Este nivel ya está separado de la práctica general de verbos y queda listo para organizar actividades específicas. La opción <strong className="text-white">Verbos</strong> reúne ahora esa práctica.</p>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => handleLevelSelect('verbs')} className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400">📘 Abrir Verbos</button>
                <button onClick={() => handleLevelSelect('listening')} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">🎧 Ir a Listening</button>
                <button onClick={() => handleLevelSelect('dialogues')} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">💬 Ir a Diálogos</button>
              </div>
            </section>
          )}

          {/* VERBS SECTION */}
          {appSection === 'verbs' && (
            <>
              {/* Verb Type Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => switchVerbType('regular')}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    verbType === 'regular'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ✅ Regulares
                </button>
                <button
                  onClick={() => switchVerbType('irregular')}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    verbType === 'irregular'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ⚡ Irregulares
                </button>
              </div>

              {/* Controls */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 mb-4 border border-white/10">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <input
                    type="text"
                    placeholder="🔍 Buscar verbo..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="flex-1 w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs">🐢</span>
                    <input type="range" min="0.3" max="1.2" step="0.1" value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-20 accent-purple-400" />
                    <span className="text-white text-xs">🐇</span>
                    <span className="text-purple-200 text-xs">{speechRate}x</span>
                  </div>
                  <button onClick={() => setShowTranslations(!showTranslations)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${showTranslations ? 'bg-purple-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {showTranslations ? '🇪🇸 ON' : '🙈 OFF'}
                  </button>
                </div>
              </div>

              {/* Quiz Mode */}
              {quizMode && quizVerb && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-4 border border-green-400/30">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white">🎯 Quiz</h2>
                    <div className="text-green-200 font-medium text-sm">{quizScore.correct}/{quizScore.total}</div>
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-purple-200 text-sm mb-1">Di el pasado simple de:</p>
                    <p className="text-3xl font-bold text-white">{quizVerb.infinitive}</p>
                    {showTranslations && <p className="text-purple-300 text-sm">({quizVerb.translation})</p>}
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <button onClick={() => { setCurrentWord('past'); setActiveVerb(quizVerb); startListening(); }}
                      disabled={isListening}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white hover:bg-green-400'}`}>
                      {isListening ? '🎤 Escuchando...' : '🎤 Hablar'}
                    </button>
                    <button onClick={() => speak(quizVerb.pastSimple)}
                      className="px-4 py-2 bg-blue-500/30 text-white rounded-xl hover:bg-blue-500/50 text-sm">
                      🔊 Escuchar respuesta
                    </button>
                    {feedback && (
                      <div className={`p-3 rounded-xl w-full ${feedback === 'success' ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'}`}>
                        <p className={`text-center text-sm ${feedback === 'success' ? 'text-green-200' : 'text-red-200'}`}>{feedbackMessage}</p>
                        {userTranscript && <p className="text-center text-purple-200 text-xs mt-1">Escuché: "{userTranscript}"</p>}
                      </div>
                    )}
                    {feedback === 'success' && (
                      <div className="flex gap-2">
                        <button onClick={() => { setQuizScore(p => ({ correct: p.correct + 1, total: p.total + 1 })); setTimeout(getRandomQuizVerb, 1500); }}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">✓ Correcto</button>
                        <button onClick={() => { setQuizScore(p => ({ ...p, total: p.total + 1 })); setTimeout(getRandomQuizVerb, 1500); }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">✗ Incorrecto</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Practice Panel */}
              {activeVerb && !quizMode && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-4 border border-white/10 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white">🎤 Practicar pronunciación</h2>
                    <button onClick={() => { setActiveVerb(null); setFeedback(null); }} className="text-white/60 hover:text-white text-xl">✕</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className={`p-3 rounded-xl cursor-pointer transition-all ${currentWord === 'infinitive' ? 'bg-purple-500/30 border-2 border-purple-400' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                      onClick={() => setCurrentWord('infinitive')}>
                      <p className="text-purple-200 text-xs mb-1">Infinitivo</p>
                      <p className="text-xl font-bold text-white">{activeVerb.infinitive}</p>
                      <button onClick={(e) => { e.stopPropagation(); speak(activeVerb.infinitive); }}
                        className="mt-2 px-3 py-1 bg-blue-500/30 text-blue-200 rounded-lg text-xs hover:bg-blue-500/50">🔊 Escuchar</button>
                    </div>
                    <div className={`p-3 rounded-xl cursor-pointer transition-all ${currentWord === 'past' ? 'bg-purple-500/30 border-2 border-purple-400' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                      onClick={() => setCurrentWord('past')}>
                      <p className="text-purple-200 text-xs mb-1">Pasado Simple</p>
                      <p className="text-xl font-bold text-white">{activeVerb.pastSimple}</p>
                      <button onClick={(e) => { e.stopPropagation(); speak(activeVerb.pastSimple); }}
                        className="mt-2 px-3 py-1 bg-blue-500/30 text-blue-200 rounded-lg text-xs hover:bg-blue-500/50">🔊 Escuchar</button>
                    </div>
                    <div className={`p-3 rounded-xl cursor-pointer transition-all ${currentWord === 'participle' ? 'bg-purple-500/30 border-2 border-purple-400' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                      onClick={() => setCurrentWord('participle')}>
                      <p className="text-purple-200 text-xs mb-1">Pasado participio</p>
                      <p className="text-xl font-bold text-white">{pastParticiple(activeVerb)}</p>
                      <button onClick={(e) => { e.stopPropagation(); speak(pastParticiple(activeVerb)); }}
                        className="mt-2 px-3 py-1 bg-blue-500/30 text-blue-200 rounded-lg text-xs hover:bg-blue-500/50">🔊 Escuchar</button>
                    </div>
                  </div>
                  {showTranslations && <p className="text-purple-200 text-center text-sm mb-3">🇪🇸 {activeVerb.translation}</p>}
                  <div className="flex flex-col items-center gap-3">
                    <button onClick={startListening} disabled={isListening}
                      className={`px-6 py-3 rounded-full font-bold transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105'}`}>
                      {isListening ? '🎤 Escuchando...' : '🎤 Practicar pronunciación'}
                    </button>
                    {feedback && (
                      <div className={`w-full max-w-md p-3 rounded-xl text-center ${feedback === 'success' ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'}`}>
                        <p className={`text-sm ${feedback === 'success' ? 'text-green-200' : 'text-red-200'}`}>{feedbackMessage}</p>
                        {userTranscript && <p className="text-purple-200 text-xs mt-1">Escuché: "<span className="text-white">{userTranscript}</span>"</p>}
                      </div>
                    )}
                    {manualCheck && <div className="w-full rounded-xl border border-amber-200/20 bg-amber-400/10 p-3"><p className="text-xs leading-relaxed text-amber-100">La evaluación automática no está disponible ahora. Puedes reintentar o practicar por escrito; esta alternativa comprueba la forma escrita, no tu pronunciación.</p>{localPackAvailable && <button onClick={installLocalEnglishPack} disabled={installingLocalPack} className="mt-2 rounded-lg bg-sky-500/80 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{installingLocalPack ? 'Instalando paquete local…' : 'Instalar reconocimiento local en inglés'}</button>}{localPackMessage && <p className="mt-2 text-xs text-sky-100">{localPackMessage}</p>}<div className="mt-2 flex flex-col gap-2 sm:flex-row"><input value={manualAttempt} onChange={event => setManualAttempt(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') checkManualAttempt(); }} placeholder="Escribe lo que pronunciaste…" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-white/40" /><button onClick={checkManualAttempt} className="rounded-lg bg-amber-500/80 px-3 py-2 text-sm font-semibold text-white">Revisar escritura</button><button onClick={startListening} disabled={isListening} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-50">Reintentar micrófono</button></div></div>}
                    <button onClick={() => speak(currentWord === 'infinitive' ? activeVerb.infinitive : currentWord === 'past' ? activeVerb.pastSimple : pastParticiple(activeVerb))}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm">🔁 Repetir sonido</button>
                  </div>
                </div>
              )}

              {/* Verb List */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className={`grid grid-cols-12 gap-1 md:gap-2 p-3 border-b border-white/10 text-xs font-medium ${
                  verbType === 'regular' ? 'bg-purple-500/20 text-purple-200' : 'bg-orange-500/20 text-orange-200'
                }`}>
                  <div className="col-span-1">#</div>
                  <div className="col-span-2">Infinitivo</div>
                  <div className="col-span-2">Pasado</div>
                  <div className="col-span-2">Participio</div>
                  {showTranslations && <div className="col-span-3 hidden sm:block">Traducción</div>}
                  <div className={`${showTranslations ? 'col-span-2' : 'col-span-5'} text-center`}>🔊</div>
                </div>
                {paginatedVerbs.map((verb, index) => (
                  <div key={`${verbType}-${verb.id}-${index}`}
                    className={`grid grid-cols-12 gap-1 md:gap-2 p-3 border-b border-white/5 transition-all hover:bg-white/5 ${
                      activeVerb?.id === verb.id ? (verbType === 'regular' ? 'bg-purple-500/20' : 'bg-orange-500/20') : ''
                    }`}>
                    <div className="col-span-1 text-purple-300 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</div>
                    <div className="col-span-2">
                      <button onClick={() => speak(verb.infinitive)} className="text-white font-medium hover:text-purple-300 text-xs sm:text-sm text-left truncate block w-full">
                        {verb.infinitive}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <button onClick={() => speak(verb.pastSimple)}
                        className={`font-medium text-xs sm:text-sm text-left truncate block w-full ${verbType === 'irregular' ? 'text-orange-200 hover:text-orange-300' : 'text-white hover:text-purple-300'}`}>
                        {verb.pastSimple}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <button onClick={() => speak(pastParticiple(verb))} className="text-emerald-200 hover:text-emerald-100 text-xs sm:text-sm text-left truncate block w-full">
                        {pastParticiple(verb)}
                      </button>
                    </div>
                    {showTranslations && <div className="col-span-3 text-purple-200 text-xs hidden sm:block truncate">{verb.translation}</div>}
                    <div className={`${showTranslations ? 'col-span-2' : 'col-span-5'} flex items-center justify-center gap-1`}>
                      <button onClick={() => speak(verb.infinitive)} className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 text-xs" title="Infinitivo">🔊</button>
                      <button onClick={() => speak(verb.pastSimple)} className="p-1.5 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/40 text-xs" title="Pasado">🔊</button>
                      <button onClick={() => speak(pastParticiple(verb))} className="hidden sm:block p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/40 text-xs" title="Pasado participio">🔊</button>
                      <button onClick={() => { setActiveVerb(verb); setCurrentWord('infinitive'); setFeedback(null); }}
                        className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/40 text-xs" title="Practicar">🎤</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 text-sm">←</button>
                  <span className="text-purple-200 text-sm px-2">{currentPage}/{totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 text-sm">→</button>
                </div>
              )}

              {/* Stats */}
              <div className="mt-4 text-center text-purple-300 text-xs">
                <p>Total: <span className="text-white font-bold">{currentVerbList.length}</span> verbos | Mostrando: {filteredVerbs.length}</p>
              </div>
            </>
          )}

          {/* DIALOGUES SECTION */}
          {appSection === 'dialogues' && (
            <>
              {/* Dialogue List / Detail Toggle */}
              {selectedDialogue === null ? (
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-2">💬 Diálogos para Practicar</h2>
                    <p className="text-purple-200 text-sm">Escucha, repite y practica tu pronunciación con diálogos reales en inglés.</p>
                  </div>

                  {dialogues.map((dialogue) => (
                    <div key={dialogue.id}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => setSelectedDialogue(dialogue.id)}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">💬</span>
                            <h3 className="text-lg font-bold text-white">{dialogue.titleEs}</h3>
                          </div>
                          <p className="text-purple-300 text-sm mb-2">{dialogue.title}</p>
                          <p className="text-purple-200 text-sm">{dialogue.descriptionEs}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-xs font-medium border border-yellow-400/30">
                              Nivel {dialogue.level}
                            </span>
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs font-medium border border-blue-400/30">
                              ⏱ {dialogue.duration}
                            </span>
                          </div>
                          <span className="px-3 py-1.5 bg-purple-500/30 text-purple-200 rounded-lg text-xs border border-purple-400/30">
                            {dialogue.lines.length} líneas
                          </span>
                          <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:scale-105 transition-all">
                            ▶ Iniciar Diálogo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Info */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-2">💡 Cómo practicar con diálogos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-purple-200">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white font-medium mb-1">🔊 Escuchar</p>
                        <p>Presiona 🔊 en cada línea para escuchar la pronunciación correcta.</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white font-medium mb-1">🎤 Practicar</p>
                        <p>Presiona 🎤 para repetir la línea y que el sistema evalúe tu pronunciación.</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white font-medium mb-1">▶ Reproducir todo</p>
                        <p>Escucha el diálogo completo con resaltado automático de cada línea.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => { setSelectedDialogue(null); window.speechSynthesis.cancel(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all text-sm"
                  >
                    ← Volver a diálogos
                  </button>
                  <Suspense fallback={<div className="rounded-xl bg-white/5 p-6 text-center text-purple-100">Cargando diálogo…</div>}>
                    <DialogueView dialogue={dialogues.find(d => d.id === selectedDialogue)!} />
                  </Suspense>
                </div>
              )}
            </>
          )}

          {/* DICTIONARY SECTION */}
          {appSection === 'dictionary' && (
            <Suspense fallback={<div className="rounded-xl bg-white/5 p-6 text-center text-purple-100">Cargando diccionario…</div>}>
              <DictionaryView />
            </Suspense>
          )}

          {appSection === 'phrasal' && <Suspense fallback={<div className="rounded-xl bg-white/5 p-6 text-center text-purple-100">Cargando verbos frasales…</div>}><PhrasalVerbsView /></Suspense>}
          {appSection === 'listening' && <Suspense fallback={<div className="rounded-xl bg-white/5 p-6 text-center text-purple-100">Cargando historias…</div>}><ListeningView /></Suspense>}
          {appSection === 'teacher' && <Suspense fallback={<div className="rounded-xl bg-white/5 p-6 text-center text-purple-100">Cargando profesor virtual…</div>}><VirtualTeacherView /></Suspense>}

          {/* General Info */}
          {appSection === 'verbs' && (
            <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
              <h3 className="text-base font-bold text-white mb-3">💡 Cómo usar esta herramienta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-purple-200">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white font-medium mb-1">🔊 Escuchar</p>
                  <p>Haz clic en cualquier verbo para escuchar su pronunciación. Ajusta la velocidad con el control.</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white font-medium mb-1">🎤 Practicar</p>
                  <p>Presiona 🎤 en un verbo y habla. El sistema evaluará tu pronunciación.</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white font-medium mb-1">🎯 Quiz</p>
                  <p>Modo Quiz para practicar de forma aleatoria y evaluar tu conocimiento.</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                <p className="text-yellow-200 text-xs">⚠️ <strong>Nota:</strong> Usa Google Chrome para mejor experiencia. Permite el acceso al micrófono.</p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-3 border-t border-white/10 text-center text-purple-300 text-xs px-4">
          <p>📚 Inglés Americano Aprendizaje</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
