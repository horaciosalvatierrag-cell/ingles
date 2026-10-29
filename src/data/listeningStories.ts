import { technologyListeningStories } from './technologyLearningContent';

export interface ListeningQuestion {
  prompt: string;
  options: string[];
  answer: number;
}

export interface ListeningStory {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  title: string;
  summary: string;
  paragraphs: string[];
  questions: ListeningQuestion[];
}

// Diez prácticas de TI por nivel: Listening consume las cinco primeras;
// la Ruta A1–C1 las combina con las 45 adicionales.
export const listeningStories: ListeningStory[] = technologyListeningStories.slice(0, 5);
