interface Env {
  AZURE_SPEECH_KEY: string;
  AZURE_SPEECH_REGION: string;
  ALLOWED_ORIGIN?: string;
}

const MAX_TEXT_LENGTH = 2500;
const MAX_BODY_BYTES = 12_000;
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

async function readLimitedJson(request: Request): Promise<{ body?: unknown; error?: 'too-large' | 'invalid' }> {
  const reader = request.body?.getReader();
  if (!reader) return { error: 'invalid' };

  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return { error: 'too-large' };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { body: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { error: 'invalid' };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigin = env.ALLOWED_ORIGIN ?? 'https://horaciosalvatierrag-cell.github.io,http://localhost:3000';
    const headers = corsHeaders(origin, allowedOrigin);
    const isAllowedOrigin = Boolean(origin && allowedOrigin.split(',').map(value => value.trim()).includes(origin));

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin) return Response.json({ error: 'Origen no permitido.' }, { status: 403, headers });
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') return Response.json({ error: 'Usa POST para sintetizar voz.' }, { status: 405, headers });
    if (!isAllowedOrigin) return Response.json({ error: 'Origen no permitido.' }, { status: 403, headers });
    if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return Response.json({ error: 'El servicio de voz no está configurado.' }, { status: 503, headers });

    const contentLength = Number(request.headers.get('Content-Length') ?? 0);
    if (contentLength > MAX_BODY_BYTES) return Response.json({ error: 'La solicitud es demasiado grande.' }, { status: 413, headers });
    const parsed = await readLimitedJson(request);
    if (parsed.error === 'too-large') return Response.json({ error: 'La solicitud es demasiado grande.' }, { status: 413, headers });
    if (parsed.error || !parsed.body || typeof parsed.body !== 'object') return Response.json({ error: 'Solicitud JSON inválida.' }, { status: 400, headers });
    const body = parsed.body as { text?: unknown; gender?: unknown; rate?: unknown };

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
