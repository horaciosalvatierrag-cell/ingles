/**
 * Estimates where a spoken text is in the absence of native word-boundary
 * events. Native SpeechSynthesis boundary events remain the source of truth
 * whenever the browser provides them.
 */
export type SpeechWordRange = { start: number; end: number; weight: number };

function syllableWeight(word: string) {
  const letters = word.toLocaleLowerCase().replace(/[^a-z]/g, '');
  const vowelGroups = letters.match(/[aeiouy]+/g)?.length ?? 1;
  const silentEnding = /(?:[^aeiou]e|[^aeiou]ed)$/.test(letters) && vowelGroups > 1;
  return Math.max(1, vowelGroups - Number(silentEnding)) + (/[,.!?;:]$/.test(word) ? 0.65 : 0);
}

export function getSpeechWordRanges(text: string): SpeechWordRange[] {
  return Array.from(text.matchAll(/\S+/g), match => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    weight: syllableWeight(match[0]),
  }));
}

export function getSpeechCharIndexAtProgress(ranges: SpeechWordRange[], progress: number) {
  if (!ranges.length) return 0;
  const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0);
  let remainingWeight = Math.max(0, Math.min(0.999, progress)) * totalWeight;
  for (const range of ranges) {
    if (remainingWeight < range.weight) return range.start;
    remainingWeight -= range.weight;
  }
  return ranges[ranges.length - 1].start;
}

export function getEstimatedWordIndex(ranges: SpeechWordRange[], elapsedSeconds: number, rate: number) {
  if (!ranges.length) return -1;
  // Approximate 3.1 syllables per second at normal speed and weight longer
  // words/punctuation proportionally so the fallback does not drift by word.
  const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0);
  const expectedDuration = totalWeight / (3.1 * Math.max(0.5, rate));
  const charIndex = getSpeechCharIndexAtProgress(ranges, elapsedSeconds / expectedDuration);
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (charIndex < ranges[middle].start) high = middle - 1;
    else if (charIndex >= ranges[middle].end) low = middle + 1;
    else return middle;
  }
  return Math.min(low, ranges.length - 1);
}
