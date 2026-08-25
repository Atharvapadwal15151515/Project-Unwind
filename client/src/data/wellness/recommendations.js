export const wellnessRecommendations = {
  calm: [
    "gratitude",
    "focus-timer",
    "movement-break"
  ],

  anxious: [
    "slow-calm-breathing",
    "grounding-54321",
    "calm-sounds"
  ],

  low: [
    "emotional-checkin",
    "gratitude",
    "thought-dump"
  ],

  stressed: [
    "box-breathing",
    "grounding-54321",
    "thought-dump"
  ],

  tired: [
    "movement-break",
    "calm-sounds",
    "emotional-checkin"
  ],

  overthinking: [
    "thought-dump",
    "slow-calm-breathing",
    "grounding-54321"
  ],

  frustrated: [
    "box-breathing",
    "movement-break",
    "thought-dump"
  ],

  focus: [
    "focus-timer",
    "calm-sounds",
    "movement-break"
  ],

  overwhelmed: [
    "grounding-54321",
    "thought-dump",
    "focus-timer"
  ],

  sleep: [
    "slow-calm-breathing",
    "calm-sounds",
    "body-scan"
  ],

  lonely: [
    "emotional-checkin",
    "gratitude",
    "thought-dump"
  ],

  happy: [
    "gratitude",
    "focus-timer",
    "movement-break"
  ],

  sad: [
    "gratitude",
    "thought-dump",
    "emotional-checkin"
  ],

  angry: [
    "box-breathing",
    "movement-break",
    "thought-dump"
  ],

  exhausted: [
    "slow-calm-breathing",
    "calm-sounds",
    "body-scan"
  ],

  excited: [
    "gratitude",
    "focus-timer",
    "movement-break"
  ],

  neutral: [
    "gratitude",
    "focus-timer",
    "calm-sounds"
  ]
};

export function getRecommendedToolIds(
  goal
) {
  return (
    wellnessRecommendations[
      goal
    ] || []
  );
}