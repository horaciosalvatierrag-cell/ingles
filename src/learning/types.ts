export const learningLevels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type LearningLevel = (typeof learningLevels)[number];
export type LearningSkill = 'grammar' | 'reading' | 'listening' | 'speaking';

export interface ChoiceExercise {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanationEs: string;
}

export interface GrammarActivity {
  explanationEs: string;
  examples: Array<{ english: string; spanish: string }>;
  exercises: ChoiceExercise[];
}

export interface ReadingActivity {
  title: string;
  text: string;
  questions: ChoiceExercise[];
}

export type ListeningAudio =
  | { kind: 'speech-synthesis'; transcript: string; voiceNoteEs: string }
  | { kind: 'file'; src: string; transcript: string; attribution: string };

export interface ListeningActivity {
  title: string;
  audio: ListeningAudio;
  questions: ChoiceExercise[];
}

export interface SpeakingActivity {
  situationEs: string;
  prompts: string[];
  modelAnswer: { english: string; spanishSupport: string };
  rubric: Array<{ criterion: string; descriptionEs: string }>;
}

export interface LearningUnit {
  id: string;
  level: LearningLevel;
  unitNumber: number;
  title: string;
  objectives: string[];
  grammarTopics: string[];
  vocabulary: Array<{ term: string; meaningEs: string; kind: 'word' | 'expression' }>;
  activities: {
    grammar: GrammarActivity;
    reading: ReadingActivity;
    listening: ListeningActivity;
    speaking: SpeakingActivity;
  };
  evaluationCriteria: string[];
}

export const learningSkillLabels: Record<LearningSkill, string> = {
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
};
