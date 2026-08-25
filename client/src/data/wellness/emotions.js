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
  ]
};

export const wellnessGoals = [
  {
    id: "calm-down",
    label: "Calm down",
    emoji: "😌",
    description: "Slow things down and settle your body.",
  },
  {
    id: "stop-overthinking",
    label: "Stop overthinking",
    emoji: "🧠",
    description: "Step away from racing or repetitive thoughts.",
  },
  {
    id: "focus",
    label: "Focus",
    emoji: "🎯",
    description: "Clear distractions and focus on one thing.",
  },
  {
    id: "sleep",
    label: "Sleep",
    emoji: "😴",
    description: "Wind down and prepare your body for rest.",
  },
  {
    id: "cool-down",
    label: "Cool down",
    emoji: "😤",
    description: "Create some space when emotions feel intense.",
  },
  {
    id: "feel-supported",
    label: "Feel supported",
    emoji: "❤️",
    description: "Give yourself a little care and reassurance.",
  },
  {
    id: "get-energy",
    label: "Get some energy",
    emoji: "⚡",
    description: "Try something small to gently re-energize.",
  },
  {
    id: "clear-my-head",
    label: "Clear my head",
    emoji: "📝",
    description: "Get thoughts out of your head and onto the page.",
  },
];

export const emotionalCheckinOptions = [
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
  },
  {
    id: "calm",
    label: "Calm",
    emoji: "😌",
  },
  {
    id: "sad",
    label: "Sad",
    emoji: "😔",
  },
  {
    id: "angry",
    label: "Angry",
    emoji: "😡",
  },
  {
    id: "anxious",
    label: "Anxious",
    emoji: "😰",
  },
  {
    id: "lonely",
    label: "Lonely",
    emoji: "😞",
  },
  {
    id: "overwhelmed",
    label: "Overwhelmed",
    emoji: "😵",
  },
  {
    id: "exhausted",
    label: "Exhausted",
    emoji: "🥱",
  },
  {
    id: "excited",
    label: "Excited",
    emoji: "🤩",
  },
  {
    id: "neutral",
    label: "Neutral",
    emoji: "😐",
  },
];

export function getRecommendedToolIds(
  goal
) {
  return (
    wellnessRecommendations[
      goal
    ] || []
  );
}