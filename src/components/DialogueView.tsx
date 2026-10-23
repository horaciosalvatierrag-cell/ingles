import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialogue, DialogueLine } from '../data/dialogues';

interface DialogueViewProps {
  dialogue: Dialogue;
  speechRate: number;
}

function DialogueView({ dialogue, speechRate }: DialogueViewProps) {
  const [activeLine, setActiveLine] = useState<DialogueLine | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAtIndex, setPausedAtIndex] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  const dialogueContainerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef<boolean>(false);
  const timeoutRef = useRef<any>(null);
  const currentIndexRef = useRef<number>(0);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Text-to-Speech
  const speak = useCallback((text: string, lineId: number) => {
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

      utterance.onstart = () => {
        setCurrentPlayingId(lineId);
        setHighlightedLine(lineId);
      };
      utterance.onend = () => {
        setCurrentPlayingId(null);
        setHighlightedLine(null);
      };
      utterance.onerror = () => {
        setCurrentPlayingId(null);
        setHighlightedLine(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [speechRate]);

  // Play entire dialogue from a specific index
  const playDialogueFromIndex = useCallback((startIndex: number = 0) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Set playing flag
      isPlayingRef.current = true;
      setIsPaused(false);
      
      const lines = dialogue.lines.filter(l => l.speaker !== 'narrator');
      
      currentIndexRef.current = startIndex;
      
      const speakNext = () => {
        // Check if playback was stopped
        if (!isPlayingRef.current) {
          setCurrentPlayingId(null);
          setHighlightedLine(null);
          return;
        }
        
        if (currentIndexRef.current >= lines.length) {
          setCurrentPlayingId(null);
          setHighlightedLine(null);
          isPlayingRef.current = false;
          setIsPaused(false);
          return;
        }

        const line = lines[currentIndexRef.current];
        const utterance = new SpeechSynthesisUtterance(line.text);
        utterance.lang = 'en-US';
        utterance.rate = speechRate;

        const voices = window.speechSynthesis.getVoices();
        // Priorizar voces americanas (en-US)
        const englishVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Female'))
          || voices.find(v => v.lang === 'en-US')
          || voices.find(v => v.lang.startsWith('en-US'))
          || voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;

        utterance.onstart = () => {
          setHighlightedLine(line.id);
          // Scroll to the current line
          const element = document.getElementById(`line-${line.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };

        utterance.onend = () => {
          currentIndexRef.current++;
          // Store timeout ID so we can clear it if needed
          timeoutRef.current = setTimeout(speakNext, 500);
        };

        utterance.onerror = () => {
          currentIndexRef.current++;
          // Store timeout ID so we can clear it if needed
          timeoutRef.current = setTimeout(speakNext, 500);
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNext();
    }
  }, [dialogue, speechRate]);

  // Play from beginning
  const playDialogue = useCallback(() => {
    playDialogueFromIndex(0);
  }, [playDialogueFromIndex]);

  const stopDialogue = () => {
    // Set flag to stop playback
    isPlayingRef.current = false;
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Cancel speech synthesis
    window.speechSynthesis.cancel();
    setCurrentPlayingId(null);
    setHighlightedLine(null);
    
    // Save current position and show pause state
    setPausedAtIndex(currentIndexRef.current);
    setIsPaused(true);
  };

  // Continue from where it was stopped
  const continueDialogue = () => {
    playDialogueFromIndex(pausedAtIndex);
  };

  // Restart from beginning
  const restartDialogue = () => {
    setPausedAtIndex(0);
    setIsPaused(false);
    playDialogueFromIndex(0);
  };

  // Levenshtein distance
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
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

  // Start practice mode for a specific line
  const startPractice = (line: DialogueLine) => {
    setActiveLine(line);
    setPracticeMode(true);
    setFeedback(null);
    setFeedbackMessage('');
    setUserTranscript('');
  };

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setFeedback('error');
      setFeedbackMessage('Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
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

      const targetText = activeLine?.text.toLowerCase() || '';
      const targetWords = targetText.split(/\s+/);

      // Check similarity
      const isCorrect = results.some((r: string) => {
        const normalized = r.replace(/[^a-z\s]/g, '').trim();
        const target = targetText.replace(/[^a-z\s]/g, '').trim();
        return normalized === target ||
          levenshteinDistance(normalized, target) <= Math.max(2, Math.floor(target.length * 0.1));
      });

      // Check word-by-word match for partial credit
      const matchWords = results.some((r: string) => {
        const spokenWords = r.replace(/[^a-z\s]/g, '').trim().split(/\s+/);
        const matches = spokenWords.filter(sw =>
          targetWords.some(tw => levenshteinDistance(sw, tw) <= 1)
        );
        return matches.length >= targetWords.length * 0.7;
      });

      if (isCorrect) {
        setFeedback('success');
        setFeedbackMessage('¡Excelente! 🎉 Pronunciaste la frase correctamente.');
      } else if (matchWords) {
        setFeedback('success');
        setFeedbackMessage('¡Muy bien! 🎉 Captaste la mayoría de las palabras. Sigue practicando.');
      } else {
        setFeedback('error');
        setFeedbackMessage(`Escuché "${bestMatch}". Intenta decir la frase más claramente.`);
      }

      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'no-speech') {
        setFeedback('error');
        setFeedbackMessage('No detecté tu voz. Habla más fuerte.');
      } else if (event.error === 'not-allowed') {
        setFeedback('error');
        setFeedbackMessage('Permiso de micrófono denegado.');
      } else {
        setFeedback('error');
        setFeedbackMessage(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    setFeedback(null);
    setFeedbackMessage('');
    setUserTranscript('');

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [activeLine]);

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'technician': return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30';
      case 'customer': return 'from-green-500/20 to-emerald-500/20 border-green-400/30';
      case 'professor': return 'from-indigo-500/20 to-blue-500/20 border-indigo-400/30';
      case 'student': return 'from-amber-500/20 to-yellow-500/20 border-amber-400/30';
      case 'narrator': return 'from-purple-500/20 to-pink-500/20 border-purple-400/30';
      default: return 'from-gray-500/20 to-gray-500/20 border-gray-400/30';
    }
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'technician': return '👨‍💻';
      case 'customer': return '👩';
      case 'professor': return '👨‍🏫';
      case 'student': return '👩‍🎓';
      case 'narrator': return '📖';
      default: return '💬';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dialogue Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">{dialogue.titleEs}</h2>
            <p className="text-purple-200 text-sm">{dialogue.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-sm font-medium border border-yellow-400/30">
              Nivel {dialogue.level}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm font-medium border border-blue-400/30">
              ⏱ {dialogue.duration}
            </span>
          </div>
        </div>

        <p className="text-purple-200 text-sm mb-4">{dialogue.descriptionEs}</p>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {!isPaused ? (
            <>
              <button
                onClick={playDialogue}
                className="px-4 py-2 bg-green-500/30 text-green-200 rounded-lg hover:bg-green-500/50 transition-all text-sm font-medium border border-green-400/30"
              >
                ▶ Reproducir todo
              </button>
              <button
                onClick={stopDialogue}
                className="px-4 py-2 bg-red-500/30 text-red-200 rounded-lg hover:bg-red-500/50 transition-all text-sm font-medium border border-red-400/30"
              >
                ⏹ Detener
              </button>
            </>
          ) : (
            <>
              <button
                onClick={continueDialogue}
                className="px-4 py-2 bg-blue-500/30 text-blue-200 rounded-lg hover:bg-blue-500/50 transition-all text-sm font-medium border border-blue-400/30"
              >
                ▶️ Continuar
              </button>
              <button
                onClick={restartDialogue}
                className="px-4 py-2 bg-yellow-500/30 text-yellow-200 rounded-lg hover:bg-yellow-500/50 transition-all text-sm font-medium border border-yellow-400/30"
              >
                🔄 Reiniciar
              </button>
            </>
          )}
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              showTranslations
                ? 'bg-purple-500/30 text-purple-200 border-purple-400/30'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
          >
            {showTranslations ? '🇪🇸 Traducciones ON' : '🙈 Traducciones OFF'}
          </button>
          <button
            onClick={() => { setPracticeMode(false); setActiveLine(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              practiceMode
                ? 'bg-orange-500/30 text-orange-200 border-orange-400/30'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
          >
            🎤 Modo Práctica {practiceMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Paused indicator */}
        {isPaused && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-xl animate-fade-in">
            <p className="text-yellow-200 text-sm text-center">
              ⏸️ Diálogo pausado en la línea <span className="font-bold text-white">{pausedAtIndex + 1}</span> de{' '}
              <span className="font-bold text-white">{dialogue.lines.filter(l => l.speaker !== 'narrator').length}</span>
            </p>
          </div>
        )}
      </div>

      {/* Practice Panel */}
      {practiceMode && activeLine && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-orange-400/30 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">🎤 Practica esta línea</h3>
            <button onClick={() => { setPracticeMode(false); setActiveLine(null); setFeedback(null); }} className="text-white/60 hover:text-white text-xl">✕</button>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-xs text-purple-300 mb-1">{activeLine.speakerName}:</p>
            <p className="text-white text-lg font-medium">"{activeLine.text}"</p>
            {showTranslations && <p className="text-purple-200 text-sm mt-2">🇪🇸 {activeLine.translation}</p>}
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => speak(activeLine.text, activeLine.id)}
              className="px-4 py-2 bg-blue-500/30 text-blue-200 rounded-lg hover:bg-blue-500/50 transition-all text-sm"
            >
              🔊 Escuchar modelo
            </button>
            
            <button
              onClick={startListening}
              disabled={isListening}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105'
              }`}
            >
              {isListening ? '🎤 Escuchando...' : '🎤 Hablar ahora'}
            </button>

            {feedback && (
              <div className={`w-full p-3 rounded-xl text-center ${
                feedback === 'success' ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'
              }`}>
                <p className={`font-medium text-sm ${feedback === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                  {feedbackMessage}
                </p>
                {userTranscript && (
                  <p className="text-purple-200 text-xs mt-1">
                    Escuché: "<span className="text-white">{userTranscript}</span>"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogue Content */}
      <div ref={dialogueContainerRef} className="space-y-3">
        {dialogue.lines.map((line) => (
          <div
            key={line.id}
            id={`line-${line.id}`}
            className={`bg-gradient-to-r ${getSpeakerColor(line.speaker)} backdrop-blur-sm rounded-xl p-3 md:p-4 border transition-all ${
              highlightedLine === line.id ? 'ring-2 ring-yellow-400 scale-[1.01]' : ''
            } ${practiceMode ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
            onClick={() => practiceMode && line.speaker !== 'narrator' && startPractice(line)}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{getSpeakerIcon(line.speaker)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-300 font-medium mb-1">{line.speakerName}</p>
                <p className={`font-medium ${
                  line.speaker === 'narrator' ? 'text-purple-200 italic text-sm' : 'text-white'
                }`}>
                  {line.speaker === 'narrator' ? `[${line.text}]` : `"${line.text}"`}
                </p>
                {showTranslations && (
                  <p className="text-purple-300 text-xs mt-1">🇪🇸 {line.translation}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); speak(line.text, line.id); }}
                  className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-all text-xs"
                  title="Escuchar"
                >
                  🔊
                </button>
                {line.speaker !== 'narrator' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startPractice(line); }}
                    className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/40 transition-all text-xs"
                    title="Practicar"
                  >
                    🎤
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogue Footer */}
      <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
        <p className="text-purple-300 text-sm">
          📝 Total de líneas: <span className="text-white font-bold">{dialogue.lines.length}</span> | 
          {' '}Duración estimada: <span className="text-white font-bold">{dialogue.duration}</span> | 
          {' '}Nivel: <span className="text-white font-bold">{dialogue.level}</span>
        </p>
      </div>
    </div>
  );
}

export default DialogueView;
