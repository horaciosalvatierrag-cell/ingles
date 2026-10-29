# Call Center: inglés para soporte TIC

## Alcance implementado

La opción **Call Center** se carga como vista React diferida y funciona en GitHub Pages, sin PHP ni llamadas obligatorias a servicios externos.

### Diálogos guiados

Hay cinco sesiones, una por nivel A1–C1. Cada una incluye objetivos, una situación, vocabulario técnico con pronunciación del navegador, transcripción completa en inglés y español, preguntas de comprensión autocorregibles, una breve explicación gramatical con tres ejercicios autocorregibles y tareas de Speaking con rúbrica de autoevaluación. Los guiones de soporte fueron redactados para esta actividad e incluyen precauciones de seguridad.

El cronómetro cuenta mientras la sesión está activa y dispone de iniciar, pausar, reanudar, finalizar y repetir. Veinte minutos es un objetivo didáctico: al alcanzarlo la sesión continúa. Las respuestas correctas, las actividades registradas y el resultado por nivel se guardan en `localStorage`, bajo `ingles.call-center-progress.v1`. No se persiste el texto del agente ni se graban las respuestas orales.

El resultado de 0 a 100 se compone de comprensión (30%), gramática (30%), términos del vocabulario objetivo escritos en notas (20%) y notas de Speaking con cinco o más palabras (20%). Es un indicador limitado de práctica; no califica la corrección de redacción libre, pronunciación, fluidez acústica ni comprensión semántica. La fluidez se muestra como no medida.

La práctica oral guiada puede hacerse hablando sin grabación, con notas opcionales. El módulo de demostración del agente permite dictado mediante el reconocimiento de voz del navegador; se activa únicamente cuando la persona pulsa el botón del micrófono. El navegador o su proveedor puede procesar el audio según sus propias condiciones. Esta aplicación no guarda ese audio. La síntesis de voz usa el navegador; si se seleccionó el acento indio y se configuró `VITE_INDIAN_TTS_ENDPOINT`, el texto hablado se envía al servicio Azure Speech configurado.

### Agente de práctica TIC

El modo habilitado es una **demostración local basada en reglas, no inteligencia artificial**. Usa tema, nivel, mensajes anteriores e indicios del mensaje actual para seleccionar preguntas de diagnóstico y seguimiento. Una lista acotada de reglas detecta algunos errores frecuentes y proporciona explicación bilingüe. No llama a Internet ni a una API, no comprende libremente cualquier respuesta y no proporciona asesoramiento para incidentes reales.

Se pueden ajustar nivel, tema, entrada por texto o dictado del navegador, momento de las correcciones e idioma de las explicaciones. El resumen solo cuenta intervenciones, respuestas escritas de cinco palabras, coincidencias exactas de vocabulario y correcciones activadas por las reglas; no emite un nivel o una fluidez inventados. El hilo se mantiene en memoria mientras la vista permanece abierta y no se guarda.

La IA por texto y la conversación de voz por IA aparecen como **pendientes** y no se pueden iniciar. No hay claves, endpoint ni servicio de IA configurados en este repositorio.

## Requisitos para habilitar IA externa

GitHub Pages publica archivos estáticos y no puede mantener una clave secreta del proveedor. Una integración real necesita un backend o función serverless independiente que autentique y limite las solicitudes, proteja la clave, aplique controles de abuso y devuelva errores explícitos. No se debe colocar una clave estándar en React, variables `VITE_*`, archivos del repositorio o almacenamiento del navegador.

Para voz, la [guía oficial vigente de WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc) recomienda WebRTC para clientes de navegador. El micrófono requiere permiso explícito y HTTPS (localhost sirve para desarrollo). La configuración segura necesita un servicio de confianza que mantenga la clave estándar en el servidor y cree la sesión mediante el flujo WebRTC actual o emita un secreto efímero para el navegador. El SDP y la conexión deben seguir el flujo documentado; una clave estándar nunca debe llegar al cliente. El servicio intermediario es una pieza externa que aún debe construirse, desplegarse, protegerse y probarse; el Worker existente para síntesis Azure no se considera automáticamente un servicio de conversación IA.

El modo IA por texto enviaría al proveedor los mensajes de la conversación, el tema y las instrucciones de nivel. El modo de voz enviaría el audio autorizado y los datos necesarios para la sesión. Antes de habilitarlos habría que informar al usuario, pedir consentimiento, definir conservación de datos y evitar que se compartan contraseñas, códigos MFA, datos de clientes o secretos empresariales. Ninguno de estos envíos ocurre en la implementación actual.

El consumo de IA puede generar cargos por tokens de texto y audio según el modelo y el uso, además del alojamiento del intermediario. La guía de WebRTC indica que inicializar una sesión contabiliza 15 segundos de duración de voz y que ese consumo se acredita al uso de la sesión cuando empieza; consulta la página de precios para tarifas vigentes. Las tarifas cambian, por lo que no se fija una estimación de coste en la aplicación. Antes de configurar un proveedor, revisa la [guía oficial de WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc), la [guía de Realtime](https://developers.openai.com/api/docs/guides/realtime) y los [precios oficiales](https://developers.openai.com/api/docs/pricing).

## Validación

Comprobaciones ejecutadas durante la implementación:

- `npm run typecheck`
- `npm run build`
- `git diff --check`
- Revisión manual en `http://localhost:3000/`: acceso en el menú, las cinco tarjetas, apertura A1, vocabulario/transcripción, iniciar y pausar el temporizador, modo de demostración, respuesta contextual y corrección activada por reglas.

No hay un runner de pruebas automatizadas configurado en `package.json`. El micrófono, las voces instaladas y la eventual integración IA no se declararon probados; dependen del navegador y de servicios aún no configurados.

## Publicación

El workflow existente de GitHub Pages compila `npm ci` / `npm run build` y publica `dist` en la ruta `/ingles/` cuando se hace push a la rama configurada. Los cambios de esta tarea todavía no se publican automáticamente hasta que se autorice el push.
