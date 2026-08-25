export const breathingExercises = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    description:
      "A balanced four-step breathing rhythm.",
    phases: [
      {
        id: "inhale",
        label: "Breathe in",
        duration: 4
      },
      {
        id: "hold-in",
        label: "Hold",
        duration: 4
      },
      {
        id: "exhale",
        label: "Breathe out",
        duration: 4
      },
      {
        id: "hold-out",
        label: "Hold",
        duration: 4
      }
    ],
    defaultRounds: 6
  },

  {
    id: "478-breathing",
    name: "4-7-8 Breathing",
    description:
      "A slower breathing pattern designed for settling down.",
    phases: [
      {
        id: "inhale",
        label: "Breathe in",
        duration: 4
      },
      {
        id: "hold",
        label: "Hold",
        duration: 7
      },
      {
        id: "exhale",
        label: "Breathe out",
        duration: 8
      }
    ],
    defaultRounds: 4
  },

  {
    id: "slow-calm-breathing",
    name: "Slow Calm Breathing",
    description:
      "A gentle rhythm with a longer exhale.",
    phases: [
      {
        id: "inhale",
        label: "Breathe in",
        duration: 4
      },
      {
        id: "exhale",
        label: "Breathe out",
        duration: 6
      }
    ],
    defaultRounds: 6
  }
];

export function getBreathingExercise(
  exerciseId
) {
  return (
    breathingExercises.find(
      (exercise) =>
        exercise.id ===
        exerciseId
    ) || null
  );
}