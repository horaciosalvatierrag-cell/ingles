import { useState, useMemo, useRef, useEffect } from 'react';
import { dictionaryWords } from '../data/dictionary';
import { configureEnglishUtterance } from '../lib/speechAccent';
import { webSearchUrl } from '../lib/webSearch';

function DictionaryView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const itemsPerPage = 30;

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(dictionaryWords.map(w => w.category || 'other'));
    return Array.from(cats).sort();
  }, []);

  // Filtrar palabras
  const filteredWords = useMemo(() => {
    return dictionaryWords.filter(word => {
      const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           word.meaning.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Paginación
  const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Función de pronunciación
  const speak = (text: string, wordId: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      configureEnglishUtterance(utterance);
      utterance.rate = 0.8;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(wordId);
      utterance.onend = () => setIsSpeaking(null);
      utterance.onerror = () => setIsSpeaking(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Cargar voces
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Resetear página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'noun': return '📦';
      case 'verb': return '🏃';
      case 'adjective': return '🎨';
      case 'adverb': return '⚡';
      case 'preposition': return '📍';
      case 'conjunction': return '🔗';
      case 'pronoun': return '👤';
      case 'interjection': return '💬';
      default: return '📝';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'noun': return 'Sustantivo';
      case 'verb': return 'Verbo';
      case 'adjective': return 'Adjetivo';
      case 'adverb': return 'Adverbio';
      case 'preposition': return 'Preposición';
      case 'conjunction': return 'Conjunción';
      case 'pronoun': return 'Pronombre';
      case 'interjection': return 'Interjección';
      default: return 'Otro';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">📖 Diccionario Inglés-Español</h2>
        <p className="text-purple-200 text-sm mb-4">
          {dictionaryWords.length} palabras con pronunciación en inglés americano
        </p>

        {/* Search Box */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="🔍 Buscar palabra en inglés o español..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            📚 Todas ({dictionaryWords.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {getCategoryIcon(cat)} {getCategoryName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
        <p className="text-purple-200 text-sm">
          Mostrando <span className="text-white font-bold">{filteredWords.length}</span> palabras
          {searchTerm && <span> para "<span className="text-purple-300">{searchTerm}</span>"</span>}
        </p>
      </div>

      {/* Dictionary List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {paginatedWords.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-purple-200 text-lg">No se encontraron palabras</p>
            <p className="text-purple-300 text-sm mt-2">Intenta con otro término de búsqueda</p>
            {searchTerm.trim() && <a href={webSearchUrl(`${searchTerm} English meaning`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Buscar en Internet ↗</a>}
          </div>
        ) : (
          paginatedWords.map((word, index) => (
            <div
              key={word.id}
              className={`p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-all ${
                (currentPage - 1) * itemsPerPage + index + 1 === 1 ? 'border-t-0' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-purple-300">
                      {(currentPage - 1) * itemsPerPage + index + 1}.
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      {word.word}
                    </h3>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs">
                      {getCategoryIcon(word.category || '')} {getCategoryName(word.category || '')}
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm md:text-base">
                    {word.meaning}
                  </p>
                </div>
                <button
                  onClick={() => speak(word.word, word.id)}
                  disabled={isSpeaking === word.id}
                  className={`flex-shrink-0 p-3 rounded-xl transition-all ${
                    isSpeaking === word.id
                      ? 'bg-green-500/30 text-green-200 animate-pulse'
                      : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/40'
                  }`}
                  title="Escuchar pronunciación"
                >
                  {isSpeaking === word.id ? '🔊' : '🔊'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 text-sm"
          >
            ⟪ Primera
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 text-sm"
          >
            ← Anterior
          </button>
          <span className="text-purple-200 text-sm px-2">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 text-sm"
          >
            Siguiente →
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 text-sm"
          >
            Última ⟫
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-white font-bold text-sm mb-2">💡 Cómo usar el diccionario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-purple-200">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-white font-medium mb-1">🔍 Buscar</p>
            <p>Escribe en inglés o español para encontrar palabras rápidamente.</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-white font-medium mb-1">📂 Filtrar</p>
            <p>Usa los botones de categoría para ver solo sustantivos, verbos, etc.</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-white font-medium mb-1">🔊 Escuchar</p>
            <p>Haz clic en el icono de sonido para escuchar la pronunciación americana.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DictionaryView;
