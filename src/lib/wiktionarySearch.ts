export type WiktionaryResult = { title: string; snippet: string; url: string };

/** Searches English Wiktionary through its anonymous, cross-origin Action API. */
export async function searchWiktionary(query: string, signal: AbortSignal): Promise<WiktionaryResult[]> {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: query, srnamespace: '0',
    srlimit: '5', srprop: 'snippet', format: 'json', origin: '*',
  });
  const response = await fetch(`https://en.wiktionary.org/w/api.php?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Búsqueda de Wiktionary: ${response.status}`);
  const data = await response.json() as { query?: { search?: Array<{ title: string; snippet: string }> } };
  return (data.query?.search ?? []).map(result => ({
    title: result.title,
    snippet: new DOMParser().parseFromString(result.snippet, 'text/html').body.textContent?.trim() ?? '',
    url: `https://en.wiktionary.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
  }));
}
