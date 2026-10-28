# Voz neural English (India)

La aplicación puede usar voces `en-IN` instaladas en el navegador. Para ofrecer además una voz neural consistente en cualquier dispositivo, este repositorio incluye un endpoint de Cloudflare Workers que protege la clave de Azure Speech y transmite el audio de Microsoft Neural TTS. Las voces disponibles son `en-IN-NeerjaNeural` (femenina) y `en-IN-PrabhatIndicNeural` (masculina), según el [catálogo oficial de Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts).

## Requisitos externos

- Una cuenta Cloudflare Workers para alojar el endpoint.
- Un recurso **Speech** en Azure AI Speech; requiere región y clave. Azure aplica cuotas y condiciones según el nivel elegido; revisa [precios y cuotas actuales](https://azure.microsoft.com/pricing/details/speech/).
- Node.js y Wrangler para desplegar el Worker.

## Configurar y desplegar el endpoint

Desde `functions/indian-tts-worker`:

```bash
npm exec --yes --package wrangler -- wrangler login
npm exec --yes --package wrangler -- wrangler secret put AZURE_SPEECH_KEY
npm exec --yes --package wrangler -- wrangler secret put AZURE_SPEECH_REGION
npm exec --yes --package wrangler -- wrangler deploy
```

Al pedir la clave, Wrangler la guarda como secreto del Worker. No la pegues en el código, en GitHub Pages ni en un archivo `.env` del frontend. La región es el identificador de región del recurso Speech, por ejemplo `centralindia` o `eastus`.

La URL resultante será `https://ingles-indian-tts.<tu-subdominio>.workers.dev`. Configura un límite de solicitudes en Cloudflare para evitar consumo inesperado de la cuota.

## Conectar la aplicación

En GitHub, crea una variable de repositorio `VITE_INDIAN_TTS_ENDPOINT` en **Settings → Secrets and variables → Actions → Variables**, con la URL base del Worker (sin `/synthesize`). El workflow de Pages ya la pasa a la compilación; después de guardarla, ejecuta una vez **Actions → Deploy GitHub Pages → Run workflow** para que el sitio cargue el endpoint.

Para desarrollo local, crea `.env.local` (no lo subas a Git) con:

```dotenv
VITE_INDIAN_TTS_ENDPOINT=https://ingles-indian-tts.<tu-subdominio>.workers.dev
```

La ruta `POST /synthesize` acepta `{ "text": "Hello", "gender": "male", "rate": 1 }`. Si no se configura el endpoint, la aplicación sigue usando la voz local del navegador cuando haya una `en-IN` instalada.

## Privacidad

El Worker envía a Azure el texto solicitado para sintetizarlo. No envía grabaciones del micrófono ni guarda el texto. Cada reproducción requiere conexión y consume la cuota del recurso Azure.
