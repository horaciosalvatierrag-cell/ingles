# Inglés Americano · Aprendizaje

Aplicación web para practicar inglés americano desde una interfaz adaptable con superficies translúcidas inspiradas en Windows 11.

## Funciones

- **Verbos:** 300 regulares y 160 irregulares; infinitivo, pasado simple y pasado participio. Pronunciación, práctica oral y modo quiz.
- **Verbos frasales:** 400 expresiones con significado, ejemplo, búsqueda, filtro de nivel, pronunciación y reto de práctica. Consulta [la atribución y licencia de estos datos](src/data/PHRASAL_VERBS_ATTRIBUTION.md).
- **Diálogos:** soporte técnico e inteligencia artificial, reproducción y pausa/reanudación, voces diferenciadas cuando el navegador las ofrece, y ritmo de escucha A1–C1.
- **Diccionario:** más de 1,390 palabras, búsqueda, categorías y pronunciación.
- **Listening:** diez actividades por nivel A1–C1 (50 en total), narración de texto con la voz inglesa disponible en el navegador, pausa/reanudación, transcripción y cuatro preguntas por actividad.
- **Ruta A1–C1:** 50 unidades con Grammar, Reading, Listening y Speaking, explicaciones y ejemplos bilingües, evaluación automática para ejercicios escritos, rúbrica oral manual y progreso local versionado. El temario es una propuesta alineada al CEFR; consulta [el mapa curricular](docs/CEFR_CURRICULUM.md).
- **Profesor virtual:** diez temas, conversación de práctica con voz o texto, reconocimiento y respuesta hablada. La cámara opcional muestra la vista previa local.
- **Gramática inglés:** redacción por niveles A1–C1 con temas, sugerencias de corrección y explicación de reglas frecuentes.
- **SLANG inglés:** expresiones informales graduadas por nivel, significado, ejemplos y contexto cultural.
- **Expresiones cotidianas:** buscador de frases comunes con significado, ejemplo traducido y situaciones de uso.
- **Acentos:** selector de pronunciación americano, británico e indio para las voces disponibles en el navegador.
- **PWA adaptable:** puede instalarse en computadora, Android y iPhone/iPad desde el navegador. La interfaz puede abrirse offline después de cargarla; las búsquedas web y algunos servicios de voz requieren conexión.

## Ejecutar en local

```bash
npm ci
npm run dev
```

Vite sirve la aplicación en `http://localhost:3000`. El reconocimiento de voz y la cámara requieren un navegador compatible. El micrófono y la cámara solicitan permiso al activarse; en otros dominios se requiere HTTPS. El navegador controla el permiso y puede bloquearlo desde su configuración del sitio.

La ruta A1–C1 se abre desde **Ruta A1–C1** en el menú principal. El progreso se guarda en `localStorage` bajo `ingles.learning-progress` (versión 1), separado por identificadores estables de unidad y actividad. No se guarda ni envía audio de Speaking. Listening genera voz en el dispositivo mediante Speech Synthesis; no hay archivos de audio grabados en el repositorio para estas unidades.

## Publicar en línea e instalar en dispositivos

Esta aplicación es un sitio estático de Vite. En las plataformas de alojamiento configura:

- Comando de instalación: `npm ci`
- Comando de compilación: `npm run build`
- Carpeta publicada: `dist`

Opciones recomendadas:

1. **Vercel:** conecta el repositorio de GitHub y configura como rama de producción `regular-verbs-pronunciation-204c1`. Los cambios que se suban a esa rama pueden generar despliegues automáticos y enlaces de vista previa.
2. **Netlify:** conecta el mismo repositorio y usa los valores de compilación indicados arriba.
3. **GitHub Pages:** el repositorio ya incluye un workflow que compila la ruta `/ingles/` y publica automáticamente al subir cambios a `regular-verbs-pronunciation-204c1` una vez habilitado Pages en GitHub.

Una vez disponible mediante HTTPS, abre la dirección en cada dispositivo y usa **Instalar en este dispositivo** en el menú de la aplicación. En Safari para iPhone/iPad, selecciona **Compartir → Añadir a pantalla de inicio**. El reconocimiento de voz depende del soporte del navegador; el acceso a cámara y micrófono necesita permiso.

Cuando una búsqueda local de verbos o expresiones no tiene coincidencias, la aplicación ofrece **Buscar en Internet** y abre los resultados en una pestaña separada.

## Comprobaciones

```bash
npm run typecheck
npm run build
```

## Tecnología

React, TypeScript, Vite, Tailwind CSS, Web Speech API y MediaDevices API.
