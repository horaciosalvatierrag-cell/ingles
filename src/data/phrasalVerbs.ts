import sourceEntries from './phrasalVerbs.json';

export interface PhrasalVerb {
  id: number;
  phrasal: string;
  meaning: string;
  examples: string[];
  level: 'A1' | 'A2' | 'B1';
}

export const phrasalVerbs = sourceEntries as PhrasalVerb[];
