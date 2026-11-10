import { useMemo, useRef, useState } from 'react';
import { Dices, MessageCircle } from 'lucide-react';
import type { LearningLevel } from '../learning/types';

type Phrase = { en: string; es: string };
type Exchange = { question: Phrase; answers: Phrase[] };
type GeneratedLine = Phrase & { speaker: string };

const participants: Array<[string, string]> = [
  ['Alex', 'Jordan'], ['Mia', 'Sam'], ['Taylor', 'Riley'], ['Casey', 'Morgan'],
];

const levels: Record<LearningLevel, Exchange[]> = {
  A1: [
    { question: { en: 'Let’s talk about {topic}. What do you know about it?', es: 'Hablemos de {topicEs}. ¿Qué sabes del tema?' }, answers: [{ en: 'I know a little. It sounds interesting, and I want to learn more.', es: 'Sé un poco. Parece interesante y quiero aprender más.' }, { en: 'I do not know much yet, but I am happy to find out.', es: 'Todavía no sé mucho, pero me da gusto descubrirlo.' }] },
    { question: { en: 'Have you tried it before, or is this new for you?', es: '¿Ya lo has probado o es algo nuevo para ti?' }, answers: [{ en: 'It is new for me, so I have a few simple questions.', es: 'Es algo nuevo para mí, así que tengo algunas preguntas sencillas.' }, { en: 'I tried it once. I liked it, but I want to learn more.', es: 'Lo probé una vez. Me gustó, pero quiero aprender más.' }] },
    { question: { en: 'What part sounds best to you, and why?', es: '¿Qué parte te parece mejor y por qué?' }, answers: [{ en: 'I like learning new things with a friend. It is more fun together.', es: 'Me gusta aprender cosas nuevas con un amigo. Juntos es más divertido.' }, { en: 'I like seeing something different and talking about it afterward.', es: 'Me gusta ver algo diferente y platicar sobre eso después.' }] },
    { question: { en: 'When is a good time to do it?', es: '¿Cuándo sería un buen momento para hacerlo?' }, answers: [{ en: 'Saturday morning is good. We have time, and we do not need to hurry.', es: 'El sábado por la mañana está bien. Tenemos tiempo y no hay que apresurarse.' }, { en: 'Let’s choose a quiet day, so we can enjoy the experience.', es: 'Elijamos un día tranquilo para disfrutar la experiencia.' }] },
    { question: { en: 'Who would you like to go with?', es: '¿Con quién te gustaría ir?' }, answers: [{ en: 'I want to go with a friend who likes this kind of activity.', es: 'Quiero ir con un amigo al que le gusta este tipo de actividad.' }, { en: 'I would like to invite my family. We enjoy doing things together.', es: 'Me gustaría invitar a mi familia. Disfrutamos hacer cosas juntos.' }] },
    { question: { en: 'What should we prepare before we start?', es: '¿Qué debemos preparar antes de empezar?' }, answers: [{ en: 'We can check the details, take what we need, and make a simple plan.', es: 'Podemos revisar los detalles, llevar lo necesario y hacer un plan sencillo.' }, { en: 'Let’s get ready the day before, so everything is easy.', es: 'Preparémonos un día antes para que todo sea sencillo.' }] },
    { question: { en: 'What can we do if something is difficult?', es: '¿Qué podemos hacer si algo se complica?' }, answers: [{ en: 'We can stop, ask a question, and try again slowly.', es: 'Podemos detenernos, hacer una pregunta e intentarlo otra vez con calma.' }, { en: 'We can ask someone for help. It is okay to learn step by step.', es: 'Podemos pedir ayuda. Está bien aprender paso a paso.' }] },
    { question: { en: 'How can we make the experience better for everyone?', es: '¿Cómo podemos hacer que la experiencia sea mejor para todos?' }, answers: [{ en: 'We can listen to each other and be kind to the people around us.', es: 'Podemos escucharnos y ser amables con las personas que nos rodean.' }, { en: 'We can share ideas, take turns, and give everyone time to speak.', es: 'Podemos compartir ideas, turnarnos y dar tiempo para que todos hablen.' }] },
    { question: { en: 'What is one new thing you hope to learn?', es: '¿Qué cosa nueva esperas aprender?' }, answers: [{ en: 'I hope to learn something useful that I can share later.', es: 'Espero aprender algo útil que pueda compartir después.' }, { en: 'I want to learn a new word and use it in a sentence.', es: 'Quiero aprender una palabra nueva y usarla en una oración.' }] },
    { question: { en: 'Can you tell me our plan in a few words?', es: '¿Puedes resumir nuestro plan en pocas palabras?' }, answers: [{ en: 'We will prepare, go together, ask questions, and enjoy learning about {topic}.', es: 'Nos prepararemos, iremos juntos, haremos preguntas y disfrutaremos aprender sobre {topicEs}.' }, { en: 'We will choose a day, get ready, and have a good time together.', es: 'Elegiremos un día, nos prepararemos y pasaremos un buen rato juntos.' }] },
  ],
  A2: [
    { question: { en: 'What made you choose {topic} for our conversation?', es: '¿Por qué elegiste {topicEs} para nuestra conversación?' }, answers: [{ en: 'I read a little about it last week, and now I want to know more.', es: 'Leí un poco sobre el tema la semana pasada y ahora quiero saber más.' }, { en: 'A friend told me about it, so I thought it would be interesting.', es: 'Un amigo me contó sobre el tema y pensé que sería interesante.' }] },
    { question: { en: 'Have you had any experience with it so far?', es: '¿Has tenido alguna experiencia con el tema hasta ahora?' }, answers: [{ en: 'I tried it once last year, but I did not have much time.', es: 'Lo probé una vez el año pasado, pero no tuve mucho tiempo.' }, { en: 'I have only seen it online, so I would like to experience it myself.', es: 'Solo lo he visto en internet, así que me gustaría vivir la experiencia.' }] },
    { question: { en: 'What do you think people enjoy most about it?', es: '¿Qué crees que es lo que más disfruta la gente?' }, answers: [{ en: 'They can discover something new and share the experience with other people.', es: 'Pueden descubrir algo nuevo y compartir la experiencia con otras personas.' }, { en: 'It gives them a chance to relax, learn, and spend time together.', es: 'Les da la oportunidad de descansar, aprender y pasar tiempo juntos.' }] },
    { question: { en: 'When would be the best time for us to try it?', es: '¿Cuál sería el mejor momento para intentarlo?' }, answers: [{ en: 'I think next Saturday will work because neither of us has plans.', es: 'Creo que el próximo sábado nos sirve porque ninguno tiene planes.' }, { en: 'Let’s go in the morning, before it gets too busy.', es: 'Vamos por la mañana, antes de que haya demasiada gente.' }] },
    { question: { en: 'What should we find out before we make a decision?', es: '¿Qué debemos averiguar antes de decidir?' }, answers: [{ en: 'We should check the opening times and see how much it will cost.', es: 'Debemos revisar el horario y averiguar cuánto costará.' }, { en: 'Let’s look at the options online and read a few recent reviews.', es: 'Revisemos las opciones en internet y leamos algunas reseñas recientes.' }] },
    { question: { en: 'Would you rather go alone or invite someone else?', es: '¿Preferirías ir solo o invitar a alguien más?' }, answers: [{ en: 'I would invite my cousin because we often enjoy the same activities.', es: 'Invitaría a mi primo porque a menudo disfrutamos las mismas actividades.' }, { en: 'I would rather go with a small group, so we can share ideas.', es: 'Preferiría ir con un grupo pequeño para compartir ideas.' }] },
    { question: { en: 'What could go wrong, and how could we handle it?', es: '¿Qué podría salir mal y cómo lo resolveríamos?' }, answers: [{ en: 'It might rain, so we can check the forecast and bring a light jacket.', es: 'Podría llover, así que podemos revisar el pronóstico y llevar una chamarra ligera.' }, { en: 'We could arrive late, but we can leave earlier and save the address.', es: 'Podríamos llegar tarde, pero podemos salir antes y guardar la dirección.' }] },
    { question: { en: 'What would make the day feel successful to you?', es: '¿Qué haría que consideraras exitoso el día?' }, answers: [{ en: 'I would feel happy if we learned something and did not rush.', es: 'Me sentiría feliz si aprendiéramos algo y no nos apresuráramos.' }, { en: 'It would be a good day if everyone felt included and had fun.', es: 'Sería un buen día si todos se sintieran incluidos y se divirtieran.' }] },
    { question: { en: 'What have you learned while planning this?', es: '¿Qué has aprendido al planear esto?' }, answers: [{ en: 'I have learned that a little planning can make the experience easier.', es: 'He aprendido que planear un poco puede facilitar la experiencia.' }, { en: 'I have found a few useful details that I did not know before.', es: 'He encontrado algunos datos útiles que antes no conocía.' }] },
    { question: { en: 'So, what are we going to do next?', es: 'Entonces, ¿qué haremos ahora?' }, answers: [{ en: 'We are going to check the details, choose a time, and invite our friends.', es: 'Vamos a revisar los detalles, elegir una hora e invitar a nuestros amigos.' }, { en: 'I will compare the options tonight, and we can decide tomorrow.', es: 'Compararé las opciones esta noche y mañana podemos decidir.' }] },
  ],
  B1: [
    { question: { en: 'What first got you interested in {topic}?', es: '¿Qué despertó tu interés por {topicEs}?' }, answers: [{ en: 'I came across an article about it recently, and it raised questions I had never considered.', es: 'Hace poco encontré un artículo sobre el tema y planteó preguntas que nunca había considerado.' }, { en: 'Someone I work with described their experience, which made me want to look into it.', es: 'Un compañero de trabajo describió su experiencia y eso me animó a investigar.' }] },
    { question: { en: 'How much did you already know before we started talking?', es: '¿Cuánto sabías antes de que empezáramos a hablar?' }, answers: [{ en: 'I understood the basics, although I had not thought about how it affects different people.', es: 'Entendía lo básico, aunque no había pensado en cómo afecta a distintas personas.' }, { en: 'I had heard a few opinions, but I had not checked whether they were reliable.', es: 'Había escuchado algunas opiniones, pero no había comprobado si eran confiables.' }] },
    { question: { en: 'Which aspect do you think deserves the most attention?', es: '¿Qué aspecto crees que merece más atención?' }, answers: [{ en: 'The practical side matters, but we should also consider the people who are directly involved.', es: 'El aspecto práctico importa, pero también debemos considerar a las personas directamente involucradas.' }, { en: 'I would focus on the long-term effects rather than judging it by one experience.', es: 'Me enfocaría en los efectos a largo plazo, en vez de juzgarlo por una sola experiencia.' }] },
    { question: { en: 'Have you changed your mind about any part of it?', es: '¿Has cambiado de opinión sobre algún aspecto?' }, answers: [{ en: 'Yes. I used to see it as straightforward, but the details are more complicated than I expected.', es: 'Sí. Antes lo veía como algo sencillo, pero los detalles son más complejos de lo que esperaba.' }, { en: 'Not completely, although I now understand why reasonable people can reach different conclusions.', es: 'No del todo, aunque ahora entiendo por qué personas razonables llegan a conclusiones distintas.' }] },
    { question: { en: 'If we had more time, what would you investigate further?', es: 'Si tuviéramos más tiempo, ¿qué investigarías?' }, answers: [{ en: 'I would speak to people with firsthand experience instead of relying only on summaries.', es: 'Hablaría con personas que tengan experiencia directa, en vez de depender solo de resúmenes.' }, { en: 'I would compare several sources and see where their evidence agrees or differs.', es: 'Compararía varias fuentes para ver en qué coincide o difiere la evidencia.' }] },
    { question: { en: 'What is one challenge people might overlook?', es: '¿Qué desafío podría pasar desapercibido?' }, answers: [{ en: 'They may underestimate the time involved, especially when plans depend on other people.', es: 'Podrían subestimar el tiempo necesario, sobre todo cuando los planes dependen de otras personas.' }, { en: 'A small practical problem can become significant if nobody prepares an alternative.', es: 'Un problema práctico pequeño puede volverse importante si nadie prepara una alternativa.' }] },
    { question: { en: 'How would you explain your point of view to someone who disagrees?', es: '¿Cómo explicarías tu punto de vista a alguien que no está de acuerdo?' }, answers: [{ en: 'I would listen first, then explain what evidence shaped my opinion and acknowledge its limits.', es: 'Primero escucharía; después explicaría qué evidencia formó mi opinión y reconocería sus límites.' }, { en: 'I would ask which part concerns them most and respond to that specific point.', es: 'Preguntaría qué aspecto le preocupa más y respondería a ese punto concreto.' }] },
    { question: { en: 'What would make the next step more manageable?', es: '¿Qué haría más manejable el siguiente paso?' }, answers: [{ en: 'Breaking it into smaller tasks would help us notice problems before they become urgent.', es: 'Dividirlo en tareas pequeñas nos ayudaría a detectar problemas antes de que sean urgentes.' }, { en: 'Setting a realistic deadline would keep us moving without creating unnecessary pressure.', es: 'Fijar una fecha realista nos permitiría avanzar sin generar presión innecesaria.' }] },
    { question: { en: 'What have you taken away from this discussion?', es: '¿Qué te llevas de esta conversación?' }, answers: [{ en: 'I have realized that asking better questions can be more useful than looking for quick answers.', es: 'Me he dado cuenta de que hacer mejores preguntas puede ser más útil que buscar respuestas rápidas.' }, { en: 'I have learned a new perspective, even though I still have some questions.', es: 'He aprendido una perspectiva nueva, aunque todavía tengo algunas preguntas.' }] },
    { question: { en: 'How would you summarize what we should do?', es: '¿Cómo resumirías lo que deberíamos hacer?' }, answers: [{ en: 'We should check reliable information, consider different experiences, and decide on a practical next step.', es: 'Debemos revisar información confiable, considerar distintas experiencias y decidir un paso práctico.' }, { en: 'Let’s stay open to new evidence and adjust the plan if the situation changes.', es: 'Mantengámonos abiertos a nueva evidencia y ajustemos el plan si la situación cambia.' }] },
  ],
  B2: [
    { question: { en: 'What prompted you to suggest {topic} as a subject worth discussing?', es: '¿Qué te llevó a proponer {topicEs} como tema de conversación?' }, answers: [{ en: 'I recently encountered a perspective that challenged my assumptions, so I wanted to examine the issue more carefully.', es: 'Hace poco encontré una perspectiva que cuestionó mis ideas, así que quise analizar el tema con más cuidado.' }, { en: 'It has come up in several conversations, yet people seem to focus on very different aspects.', es: 'Ha surgido en varias conversaciones, aunque la gente parece enfocarse en aspectos muy distintos.' }] },
    { question: { en: 'Which assumptions should we question before reaching a conclusion?', es: '¿Qué supuestos deberíamos cuestionar antes de llegar a una conclusión?' }, answers: [{ en: 'We should distinguish what we know from what we have merely inferred from limited examples.', es: 'Debemos distinguir lo que sabemos de lo que solo hemos inferido a partir de ejemplos limitados.' }, { en: 'It would be misleading to assume that one person’s experience represents everyone’s situation.', es: 'Sería engañoso suponer que la experiencia de una persona representa la situación de todos.' }] },
    { question: { en: 'How would you weigh the potential benefits against the drawbacks?', es: '¿Cómo sopesarías los posibles beneficios frente a las desventajas?' }, answers: [{ en: 'The benefits seem meaningful, provided that the costs and unintended consequences are addressed openly.', es: 'Los beneficios parecen importantes, siempre que se aborden abiertamente los costos y las consecuencias imprevistas.' }, { en: 'I would compare the likely outcomes rather than treating every possible risk as equally serious.', es: 'Compararía los resultados probables, en lugar de tratar todos los riesgos posibles como igual de graves.' }] },
    { question: { en: 'Has any new information caused you to revise your position?', es: '¿Alguna información nueva te ha hecho revisar tu postura?' }, answers: [{ en: 'It has not changed my overall view, but it has made me less certain about one detail.', es: 'No ha cambiado mi opinión general, pero me ha hecho dudar más de un detalle.' }, { en: 'Yes. Once I considered the wider context, my original explanation seemed incomplete.', es: 'Sí. Al considerar el contexto más amplio, mi explicación inicial pareció incompleta.' }] },
    { question: { en: 'What would be a fair way to compare the available options?', es: '¿Cuál sería una manera justa de comparar las opciones disponibles?' }, answers: [{ en: 'We could agree on clear criteria first, then apply the same standards to each option.', es: 'Podríamos acordar criterios claros primero y aplicar el mismo estándar a cada opción.' }, { en: 'A comparison would be more balanced if it included both measurable results and people’s experiences.', es: 'La comparación sería más equilibrada si incluyera resultados medibles y experiencias de las personas.' }] },
    { question: { en: 'Which practical constraints might influence the outcome?', es: '¿Qué limitaciones prácticas podrían influir en el resultado?' }, answers: [{ en: 'Time and access to reliable information could matter more than the ideal plan suggests.', es: 'El tiempo y el acceso a información confiable podrían importar más de lo que sugiere el plan ideal.' }, { en: 'We should account for different needs, since a solution that works for one group may exclude another.', es: 'Debemos considerar distintas necesidades, pues una solución que funciona para un grupo puede excluir a otro.' }] },
    { question: { en: 'How could we respond if our first approach proved ineffective?', es: '¿Cómo responderíamos si nuestro primer enfoque resultara ineficaz?' }, answers: [{ en: 'We should define a point at which we review the evidence and change course if necessary.', es: 'Debemos definir cuándo revisar la evidencia y cambiar de rumbo si hace falta.' }, { en: 'Keeping an alternative available would let us adapt without abandoning the objective.', es: 'Tener una alternativa disponible nos permitiría adaptarnos sin abandonar el objetivo.' }] },
    { question: { en: 'How would you present your view to someone with a different priority?', es: '¿Cómo presentarías tu postura a alguien con prioridades distintas?' }, answers: [{ en: 'I would acknowledge their concern, then explain why I give greater weight to the longer-term impact.', es: 'Reconocería su preocupación y explicaría por qué doy más peso al impacto a largo plazo.' }, { en: 'I would look for shared goals before discussing where our preferred methods diverge.', es: 'Buscaría objetivos comunes antes de hablar de las diferencias entre nuestros métodos preferidos.' }] },
    { question: { en: 'What is the strongest insight you have gained from looking at it this way?', es: '¿Cuál es la idea más valiosa que obtuviste al analizarlo así?' }, answers: [{ en: 'I can see that a well-supported decision still needs to be reviewed as circumstances evolve.', es: 'Veo que incluso una decisión bien fundamentada debe revisarse conforme cambian las circunstancias.' }, { en: 'The discussion has shown me that uncertainty can be managed without pretending it has disappeared.', es: 'La conversación me mostró que podemos gestionar la incertidumbre sin fingir que desapareció.' }] },
    { question: { en: 'What would you recommend as a balanced next step?', es: '¿Qué recomendarías como siguiente paso equilibrado?' }, answers: [{ en: 'I would gather the missing evidence, consult the people affected, and set a date to reassess.', es: 'Reuniría la evidencia faltante, consultaría a las personas afectadas y fijaría una fecha para reevaluar.' }, { en: 'We should test the approach on a manageable scale before making a wider commitment.', es: 'Deberíamos probar el enfoque a una escala manejable antes de asumir un compromiso mayor.' }] },
  ],
  C1: [
    { question: { en: 'What made you consider {topic} worthy of a more sustained discussion?', es: '¿Qué te hizo pensar que {topicEs} merecía una conversación más profunda?' }, answers: [{ en: 'It sits at the intersection of several concerns, and the usual explanations seem to leave important questions unresolved.', es: 'Se relaciona con varias preocupaciones y las explicaciones habituales parecen dejar preguntas importantes sin resolver.' }, { en: 'The issue is often discussed in broad terms, whereas its consequences depend heavily on context.', es: 'A menudo se habla del tema en términos generales, aunque sus consecuencias dependen mucho del contexto.' }] },
    { question: { en: 'Which underlying assumptions are least secure, in your view?', es: '¿Qué supuestos de fondo te parecen menos sólidos?' }, answers: [{ en: 'We may be treating a correlation as an explanation, despite having little evidence about the mechanism involved.', es: 'Quizá estemos tratando una correlación como explicación, pese a tener poca evidencia sobre el mecanismo involucrado.' }, { en: 'The argument presumes that the relevant groups share the same incentives, which may not be the case.', es: 'El argumento presupone que los grupos relevantes comparten incentivos, lo cual podría no ser así.' }] },
    { question: { en: 'How might we frame the trade-offs without overstating our certainty?', es: '¿Cómo plantearíamos las compensaciones sin exagerar nuestra certeza?' }, answers: [{ en: 'We could distinguish established findings from plausible interpretations and make the remaining uncertainty explicit.', es: 'Podríamos distinguir los hallazgos establecidos de las interpretaciones plausibles y explicitar la incertidumbre restante.' }, { en: 'It would help to state which outcomes we prioritize and what evidence would cause us to reconsider.', es: 'Ayudaría declarar qué resultados priorizamos y qué evidencia nos haría reconsiderarlo.' }] },
    { question: { en: 'Has the evidence altered the way you would characterize the issue?', es: '¿La evidencia cambió la manera en que describirías el tema?' }, answers: [{ en: 'It has refined my position rather than reversed it; I now see that the strongest case is conditional.', es: 'Ha afinado mi postura en vez de revertirla; ahora veo que el argumento más sólido es condicional.' }, { en: 'It has persuaded me that the apparent disagreement is partly about definitions, not only about facts.', es: 'Me convenció de que el desacuerdo aparente trata en parte de definiciones, no solo de hechos.' }] },
    { question: { en: 'What evidence would be necessary to distinguish between the competing explanations?', es: '¿Qué evidencia permitiría distinguir entre las explicaciones en competencia?' }, answers: [{ en: 'We would need comparable cases, transparent methods, and enough longitudinal data to separate short-term effects from lasting ones.', es: 'Necesitaríamos casos comparables, métodos transparentes y datos longitudinales suficientes para separar efectos temporales de los duraderos.' }, { en: 'A carefully designed study could test the mechanism directly, although its scope would still need to be acknowledged.', es: 'Un estudio bien diseñado podría probar directamente el mecanismo, aunque habría que reconocer sus límites.' }] },
    { question: { en: 'Whose perspective might be missing from the way this is usually discussed?', es: '¿Qué perspectiva podría faltar en la manera habitual de discutirlo?' }, answers: [{ en: 'The people most affected are sometimes consulted only after the key decisions have already been made.', es: 'A veces se consulta a las personas más afectadas después de que ya se tomaron las decisiones clave.' }, { en: 'We should consider those who bear indirect costs, since their interests may not be represented by the loudest voices.', es: 'Debemos considerar a quienes asumen costos indirectos, pues sus intereses quizá no estén representados por las voces más fuertes.' }] },
    { question: { en: 'If the preferred approach failed, what would a responsible adjustment look like?', es: 'Si el enfoque preferido fallara, ¿cómo sería un ajuste responsable?' }, answers: [{ en: 'We would revisit the assumptions, disclose the unintended effects, and adapt the intervention in light of the new evidence.', es: 'Revisaríamos los supuestos, comunicaríamos los efectos imprevistos y adaptaríamos la intervención ante la nueva evidencia.' }, { en: 'A credible response would preserve the underlying objective while replacing the method that proved ineffective.', es: 'Una respuesta creíble mantendría el objetivo y reemplazaría el método que resultó ineficaz.' }] },
    { question: { en: 'How would you engage with a critic whose priorities differ from yours?', es: '¿Cómo conversarías con alguien crítico cuyas prioridades difieren de las tuyas?' }, answers: [{ en: 'I would first identify the value behind their concern, then explain where our evidence or weighting diverges.', es: 'Primero identificaría el valor detrás de su preocupación y después explicaría dónde difieren la evidencia o las prioridades.' }, { en: 'I would avoid attributing motives and focus instead on the strongest version of their argument.', es: 'Evitaría atribuir motivos y me centraría en la versión más sólida de su argumento.' }] },
    { question: { en: 'What conclusion can we draw without claiming more than the discussion supports?', es: '¿Qué conclusión podemos sacar sin afirmar más de lo que respalda la conversación?' }, answers: [{ en: 'The evidence points in a direction, but the conclusion remains provisional until those gaps have been addressed.', es: 'La evidencia apunta en una dirección, pero la conclusión sigue siendo provisional hasta cubrir esas lagunas.' }, { en: 'We can identify the key conditions for success, even if the final outcome cannot yet be predicted.', es: 'Podemos identificar las condiciones clave para el éxito, aunque aún no se pueda predecir el resultado final.' }] },
    { question: { en: 'What would be a proportionate and defensible recommendation at this stage?', es: '¿Qué recomendación sería proporcionada y defendible en esta etapa?' }, answers: [{ en: 'I would recommend a limited, reviewable step with clear criteria for expansion, revision, or withdrawal.', es: 'Recomendaría un paso limitado y revisable, con criterios claros para ampliarlo, modificarlo o retirarlo.' }, { en: 'We should act on what is established while remaining explicit about the questions that still require investigation.', es: 'Debemos actuar según lo establecido y señalar con claridad qué preguntas requieren más investigación.' }] },
  ],
};

const topicMap: Array<{ pattern: RegExp; en: string; es: string }> = [
  { pattern: /zoo|zoolog|zolog/, en: 'a visit to the zoo', es: 'una visita al zoológico' },
  { pattern: /restaurant|restaurante|comida|meal/, en: 'a meal at a restaurant', es: 'una comida en un restaurante' },
  { pattern: /travel|trip|viaje|vacation|vacaciones/, en: 'a trip', es: 'un viaje' },
  { pattern: /school|escuela|colegio|clase/, en: 'a day at school', es: 'un día en la escuela' },
  { pattern: /work|trabajo|oficina|empleo/, en: 'a day at work', es: 'un día de trabajo' },
  { pattern: /computer|computadora|ordenador|tecnolog/, en: 'computer technology', es: 'la tecnología informática' },
  { pattern: /shopping|compras|tiendas/, en: 'a shopping trip', es: 'un día de compras' },
  { pattern: /soccer|football|f[uú]tbol|deporte|sports?/, en: 'playing a sport', es: 'practicar un deporte' },
  { pattern: /birthday|cumplea[nñ]os|fiesta/, en: 'a birthday celebration', es: 'una celebración de cumpleaños' },
  { pattern: /beach|playa/, en: 'a day at the beach', es: 'un día en la playa' },
  { pattern: /family|familia/, en: 'spending time with family', es: 'pasar tiempo en familia' },
  { pattern: /airport|aeropuerto|flight|vuelo/, en: 'a trip through the airport', es: 'un viaje por el aeropuerto' },
  { pattern: /hotel|hospedaje/, en: 'staying at a hotel', es: 'hospedarse en un hotel' },
  { pattern: /music|concert|m[uú]sica|concierto/, en: 'a live music event', es: 'un evento de música en vivo' },
  { pattern: /doctor|m[eé]dico|hospital|salud/, en: 'a visit to the doctor', es: 'una visita al médico' },
];

const commandPrefixes = [
  /^(?:please\s+)?(?:generate|write|create|make)\s+(?:(?:me|us)\s+)?(?:a|an)?\s*(?:random\s+)?(?:conversation|dialogue)\s*(?:(?:about|on|for|of)\s+)?/i,
  /^(?:por favor\s+)?(?:genera(?:r)?|crea(?:r)?|escribe|escribir)\s+(?:una?\s+)?(?:conversaci[oó]n|convesaci[oó]n|di[aá]logo)\s*(?:(?:sobre|acerca de|de|para)\s+)?/i,
  /^(?:conversaci[oó]n|convesaci[oó]n|di[aá]logo)\s+(?:sobre|acerca de|de|about)\s+/i,
];

function resolveTopic(request: string) {
  let topic = request.trim();
  for (const prefix of commandPrefixes) topic = topic.replace(prefix, '');
  topic = topic.replace(/^[\s:;,.-]+|[\s?!.]+$/g, '').trim();
  if (!topic) return null;
  const normalized = topic.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const mapped = topicMap.find(item => item.pattern.test(normalized));
  if (mapped) return mapped;
  return { en: topic, es: topic };
}

function fillTemplate(value: string, topic: { en: string; es: string }) {
  return value.split('{topic}').join(topic.en).split('{topicEs}').join(topic.es);
}

export default function RandomConversationGenerator({ level }: { level: LearningLevel }) {
  const [request, setRequest] = useState('');
  const [lines, setLines] = useState<GeneratedLine[]>([]);
  const [topicTitle, setTopicTitle] = useState('');
  const [showSpanish, setShowSpanish] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const wordCount = useMemo(() => lines.reduce((total, line) => total + line.en.split(/\s+/).length, 0), [lines]);
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 145));

  const generate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const topic = resolveTopic(request);
    if (!topic) {
      setError('Escribe el tema que quieres conversar.');
      setLines([]);
      return;
    }
    const [firstSpeaker, secondSpeaker] = participants[Math.floor(Math.random() * participants.length)];
    const conversation = levels[level].flatMap((exchange, index) => {
      const response = exchange.answers[Math.floor(Math.random() * exchange.answers.length)];
      const speaker = index % 2 === 0 ? firstSpeaker : secondSpeaker;
      const otherSpeaker = index % 2 === 0 ? secondSpeaker : firstSpeaker;
      return [
        { speaker, en: fillTemplate(exchange.question.en, topic), es: fillTemplate(exchange.question.es, topic) },
        { speaker: otherSpeaker, en: fillTemplate(response.en, topic), es: fillTemplate(response.es, topic) },
      ];
    });
    const opening: GeneratedLine = {
      speaker: firstSpeaker,
      en: `Hi! I’m ${firstSpeaker}. I’m glad we can talk about ${topic.en} today.`,
      es: `¡Hola! Soy ${firstSpeaker}. Me da gusto que hoy podamos hablar de ${topic.es}.`,
    };
    const closing: GeneratedLine = {
      speaker: secondSpeaker,
      en: 'Thanks for the conversation. I have a clearer idea and something new to think about.',
      es: 'Gracias por la conversación. Ahora tengo una idea más clara y algo nuevo en qué pensar.',
    };
    setLines([opening, ...conversation, closing]);
    setTopicTitle(topic.en);
    setShowSpanish(false);
    setError('');
  };

  return (
    <section className="mt-7 rounded-2xl border border-blue-200/15 bg-slate-950/25 p-4 sm:p-6" aria-labelledby="random-conversation-title">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-blue-500/20 p-2.5 text-blue-100"><MessageCircle aria-hidden="true" /></span>
        <div>
          <h3 id="random-conversation-title" className="text-lg font-bold text-white">Conversación aleatoria · {level}</h3>
          <p className="mt-1 text-sm text-blue-100">Escribe una solicitud o solo el tema. Genera un diálogo de unos dos minutos, adaptado al nivel.</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={generate} className="mt-4 space-y-3">
        <label htmlFor={`conversation-topic-${level}`} className="block text-sm font-semibold text-white">Tema de la conversación</label>
        <textarea
          id={`conversation-topic-${level}`}
          value={request}
          maxLength={180}
          rows={2}
          onChange={event => setRequest(event.target.value)}
          placeholder="Ej.: Genera una conversación sobre una visita al zoológico"
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          aria-describedby={`conversation-help-${level}`}
        />
        <p id={`conversation-help-${level}`} className="text-xs text-blue-100">Nivel {level} · Aproximadamente 2 minutos · Se genera localmente con plantillas, sin usar IA externa.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!request.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            <Dices size={18} aria-hidden="true" /> Generar conversación
          </button>
          {lines.length > 0 && <button type="button" onClick={() => formRef.current?.requestSubmit()} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Generar otra</button>}
          {lines.length > 0 && <button type="button" onClick={() => setShowSpanish(value => !value)} aria-pressed={showSpanish} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">{showSpanish ? 'Ocultar español' : 'Mostrar español'}</button>}
          {lines.length > 0 && <span className="text-xs text-blue-100">{wordCount} palabras · {estimatedMinutes} min aprox.</span>}
        </div>
      </form>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-amber-200">{error}</p>}
      {lines.length > 0 && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h4 className="mb-4 text-base font-bold text-white">{topicTitle} <span className="font-normal text-blue-200">· {level} · {estimatedMinutes} min</span></h4>
          <ol className="space-y-3">
            {lines.map((line, index) => <li key={`${index}-${line.speaker}`} className={`rounded-lg px-3 py-2.5 ${index % 2 === 0 ? 'bg-blue-500/10' : 'bg-white/5'}`}>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-200">{line.speaker}</p>
              <p className="text-sm leading-relaxed text-white">{line.en}</p>
              {showSpanish && <p className="mt-1 text-sm leading-relaxed text-blue-100">{line.es}</p>}
            </li>)}
          </ol>
        </div>
      )}
    </section>
  );
}
