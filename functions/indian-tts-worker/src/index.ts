interface Env {
  AZURE_SPEECH_KEY: string;
  AZURE_SPEECH_REGION: string;
  ALLOWED_ORIGIN?: string;
}

const MAX_TEXT_LENGTH = 2500;
const ALLOWED_VOICES = {
  female: 'en-IN-NeerjaNeural',
  male: 'en-IN-PrabhatIndicNeural',
} as const;

function corsHeaders(origin: string, allowedOrigin: string) {
  const allowed = allowedOrigin.split(',').map(value => value.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] ?? '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function xmlEscape(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  })[character] ?? character);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigin = env.ALLOWED_ORIGIN ?? 'https://horaciosalvatierrag-cell.github.io,http://localhost:3000';
    const headers = corsHeaders(origin, allowedOrigin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return Response.json({ error: 'Usa POST para sintetizar voz.' }, { status: 405, headers });
    if (origin && headers['Access-Control-Allow-Origin'] !== origin) return Response.json({ error: 'Origen no permitido.' }, { status: 403, headers });
    if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return Response.json({ error: 'El servicio de voz no está configurado.' }, { status: 503, headers });

    let body: { text?: unknown; gender?: unknown; rate?: unknown };
    try { body = await request.json() as typeof body; }
    catch { return Response.json({ error: 'Solicitud JSON inválida.' }, { status: 400, headers }); }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > MAX_TEXT_LENGTH) return Response.json({ error: `El texto debe tener entre 1 y ${MAX_TEXT_LENGTH} caracteres.` }, { status: 400, headers });

    const gender = body.gender === 'male' ? 'male' : 'female';
    const rate = typeof body.rate === 'number' ? Math.min(1.2, Math.max(0.7, body.rate)) : 1;
    const ratePercent = `${rate >= 1 ? '+' : ''}${Math.round((rate - 1) * 100)}%`;
    const region = env.AZURE_SPEECH_REGION.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const ssml = `<speak version="1.0" xml:lang="en-IN"><voice name="${ALLOWED_VOICES[gender]}"><prosody rate="${ratePercent}">${xmlEscape(text)}</prosody></voice></speak>`;

    try {
      const azureResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          'User-Agent': 'EnglishLearningApp',
        },
        body: ssml,
      });
      if (!azureResponse.ok) {
        return Response.json({ error: `El servicio de voz respondió ${azureResponse.status}.` }, { status: 502, headers });
      }
      return new Response(azureResponse.body, { status: 200, headers: { ...headers, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
    } catch {
      return Response.json({ error: 'No fue posible conectar con el servicio de voz.' }, { status: 502, headers });
    }
  },
};
