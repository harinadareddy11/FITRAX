// src/utils/exerciseTypes.js
// Context-aware exercise type detection
// Returns: 'weighted' | 'bodyweight' | 'timed'

// Exercises that are held for time (no reps, no weight — just seconds)
const TIMED_KEYWORDS = [
  'plank', 'side plank', 'reverse plank',
  'wall sit', 'wall squat',
  'dead hang', 'bar hang', 'hanging hold',
  'hollow hold', 'hollow body',
  'l-sit', 'l sit',
  'boat pose', 'v-sit',
  'superman hold', 'back extension hold',
  'bridge hold', 'glute bridge hold',
  'isometric', 'static hold',
  'farmer carry', "farmer's carry", 'farmers carry',
  'suitcase carry', 'overhead carry',
  'tuck hold', 'front lever', 'back lever',
  'straddle hold',
];

// Exercises done with bodyweight only (reps, no weight)
const BODYWEIGHT_KEYWORDS = [
  'push-up', 'push up', 'pushup',
  'pull-up', 'pull up', 'pullup',
  'chin-up', 'chin up', 'chinup',
  'dip',
  'sit-up', 'sit up', 'situp',
  'crunch', 'bicycle crunch', 'reverse crunch',
  'mountain climber',
  'burpee',
  'jumping jack', 'jump jack',
  'air squat', 'bodyweight squat', 'body weight squat',
  'bodyweight lunge', 'walking lunge', 'reverse lunge',
  'jump squat', 'squat jump',
  'box jump', 'broad jump', 'depth jump',
  'flutter kick', 'scissor kick',
  'leg raise', 'hanging leg raise', 'lying leg raise',
  'knee raise', 'hanging knee raise',
  'russian twist',
  'glute bridge', 'bodyweight hip thrust',
  'step up', 'step-up',
  'tricep dip', 'bench dip',
  'diamond push', 'wide push',
  'pike push', 'handstand push',
  'inverted row', 'bodyweight row',
  'superman', // the rep version (not hold)
  'good morning', // usually bodyweight in warmup
  'hip circle', 'leg swing',
  'jumping lunge', 'lunge jump',
  'squat thrust',
  'inchworm',
  'bear crawl',
  'crab walk',
  'toe touch',
  'high knee',
  'butt kick',
];

/**
 * Determines the exercise type from its name.
 * @param {string} name - Exercise name
 * @returns {'weighted'|'bodyweight'|'timed'}
 */
export function getExerciseType(name) {
  if (!name) return 'weighted';
  const lower = name.toLowerCase().trim();

  // Check timed first (most specific)
  if (TIMED_KEYWORDS.some(k => lower.includes(k))) return 'timed';

  // Check bodyweight
  if (BODYWEIGHT_KEYWORDS.some(k => lower.includes(k))) return 'bodyweight';

  // Default: weighted
  return 'weighted';
}

/**
 * Parse targetReps string to seconds for timed exercises.
 * Handles: "60", "60s", "1:30", "90 seconds"
 */
export function parseTargetSeconds(targetReps) {
  if (!targetReps) return 60;
  const str = String(targetReps).replace(/seconds?|sec/gi, '').replace('s', '').trim();
  if (str.includes(':')) {
    const [m, s] = str.split(':').map(Number);
    return (m || 0) * 60 + (s || 0);
  }
  const n = parseInt(str);
  // If the number seems like reps (1-30) for a timed exercise, treat as seconds * 10
  // e.g., targetReps="12" for a plank probably means 12 reps not 12 seconds — treat as 60s default
  if (n > 0 && n <= 30) return 60; // default 60s if ambiguous
  return n > 0 ? n : 60;
}

/**
 * Format seconds to display string: 60 → "1:00", 45 → "0:45"
 */
export function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get the display label for a completed set based on type.
 */
export function getSetDoneLabel(set, type) {
  if (!set.done) return 'Tap to log';
  switch (type) {
    case 'timed':     return `⏱ ${set.reps}s ✓`;
    case 'bodyweight': return `× ${set.reps} reps ✓`;
    default:          return `${set.kg}kg × ${set.reps} reps ✓`;
  }
}

/**
 * Get placeholder text for the log button on an undone set.
 */
export function getSetPendingLabel(type) {
  switch (type) {
    case 'timed':     return '▶ Start timer';
    case 'bodyweight': return 'Tap to log reps';
    default:          return 'Tap to log set';
  }
}
