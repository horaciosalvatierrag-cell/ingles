import { useState, useRef, useCallback, useEffect } from 'react';
import { regularVerbs, RegularVerb } from './data/regularVerbs';
import { irregularVerbs, IrregularVerb } from './data/irregularVerbs';

type VerbType = 'regular' | 'irregular';
type PracticeMode = 'listen' | 'speak';
type FeedbackType = 'success' | 'error' | 'neutral' | null;
type Verb = RegularVerb | IrregularVerb;

function App() {
  const [verbType, setVerbType] = useState<VerbType>('regular');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeVerb, setActiveVerb] = useState<Verb | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('listen');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [currentWord, setCurrentWord] = useState<'infinitive' | 'past'>('infinitive');
  const [speechRate, setSpeechRate] = useState(0.8);
  const [showTranslations, setShowTranslations] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [quizVerb, setQuizVerb] = useState<Verb | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const recognitionRef = useRef<any>(null);
  const itemsPerPage = 20;

  // Get current verb list
  const currentVerbList = verbType === 'regular' ? regularVerbs : irregularVerbs;

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

  // Text-to-Speech function
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, [speechRate]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Levenshtein distance for fuzzy matching
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Speech Recognition function
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setFeedback('error');
      setFeedbackMessage('Tu navegador no soporta reconocimiento de voz. Usa Chrome para mejor experiencia.');
      return;
    }

    const recognition = recognitionRef.current;

    recognition.onresult = (event: any) => {
      const results = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(event.results[0][i].transcript.toLowerCase().trim());
      }

      const bestMatch = results[0];
      setUserTranscript(bestMatch);

      let targetWord = '';
      if (activeVerb) {
        targetWord = currentWord === 'infinitive' ? activeVerb.infinitive : activeVerb.pastSimple;
      } else if (quizVerb) {
        targetWord = quizVerb.pastSimple;
      }

      // Handle special cases like "was/were"
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
        setFeedbackMessage(`No pude entender bien. Intenta decir "${targetWord}" de nuevo, más despacio.`);
      }

      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'no-speech') {
        setFeedback('error');
        setFeedbackMessage('No detecté tu voz. Habla más fuerte o acércate al micrófono.');
      } else if (event.error === 'not-allowed') {
        setFeedback('error');
        setFeedbackMessage('Permiso de micrófono denegado. Permite el acceso al micrófono en tu navegador.');
      } else {
        setFeedback('error');
        setFeedbackMessage(`Error: ${event.error}. Intenta de nuevo.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setIsListening(true);
    setFeedback(null);
    setFeedbackMessage('');
    setUserTranscript('');

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setFeedback('error');
      setFeedbackMessage('Error al iniciar el micrófono. Intenta de nuevo.');
    }
  }, [activeVerb, currentWord, quizVerb]);

  // Filter verbs
  const filteredVerbs = currentVerbList.filter(verb =>
    verb.infinitive.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verb.pastSimple.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verb.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredVerbs.length / itemsPerPage);
  const paginatedVerbs = filteredVerbs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Start quiz mode
  const startQuiz = () => {
    setQuizMode(true);
    setQuizScore({ correct: 0, total: 0 });
    getRandomQuizVerb();
  };

  const getRandomQuizVerb = () => {
    const randomIndex = Math.floor(Math.random() * currentVerbList.length);
    setQuizVerb(currentVerbList[randomIndex]);
    setFeedback(null);
    setFeedbackMessage('');
    setUserTranscript('');
  };

  const handleQuizResult = (correct: boolean) => {
    setQuizScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
    setTimeout(() => {
      getRandomQuizVerb();
    }, 2000);
  };

  // Switch verb type
  const switchVerbType = (type: VerbType) => {
    setVerbType(type);
    setSearchTerm('');
    setCurrentPage(1);
    setActiveVerb(null);
    setQuizMode(false);
    setFeedback(null);
    setFeedbackMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Verbos en Inglés</h1>
                <p className="text-purple-200 text-sm">Pronunciación y práctica interactiva</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setQuizMode(!quizMode)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  quizMode
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                🎯 Quiz
              </button>
            </div>
          </div>

          {/* Verb Type Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => switchVerbType('regular')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                verbType === 'regular'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ✅ Regulares ({regularVerbs.length})
            </button>
            <button
              onClick={() => switchVerbType('irregular')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                verbType === 'irregular'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ⚡ Irregulares ({irregularVerbs.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Verb type indicator */}
        <div className={`mb-4 p-3 rounded-xl border ${
          verbType === 'regular' 
            ? 'bg-purple-500/10 border-purple-400/30' 
            : 'bg-orange-500/10 border-orange-400/30'
        }`}>
          <p className={`text-center font-medium ${
            verbType === 'regular' ? 'text-purple-200' : 'text-orange-200'
          }`}>
            {verbType === 'regular' 
              ? '✅ Verbos Regulares — El pasado se forma añadiendo "-ed" al infinitivo'
              : '⚡ Verbos Irregulares — El pasado tiene formas únicas que hay que memorizar'
            }
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/10">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Buscar verbo..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">🐢</span>
              <input
                type="range"
                min="0.3"
                max="1.2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-24 accent-purple-400"
              />
              <span className="text-white text-sm">🐇</span>
              <span className="text-purple-200 text-xs ml-1">{speechRate}x</span>
            </div>

            {/* Toggle translations */}
            <button
              onClick={() => setShowTranslations(!showTranslations)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                showTranslations
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {showTranslations ? '🇪🇸 Traducciones' : '🙈 Ocultas'}
            </button>
          </div>
        </div>

        {/* Quiz Mode */}
        {quizMode && quizVerb && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-green-400/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                🎯 Quiz - {verbType === 'regular' ? 'Regulares' : 'Irregulares'}
              </h2>
              <div className="text-green-200 font-medium">
                Puntuación: {quizScore.correct}/{quizScore.total}
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-purple-200 mb-2">Di en voz alta el pasado simple de:</p>
              <p className="text-4xl font-bold text-white mb-2">{quizVerb.infinitive}</p>
              {showTranslations && <p className="text-purple-300">({quizVerb.translation})</p>}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  setCurrentWord('past');
                  setActiveVerb(quizVerb);
                  startListening();
                }}
                disabled={isListening}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/30'
                }`}
              >
                {isListening ? '🎤 Escuchando...' : '🎤 Hablar'}
              </button>

              <button
                onClick={() => speak(quizVerb.pastSimple)}
                className="px-6 py-3 bg-blue-500/30 text-white rounded-xl hover:bg-blue-500/50 transition-all"
              >
                🔊 Escuchar respuesta
              </button>

              {feedback && (
                <div className={`mt-4 p-4 rounded-xl w-full max-w-md ${
                  feedback === 'success' ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'
                }`}>
                  <p className={`text-center font-medium ${feedback === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                    {feedbackMessage}
                  </p>
                  {userTranscript && (
                    <p className="text-center text-purple-200 text-sm mt-1">
                      Escuché: "{userTranscript}"
                    </p>
                  )}
                </div>
              )}

              {feedback === 'success' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleQuizResult(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg">
                    ✓ Correcto
                  </button>
                  <button onClick={() => handleQuizResult(false)} className="px-4 py-2 bg-red-500 text-white rounded-lg">
                    ✗ Incorrecto
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Practice Panel */}
        {activeVerb && !quizMode && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Practicar pronunciación — {verbType === 'regular' ? 'Regular' : 'Irregular'}
              </h2>
              <button
                onClick={() => { setActiveVerb(null); setFeedback(null); }}
                className="text-white/60 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Infinitive */}
              <div
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  currentWord === 'infinitive'
                    ? 'bg-purple-500/30 border-2 border-purple-400'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                }`}
                onClick={() => setCurrentWord('infinitive')}
              >
                <p className="text-purple-200 text-sm mb-1">Infinitivo</p>
                <p className="text-2xl font-bold text-white">{activeVerb.infinitive}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(activeVerb.infinitive); }}
                  className="mt-2 px-3 py-1 bg-blue-500/30 text-blue-200 rounded-lg text-sm hover:bg-blue-500/50 transition-all"
                >
                  🔊 Escuchar
                </button>
              </div>

              {/* Past Simple */}
              <div
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  currentWord === 'past'
                    ? 'bg-purple-500/30 border-2 border-purple-400'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                }`}
                onClick={() => setCurrentWord('past')}
              >
                <p className="text-purple-200 text-sm mb-1">Pasado Simple</p>
                <p className="text-2xl font-bold text-white">{activeVerb.pastSimple}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(activeVerb.pastSimple); }}
                  className="mt-2 px-3 py-1 bg-blue-500/30 text-blue-200 rounded-lg text-sm hover:bg-blue-500/50 transition-all"
                >
                  🔊 Escuchar
                </button>
              </div>
            </div>

            {showTranslations && (
              <p className="text-purple-200 text-center mb-4">
                🇪🇸 {activeVerb.translation}
              </p>
            )}

            {/* Speak button */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-purple-200 text-sm">
                Selecciona la palabra (infinitivo o pasado) y presiona el micrófono:
              </p>
              <button
                onClick={startListening}
                disabled={isListening}
                className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                }`}
              >
                {isListening ? '🎤 Escuchando... (habla ahora)' : '🎤 Practicar pronunciación'}
              </button>

              {/* Feedback */}
              {feedback && (
                <div className={`w-full max-w-md p-4 rounded-xl text-center ${
                  feedback === 'success'
                    ? 'bg-green-500/20 border border-green-400/50'
                    : feedback === 'error'
                      ? 'bg-red-500/20 border border-red-400/50'
                      : 'bg-blue-500/20 border border-blue-400/50'
                }`}>
                  <p className={`font-medium ${
                    feedback === 'success' ? 'text-green-200' :
                      feedback === 'error' ? 'text-red-200' : 'text-blue-200'
                  }`}>
                    {feedbackMessage}
                  </p>
                  {userTranscript && (
                    <p className="text-purple-200 text-sm mt-2">
                      Lo que escuché: "<span className="text-white font-medium">{userTranscript}</span>"
                    </p>
                  )}
                </div>
              )}

              {/* Repeat button */}
              <button
                onClick={() => speak(currentWord === 'infinitive' ? activeVerb.infinitive : activeVerb.pastSimple)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all text-sm"
              >
                🔁 Repetir sonido
              </button>
            </div>
          </div>
        )}

        {/* Verb List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {/* Table header */}
          <div className={`grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-sm font-medium ${
            verbType === 'regular' ? 'bg-purple-500/20 text-purple-200' : 'bg-orange-500/20 text-orange-200'
          }`}>
            <div className="col-span-1">#</div>
            <div className="col-span-3">Infinitivo</div>
            <div className="col-span-3">Pasado Simple</div>
            {showTranslations && <div className="col-span-3">Traducción</div>}
            <div className={`${showTranslations ? 'col-span-2' : 'col-span-5'} text-center`}>Acciones</div>
          </div>

          {/* Verb rows */}
          {paginatedVerbs.map((verb, index) => (
            <div
              key={`${verbType}-${verb.id}-${index}`}
              className={`grid grid-cols-12 gap-2 p-4 border-b border-white/5 transition-all hover:bg-white/5 ${
                activeVerb?.id === verb.id ? (verbType === 'regular' ? 'bg-purple-500/20' : 'bg-orange-500/20') : ''
              }`}
            >
              <div className="col-span-1 text-purple-300 text-sm">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </div>
              <div className="col-span-3">
                <button
                  onClick={() => speak(verb.infinitive)}
                  className="text-white font-medium hover:text-purple-300 transition-colors text-left"
                >
                  {verb.infinitive}
                </button>
              </div>
              <div className="col-span-3">
                <button
                  onClick={() => speak(verb.pastSimple)}
                  className={`font-medium transition-colors text-left ${
                    verbType === 'irregular' ? 'text-orange-200 hover:text-orange-300' : 'text-white hover:text-purple-300'
                  }`}
                >
                  {verb.pastSimple}
                </button>
              </div>
              {showTranslations && (
                <div className="col-span-3 text-purple-200">
                  {verb.translation}
                </div>
              )}
              <div className={`${showTranslations ? 'col-span-2' : 'col-span-5'} flex items-center justify-center gap-1`}>
                <button
                  onClick={() => speak(verb.infinitive)}
                  className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-all text-xs"
                  title="Escuchar infinitivo"
                >
                  🔊
                </button>
                <button
                  onClick={() => speak(verb.pastSimple)}
                  className="p-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/40 transition-all text-xs"
                  title="Escuchar pasado"
                >
                  🔊
                </button>
                <button
                  onClick={() => {
                    setActiveVerb(verb);
                    setCurrentWord('infinitive');
                    setFeedback(null);
                  }}
                  className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/40 transition-all text-xs"
                  title="Practicar pronunciación"
                >
                  🎤
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 transition-all"
            >
              ← Anterior
            </button>
            <span className="text-purple-200 px-4">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 transition-all"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Info section */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3">💡 Cómo usar esta herramienta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-200">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white font-medium mb-2">🔊 Escuchar</p>
              <p>Haz clic en cualquier verbo o en el botón 🔊 para escuchar la pronunciación correcta. Ajusta la velocidad con el control deslizante.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white font-medium mb-2">🎤 Practicar</p>
              <p>Presiona el botón 🎤 en un verbo para abrir el panel de práctica. Selecciona si quieres practicar el infinitivo o el pasado, y habla.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white font-medium mb-2">🎯 Quiz</p>
              <p>Activa el modo Quiz para practicar de forma aleatoria. El sistema te dará un verbo y tendrás que decir su pasado simple.</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
            <p className="text-yellow-200 text-sm">
              ⚠️ <strong>Nota:</strong> El reconocimiento de voz funciona mejor en Google Chrome. Asegúrate de permitir el acceso al micrófono cuando el navegador lo solicite. Habla claro y cerca del micrófono para mejores resultados.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 text-center text-purple-300 text-sm">
          <p>Total de verbos {verbType === 'regular' ? 'regulares' : 'irregulares'}: <span className="text-white font-bold">{currentVerbList.length}</span></p>
          <p className="mt-1">Mostrando: {filteredVerbs.length} verbos</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-white/10 text-center text-purple-300 text-sm">
        <p>📚 Verbos en Inglés - Herramienta de pronunciación interactiva</p>
        <p className="mt-1 text-purple-400">Regulares: {regularVerbs.length} | Irregulares: {irregularVerbs.length} | Total: {regularVerbs.length + irregularVerbs.length}</p>
      </footer>
    </div>
  );
}

export default App;
