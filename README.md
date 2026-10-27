# Inglés Americano · Aprendizaje

Aplicación web para practicar inglés americano desde una interfaz adaptable con superficies translúcidas inspiradas en Windows 11.

## Funciones

- **Verbos:** 300 regulares y 160 irregulares; infinitivo, pasado simple y pasado participio. Pronunciación, práctica oral y modo quiz.
- **Verbos frasales:** 400 expresiones con significado, ejemplo, búsqueda, filtro de nivel, pronunciación y reto de práctica. Consulta [la atribución y licencia de estos datos](src/data/PHRASAL_VERBS_ATTRIBUTION.md).
- **Diálogos:** soporte técnico e inteligencia artificial, reproducción y pausa/reanudación, voces diferenciadas cuando el navegador las ofrece, y ritmo de escucha A1–C1.
- **Diccionario:** más de 1,390 palabras, búsqueda, categorías y pronunciación.
- **Listening:** cinco historias, una por nivel A1–C1, resaltado de palabra, control de velocidad, texto opcional y evaluación de comprensión. Cada historia incluye una ruta de práctica guiada de 30 minutos.
- **Profesor virtual:** diez temas, conversación de práctica con voz o texto, reconocimiento y respuesta hablada. La cámara opcional muestra la vista previa local.

## Ejecutar en local

```bash
npm ci
npm run dev
```

Vite sirve la aplicación en `http://localhost:5173`. El reconocimiento de voz y la cámara requieren un navegador compatible. El micrófono y la cámara solicitan permiso al activarse; en otros dominios se requiere HTTPS. El navegador controla el permiso y puede bloquearlo desde su configuración del sitio.

## Comprobaciones

```bash
npm run typecheck
npm run build
```

## Tecnología

React, TypeScript, Vite, Tailwind CSS, Web Speech API y MediaDevices API.
