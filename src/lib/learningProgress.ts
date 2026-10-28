import type { LearningSkill } from '../learning/types';

export const LEARNING_PROGRESS_KEY = 'ingles.learning-progress';
export const LEARNING_PROGRESS_VERSION = 1;

export interface ActivityProgress {
  completed: boolean;
  score: number | null;
  maxScore: number | null;
  completedAt: string | null;
}

export interface UnitProgress {
  activities: Partial<Record<LearningSkill, ActivityProgress>>;
}

export interface LearningProgress {
  version: typeof LEARNING_PROGRESS_VERSION;
  updatedAt: string;
  /** Stable unit IDs are retained even when a future curriculum version renames a unit. */
  units: Record<string, UnitProgress>;
}

export function emptyLearningProgress(): LearningProgress {
  return { version: LEARNING_PROGRESS_VERSION, updatedAt: new Date(0).toISOString(), units: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeActivity(value: unknown): ActivityProgress | null {
  if (!isRecord(value)) return null;
  return {
    completed: value.completed === true,
    score: typeof value.score === 'number' && Number.isFinite(value.score) ? value.score : null,
    maxScore: typeof value.maxScore === 'number' && Number.isFinite(value.maxScore) ? value.maxScore : null,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
  };
}

function normalizeProgress(value: unknown): LearningProgress {
  if (!isRecord(value) || !isRecord(value.units)) return emptyLearningProgress();
  const units: Record<string, UnitProgress> = {};
  for (const [unitId, rawUnit] of Object.entries(value.units)) {
    if (!isRecord(rawUnit) || !isRecord(rawUnit.activities)) continue;
    const activities: UnitProgress['activities'] = {};
    for (const skill of ['grammar', 'reading', 'listening', 'speaking'] as const) {
      const activity = normalizeActivity(rawUnit.activities[skill]);
      if (activity) activities[skill] = activity;
    }
    units[unitId] = { activities };
  }
  return {
    version: LEARNING_PROGRESS_VERSION,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date(0).toISOString(),
    units,
  };
}

/** Keeps the local snapshot readable if storage is unavailable or contains malformed JSON. */
export function loadLearningProgress(): LearningProgress {
  try {
    const raw = window.localStorage.getItem(LEARNING_PROGRESS_KEY);
    if (!raw) return emptyLearningProgress();
    const parsed = JSON.parse(raw) as unknown;
    if (isRecord(parsed) && typeof parsed.version === 'number' && parsed.version !== LEARNING_PROGRESS_VERSION) {
      try { window.localStorage.setItem(`${LEARNING_PROGRESS_KEY}.backup.v${parsed.version}`, raw); } catch { /* The original key remains untouched until the learner saves progress. */ }
      return emptyLearningProgress();
    }
    return normalizeProgress(parsed);
  } catch {
    return emptyLearningProgress();
  }
}

export function saveActivityProgress(
  current: LearningProgress,
  unitId: string,
  skill: LearningSkill,
  result: { score: number | null; maxScore: number | null },
): { progress: LearningProgress; persisted: boolean } {
  const next: LearningProgress = {
    version: LEARNING_PROGRESS_VERSION,
    updatedAt: new Date().toISOString(),
    units: {
      ...current.units,
      [unitId]: {
        activities: {
          ...current.units[unitId]?.activities,
          [skill]: {
            completed: true,
            score: result.score,
            maxScore: result.maxScore,
            completedAt: new Date().toISOString(),
          },
        },
      },
    },
  };
  let persisted = false;
  try {
    window.localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(next));
    persisted = true;
  } catch {
    // Keep the in-memory result usable if the browser blocks local storage.
  }
  return { progress: next, persisted };
}
