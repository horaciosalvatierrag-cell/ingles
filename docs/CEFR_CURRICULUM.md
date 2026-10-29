# Ruta A1–C1: propuesta de temario

Esta propuesta organiza el curso por dificultad creciente y práctica integrada de cuatro destrezas. No se encontró una especificación educativa previa en el repositorio; por ello, el contenido se identifica como una propuesta alineada de forma general al CEFR, no como un currículo oficial certificado.

El hilo conductor de los niveles A1–C1 es el inglés aplicado a tecnologías de información: los casos avanzan desde dispositivos, cuentas e instrucciones sencillas hasta redes, ciberseguridad, servicios en la nube, continuidad operativa y comunicación ejecutiva. Se conserva la progresión gramatical por nivel; cada regla se contextualiza en el caso técnico de la unidad. Las historias y conversaciones de Reading, Listening y Speaking usan estos mismos escenarios.

Cada unidad incluye objetivos, contenido gramatical, palabras seleccionadas del texto y una expresión en español/inglés, tres ejercicios autocorregibles de Grammar, un texto y cuatro preguntas de Reading, una narración de ese texto con cuatro preguntas de Listening, y una actividad de Speaking con modelo, situación y rúbrica de autoevaluación de cuatro criterios. Los textos de Reading y Listening se comparten para practicar primero comprensión escrita y después auditiva. La narración usa la voz de síntesis disponible en el navegador; no hay audios grabados ni se presentan como tales.

## A1 · Principiante

1. Be: presentarse y hacer preguntas.
2. Presente simple y rutinas.
3. Artículos y plurales.
4. There is / there are.
5. Preposiciones de lugar.
6. Sustantivos contables: some / any.
7. Adverbios de frecuencia.
8. Preguntas con do / does.
9. Can / can’t para habilidades.
10. Imperativos e instrucciones.

## A2 · Elemental

1. Pasado simple regular.
2. Pasado simple irregular.
3. Preguntas y negativas en pasado.
4. Comparativos.
5. Superlativos.
6. Planes con going to.
7. Will para predicciones y ofrecimientos.
8. Should y have to.
9. Presente continuo para planes acordados.
10. Primer condicional.

## B1 · Intermedio

1. Present perfect para experiencias.
2. Present perfect y past simple.
3. For y since.
4. Used to para hábitos pasados.
5. Segundo condicional.
6. Voz pasiva en presente y pasado.
7. Estilo indirecto.
8. Oraciones relativas especificativas.
9. Past continuous y past simple.
10. Present perfect continuous.

## B2 · Intermedio alto

1. Tercer condicional.
2. Condicionales mixtos.
3. Modales de deducción.
4. Preguntas indirectas.
5. Estructuras pasivas de reporte.
6. Gerundios e infinitivos.
7. Future perfect y future continuous.
8. Concesión y contraste.
9. Cláusulas participiales.
10. Cleft sentences para énfasis.

## C1 · Avanzado

1. Inversión después de adverbios negativos.
2. Condicionales mixtos y perspectiva temporal.
3. Hedging y afirmaciones cautelosas.
4. Nominalización en registro formal.
5. Cláusulas participiales y referencia clara.
6. Subjuntivo en recomendaciones formales.
7. Artículos y referencia avanzada.
8. Inversión concesiva.
9. Elipsis y sustitución.
10. Marcadores discursivos y cohesión.

## Evaluación, voz y progreso

- Grammar tiene tres reactivos por unidad; Reading y Listening tienen cuatro cada uno. Cada reactivo muestra la respuesta y una explicación en español después de revisar.
- Speaking es una práctica oral presencial con modelo y rúbrica de autoevaluación; no usa reconocimiento automático ni guarda grabaciones.
- Reading y Listening usan los textos y preguntas existentes de la aplicación. Si el navegador ofrece Speech Synthesis, Listening puede narrar la transcripción; la disponibilidad y el timbre dependen del dispositivo.
- El progreso se guarda localmente con la clave `ingles.learning-progress`, versión 1, y los identificadores estables `a1-unit-01` a `c1-unit-10`. Las versiones desconocidas se respaldan antes de iniciar un nuevo progreso.

## Publicación

La publicación se mantiene en GitHub Pages en `/ingles/`, configurada en `vite.config.js` y en `.github/workflows/deploy-pages.yml`. Para desplegar una actualización: ejecutar `npm run typecheck` y `npm run build`, revisar el cambio y, solo con autorización explícita, subirlo a la rama configurada del workflow. El workflow publica el directorio `dist` automáticamente.
