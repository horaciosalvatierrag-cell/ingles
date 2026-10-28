# Inglés Americano · Aprendizaje

Aplicación web para practicar inglés americano desde una interfaz adaptable con superficies translúcidas inspiradas en Windows 11.

## Funciones

- **Verbos:** 300 regulares y 160 irregulares; infinitivo, pasado simple y pasado participio. Pronunciación, práctica oral y modo quiz.
- **Verbos frasales:** 400 expresiones con significado, ejemplo, búsqueda, filtro de nivel, pronunciación y reto de práctica. Consulta [la atribución y licencia de estos datos](src/data/PHRASAL_VERBS_ATTRIBUTION.md).
- **Diálogos:** soporte técnico e inteligencia artificial, reproducción y pausa/reanudación, voces diferenciadas cuando el navegador las ofrece, y ritmo de escucha A1–C1.
- **Diccionario:** más de 1,390 palabras, búsqueda, categorías y pronunciación.
- **Listening:** cinco historias, una por nivel A1–C1, resaltado de palabra, control de velocidad, texto opcional y evaluación de comprensión. Cada historia incluye una ruta de práctica guiada de 30 minutos.
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

## Publicar en línea e instalar en dispositivos

Esta aplicación es un sitio estático de Vite. En las plataformas de alojamiento configura:

- Comando de instalación: `npm ci`
- Comando de compilación: `npm run build`
- Carpeta publicada: `dist`

Opciones recomendadas:

1. **Vercel:** conecta el repositorio de GitHub y configura como rama de producción `regular-verbs-pronunciation-204c1`. Los cambios que se suban a esa rama pueden generar despliegues automáticos y enlaces de vista previa.
2. **Netlify:** conecta el mismo repositorio y usa los valores de compilación indicados arriba.
3. **GitHub Pages:** también puede servir el sitio estático; al publicarlo bajo una ruta `/ingles/` habrá que configurar la ruta base de Vite y el alcance del service worker.

Una vez disponible mediante HTTPS, abre la dirección en cada dispositivo y usa **Instalar en este dispositivo** en el menú de la aplicación. En Safari para iPhone/iPad, selecciona **Compartir → Añadir a pantalla de inicio**. El reconocimiento de voz depende del soporte del navegador; el acceso a cámara y micrófono necesita permiso.

Cuando una búsqueda local de verbos o expresiones no tiene coincidencias, la aplicación ofrece **Buscar en Internet** y abre los resultados en una pestaña separada.

## Comprobaciones

```bash
npm run typecheck
npm run build
```

## Tecnología

React, TypeScript, Vite, Tailwind CSS, Web Speech API y MediaDevices API.
