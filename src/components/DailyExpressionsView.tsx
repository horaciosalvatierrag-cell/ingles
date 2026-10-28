import { useState } from 'react';
import type { FormEvent } from 'react';
import { configureEnglishUtterance } from '../lib/speechAccent';
import { speakUtterance, cancelSpeech } from '../lib/indianSpeech';
import { webSearchUrl } from '../lib/webSearch';

type DailyExpression = {
  phrase: string;
  aliases?: string[];
  meaning: string;
  example: string;
  translation: string;
  where: string;
  register: string;
};

const expressions: DailyExpression[] = [
  { phrase: 'How are you?', aliases: ['How are you doing?'], meaning: '¿Cómo estás? / ¿Cómo está?', example: 'Hi, Ana. How are you today?', translation: 'Hola, Ana. ¿Cómo estás hoy?', where: 'Saludo cotidiano con amigos, compañeros y personas que conoces. En un contexto formal también es apropiada.', register: 'Neutral · formal o informal' },
  { phrase: 'How’s it going?', meaning: '¿Cómo te va? / ¿Qué tal?', example: 'Hey, Luis. How’s it going?', translation: 'Hola, Luis. ¿Qué tal?', where: 'Saludo relajado entre conocidos y compañeros. Es común responder brevemente: “Pretty good, thanks.”', register: 'Informal' },
  { phrase: 'What’s up?', aliases: ['What is up?'], meaning: '¿Qué tal? / ¿Qué pasa?', example: 'What’s up, Sam? Haven’t seen you in a while.', translation: '¿Qué tal, Sam? Hace tiempo que no te veo.', where: 'Saludo casual entre amigos. No suele ser una pregunta formal sobre un problema.', register: 'Muy informal' },
  { phrase: 'Nice to meet you.', meaning: 'Mucho gusto.', example: 'I’m Carla. Nice to meet you.', translation: 'Soy Carla. Mucho gusto.', where: 'Al conocer a alguien por primera vez, en persona o en una videollamada.', register: 'Neutral · cortés' },
  { phrase: 'Long time no see.', meaning: '¡Cuánto tiempo sin verte!', example: 'Long time no see! How have you been?', translation: '¡Cuánto tiempo sin verte! ¿Cómo has estado?', where: 'Al reencontrarte con un amigo o conocido después de mucho tiempo.', register: 'Informal' },
  { phrase: 'See you around.', meaning: 'Nos vemos por ahí.', example: 'I have to get back to work. See you around!', translation: 'Tengo que volver al trabajo. ¡Nos vemos por ahí!', where: 'Despedida casual cuando esperas encontrarte de nuevo, pero no hay un plan concreto.', register: 'Informal' },
  { phrase: 'Have a good one.', meaning: 'Que te vaya bien. / Que tengas buen día.', example: 'Thanks for your help. Have a good one!', translation: 'Gracias por tu ayuda. ¡Que te vaya bien!', where: 'Despedida amable en tiendas, cafés o conversaciones breves. “One” se refiere al día o momento.', register: 'Informal · frecuente en EE. UU.' },
  { phrase: 'Take care.', meaning: 'Cuídate.', example: 'It was great talking to you. Take care!', translation: 'Fue un gusto hablar contigo. ¡Cuídate!', where: 'Despedida cordial con amigos, familiares o compañeros.', register: 'Neutral · cortés' },
  { phrase: 'Could you help me?', meaning: '¿Podrías ayudarme?', example: 'Could you help me carry these bags?', translation: '¿Podrías ayudarme a cargar estas bolsas?', where: 'Para pedir ayuda de forma educada en casa, en el trabajo o en un lugar público.', register: 'Cortés' },
  { phrase: 'Could you give me a hand?', meaning: '¿Me echas una mano?', example: 'Could you give me a hand with this table?', translation: '¿Me echas una mano con esta mesa?', where: 'Petición amistosa para que alguien ayude con una tarea concreta.', register: 'Informal · cortés' },
  { phrase: 'Would you mind…?', meaning: '¿Te importaría…? / ¿Le importaría…?', example: 'Would you mind opening the window?', translation: '¿Te importaría abrir la ventana?', where: 'Para pedir algo con cortesía. Normalmente se responde “Not at all” para aceptar.', register: 'Cortés · formal o informal' },
  { phrase: 'Could I have…?', meaning: '¿Me podría dar…? / ¿Me das…?', example: 'Could I have a glass of water, please?', translation: '¿Me podría dar un vaso de agua, por favor?', where: 'Para pedir comida, bebida o un producto en tiendas y restaurantes.', register: 'Cortés' },
  { phrase: 'I’d like…', meaning: 'Quisiera… / Me gustaría…', example: 'I’d like a coffee and a sandwich, please.', translation: 'Quisiera un café y un sándwich, por favor.', where: 'Para pedir algo o expresar una preferencia de manera amable.', register: 'Cortés · uso general' },
  { phrase: 'Can I get…?', meaning: '¿Me das…? / ¿Puedo pedir…?', example: 'Can I get a small tea to go?', translation: '¿Me das un té pequeño para llevar?', where: 'Pedido común en cafés y restaurantes, especialmente en Estados Unidos.', register: 'Informal · servicio' },
  { phrase: 'I’m just looking, thanks.', meaning: 'Solo estoy mirando, gracias.', example: '“Can I help you?” “I’m just looking, thanks.”', translation: '—¿Le puedo ayudar? —Solo estoy mirando, gracias.', where: 'Respuesta amable cuando alguien ofrece ayuda en una tienda y aún no necesitas nada.', register: 'Cortés · compras' },
  { phrase: 'How much is this?', meaning: '¿Cuánto cuesta esto?', example: 'Excuse me, how much is this jacket?', translation: 'Disculpe, ¿cuánto cuesta esta chaqueta?', where: 'Para preguntar el precio en una tienda, mercado o puesto.', register: 'Neutral · compras' },
  { phrase: 'Can I try this on?', meaning: '¿Me puedo probar esto?', example: 'Can I try this on in a different size?', translation: '¿Me puedo probar esto en otra talla?', where: 'Al comprar ropa o zapatos y preguntar por los probadores.', register: 'Neutral · compras' },
  { phrase: 'Could we get the check, please?', aliases: ['Could we get the bill, please?'], meaning: '¿Nos trae la cuenta, por favor?', example: 'Everything was delicious. Could we get the check, please?', translation: 'Todo estuvo delicioso. ¿Nos trae la cuenta, por favor?', where: 'Para pedir la cuenta en un restaurante. “Check” es más común en EE. UU.; “bill”, en Reino Unido.', register: 'Cortés · check (EE. UU.) / bill (Reino Unido)' },
  { phrase: 'For here or to go?', meaning: '¿Para comer aquí o para llevar?', example: '“For here or to go?” “To go, please.”', translation: '—¿Para aquí o para llevar? —Para llevar, por favor.', where: 'Pregunta habitual al pedir comida o bebidas en un establecimiento.', register: 'Informal · frecuente en EE. UU.' },
  { phrase: 'Could I have this to go?', meaning: '¿Me lo puede poner para llevar?', example: 'I couldn’t finish my meal. Could I have this to go?', translation: 'No pude terminar mi comida. ¿Me la puede poner para llevar?', where: 'En un restaurante cuando quieres llevarte lo que sobró o pedir comida para llevar.', register: 'Cortés · restaurante' },
  { phrase: 'Where is the nearest…?', meaning: '¿Dónde está el/la… más cercano/a?', example: 'Where is the nearest bus stop?', translation: '¿Dónde está la parada de autobús más cercana?', where: 'Para pedir indicaciones en la calle o al personal de un lugar.', register: 'Neutral · viajes' },
  { phrase: 'How do I get to…?', meaning: '¿Cómo llego a…?', example: 'How do I get to the train station from here?', translation: '¿Cómo llego a la estación de tren desde aquí?', where: 'Para preguntar una ruta a pie, en transporte o en automóvil.', register: 'Neutral · viajes' },
  { phrase: 'Is it within walking distance?', meaning: '¿Se puede llegar caminando? / ¿Está a una distancia caminable?', example: 'Is the museum within walking distance of the hotel?', translation: '¿Se puede llegar caminando al museo desde el hotel?', where: 'Al planear una ruta y preguntar si el lugar está lo bastante cerca para ir a pie.', register: 'Neutral · viajes' },
  { phrase: 'I’m looking for…', meaning: 'Estoy buscando…', example: 'I’m looking for the platform for the 10:30 train.', translation: 'Estoy buscando el andén del tren de las 10:30.', where: 'Para explicar qué necesitas en una estación, tienda, edificio o barrio.', register: 'Neutral · uso general' },
  { phrase: 'Could you say that again?', meaning: '¿Podrías repetir eso?', example: 'Sorry, could you say that again a little more slowly?', translation: 'Perdón, ¿podrías repetirlo un poco más despacio?', where: 'Cuando no escuchaste o entendiste una conversación, llamada o indicación.', register: 'Cortés · uso general' },
  { phrase: 'What does … mean?', meaning: '¿Qué significa…?', example: 'What does “appointment” mean?', translation: '¿Qué significa “appointment”?', where: 'Al aprender vocabulario o cuando alguien usa una palabra desconocida.', register: 'Neutral · aprendizaje' },
  { phrase: 'How do you spell that?', meaning: '¿Cómo se escribe eso?', example: 'I didn’t catch your last name. How do you spell that?', translation: 'No entendí tu apellido. ¿Cómo se escribe?', where: 'Para confirmar la escritura de un nombre, dirección o palabra.', register: 'Neutral · uso general' },
  { phrase: 'I didn’t catch that.', meaning: 'No alcancé a entender / escuchar eso.', example: 'I didn’t catch that. Was the meeting at three or four?', translation: 'No alcancé a entender. ¿La reunión era a las tres o a las cuatro?', where: 'Cuando no escuchaste bien algo; suena natural en conversaciones y llamadas.', register: 'Informal · cortés' },
  { phrase: 'Let me think about it.', meaning: 'Déjame pensarlo.', example: 'That sounds interesting. Let me think about it and call you tomorrow.', translation: 'Suena interesante. Déjame pensarlo y te llamo mañana.', where: 'Para pedir tiempo antes de aceptar una invitación, oferta o decisión.', register: 'Neutral · cortés' },
  { phrase: 'That works for me.', meaning: 'Me queda bien. / Me parece bien.', example: '“Can we meet at 2 p.m.?” “That works for me.”', translation: '—¿Podemos reunirnos a las 2? —Me queda bien.', where: 'Para aceptar un horario, fecha o plan propuesto.', register: 'Informal · trabajo y vida diaria' },
  { phrase: 'I’m running late.', meaning: 'Voy retrasado/a. / Se me está haciendo tarde.', example: 'I’m running late, but I’ll be there in ten minutes.', translation: 'Voy retrasado, pero llegaré en diez minutos.', where: 'Para avisar por mensaje o llamada que no llegarás a tiempo.', register: 'Informal · uso general' },
  { phrase: 'I’m on my way.', meaning: 'Ya voy de camino.', example: 'I’m on my way to the café now.', translation: 'Ya voy de camino al café.', where: 'Al avisar que ya saliste o que te diriges a un lugar.', register: 'Informal · uso general' },
  { phrase: 'I’ll be right back.', meaning: 'Regreso enseguida.', example: 'I’ll be right back—I need to get my phone.', translation: 'Regreso enseguida; necesito ir por mi teléfono.', where: 'Cuando te ausentas brevemente de una conversación o lugar.', register: 'Neutral · uso general' },
  { phrase: 'No rush.', meaning: 'No hay prisa.', example: 'No rush—send me the file whenever you have time.', translation: 'No hay prisa; mándame el archivo cuando tengas tiempo.', where: 'Para decir que la otra persona puede tomarse su tiempo.', register: 'Informal · amable' },
  { phrase: 'It’s up to you.', meaning: 'Tú decides. / Depende de ti.', example: 'We can eat here or at home; it’s up to you.', translation: 'Podemos comer aquí o en casa; tú decides.', where: 'Al dejar una decisión o preferencia en manos de otra persona.', register: 'Neutral · uso general' },
  { phrase: 'That sounds good.', meaning: 'Eso suena bien. / Me parece bien.', example: '“Let’s order pizza tonight.” “That sounds good.”', translation: '—Pidamos pizza esta noche. —Me parece bien.', where: 'Para reaccionar positivamente a una idea o propuesta.', register: 'Informal · uso general' },
  { phrase: 'I’m not sure.', meaning: 'No estoy seguro/a.', example: 'I’m not sure what time the store closes.', translation: 'No estoy seguro de a qué hora cierra la tienda.', where: 'Para expresar duda con suavidad en vez de dar una respuesta definitiva.', register: 'Neutral · uso general' },
  { phrase: 'It depends.', meaning: 'Depende.', example: '“Can you come on Saturday?” “It depends on my work schedule.”', translation: '—¿Puedes venir el sábado? —Depende de mi horario de trabajo.', where: 'Cuando la respuesta cambia según una condición o circunstancia.', register: 'Neutral · uso general' },
  { phrase: 'I’m afraid…', meaning: 'Me temo que… / Lamento decir que…', example: 'I’m afraid we’re closed for the day.', translation: 'Me temo que ya cerramos por hoy.', where: 'Para comunicar una noticia negativa de manera educada; no expresa necesariamente miedo.', register: 'Cortés · formal o neutral' },
  { phrase: 'Sorry about that.', meaning: 'Perdón por eso. / Lamento lo ocurrido.', example: 'Sorry about that—the bus was delayed.', translation: 'Perdón por eso; el autobús se retrasó.', where: 'Disculpa breve por un inconveniente o un error pequeño.', register: 'Neutral · uso general' },
  { phrase: 'I appreciate it.', meaning: 'Te lo agradezco. / Se lo agradezco.', example: 'Thanks for covering my shift. I really appreciate it.', translation: 'Gracias por cubrir mi turno. Te lo agradezco mucho.', where: 'Para agradecer una ayuda o gesto; suena algo más enfático que “thanks”.', register: 'Cortés · uso general' },
  { phrase: 'You’re welcome.', meaning: 'De nada.', example: '“Thanks for the directions.” “You’re welcome.”', translation: '—Gracias por las indicaciones. —De nada.', where: 'Respuesta estándar cuando alguien te agradece.', register: 'Neutral · uso general' },
  { phrase: 'Don’t mention it.', meaning: 'No hay de qué. / No te preocupes.', example: '“Thanks for helping me move.” “Don’t mention it.”', translation: '—Gracias por ayudarme con la mudanza. —No hay de qué.', where: 'Respuesta amistosa a un agradecimiento, cuando quieres restarle importancia al favor.', register: 'Informal · amable' },
  { phrase: 'No problem.', meaning: 'No hay problema.', example: '“Can we change the time?” “No problem.”', translation: '—¿Podemos cambiar la hora? —No hay problema.', where: 'Para aceptar una petición, cambio o disculpa en situaciones cotidianas.', register: 'Informal · uso general' },
  { phrase: 'My pleasure.', meaning: 'Con mucho gusto. / Fue un placer.', example: '“Thank you for your time.” “My pleasure.”', translation: '—Gracias por su tiempo. —Con mucho gusto.', where: 'Respuesta cortés a un agradecimiento, especialmente en atención al cliente o contextos profesionales.', register: 'Cortés' },
  { phrase: 'I’m sorry to hear that.', meaning: 'Siento escuchar eso. / Lamento que haya pasado.', example: '“I’ve been sick all week.” “I’m sorry to hear that.”', translation: '—He estado enfermo toda la semana. —Lo lamento.', where: 'Para mostrar empatía cuando alguien comparte una dificultad o mala noticia.', register: 'Cortés · empático' },
  { phrase: 'What do you think?', meaning: '¿Qué opinas? / ¿Qué te parece?', example: 'I’m thinking of taking a cooking class. What do you think?', translation: 'Estoy pensando en tomar una clase de cocina. ¿Qué opinas?', where: 'Para pedir la opinión de alguien sobre una idea, decisión o plan.', register: 'Neutral · uso general' },
  { phrase: 'Are you free…?', meaning: '¿Estás libre…? / ¿Tienes tiempo…?', example: 'Are you free for lunch tomorrow?', translation: '¿Tienes tiempo para almorzar mañana?', where: 'Para preguntar si alguien está disponible antes de invitarlo a algo.', register: 'Informal · uso general' },
  { phrase: 'Do you feel like…?', meaning: '¿Te apetece…? / ¿Tienes ganas de…?', example: 'Do you feel like watching a movie tonight?', translation: '¿Te apetece ver una película esta noche?', where: 'Para preguntar si alguien tiene ganas de hacer una actividad.', register: 'Informal · uso general' },
  { phrase: 'I’m looking forward to it.', meaning: 'Tengo muchas ganas. / Espero con ilusión que llegue.', example: 'We’re meeting your family next week. I’m looking forward to it.', translation: 'Conoceremos a tu familia la próxima semana. Tengo muchas ganas.', where: 'Para mostrar entusiasmo por un evento futuro. Va seguido de un sustantivo o verbo en -ing.', register: 'Neutral · amable' },
  { phrase: 'Let’s keep in touch.', meaning: 'Sigamos en contacto.', example: 'I’m moving next month, but let’s keep in touch.', translation: 'Me mudo el próximo mes, pero sigamos en contacto.', where: 'Al despedirte de un compañero, amigo o conocido con quien quieres seguir hablando.', register: 'Informal · uso general' },
];

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function findSuggestions(query: string) {
  const terms = normalize(query).split(/\s+/).filter(term => term.length > 2);
  return expressions.map(item => ({ item, score: terms.reduce((score, term) => score + (normalize(`${item.phrase} ${item.meaning} ${item.where}`).includes(term) ? 1 : 0), 0) }))
    .filter(match => match.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(match => match.item);
}

export default function DailyExpressionsView() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DailyExpression | null>(null);
  const [suggestions, setSuggestions] = useState<DailyExpression[]>([]);
  const [message, setMessage] = useState('');

  const explain = (expression: DailyExpression) => {
    setSelected(expression);
    setQuery(expression.phrase);
    setSuggestions([]);
    setMessage('');
  };

  const lookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      setSelected(null);
      setSuggestions([]);
      setMessage('Escribe una expresión en inglés para buscar su significado.');
      return;
    }
    const exact = expressions.find(item => [item.phrase, ...(item.aliases ?? [])].some(phrase => normalize(phrase) === normalizedQuery));
    const contained = exact ?? expressions
      .filter(item => [item.phrase, ...(item.aliases ?? [])].some(phrase => normalizedQuery.includes(normalize(phrase)) && normalize(phrase).length > 5))
      .sort((a, b) => b.phrase.length - a.phrase.length)[0];
    if (contained) {
      explain(contained);
      return;
    }
    const found = findSuggestions(query);
    setSelected(null);
    setSuggestions(found);
    if (found.length) {
      setMessage('No encontré una coincidencia exacta. Quizá te refieres a alguna de estas expresiones:');
      return;
    }

    const searchUrl = webSearchUrl(`${query} English expression meaning usage examples`);
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    setMessage('No encontré esta expresión en la guía. Abrí una búsqueda en Internet en otra pestaña para consultar su significado y uso.');
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    configureEnglishUtterance(utterance);
    speakUtterance(utterance);
  };

  return <section className="mx-auto max-w-4xl space-y-5">
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur-sm md:p-7">
      <p className="text-sm font-semibold text-blue-200">📘 GUÍA DE USO · 50 EXPRESIONES</p>
      <h2 className="mt-1 text-2xl font-bold text-white">Expresiones de la vida cotidiana</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-purple-200">Escribe una frase en inglés para conocer qué significa, cómo se usa y en qué situaciones cotidianas resulta natural. La guía incluye saludos, compras, restaurantes, viajes, trabajo y conversaciones.</p>
      <form onSubmit={lookup} className="mt-5 space-y-2">
        <label htmlFor="daily-expression" className="block text-sm font-semibold text-white">Expresión en inglés</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="daily-expression" value={query} onChange={event => { setQuery(event.target.value); setMessage(''); setSuggestions([]); }} placeholder="Ej.: Could you give me a hand?" autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400" />
          <button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Explicar expresión</button>
        </div>
        <p className="text-xs text-purple-200">Prueba también: “How are you?”, “Could I have…?” o “I’m on my way.”</p>
      </form>
    </div>

    {message && <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100" role="status">{message}</div>}
    {selected && <article className="rounded-2xl border border-blue-400/25 bg-white/10 p-5 shadow-sm md:p-7" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Expresión</p><h3 className="mt-1 text-2xl font-bold text-white">{selected.phrase}</h3></div>
        <button onClick={() => speak(selected.phrase)} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20" aria-label={`Escuchar ${selected.phrase}`}>🔊 Escuchar</button>
      </div>
      <div className="mt-5 rounded-xl bg-blue-500/10 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-200">Significado</p><p className="mt-1 text-lg font-semibold text-white">{selected.meaning}</p><span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-purple-100">{selected.register}</span></div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-200">Ejemplo en inglés</p><p className="mt-2 text-base leading-7 text-white">“{selected.example}”</p><p className="mt-1 text-sm text-purple-200">{selected.translation}</p></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-200">¿Dónde se aplica?</p><p className="mt-2 text-sm leading-6 text-purple-100">{selected.where}</p></div>
      </div>
    </article>}

    {suggestions.length > 0 && <div className="grid gap-2 sm:grid-cols-2" aria-label="Expresiones sugeridas">
      {suggestions.map(item => <button key={item.phrase} onClick={() => explain(item)} className="rounded-xl border border-white/10 bg-white/10 p-4 text-left transition hover:bg-white/20"><span className="font-semibold text-white">{item.phrase}</span><span className="mt-1 block text-sm text-purple-200">{item.meaning}</span></button>)}
    </div>}
  </section>;
}
