export const wellnessTools = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    description:
      "Calm your breathing with a steady four-step rhythm.",
    category: "breathe-relax",
    duration: "2–5 min",
    icon: "wind",
    route:
      "/dashboard/toolkit/breathing/box-breathing",
    goals: [
      "anxious",
      "stressed",
      "overthinking",
      "frustrated"
    ],
    featured: true
  },

  {
    id: "slow-calm-breathing",
    name: "Slow Calm Breathing",
    description:
      "Use a longer exhale to slow down and settle.",
    category: "breathe-relax",
    duration: "2–5 min",
    icon: "waves",
    route:
      "/dashboard/toolkit/breathing/slow-calm-breathing",
    goals: [
      "anxious",
      "stressed",
      "sleep",
      "overthinking"
    ],
    featured: true
  },

  {
    id: "grounding-54321",
    name: "5-4-3-2-1 Grounding",
    description:
      "Reconnect with the present moment through your senses.",
    category: "ground-yourself",
    duration: "3–5 min",
    icon: "sprout",
    route:
      "/dashboard/toolkit/grounding",
    goals: [
      "anxious",
      "stressed",
      "overthinking",
      "overwhelmed"
    ],
    featured: true
  },

  {
    id: "thought-dump",
    name: "Thought Dump",
    description:
      "Get what's taking up space in your mind onto the page.",
    category: "clear-mind",
    duration: "3–10 min",
    icon: "notebook-pen",
    route:
      "/dashboard/toolkit/thought-dump",
    goals: [
      "overthinking",
      "stressed",
      "low",
      "overwhelmed"
    ],
    featured: true
  },

  {
    id: "emotional-checkin",
    name: "Emotional Check-In",
    description:
      "Name what you're feeling and choose what might help next.",
    category: "emotional-support",
    duration: "2–4 min",
    icon: "heart-pulse",
    route:
      "/dashboard/toolkit/emotional-checkin",
    goals: [
      "low",
      "anxious",
      "frustrated",
      "overwhelmed",
      "lonely"
    ],
    featured: true
  },

  {
    id: "focus-timer",
    name: "Focus Timer",
    description:
      "Create a quiet block of time for one task.",
    category: "focus-productivity",
    duration: "5–50 min",
    icon: "timer",
    route:
      "/dashboard/toolkit/focus",
    goals: [
      "focus",
      "overwhelmed",
      "tired"
    ],
    featured: true
  },

  {
    id: "calm-sounds",
    name: "Calming Sounds",
    description:
      "Create a softer environment with relaxing background audio.",
    category: "calm-sensory",
    duration: "Any time",
    icon: "headphones",
    route:
      "/dashboard/toolkit/sounds",
    goals: [
      "anxious",
      "stressed",
      "sleep",
      "focus",
      "tired"
    ],
    featured: true
  },

  {
    id: "gratitude",
    name: "Gratitude",
    description:
      "Take a moment to notice three things you appreciate.",
    category: "emotional-support",
    duration: "2–3 min",
    icon: "heart-handshake",
    route:
      "/dashboard/toolkit/gratitude",
    goals: [
      "low",
      "lonely",
      "stressed"
    ],
    featured: true
  },

  {
    id: "body-scan",
    name: "Body Scan",
    description:
      "Notice tension from head to toe and gently soften it.",
    category: "ground-yourself",
    duration: "5–10 min",
    icon: "scan",
    route:
      "/dashboard/toolkit/body-scan",
    goals: [
      "stressed",
      "anxious",
      "sleep"
    ],
    featured: false
  },

  {
    id: "movement-break",
    name: "Movement Break",
    description:
      "Reset with a short guided sequence of gentle movement.",
    category: "healthy-habits",
    duration: "2–5 min",
    icon: "move",
    route:
      "/dashboard/toolkit/movement",
    goals: [
      "tired",
      "focus",
      "stressed"
    ],
    featured: false
  }
];

export function getWellnessToolById(
  toolId
) {
  return (
    wellnessTools.find(
      (tool) =>
        tool.id === toolId
    ) || null
  );
}