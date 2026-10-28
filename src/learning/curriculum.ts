import { additionalListeningActivities } from '../data/additionalListeningActivities';
import { listeningStories } from '../data/listeningStories';
import { learningLevels, type ChoiceExercise, type LearningLevel, type LearningUnit } from './types';

type GrammarSeed = {
  title: string; rule: string; examples: [string, string, string, string];
  prompt: string; correct: string; wrong: [string, string]; why: string;
};

const grammarByLevel: Record<LearningLevel, GrammarSeed[]> = {
  A1: [
    { title:'Be: introductions', rule:'Usa am con I, is con he/she/it y are con you/we/they. En preguntas, be va antes del sujeto.', examples:['I am a student.','Soy estudiante.','Are they at home?','¿Están en casa?'], prompt:'Complete: She ___ my new teacher.', correct:'is', wrong:['are','am'], why:'Con she se usa is.' },
    { title:'Present simple: routines', rule:'El presente simple expresa hábitos. Añade -s o -es a la tercera persona singular.', examples:['He works every day.','Él trabaja todos los días.','We study after lunch.','Estudiamos después de comer.'], prompt:'Complete: My brother ___ early.', correct:'gets up', wrong:['get up','getting up'], why:'My brother equivale a he; el verbo lleva -s.' },
    { title:'Articles and plurals', rule:'Usa a/an para un sustantivo singular no específico; usa the para algo conocido. Muchos plurales añaden -s.', examples:['She has an orange.','Ella tiene una naranja.','The books are new.','Los libros son nuevos.'], prompt:'Choose the correct phrase:', correct:'an apple', wrong:['a apple','apples a'], why:'Apple empieza con sonido vocálico, por eso se usa an.' },
    { title:'There is / There are', rule:'There is presenta un elemento singular; there are presenta varios.', examples:['There is a park nearby.','Hay un parque cerca.','There are two windows.','Hay dos ventanas.'], prompt:'Complete: ___ three chairs in the room.', correct:'There are', wrong:['There is','They is'], why:'Three chairs es plural; corresponde there are.' },
    { title:'Prepositions of place', rule:'In indica dentro; on, sobre una superficie; under, debajo; next to, al lado.', examples:['The keys are on the table.','Las llaves están sobre la mesa.','The cat is under the chair.','El gato está debajo de la silla.'], prompt:'The book is ___ the bag (inside).', correct:'in', wrong:['on','between'], why:'In expresa que algo está dentro de otra cosa.' },
    { title:'Countable nouns: some / any', rule:'Some suele usarse en afirmaciones y any en preguntas y negativas con sustantivos contables plurales.', examples:['I have some apples.','Tengo algunas manzanas.','Do you have any pencils?','¿Tienes lápices?'], prompt:'We do not have ___ eggs.', correct:'any', wrong:['some','a'], why:'Any es la opción habitual en una oración negativa.' },
    { title:'Adverbs of frequency', rule:'Usually, often y never suelen ir antes del verbo principal, pero después de be.', examples:['She often walks to work.','Ella suele caminar al trabajo.','He is always kind.','Él siempre es amable.'], prompt:'Choose the natural order:', correct:'They usually eat at home.', wrong:['They eat usually at home.','Usually they are eat home.'], why:'Usually va antes del verbo principal eat.' },
    { title:'Questions with do / does', rule:'En preguntas de presente simple usa do con I/you/we/they y does con he/she/it; después va el verbo base.', examples:['Do you like tea?','¿Te gusta el té?','Does Ana live here?','¿Ana vive aquí?'], prompt:'___ your sister speak English?', correct:'Does', wrong:['Do','Is'], why:'Your sister es tercera persona singular; se usa does.' },
    { title:'Can / can’t for ability', rule:'Can expresa habilidad o posibilidad. Mantiene la misma forma con todos los sujetos y va seguido del verbo base.', examples:['I can swim.','Sé nadar.','He can’t drive.','Él no sabe conducir.'], prompt:'Complete: Birds ___ fly.', correct:'can', wrong:['cans','are can'], why:'Can no cambia y va directamente antes del verbo base.' },
    { title:'Imperatives and instructions', rule:'Las instrucciones afirmativas usan el verbo base. Para negarlas, usa don’t + verbo base.', examples:['Turn left at the bank.','Gira a la izquierda en el banco.','Don’t open the window.','No abras la ventana.'], prompt:'Give a negative instruction:', correct:'Don’t touch the hot pan.', wrong:['Doesn’t touch the hot pan.','Not touching the hot pan.'], why:'El imperativo negativo se forma con don’t + verbo base.' },
  ],
  A2: [
    { title:'Past simple: regular verbs', rule:'Para verbos regulares, añade -ed en afirmativo. Algunos cambios ortográficos duplican consonantes o cambian y por i.', examples:['We visited the museum.','Visitamos el museo.','She studied last night.','Ella estudió anoche.'], prompt:'Yesterday, I ___ my aunt.', correct:'visited', wrong:['visit','visiting'], why:'El marcador yesterday pide pasado; visit es regular y forma visited.' },
    { title:'Past simple: irregular verbs', rule:'Los verbos irregulares tienen formas propias en pasado y deben aprenderse en contexto.', examples:['They went home early.','Ellos se fueron a casa temprano.','I bought fresh bread.','Compré pan fresco.'], prompt:'Last week, he ___ a new phone.', correct:'bought', wrong:['buyed','buys'], why:'Buy es irregular: su pasado es bought.' },
    { title:'Past questions and negatives', rule:'Usa did/didn’t + verbo base. Did marca el pasado, así que el verbo principal no lleva -ed.', examples:['Did you call Sam?','¿Llamaste a Sam?','We didn’t miss the bus.','No perdimos el autobús.'], prompt:'She didn’t ___ the email.', correct:'read', wrong:['readed','reads'], why:'Después de didn’t se usa la forma base read.' },
    { title:'Comparatives', rule:'Compara dos elementos con -er o more + adjetivo, seguido de than. Algunos adjetivos son irregulares.', examples:['This route is shorter than that one.','Esta ruta es más corta que esa.','The train is more comfortable than the bus.','El tren es más cómodo que el autobús.'], prompt:'This bag is ___ than mine (heavy).', correct:'heavier', wrong:['more heavy','heaviest'], why:'Heavy cambia y por i y añade -er: heavier.' },
    { title:'Superlatives', rule:'Usa the + -est o the most para destacar un elemento dentro de un grupo.', examples:['It is the tallest building here.','Es el edificio más alto de aquí.','That was the most useful lesson.','Esa fue la lección más útil.'], prompt:'Mount Everest is ___ mountain in the world.', correct:'the highest', wrong:['higher','the most high'], why:'Para el superlativo de high se usa the highest.' },
    { title:'Future plans: going to', rule:'Usa be going to + verbo base para intenciones o planes ya decididos.', examples:['I am going to cook tonight.','Voy a cocinar esta noche.','They are going to travel in June.','Van a viajar en junio.'], prompt:'We ___ visit our cousins tomorrow.', correct:'are going to', wrong:['going','is going to'], why:'We se combina con are going to.' },
    { title:'Will for predictions and offers', rule:'Will + verbo base expresa predicciones, decisiones espontáneas y ofrecimientos.', examples:['I think it will rain.','Creo que lloverá.','I will carry that bag for you.','Te llevaré esa bolsa.'], prompt:'The phone is ringing. I ___ answer it.', correct:'will', wrong:['am will','will to'], why:'La decisión espontánea se expresa con will + verbo base.' },
    { title:'Should and have to', rule:'Should da consejos; have to expresa una obligación. Ambos se siguen de un verbo base.', examples:['You should rest today.','Deberías descansar hoy.','We have to wear a uniform.','Tenemos que usar uniforme.'], prompt:'It is a good idea to drink more water. You ___ drink more water.', correct:'should', wrong:['have','should to'], why:'Should introduce una recomendación y no lleva to.' },
    { title:'Present continuous for arrangements', rule:'El presente continuo puede expresar un plan futuro ya organizado, a menudo con fecha u hora.', examples:['I am meeting Jo at six.','Me reuniré con Jo a las seis.','We are flying on Friday.','Volamos el viernes.'], prompt:'They ___ dinner with us tonight.', correct:'are having', wrong:['have','is having'], why:'They usa are; el presente continuo describe un arreglo futuro.' },
    { title:'First conditional', rule:'If + presente simple, will + verbo base expresa un resultado futuro posible.', examples:['If it rains, we will stay inside.','Si llueve, nos quedaremos dentro.','You will feel better if you rest.','Te sentirás mejor si descansas.'], prompt:'If she calls, I ___ her the news.', correct:'will tell', wrong:['tell will','would tell'], why:'La cláusula principal usa will + verbo base.' },
  ],
  B1: [
    { title:'Present perfect: experiences', rule:'Have/has + participio describe experiencias sin indicar un momento terminado concreto.', examples:['I have visited London twice.','He visitado Londres dos veces.','She has never tried sushi.','Ella nunca ha probado sushi.'], prompt:'___ you ever ___ a horse?', correct:'Have / ridden', wrong:['Did / rode','Has / ride'], why:'Ever pregunta por experiencias; se usa have + participio ridden.' },
    { title:'Present perfect vs. past simple', rule:'Usa past simple con un tiempo pasado terminado; present perfect cuando el periodo sigue vigente o no se especifica cuándo.', examples:['I saw him yesterday.','Lo vi ayer.','I have seen him this week.','Lo he visto esta semana.'], prompt:'I ___ her last night.', correct:'called', wrong:['have called','have call'], why:'Last night es un momento terminado; se usa past simple.' },
    { title:'For and since', rule:'For indica duración; since indica el punto de inicio de una situación que continúa.', examples:['We have lived here for a year.','Hemos vivido aquí durante un año.','He has worked here since May.','Él trabaja aquí desde mayo.'], prompt:'She has studied English ___ 2022.', correct:'since', wrong:['for','during'], why:'2022 es el punto de inicio; se usa since.' },
    { title:'Used to for past habits', rule:'Used to + verbo base describe hábitos o estados pasados que ya no son habituales.', examples:['I used to walk to school.','Antes caminaba a la escuela.','This shop used to be a cinema.','Esta tienda antes era un cine.'], prompt:'We ___ live near the beach, but we moved.', correct:'used to', wrong:['use to','are used to'], why:'Used to describe una situación habitual pasada que cambió.' },
    { title:'Second conditional', rule:'If + past simple, would + verbo base habla de situaciones hipotéticas o poco probables.', examples:['If I had more time, I would learn Italian.','Si tuviera más tiempo, aprendería italiano.','She would travel if she could.','Ella viajaría si pudiera.'], prompt:'If he ___ taller, he would play basketball.', correct:'were', wrong:['is','will be'], why:'La condición hipotética usa past simple; en estilo formal se usa were.' },
    { title:'Passive voice: present and past', rule:'La pasiva pone el foco en la acción o el resultado: be conjugado + participio.', examples:['Coffee is grown in many countries.','El café se cultiva en muchos países.','The bridge was built in 1920.','El puente fue construido en 1920.'], prompt:'The letters ___ yesterday.', correct:'were delivered', wrong:['delivered','was delivered'], why:'Letters es plural y yesterday requiere pasado: were + participio.' },
    { title:'Reported speech', rule:'Al reportar palabras pasadas, a menudo el tiempo verbal retrocede: present simple → past simple.', examples:['“I feel tired.” → He said he felt tired.','“Estoy cansado.” → Dijo que estaba cansado.','“We live here.” → They said they lived there.','“Vivimos aquí.” → Dijeron que vivían allí.'], prompt:'“I like this song.” → She said she ___ that song.', correct:'liked', wrong:['likes','has liked'], why:'Al reportar un dicho en pasado, like normalmente cambia a liked.' },
    { title:'Defining relative clauses', rule:'Who introduce información sobre personas; which sobre cosas; that puede referirse a ambos.', examples:['The woman who called is my aunt.','La mujer que llamó es mi tía.','This is the book that I mentioned.','Este es el libro que mencioné.'], prompt:'The mechanic ___ fixed my car was helpful.', correct:'who', wrong:['where','whose'], why:'Who se refiere a la persona que realizó la acción.' },
    { title:'Past continuous and past simple', rule:'Past continuous describe una acción en progreso; past simple marca un evento que la interrumpe.', examples:['I was cooking when you called.','Estaba cocinando cuando llamaste.','They were walking when it began to rain.','Caminaban cuando empezó a llover.'], prompt:'While we ___, the lights went out.', correct:'were studying', wrong:['studied','are studying'], why:'While presenta la acción que estaba en progreso: were studying.' },
    { title:'Present perfect continuous', rule:'Have/has been + verbo -ing destaca duración o actividad reciente con efecto presente.', examples:['I have been waiting for an hour.','Llevo una hora esperando.','She has been working all morning.','Ella lleva trabajando toda la mañana.'], prompt:'He is tired because he ___ all day.', correct:'has been driving', wrong:['is driving','have driven'], why:'La actividad prolongada con un resultado presente usa has been + -ing.' },
  ],
  B2: [
    { title:'Third conditional', rule:'If + past perfect, would have + participio imagina un resultado pasado diferente.', examples:['If we had left earlier, we would have caught the train.','Si hubiéramos salido antes, habríamos alcanzado el tren.','She would have passed if she had revised.','Habría aprobado si hubiera repasado.'], prompt:'If they had booked, they ___ a room.', correct:'would have found', wrong:['will find','would find'], why:'El resultado hipotético pasado requiere would have + participio.' },
    { title:'Mixed conditionals', rule:'Combina tiempos de dos tipos de condicional para relacionar una condición pasada con un resultado presente.', examples:['If I had slept, I would feel better now.','Si hubiera dormido, ahora me sentiría mejor.','He would be here if he had taken the earlier train.','Estaría aquí si hubiera tomado el tren anterior.'], prompt:'If she had accepted the job, she ___ in Paris now.', correct:'would be', wrong:['would have been','will be'], why:'Una condición pasada tiene un resultado presente: would + base.' },
    { title:'Modals of deduction', rule:'Must expresa una deducción fuerte; might/may una posibilidad; can’t una conclusión casi imposible.', examples:['The lights are off; they must be asleep.','Las luces están apagadas; deben de estar dormidos.','That can’t be the right address.','Esa no puede ser la dirección correcta.'], prompt:'He knows every answer. He ___ studied a lot.', correct:'must have', wrong:['must be','can’t have'], why:'La deducción sobre una acción pasada se forma con must have + participio.' },
    { title:'Reported questions', rule:'En preguntas indirectas el orden es sujeto + verbo; no se usa la inversión de la pregunta directa.', examples:['She asked where I lived.','Ella preguntó dónde vivía.','He wondered if the shop was open.','Se preguntó si la tienda estaba abierta.'], prompt:'“Where is the station?” → She asked me where the station ___.', correct:'was', wrong:['was it','is'], why:'La pregunta indirecta conserva el orden sujeto-verbo.' },
    { title:'Passive reporting structures', rule:'It is said that… y He is believed to… permiten reportar afirmaciones sin destacar quién las dice.', examples:['It is believed that the painting is genuine.','Se cree que la pintura es auténtica.','The actor is said to live abroad.','Se dice que el actor vive en el extranjero.'], prompt:'The bridge ___ to be over 200 years old.', correct:'is thought', wrong:['thinks','is thinking'], why:'La estructura de reporte impersonal usa be + participio.' },
    { title:'Gerunds and infinitives', rule:'Algunos verbos van seguidos de -ing y otros de to + infinitivo; en ciertos casos el significado cambia.', examples:['She suggested taking a taxi.','Ella sugirió tomar un taxi.','We decided to wait.','Decidimos esperar.'], prompt:'They avoided ___ about the mistake.', correct:'talking', wrong:['to talk','talk'], why:'Avoid va seguido de un gerundio (-ing).' },
    { title:'Future perfect and continuous', rule:'Future perfect mira una acción terminada antes de un punto futuro; future continuous una acción en curso en ese momento.', examples:['By June, I will have finished the course.','Para junio, habré terminado el curso.','At noon, we will be travelling.','Al mediodía estaremos viajando.'], prompt:'By next year, she ___ her degree.', correct:'will have completed', wrong:['will complete','will be completing'], why:'By next year marca un límite para usar future perfect.' },
    { title:'Concession and contrast', rule:'Although/even though introducen una concesión; despite/in spite of van con sustantivo o gerundio.', examples:['Although it was late, we continued.','Aunque era tarde, continuamos.','Despite the rain, they played.','A pesar de la lluvia, jugaron.'], prompt:'___ being tired, he finished the report.', correct:'Despite', wrong:['Although','However'], why:'Despite va seguido de gerundio o sustantivo, no de una cláusula completa.' },
    { title:'Participle clauses', rule:'Una cláusula participial puede condensar información cuando comparte el sujeto con la oración principal.', examples:['Having checked the figures, she sent the report.','Tras comprobar las cifras, envió el informe.','Built in 1890, the station is still in use.','Construida en 1890, la estación todavía se utiliza.'], prompt:'___ all the evidence, the jury reached a decision.', correct:'Having considered', wrong:['Have considered','To considering'], why:'Having + participio indica una acción completada antes de la principal.' },
    { title:'Cleft sentences for emphasis', rule:'It-clefts (It is/was… that/who…) enfocan un elemento específico de la oración.', examples:['It was Maya who found the key.','Fue Maya quien encontró la llave.','It is the timing that matters most.','Lo que más importa es el momento.'], prompt:'___ the final chapter that changed my opinion.', correct:'It was', wrong:['There was','Was it'], why:'It was… that destaca el elemento que cambió la opinión.' },
  ],
  C1: [
    { title:'Inversion after negative adverbials', rule:'Expresiones negativas iniciales como never o rarely provocan inversión auxiliar-sujeto para dar énfasis formal.', examples:['Never have I seen such a view.','Nunca había visto una vista así.','Rarely does the committee agree so quickly.','Rara vez el comité está de acuerdo tan rápido.'], prompt:'Rarely ___ such a convincing argument.', correct:'have we heard', wrong:['we have heard','did we heard'], why:'Rarely al inicio exige inversión: auxiliar + sujeto + participio.' },
    { title:'Mixed conditionals: perspective', rule:'Elige la combinación de tiempos según la relación temporal entre la condición y su consecuencia.', examples:['If she were more patient, she would have waited.','Si fuera más paciente, habría esperado.','If I had taken that path, I would live abroad now.','Si hubiera tomado ese camino, ahora viviría en el extranjero.'], prompt:'If he ___ more attentive, he would not have missed the clue.', correct:'were', wrong:['had been','would be'], why:'La característica presente (were attentive) explica una consecuencia pasada.' },
    { title:'Hedging and cautious claims', rule:'Hedging con may, appears to, tends to y adverbios limita el alcance y la certeza de una afirmación.', examples:['The results may indicate a modest change.','Los resultados podrían indicar un cambio moderado.','The approach appears to reduce delays.','El enfoque parece reducir los retrasos.'], prompt:'The evidence ___ suggest a link, but it is not conclusive.', correct:'may', wrong:['must','will'], why:'May expresa una posibilidad cautelosa, adecuada si la evidencia no concluye.' },
    { title:'Nominalisation in formal writing', rule:'La nominalización convierte acciones o cualidades en sustantivos y permite condensar ideas en registros formales.', examples:['The team decided to revise the plan. → The team’s decision led to a revision.','El equipo decidió revisar el plan. → La decisión del equipo llevó a una revisión.','They failed to comply. → Their failure to comply was recorded.','No cumplieron. → Se registró su incumplimiento.'], prompt:'Choose a concise nominalisation of “They refused to cooperate.”', correct:'Their refusal to cooperate', wrong:['They refusing cooperation','Their refused to cooperate'], why:'Refusal es el sustantivo derivado de refuse.' },
    { title:'Participle clauses and reference', rule:'El sujeto tácito de una cláusula participial debe coincidir claramente con el sujeto de la principal para evitar dangling modifiers.', examples:['Having reviewed the data, the analyst revised the forecast.','Tras revisar los datos, el analista revisó la previsión.','Written in plain language, the guide is accessible.','Escrita en lenguaje claro, la guía es accesible.'], prompt:'Which sentence has a clear participle-clause subject?', correct:'After reviewing the data, the analyst revised the forecast.', wrong:['After reviewing the data, the forecast was revised.','Reviewing the data, the forecast changed.'], why:'El analista, sujeto de la principal, es quien revisó los datos.' },
    { title:'Subjunctive in formal recommendations', rule:'En recomendaciones formales, suggest/require + that suele usar el verbo base, incluso con sujetos singulares.', examples:['The panel recommended that he be consulted.','El panel recomendó que lo consultaran.','They insisted that the report include limitations.','Insistieron en que el informe incluyera limitaciones.'], prompt:'The committee requires that each applicant ___ present.', correct:'be', wrong:['is','was'], why:'Después de require that se usa subjuntivo: la forma base be.' },
    { title:'Advanced articles and reference', rule:'Usa the cuando el contexto identifica una entidad específica; omite el artículo en generalizaciones con plurales o incontables.', examples:['The research changed the policy.','La investigación cambió la política.','Research takes time.','La investigación requiere tiempo.'], prompt:'___ information in this appendix is confidential.', correct:'The', wrong:['An','— (no article)'], why:'In this appendix identifica información específica; corresponde the.' },
    { title:'Concessive inversion', rule:'Formalmente, una concesión puede formarse con adjetivo o adverbio + as/though + sujeto + verbo.', examples:['Tired as she was, she continued.','Aunque estaba cansada, continuó.','Much as I admire the design, it is impractical.','Aunque admiro mucho el diseño, no es práctico.'], prompt:'___ the task was, they completed it.', correct:'Difficult as', wrong:['Although difficult','Despite difficult'], why:'El adjetivo al inicio seguido de as forma una concesión formal.' },
    { title:'Ellipsis and substitution', rule:'So, neither, do so y one/ones sustituyen material recuperable y evitan repeticiones sin perder claridad.', examples:['Mina speaks French, and so does Leo.','Mina habla francés y Leo también.','I chose the blue folder, not the red one.','Elegí la carpeta azul, no la roja.'], prompt:'“I enjoyed the lecture.” “___ did I.”', correct:'So', wrong:['Neither','Such'], why:'So did I expresa acuerdo con una afirmación positiva.' },
    { title:'Discourse markers and cohesion', rule:'Conectores como nevertheless, consequently y insofar as expresan relaciones lógicas precisas entre argumentos.', examples:['The sample was small; nevertheless, the pattern merits study.','La muestra fue pequeña; aun así, el patrón merece estudio.','Costs fell, consequently improving access.','Los costos bajaron, lo que mejoró el acceso.'], prompt:'The evidence is limited; ___, the finding deserves replication.', correct:'nevertheless', wrong:['therefore','for instance'], why:'Nevertheless marca contraste entre evidencia limitada y relevancia del hallazgo.' },
  ],
};

const storyLibrary = [...listeningStories, ...additionalListeningActivities];
const skillOrder = ['grammar', 'reading', 'listening', 'speaking'] as const;
const speakingRubric = [
  { criterion: 'Idea completa', descriptionEs: 'Responde a la situación y desarrolla una idea comprensible.' },
  { criterion: 'Gramática', descriptionEs: 'Aplica la estructura de esta unidad; los errores no impiden entenderte.' },
  { criterion: 'Vocabulario', descriptionEs: 'Usa palabras y expresiones pertinentes al tema.' },
  { criterion: 'Claridad oral', descriptionEs: 'Habla con ritmo y pronunciación suficientemente claros para comunicar el mensaje.' },
];
const expressionsByLevel: Record<LearningLevel, Array<[string, string]>> = {
  A1: [['good morning','buenos días'],['nice to meet you','mucho gusto'],['at seven o’clock','a las siete'],['next to','al lado de'],['a cup of','una taza de'],['go to school','ir a la escuela'],['by bus','en autobús'],['Can I…?','¿Puedo…?'],['turn left','gira a la izquierda'],['look for','buscar']],
  A2: [['last week','la semana pasada'],['look after','cuidar de'],['run out of','quedarse sin'],['be going to','ir a / tener pensado'],['be interested in','tener interés en'],['have to','tener que'],['take the bus','tomar el autobús'],['at the moment','en este momento'],['as soon as','tan pronto como'],['get home','llegar a casa']],
  B1: [['used to','solía'],['take part in','participar en'],['since then','desde entonces'],['find out','averiguar'],['get along with','llevarse bien con'],['look forward to','esperar con ilusión'],['even though','aunque'],['in the end','al final'],['by the time','para cuando'],['make a decision','tomar una decisión']],
  B2: [['on the other hand','por otro lado'],['take into account','tener en cuenta'],['carry out','llevar a cabo'],['in contrast','en contraste'],['in charge of','a cargo de'],['bring about','provocar'],['as a result','como resultado'],['in the long run','a largo plazo'],['provided that','siempre que'],['rather than','en lugar de']],
  C1: [['in light of','a la luz de'],['to a lesser extent','en menor medida'],['call into question','poner en duda'],['account for','dar cuenta de / explicar'],['on balance','en conjunto'],['with regard to','con respecto a'],['in conjunction with','junto con'],['by no means','de ninguna manera'],['take precedence','tener prioridad'],['under scrutiny','bajo escrutinio']],
};

function makeExercise(id: string, prompt: string, correct: string, wrong: [string, string], explanationEs: string, position: number): ChoiceExercise {
  const options = [...wrong];
  const answerIndex = position % 3;
  options.splice(answerIndex, 0, correct);
  return { id, prompt, options, answerIndex, explanationEs };
}

function makeComprehensionQuestions(story: (typeof storyLibrary)[number], unitId: string): ChoiceExercise[] {
  return story.questions.map((question, index) => ({
    id: `${unitId}-q${index + 1}`,
    prompt: question.prompt,
    options: question.options,
    answerIndex: question.answer,
    explanationEs: `La opción correcta está respaldada por el texto: “${question.options[question.answer]}”.`,
  }));
}

function reorderWords(text: string, shift: number) {
  const words = text.split(/\s+/);
  if (words.length < 2) return `${text} ${text.toLowerCase()}`;
  const offset = (shift % (words.length - 1)) + 1;
  return [...words.slice(offset), ...words.slice(0, offset)].join(' ');
}

function makeGrammarExercises(unitId: string, grammar: GrammarSeed, peers: GrammarSeed[], position: number): ChoiceExercise[] {
  const otherTopics = peers.filter(item => item !== grammar);
  const exercises = [
    makeExercise(`${unitId}-grammar-01`, grammar.prompt, grammar.correct, grammar.wrong, grammar.why, position),
    ...([0, 2] as const).map((exampleIndex, index) => makeExercise(
      `${unitId}-grammar-${String(index + 2).padStart(2, '0')}`,
      `¿Qué significa “${grammar.examples[exampleIndex]}”?`,
      grammar.examples[exampleIndex + 1],
      [otherTopics[index].examples[1], otherTopics[index + 2].examples[1]],
      `“${grammar.examples[exampleIndex]}” significa “${grammar.examples[exampleIndex + 1]}”.`,
      position + index + 1,
    )),
    ...([0, 2] as const).map((exampleIndex, index) => makeExercise(
      `${unitId}-grammar-${String(index + 4).padStart(2, '0')}`,
      `¿Qué regla gramatical se usa en “${grammar.examples[exampleIndex]}”?`,
      grammar.rule,
      [otherTopics[index].rule, otherTopics[index + 2].rule],
      `La oración aplica esta regla: ${grammar.rule}`,
      position + index + 3,
    )),
  ];

  const questionFrames = [
    `Elige la oración que ejemplifica «${grammar.title}».`,
    `¿Cuál opción aplica la regla «${grammar.title}»?`,
    `Identifica un ejemplo correcto de «${grammar.title}».`,
    `¿Qué oración practica el punto «${grammar.title}»?`,
    `Selecciona la frase que corresponde a «${grammar.title}».`,
  ];
  for (let index = 0; index < 20; index += 1) {
    const exampleIndex = index % 2 === 0 ? 0 : 2;
    const answer = grammar.examples[exampleIndex];
    const firstDistractor = reorderWords(answer, index + 1);
    let secondDistractor = reorderWords(answer, index + 3);
    if (secondDistractor === firstDistractor) secondDistractor = `${reorderWords(answer, index + 4)} …`;
    exercises.push(makeExercise(
      `${unitId}-grammar-${String(index + 6).padStart(2, '0')}`,
      questionFrames[index % questionFrames.length],
      answer,
      [firstDistractor, secondDistractor],
      `“${answer}” conserva el orden gramatical correcto para ${grammar.title}; las otras opciones alteran el orden de las palabras.`,
      position + index + 5,
    ));
  }
  return exercises;
}

function vocabularyFor(story: (typeof storyLibrary)[number], level: LearningLevel, index: number) {
  const words = story.paragraphs.join(' ').match(/[A-Za-z']{4,}/g) ?? [];
  const seen = new Set<string>();
  const found: Array<{ term: string; meaningEs: string; kind: 'word' | 'expression' }> = [];
  for (const token of words) {
    const key = token.toLowerCase().replace(/['’]s$/i, '');
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ term: token, meaningEs: 'Abre esta sección para cargar la traducción desde el diccionario.', kind: 'word' });
    if (found.length === 5) break;
  }
  const expression = expressionsByLevel[level][index];
  if (expression) found.push({ term: expression[0], meaningEs: expression[1], kind: 'expression' });
  return found;
}

function buildUnit(level: LearningLevel, unitNumber: number, grammar: GrammarSeed, story: (typeof storyLibrary)[number], peers: GrammarSeed[]): LearningUnit {
  const id = `${level.toLowerCase()}-unit-${String(unitNumber).padStart(2, '0')}`;
  const comprehension = makeComprehensionQuestions(story, id);
  const grammarExercises = makeGrammarExercises(id, grammar, peers, unitNumber);
  if (grammarExercises.length !== 25) throw new Error(`La unidad ${id} debe incluir 25 ejercicios para ${grammar.title}.`);
  const transcript = story.paragraphs.join('\n\n');
  const modelSentence = story.paragraphs[0].split(/(?<=[.!?])\s+/)[0];
  return {
    id,
    level,
    unitNumber,
    title: `${String(unitNumber).padStart(2, '0')}. ${grammar.title}`,
    objectives: [
      `Usar ${grammar.title.toLowerCase()} en oraciones propias.`,
      `Comprender la idea principal y detalles de “${story.title}”.`,
      'Expresar una respuesta oral clara sobre la situación de la unidad.',
    ],
    grammarTopics: [grammar.title],
    vocabulary: vocabularyFor(story, level, unitNumber - 1),
    activities: {
      grammar: {
        explanationEs: grammar.rule,
        examples: [
          { english: grammar.examples[0], spanish: grammar.examples[1] },
          { english: grammar.examples[2], spanish: grammar.examples[3] },
        ],
        exercises: grammarExercises,
      },
      reading: { title: story.title, text: transcript, questions: comprehension },
      listening: {
        title: story.title,
        audio: {
          kind: 'speech-synthesis',
          transcript,
          voiceNoteEs: 'Narración generada al pulsar reproducir con una voz inglesa disponible en tu navegador; no es una grabación de estudio.',
        },
        questions: comprehension.map(question => ({ ...question, id: question.id.replace('-q', '-listen-q') })),
      },
      speaking: {
        situationEs: `Cuenta qué ocurre en “${story.title}” y comenta cómo responderías tú ante una situación parecida.`,
        prompts: [
          `What is the main situation in “${story.title}”?`,
          'What would you do in a similar situation, and why?',
          `Use ${grammar.title.toLowerCase()} in one original sentence.`,
        ],
        modelAnswer: { english: modelSentence, spanishSupport: `Idea guía (no es una traducción literal): ${story.summary}` },
        rubric: speakingRubric,
      },
    },
    evaluationCriteria: [
      'Resolver correctamente al menos tres de las cuatro preguntas de Reading y Listening.',
      `Aplicar la regla de ${grammar.title.toLowerCase()} y explicar la elección.`,
      'Completar la autoevaluación oral con la rúbrica antes de marcar Speaking como terminado.',
    ],
  };
}

export const learningUnits: LearningUnit[] = learningLevels.flatMap(level => {
  const levelStories = storyLibrary.filter(story => story.level === level);
  const grammar = grammarByLevel[level];
  if (grammar.length !== 10 || levelStories.length !== 10) {
    throw new Error(`El temario ${level} debe tener diez temas gramaticales y diez lecturas; encontrados: ${grammar.length} y ${levelStories.length}.`);
  }
  return grammar.map((topic, index) => buildUnit(level, index + 1, topic, levelStories[index], grammar));
});

export function getUnitActivitiesComplete(unit: LearningUnit, completed: Partial<Record<(typeof skillOrder)[number], { completed: boolean }>>): boolean {
  return skillOrder.every(skill => completed[skill]?.completed === true);
}
