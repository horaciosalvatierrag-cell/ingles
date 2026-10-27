import { useMemo, useState } from 'react';

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
type Correction = { before: string; after: string; reason: string; example: string };

const topics: Record<Level, string[]> = {
  A1: [
    'My name and where I live', 'My family', 'My daily routine', 'My home and bedroom', 'Food I like',
    'My favorite drink', 'My school or workplace', 'My best friend', 'My pets', 'My neighborhood',
    'My hobbies', 'My favorite day of the week', 'What I do in the morning', 'My clothes', 'The weather today',
    'My favorite color', 'A simple meal I can make', 'Things in my bag', 'My favorite room', 'A person I admire',
    'My weekend plans', 'My favorite animal', 'How I get to work or school', 'What I do after work', 'A place I visit often',
  ],
  A2: [
    'A memorable weekend', 'A trip I enjoyed', 'My last birthday', 'A restaurant I recommend', 'My childhood home',
    'A hobby I would like to try', 'Shopping for a gift', 'A healthy habit', 'A movie I watched recently', 'My plans for next month',
    'A helpful person', 'A day when something went wrong', 'How my town has changed', 'My favorite celebration', 'A job I would like to do',
    'An important family tradition', 'A place tourists should visit', 'A book or story I enjoyed', 'How I stay organized', 'A new skill I learned',
    'A time I helped someone', 'My ideal weekend', 'A memorable meal', 'How I use my phone', 'An enjoyable day outdoors',
  ],
  B1: [
    'The advantages of learning English', 'A challenge I overcame', 'How technology affects my routine', 'A decision that changed my plans', 'A place I would recommend to a visitor',
    'The best way to learn a new skill', 'A memorable conversation', 'How I manage stress', 'A useful invention', 'A goal I am working toward',
    'Living in a city or a small town', 'A mistake that taught me something', 'How social media influences people', 'A person who inspires me', 'A custom from my culture',
    'A job that makes a difference', 'Ways to protect the environment', 'An experience with good customer service', 'How travel broadens people’s views', 'A film that made me think',
    'The value of teamwork', 'A change I would make at work or school', 'How habits shape success', 'A problem in my community', 'Advice I would give my younger self',
  ],
  B2: [
    'Should remote work become the norm?', 'How cities can reduce traffic', 'The benefits and risks of artificial intelligence', 'Why financial education matters', 'How advertising shapes our choices',
    'Should schools teach practical life skills?', 'The impact of tourism on local communities', 'How to balance privacy and convenience online', 'The role of failure in personal growth', 'Should public transport be free?',
    'How employers can support mental health', 'The value of learning languages', 'Should people reduce their use of plastic?', 'How news sources influence public opinion', 'The future of work and automation',
    'What makes a community inclusive?', 'Should cities invest more in parks?', 'The advantages and drawbacks of online education', 'How consumer habits affect the planet', 'The importance of critical thinking',
    'Should phones be limited in classrooms?', 'How to make workplaces more accessible', 'The influence of role models', 'Why cultural exchange benefits society', 'How governments should prepare for extreme weather',
  ],
  C1: [
    'When should personal data be considered public?', 'Can economic growth coexist with environmental limits?', 'How should societies regulate artificial intelligence?', 'Does convenience make people less independent?', 'The ethics of persuasive design',
    'How language influences the way people think', 'What responsibilities do global companies have?', 'Can education reduce social inequality?', 'The limits of individual responsibility in public health', 'How should cities adapt to an aging population?',
    'Is expertise valued appropriately in public debate?', 'The tension between free expression and harm', 'How can institutions rebuild public trust?', 'Does technological progress always improve quality of life?', 'The social cost of constant connectivity',
    'How should societies measure progress?', 'The case for and against a four-day work week', 'What makes a policy fair across generations?', 'How can cultural heritage evolve without being lost?', 'The role of uncertainty in decision-making',
    'Should essential services be run for profit?', 'How can journalism remain independent?', 'The consequences of algorithmic bias', 'What makes leadership accountable?', 'How can communities balance development and preservation?',
  ],
};

const levelNotes: Record<Level, string> = {
  A1: 'Escribe 3–5 oraciones con presente simple, be, pronombres y vocabulario cotidiano.',
  A2: 'Escribe 5–7 oraciones. Prueba pasado simple, futuro con going to y conectores básicos.',
  B1: 'Escribe un párrafo de 7–9 oraciones con razones, ejemplos y varios tiempos verbales.',
  B2: 'Desarrolla una postura con argumentos, contraste y conectores como although, whereas y therefore.',
  C1: 'Construye un texto preciso y coherente; matiza afirmaciones y combina estructuras complejas.',
};

const irregularPast: Record<string, string> = {
  went: 'go', came: 'come', saw: 'see', ate: 'eat', took: 'take', made: 'make', did: 'do', had: 'have',
  got: 'get', gave: 'give', wrote: 'write', spoke: 'speak', ran: 'run', bought: 'buy', brought: 'bring',
  thought: 'think', told: 'tell', found: 'find', knew: 'know', chose: 'choose', drank: 'drink', drove: 'drive',
};

const thirdPersonForms: Record<string, string> = {
  go: 'goes', do: 'does', have: 'has', watch: 'watches', study: 'studies', try: 'tries', carry: 'carries',
  work: 'works', like: 'likes', play: 'plays', need: 'needs', want: 'wants', eat: 'eats', live: 'lives', speak: 'speaks',
};
const baseForms: Record<string, string> = Object.fromEntries(Object.entries(thirdPersonForms).map(([base, form]) => [form, base]));

function revise(text: string): { corrected: string; corrections: Correction[] } {
  let corrected = text;
  const corrections: Correction[] = [];
  const apply = (pattern: RegExp, replacement: string | ((...matches: string[]) => string), reason: string, example: string) => {
    corrected = corrected.replace(pattern, (...matches: string[]) => {
      const before = matches[0];
      const after = typeof replacement === 'string' ? before.replace(pattern, replacement) : replacement(...matches);
      if (after.toLowerCase() !== before.toLowerCase() || after !== before) {
        corrections.push({ before, after, reason, example });
      }
      return after;
    });
  };

  apply(/\s{2,}/g, ' ', 'Hay espacios repetidos. Usa un solo espacio entre palabras.', 'I live in a small town.');
  apply(/\bi\b/g, 'I', 'El pronombre “I” siempre se escribe con mayúscula.', 'I study English every day.');
  apply(/(^|[.!?]\s+)([a-z])/g, (_full, start, letter) => `${start}${letter.toUpperCase()}`, 'Empieza cada oración con mayúscula.', 'My family lives nearby.');
  apply(/\b(i|you|we|they)\s+is\b/gi, (_full, subject) => `${subject} are`, '“Is” acompaña a he/she/it; con este sujeto se usa “are”.', 'They are at home.');
  apply(/\b(he|she|it)\s+are\b/gi, (_full, subject) => `${subject} is`, 'Con he/she/it, el verbo be en presente es “is”.', 'She is my friend.');
  apply(/\b(i)\s+am\s+agree\b/gi, 'I agree', '“Agree” es un verbo; no lleva “am” antes en presente simple.', 'I agree with your idea.');
  apply(/\b(i)\s+has\b/gi, 'I have', 'Con “I” se usa “have”, no “has”.', 'I have two sisters.');
  apply(/\b(you|we|they)\s+has\b/gi, (_full, subject) => `${subject} have`, 'Con you/we/they se usa “have”.', 'They have a new teacher.');
  apply(/\b(he|she|it)\s+have\b/gi, (_full, subject) => `${subject} has`, 'En presente simple, he/she/it lleva “has”.', 'He has a busy schedule.');
  apply(/\b(he|she|it)\s+(go|do|have|watch|study|try|carry|work|like|play|need|want|eat|live|speak)\b/gi, (_full, subject, verb) => `${subject} ${thirdPersonForms[verb.toLowerCase()]}`, 'En presente simple, he/she/it lleva -s o -es; algunos verbos cambian su forma.', 'She studies English every evening.');
  apply(/\b(i|you|we|they)\s+(goes|does|has|watches|studies|tries|carries|works|likes|plays|needs|wants|eats|lives|speaks)\b/gi, (_full, subject, verb) => `${subject} ${baseForms[verb.toLowerCase()]}`, 'Con I/you/we/they, el verbo en presente simple va en forma base, sin -s.', 'They live near the station.');
  apply(/\b(he|she|it)\s+don't\b/gi, (_full, subject) => `${subject} doesn't`, 'Con he/she/it, la negación en presente simple usa “doesn’t”.', 'She doesn’t work on Sundays.');
  apply(/\b(i|you|we|they)\s+doesn't\b/gi, (_full, subject) => `${subject} don't`, 'Con I/you/we/they, la negación usa “don’t”.', 'We don’t eat meat.');
  apply(/\b(doesn't|don't|didn't)\s+(likes|wants|needs|works|plays|goes|studies|watches|has|does)\b/gi, (_full, auxiliary, verb) => `${auxiliary} ${verb.replace(/s$/i, '').replace(/ies$/i, 'y').replace(/^has$/i, 'have').replace(/^does$/i, 'do')}`, 'Después de do/does/did en una negación va el verbo en forma base.', 'He doesn’t like coffee.');
  apply(/\b(did|didn't)\s+(went|came|saw|ate|took|made|did|had|got|gave|wrote|spoke|ran|bought|brought|thought|told|found|knew|chose|drank|drove)\b/gi, (_full, aux, verb) => `${aux} ${irregularPast[verb.toLowerCase()]}`, 'Después de did/didn’t se usa el verbo en forma base, no en pasado.', 'Did you go yesterday? / I didn’t go.');
  apply(/\b(a)\s+(hour|honest|apple|orange|egg|idea|office|answer|umbrella)\b/gi, 'an $2', 'Antes de un sonido vocálico se usa “an”.', 'She ate an apple.');
  apply(/\ban\s+(university|useful|European|uniform)\b/gi, 'a $1', '“A/an” depende del sonido inicial: aquí la “u” suena como “you”.', 'He studies at a university.');
  apply(/\bthere\s+is\s+(many|a few|several|two|three|four|five)\b/gi, 'there are $1', 'Con un sustantivo plural se usa “there are”.', 'There are many parks nearby.');
  apply(/\bmore\s+(better|easier|bigger|smaller|worse|faster)\b/gi, '$1', 'No combines “more” con un comparativo que ya termina en -er.', 'This route is better.');
  apply(/\bwill\s+to\s+([a-z]+)\b/gi, 'will $1', 'Después de “will” va el verbo base sin “to”.', 'I will call you tomorrow.');
  apply(/\b(am|is|are)\s+(work|study|play|eat|read|write|walk|learn|cook|travel|watch|run)\b/gi, '$1 $2ing', 'Para una acción en progreso, usa be + verbo terminado en -ing.', 'She is studying now.');
  apply(/\b(many|much)\s+informations?\b/gi, 'a lot of information', '“Information” es incontable y no suele tener plural en inglés.', 'I found a lot of information online.');
  apply(/\b(discuss)\s+about\b/gi, '$1', '“Discuss” lleva el tema directamente; no necesita “about”.', 'We discussed the plan.');
  apply(/\s+([,.!?])/g, '$1', 'No se deja un espacio antes de la puntuación.', 'I like music, and I play guitar.');
  apply(/([^.!?])\s*$/g, '$1.', 'Añade un punto final para cerrar la oración.', 'My brother lives in Canada.');

  return { corrected, corrections };
}

export default function GrammarView() {
  const [level, setLevel] = useState<Level>('A1');
  const [topic, setTopic] = useState(topics.A1[0]);
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof revise> | null>(null);
  const count = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  const changeLevel = (next: Level) => {
    setLevel(next);
    setTopic(topics[next][0]);
    setResult(null);
  };
  const randomTopic = () => {
    const choices = topics[level].filter((item) => item !== topic);
    setTopic(choices[Math.floor(Math.random() * choices.length)]);
    setText('');
    setResult(null);
  };
  const checkText = () => {
    if (text.trim()) setResult(revise(text.trim()));
  };

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-200">✍️ Escritura guiada · 125 temas</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Gramática inglés</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-purple-200">Escribe sobre un tema y revisa sugerencias claras para entender la regla, corregirla y volver a intentarlo.</p>
          </div>
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">Nivel {level}</span>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2" role="group" aria-label="Nivel de inglés">
          {(['A1', 'A2', 'B1', 'B2', 'C1'] as Level[]).map((item, index) => (
            <button key={item} onClick={() => changeLevel(item)} aria-pressed={level === item}
              className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${level === item ? 'border-blue-400 bg-blue-500 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'}`}>
              <span className="block">{item}</span><span className="hidden text-[10px] font-normal sm:block">{['Inicial', 'Básico', 'Intermedio', 'Avanzado', 'Dominio'][index]}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-purple-200">{levelNotes[level]}</p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label className="flex-1 text-sm font-medium text-white">
            Tema de escritura <span className="sr-only">(25 temas disponibles para cada nivel)</span>
            <select value={topic} onChange={(event) => { setTopic(event.target.value); setResult(null); }}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-400">
              {topics[level].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button onClick={randomTopic} className="self-end rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20">🎲 Tema aleatorio</button>
        </div>

        <div className="mt-5 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Tu consigna</p>
          <p className="mt-1 font-semibold text-white">Escribe en inglés sobre: {topic}</p>
          <p className="mt-1 text-sm text-purple-200">{levelNotes[level]}</p>
        </div>

        <label className="mt-5 block text-sm font-semibold text-white" htmlFor="grammar-draft">Tu texto en inglés</label>
        <textarea id="grammar-draft" value={text} onChange={(event) => { setText(event.target.value); setResult(null); }}
          placeholder="Write your text here…" rows={9} maxLength={5000} spellCheck lang="en"
          className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-white p-4 text-[15px] leading-7 text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-400" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-purple-200">
          <span>{count} palabras · máximo 5,000 caracteres</span>
          <button onClick={checkText} disabled={!text.trim()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Revisar y aprender</button>
        </div>
      </div>

      {result && <div className="space-y-4" aria-live="polite">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 md:p-6">
          <h3 className="text-lg font-bold text-white">{result.corrections.length ? `Revisión: ${result.corrections.length} sugerencias` : '¡Buen trabajo! No encontré errores en las reglas revisadas.'}</h3>
          <p className="mt-1 text-sm text-purple-200">Compara tu borrador con la versión sugerida y fíjate en el motivo de cada cambio.</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/80 p-4 text-slate-900">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Versión corregida</p>
            <p className="whitespace-pre-wrap leading-7">{result.corrected}</p>
          </div>
        </div>
        {result.corrections.length > 0 && <div className="grid gap-3 md:grid-cols-2">
          {result.corrections.map((item, index) => <article key={`${item.before}-${index}`} className="rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Sugerencia {index + 1}</p>
            <p className="mt-2 text-sm text-white"><span className="rounded bg-red-500/15 px-1 text-red-200 line-through">{item.before}</span> <span aria-hidden="true">→</span> <span className="rounded bg-green-500/15 px-1 font-semibold text-green-200">{item.after}</span></p>
            <p className="mt-3 text-sm leading-6 text-purple-100">{item.reason}</p>
            <p className="mt-2 text-xs text-purple-200">Ejemplo: <span className="font-medium text-white">{item.example}</span></p>
          </article>)}
        </div>}
        <p className="px-1 text-xs leading-5 text-purple-200">La revisión automática detecta patrones frecuentes de gramática, mayúsculas y puntuación. Puede pasar por alto errores de contexto o estilo; usa cada sugerencia como guía y vuelve a leer tu texto.</p>
      </div>}
    </section>
  );
}
