import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { configureEnglishUtterance } from '../lib/speechAccent';
import { speakUtterance, cancelSpeech } from '../lib/indianSpeech';
import { searchWiktionary, type WiktionaryResult } from '../lib/wiktionarySearch';

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
type Expression = { phrase: string; meaning: string; example: string; translation: string; use: string; register: string };

const expressions: Record<Level, Expression[]> = {
  A1: [
    { phrase: "What's up?", meaning: '¿Qué tal? / ¿Qué pasa?', example: "Hey, Mia! What's up?", translation: '¡Hola, Mia! ¿Qué tal?', use: 'Saludo casual entre amigos; no suele pedir una explicación detallada.', register: 'Informal · muy común en EE. UU.' },
    { phrase: 'How’s it going?', meaning: '¿Cómo te va?', example: 'Hi, Ben. How’s it going?', translation: 'Hola, Ben. ¿Cómo te va?', use: 'Saludo informal. Se puede responder “Good, thanks” o contar brevemente cómo estás.', register: 'Informal · uso general' },
    { phrase: 'Cool!', meaning: '¡Genial! / ¡Qué bien!', example: 'You got the new job? Cool!', translation: '¿Conseguiste el nuevo trabajo? ¡Genial!', use: 'Reacción positiva y casual; también significa “fresco” al hablar de temperatura.', register: 'Informal · uso general' },
    { phrase: 'Awesome!', meaning: '¡Increíble! / ¡Buenísimo!', example: 'The concert was awesome.', translation: 'El concierto estuvo buenísimo.', use: 'Para expresar entusiasmo; más enfático que “good”.', register: 'Informal · uso general' },
    { phrase: 'No worries.', meaning: 'No te preocupes. / No hay problema.', example: '“Sorry I’m late.” “No worries.”', translation: '—Perdón por llegar tarde. —No hay problema.', use: 'Para tranquilizar a alguien o aceptar una disculpa o agradecimiento.', register: 'Informal · muy común' },
    { phrase: 'My bad.', meaning: 'Fue mi culpa. / Perdón, me equivoqué.', example: 'My bad—I sent you the old address.', translation: 'Fue mi culpa: te mandé la dirección anterior.', use: 'Admite un error propio de manera casual; evita usarlo en disculpas formales.', register: 'Muy informal · EE. UU.' },
    { phrase: 'See you later!', meaning: '¡Nos vemos!', example: 'I have to go now. See you later!', translation: 'Ya me tengo que ir. ¡Nos vemos!', use: 'Despedida amistosa; no necesariamente significa que se verán más tarde ese mismo día.', register: 'Informal · uso general' },
    { phrase: 'Take care!', meaning: '¡Cuídate!', example: 'It was nice talking to you. Take care!', translation: 'Fue un gusto hablar contigo. ¡Cuídate!', use: 'Despedida cordial entre amigos, compañeros o conocidos.', register: 'Informal · uso general' },
    { phrase: 'Good luck!', meaning: '¡Buena suerte!', example: 'Good luck with your English test!', translation: '¡Buena suerte en tu examen de inglés!', use: 'Para desear éxito antes de una prueba, entrevista o reto.', register: 'Neutral · uso general' },
    { phrase: 'Hang out', meaning: 'Pasar el rato / reunirse sin un plan formal.', example: 'Do you want to hang out after class?', translation: '¿Quieres pasar el rato después de clase?', use: 'Invitación casual a pasar tiempo juntos; no implica una actividad específica.', register: 'Informal · muy común' },
  ],
  A2: [
    { phrase: 'I’m beat.', meaning: 'Estoy agotado/a.', example: 'I worked a double shift. I’m beat.', translation: 'Trabajé un turno doble. Estoy agotado.', use: 'Expresa cansancio físico o mental; “beat” no significa aquí “golpeado”.', register: 'Informal · uso general' },
    { phrase: 'Grab a bite.', meaning: 'Comer algo rápido.', example: 'Let’s grab a bite before the movie.', translation: 'Comamos algo rápido antes de la película.', use: 'Propuesta casual para comer, normalmente sin una comida formal.', register: 'Informal · uso general' },
    { phrase: 'Figure out', meaning: 'Resolver / entender cómo hacer algo.', example: 'I can’t figure out how this app works.', translation: 'No logro entender cómo funciona esta aplicación.', use: 'Para encontrar una solución o comprender algo tras pensarlo o probarlo.', register: 'Informal · uso general' },
    { phrase: 'Catch up', meaning: 'Ponerse al día / conversar después de un tiempo.', example: 'Let’s catch up over coffee this weekend.', translation: 'Pongámonos al día tomando un café este fin de semana.', use: 'Para actualizarse sobre la vida de alguien; también puede significar alcanzar a alguien.', register: 'Informal · uso general' },
    { phrase: 'That’s on me.', meaning: 'Yo invito. / Eso corre por mi cuenta.', example: 'You paid last time; lunch is on me today.', translation: 'Tú pagaste la vez pasada; hoy yo invito el almuerzo.', use: 'Al ofrecer pagar. También puede significar “es responsabilidad mía” según el contexto.', register: 'Informal · uso general' },
    { phrase: 'Sounds good.', meaning: 'Me parece bien. / Suena bien.', example: '“Meet at six?” “Sounds good.”', translation: '—¿Nos vemos a las seis? —Me parece bien.', use: 'Aceptación casual de un plan o una propuesta.', register: 'Informal · uso general' },
    { phrase: 'Give me a hand.', meaning: 'Échame una mano. / Ayúdame.', example: 'Could you give me a hand with these boxes?', translation: '¿Me ayudas con estas cajas?', use: 'Petición amistosa de ayuda; también se puede decir “Can you help me?”.', register: 'Informal · uso general' },
    { phrase: 'Get along (with someone).', meaning: 'Llevarse bien (con alguien).', example: 'I get along really well with my new coworkers.', translation: 'Me llevo muy bien con mis nuevos compañeros.', use: 'Describe una relación cordial o armoniosa entre personas.', register: 'Uso general · conversacional' },
    { phrase: 'Keep in touch.', meaning: 'Mantenerse en contacto.', example: 'We moved to different cities, but we keep in touch.', translation: 'Nos mudamos a distintas ciudades, pero seguimos en contacto.', use: 'Para expresar que se comunicarán de vez en cuando en el futuro.', register: 'Informal · uso general' },
    { phrase: 'In a hurry.', meaning: 'Con prisa.', example: 'I’m in a hurry, so I’ll take a taxi.', translation: 'Tengo prisa, así que tomaré un taxi.', use: 'Describe que alguien tiene poco tiempo y necesita actuar rápido.', register: 'Uso general · conversacional' },
  ],
  B1: [
    { phrase: 'Break the ice.', meaning: 'Romper el hielo; hacer que la gente se sienta cómoda.', example: 'A quick game helped break the ice at the workshop.', translation: 'Un juego breve ayudó a romper el hielo en el taller.', use: 'Al iniciar una reunión, conversación o actividad con personas que no se conocen.', register: 'Modismo · uso general' },
    { phrase: 'Hit the road.', meaning: 'Ponerse en camino / salir de viaje.', example: 'It’s getting late; we should hit the road.', translation: 'Se está haciendo tarde; deberíamos ponernos en camino.', use: 'Invitación informal a partir o comenzar un trayecto.', register: 'Informal · EE. UU.' },
    { phrase: 'On the same page.', meaning: 'Estar de acuerdo o entender lo mismo.', example: 'Before we start, let’s make sure we’re on the same page.', translation: 'Antes de empezar, asegurémonos de que entendemos lo mismo.', use: 'En trabajo en equipo para confirmar que todos comparten el plan o la información.', register: 'Modismo · trabajo y conversación' },
    { phrase: 'Call it a day.', meaning: 'Dar por terminado el trabajo por hoy.', example: 'We’ve finished the report. Let’s call it a day.', translation: 'Terminamos el informe. Dejémoslo por hoy.', use: 'Cuando se decide parar una actividad, a menudo al final de la jornada.', register: 'Informal · uso general' },
    { phrase: 'Under the weather.', meaning: 'Sentirse indispuesto/a.', example: 'I’m feeling a little under the weather, so I’ll stay home.', translation: 'Me siento un poco indispuesto, así que me quedaré en casa.', use: 'Manera suave de decir que no te sientes bien; no especifica una enfermedad.', register: 'Modismo · uso general' },
    { phrase: 'A piece of cake.', meaning: 'Pan comido; algo muy fácil.', example: 'The setup was a piece of cake.', translation: 'La instalación fue pan comido.', use: 'Para describir una tarea que resultó muy fácil.', register: 'Informal · uso general' },
    { phrase: 'Out of the blue.', meaning: 'De repente y sin esperarlo.', example: 'Out of the blue, an old friend called me.', translation: 'De repente, me llamó un viejo amigo.', use: 'Para introducir un evento o noticia inesperada.', register: 'Modismo · uso general' },
    { phrase: 'Sleep on it.', meaning: 'Pensarlo hasta el día siguiente antes de decidir.', example: 'It’s a big offer. I’d like to sleep on it.', translation: 'Es una oferta importante. Quisiera pensarlo hasta mañana.', use: 'Al pedir tiempo para reflexionar antes de tomar una decisión.', register: 'Informal · uso general' },
    { phrase: 'Get the hang of it.', meaning: 'Agarrarle la onda / aprender a hacer algo.', example: 'The software seemed confusing, but I’m getting the hang of it.', translation: 'El programa parecía confuso, pero ya le estoy agarrando la onda.', use: 'Cuando empiezas a dominar una habilidad o herramienta con la práctica.', register: 'Informal · uso general' },
    { phrase: 'Cost an arm and a leg.', meaning: 'Costar un ojo de la cara.', example: 'That laptop costs an arm and a leg.', translation: 'Esa laptop cuesta un ojo de la cara.', use: 'Exageración coloquial para decir que algo es muy caro.', register: 'Modismo informal · uso general' },
  ],
  B2: [
    { phrase: 'Spill the beans.', meaning: 'Revelar un secreto o contar algo antes de tiempo.', example: 'Who spilled the beans about the surprise party?', translation: '¿Quién reveló lo de la fiesta sorpresa?', use: 'En situaciones informales cuando alguien divulga información confidencial o sorpresiva.', register: 'Informal · uso general' },
    { phrase: 'Throw in the towel.', meaning: 'Tirar la toalla; rendirse.', example: 'After several failed attempts, the team refused to throw in the towel.', translation: 'Tras varios intentos fallidos, el equipo se negó a tirar la toalla.', use: 'Describe abandonar un esfuerzo; puede sonar dramático o enfático.', register: 'Modismo · uso general' },
    { phrase: 'Go the extra mile.', meaning: 'Hacer un esfuerzo adicional.', example: 'She went the extra mile to make the new students feel welcome.', translation: 'Hizo un esfuerzo adicional para que los nuevos alumnos se sintieran bienvenidos.', use: 'Para elogiar a alguien que hizo más de lo esperado.', register: 'Uso general · trabajo y estudio' },
    { phrase: 'Cut corners.', meaning: 'Tomar atajos sacrificando calidad o seguridad.', example: 'The contractor cut corners, and the repairs didn’t last.', translation: 'El contratista tomó atajos y las reparaciones no duraron.', use: 'Suele ser una crítica: se ahorra tiempo o dinero de forma descuidada.', register: 'Informal · con sentido crítico' },
    { phrase: 'Read the room.', meaning: 'Darse cuenta del ambiente y ajustar lo que uno dice o hace.', example: 'He kept joking, but he should have read the room.', translation: 'Siguió haciendo bromas, pero debió notar el ambiente.', use: 'Consejo informal para prestar atención a las reacciones de los demás.', register: 'Informal · conversacional' },
    { phrase: 'Bite the bullet.', meaning: 'Afrontar algo difícil o desagradable con decisión.', example: 'I finally bit the bullet and booked the dentist appointment.', translation: 'Por fin me armé de valor y pedí la cita con el dentista.', use: 'Cuando se deja de posponer una tarea difícil y se enfrenta.', register: 'Modismo · uso general' },
    { phrase: 'Get cold feet.', meaning: 'Echarse para atrás por nervios o miedo.', example: 'She got cold feet just before the presentation.', translation: 'Le entraron los nervios justo antes de la presentación.', use: 'Al hablar de dudas repentinas antes de un compromiso o reto.', register: 'Informal · uso general' },
    { phrase: 'Bend over backwards.', meaning: 'Hacer todo lo posible para ayudar o complacer.', example: 'The staff bent over backwards to solve the travel problem.', translation: 'El personal hizo todo lo posible para resolver el problema del viaje.', use: 'Destaca un esfuerzo excepcional; a veces implica que fue excesivo.', register: 'Modismo · uso general' },
    { phrase: 'A long shot.', meaning: 'Una posibilidad remota.', example: 'Getting tickets now is a long shot, but we can try.', translation: 'Conseguir boletos ahora es poco probable, pero podemos intentarlo.', use: 'Para una opción con pocas probabilidades de éxito.', register: 'Informal · uso general' },
    { phrase: 'Back to square one.', meaning: 'Volver al punto de partida.', example: 'The data was corrupted, so we’re back to square one.', translation: 'Los datos se dañaron, así que volvimos al punto de partida.', use: 'Cuando un plan falla y hay que empezar de nuevo.', register: 'Modismo · trabajo y conversación' },
  ],
  C1: [
    { phrase: 'Jump the gun.', meaning: 'Adelantarse antes del momento adecuado.', example: 'We may have jumped the gun by announcing the launch date.', translation: 'Quizá nos adelantamos al anunciar la fecha de lanzamiento.', use: 'En análisis o trabajo para señalar que alguien actuó con información incompleta.', register: 'Informal · uso general' },
    { phrase: 'Move the goalposts.', meaning: 'Cambiar los criterios o condiciones de forma injusta.', example: 'Every time we meet the target, management moves the goalposts.', translation: 'Cada vez que alcanzamos la meta, la dirección cambia los criterios.', use: 'Crítica a una persona o institución que cambia las reglas una vez iniciado el proceso.', register: 'Modismo · frecuente en Reino Unido y EE. UU.' },
    { phrase: 'Toe the line.', meaning: 'Acatar las reglas o ajustarse a lo esperado.', example: 'New members are expected to toe the line.', translation: 'Se espera que los nuevos integrantes acaten las reglas.', use: 'Puede describir disciplina, conformidad o presión para obedecer; el tono depende del contexto.', register: 'Modismo · uso general' },
    { phrase: 'Take it with a grain of salt.', meaning: 'Tomarlo con reservas; no creerlo por completo.', example: 'Take anonymous online reviews with a grain of salt.', translation: 'Toma con reservas las reseñas anónimas de internet.', use: 'Recomienda mantener escepticismo ante información dudosa o subjetiva.', register: 'Modismo · uso general' },
    { phrase: 'The elephant in the room.', meaning: 'El tema evidente que todos evitan mencionar.', example: 'The budget cuts were the elephant in the room during the meeting.', translation: 'Los recortes presupuestarios eran el tema evidente que nadie mencionaba en la reunión.', use: 'Para señalar un asunto importante e incómodo que no se está discutiendo.', register: 'Modismo · trabajo y conversación' },
    { phrase: 'Get your ducks in a row.', meaning: 'Organizar los detalles antes de actuar.', example: 'Let’s get our ducks in a row before we submit the proposal.', translation: 'Organicemos todo antes de entregar la propuesta.', use: 'En registros informales de trabajo para hablar de preparación y coordinación.', register: 'Informal · especialmente común en EE. UU.' },
    { phrase: 'Not my cup of tea.', meaning: 'No es lo mío / no es de mi gusto.', example: 'Horror films aren’t really my cup of tea.', translation: 'Las películas de terror no son mucho de mi agrado.', use: 'Rechazo suave y educado de una actividad o preferencia.', register: 'Informal · especialmente común en Reino Unido' },
    { phrase: 'Play it by ear.', meaning: 'Decidir sobre la marcha según cómo se desarrolle la situación.', example: 'We don’t need a strict schedule; let’s play it by ear.', translation: 'No necesitamos un horario estricto; decidamos sobre la marcha.', use: 'Cuando se prefiere esperar y adaptarse en vez de fijar un plan detallado.', register: 'Informal · uso general' },
    { phrase: 'Put a pin in it.', meaning: 'Dejar un tema para retomarlo más tarde.', example: 'We’re short on time, so let’s put a pin in that question.', translation: 'Tenemos poco tiempo, así que dejemos esa pregunta para después.', use: 'En reuniones para pausar una discusión; puede sonar brusco si se usa para silenciar a alguien.', register: 'Informal · frecuente en reuniones' },
    { phrase: 'Pull strings.', meaning: 'Usar contactos o influencia para conseguir algo.', example: 'He pulled a few strings to arrange the meeting.', translation: 'Movió algunos contactos para organizar la reunión.', use: 'Puede sugerir favoritismo o influencia privilegiada; úsalo con cuidado en contextos formales.', register: 'Informal · puede tener connotación negativa' },
  ],
};

const levelGuides: Record<Level, string> = {
  A1: 'Saludos y frases cotidianas frecuentes. Aprende primero cuándo son apropiadas y cómo responder.',
  A2: 'Expresiones prácticas para conversar, pedir ayuda, hacer planes y hablar de experiencias.',
  B1: 'Modismos comunes para conversaciones sociales y narraciones; reconoce el sentido figurado.',
  B2: 'Expresiones con matices para trabajo y conversación; observa si transmiten crítica o énfasis.',
  C1: 'Modismos más idiomáticos y sensibles al contexto; identifica región, registro e implicaciones.',
};

export default function SlangView() {
  const [level, setLevel] = useState<Level>('A1');
  const [search, setSearch] = useState('');
  const [internetResults, setInternetResults] = useState<WiktionaryResult[]>([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchControllerRef = useRef<AbortController | null>(null);
  const filtered = useMemo(() => expressions[level].filter(item =>
    `${item.phrase} ${item.meaning} ${item.example} ${item.use}`.toLowerCase().includes(search.toLowerCase().trim())
  ), [level, search]);

  useEffect(() => () => {
    searchControllerRef.current?.abort();
    searchControllerRef.current = null;
  }, []);

  const explainExpression = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) {
      setInternetResults([]);
      setSearchMessage('Escribe un modismo o expresión para buscar su significado.');
      return;
    }
    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setInternetResults([]);
    setIsSearching(true);
    setSearchMessage('Buscando la expresión en Internet…');
    let timedOut = false;
    const timeoutId = window.setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
    try {
      const results = await searchWiktionary(`${query} English slang idiom meaning`, controller.signal);
      if (searchControllerRef.current !== controller) return;
      setInternetResults(results);
      setSearchMessage(results.length
        ? filtered.length
          ? 'Consulté Wiktionary. Aquí están los resultados de Internet junto con las expresiones de esta guía.'
          : 'No estaba en esta guía; encontré estos resultados en Internet.'
        : filtered.length
          ? 'No encontré resultados relacionados en Internet. Puedes consultar las expresiones de esta guía.'
          : 'No encontré resultados para esta expresión. Prueba otra variante o una frase más corta.');
    } catch {
      if (searchControllerRef.current !== controller || (controller.signal.aborted && !timedOut)) return;
      setSearchMessage(timedOut
        ? 'La búsqueda en Internet tardó demasiado. Las expresiones locales siguen disponibles.'
        : 'No se pudo conectar con Internet. Puedes seguir consultando las expresiones de esta guía.');
    } finally {
      window.clearTimeout(timeoutId);
      if (searchControllerRef.current === controller) {
        searchControllerRef.current = null;
        setIsSearching(false);
      }
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    configureEnglishUtterance(utterance);
    utterance.rate = level === 'A1' || level === 'A2' ? 0.82 : 0.94;
    speakUtterance(utterance);
  };

  return <section className="mx-auto max-w-6xl space-y-5">
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur-sm md:p-7">
      <p className="text-sm font-semibold text-blue-200">💬 MODISMOS Y EXPRESIONES · 50 FRASES</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-2xl font-bold text-white">SLANG inglés</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-purple-200">Aprende expresiones informales y modismos con su sentido real, ejemplos traducidos y situaciones donde suenan naturales. Avanza de frases cotidianas a expresiones con matices culturales.</p></div>
        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">Nivel {level}</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5" role="group" aria-label="Nivel de slang">
        {(['A1', 'A2', 'B1', 'B2', 'C1'] as Level[]).map((item, index) => <button key={item} onClick={() => setLevel(item)} aria-pressed={level === item}
          className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${level === item ? 'border-blue-400 bg-blue-500 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'}`}>
          <span className="block">{item}</span><span className="hidden text-[10px] font-normal sm:block">{['Inicial', 'Básico', 'Intermedio', 'Avanzado', 'Dominio'][index]}</span>
        </button>)}
      </div>
      <p className="mt-3 text-xs leading-5 text-purple-200">{levelGuides[level]}</p>
      <form onSubmit={explainExpression} className="mt-4">
        <label className="block text-sm font-medium text-white" htmlFor="slang-search">Buscar o explicar un modismo</label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input id="slang-search" value={search} maxLength={120} onChange={event => { searchControllerRef.current?.abort(); searchControllerRef.current = null; setIsSearching(false); setInternetResults([]); setSearchMessage(''); setSearch(event.target.value); }} placeholder="Ej.: no worries, spill the beans…"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400" />
          <button type="submit" disabled={isSearching} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70">{isSearching ? 'Buscando en Internet…' : 'Explicar expresión'}</button>
        </div>
      </form>
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      {filtered.map(item => <article key={item.phrase} className="rounded-2xl border border-white/10 bg-white/10 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h3 className="text-lg font-bold text-white">{item.phrase}</h3><p className="mt-1 font-semibold text-blue-200">{item.meaning}</p></div>
          <button onClick={() => speak(item.phrase)} aria-label={`Escuchar ${item.phrase}`} title="Escuchar pronunciación" className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">🔊 Escuchar</button>
        </div>
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white">“{item.example}”</p>
        <p className="mt-1 text-xs leading-5 text-purple-200">{item.translation}</p>
        <div className="mt-3 rounded-xl bg-blue-500/10 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-blue-200">Cuándo usarla</p><p className="mt-1 text-sm leading-5 text-purple-100">{item.use}</p></div>
        <span className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-purple-200">{item.register}</span>
      </article>)}
    </div>
    {searchMessage && <p className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-4 text-sm leading-6 text-blue-100" role="status" aria-live="polite">{searchMessage}</p>}
    {internetResults.length > 0 && <section className="space-y-3" aria-label="Resultados de Internet"><h3 className="text-lg font-bold text-white">Resultados de Internet · Wiktionary</h3>{internetResults.map(result => <article key={`${result.title}-${result.url}`} className="rounded-xl border border-white/10 bg-white/10 p-4"><h4 className="font-semibold text-white">{result.title}</h4><p className="mt-1 text-sm leading-6 text-purple-100">{result.snippet || 'Abre la entrada para leer su definición completa.'}</p><a href={result.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-semibold text-sky-200 underline underline-offset-2">Ver entrada y contexto ↗</a></article>)}</section>}
    {filtered.length === 0 && search.trim() && <div className="rounded-xl border border-white/10 bg-white/10 p-6 text-center text-purple-100"><p>No encontré expresiones con esa búsqueda en el nivel {level}. Revisa también los resultados de Internet o cambia de nivel.</p></div>}
    <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">El slang depende de la región, la edad y la confianza entre las personas. Estas expresiones son principalmente informales: en entrevistas, documentos o correos formales, elige una alternativa neutral cuando tengas dudas.</p>
  </section>;
}
