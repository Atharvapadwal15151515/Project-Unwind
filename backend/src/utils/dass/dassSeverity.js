export const DASS_SEVERITY_RANGES = {
  depression: [
    { min: 0, max: 9, severity: "normal" },
    { min: 10, max: 13, severity: "mild" },
    { min: 14, max: 20, severity: "moderate" },
    { min: 21, max: 27, severity: "severe" },
    { min: 28, max: 42, severity: "extremely_severe" },
  ],

  anxiety: [
    { min: 0, max: 7, severity: "normal" },
    { min: 8, max: 9, severity: "mild" },
    { min: 10, max: 14, severity: "moderate" },
    { min: 15, max: 19, severity: "severe" },
    { min: 20, max: 42, severity: "extremely_severe" },
  ],

  stress: [
    { min: 0, max: 14, severity: "normal" },
    { min: 15, max: 18, severity: "mild" },
    { min: 19, max: 25, severity: "moderate" },
    { min: 26, max: 33, severity: "severe" },
    { min: 34, max: 42, severity: "extremely_severe" },
  ],
};

export function getDassSeverity(category, score) {
  const ranges = DASS_SEVERITY_RANGES[category];

  if (!ranges) {
    throw new Error(`Invalid DASS category: ${category}`);
  }

  const matchedRange = ranges.find(
    (range) => score >= range.min && score <= range.max
  );

  return matchedRange?.severity || "unknown";
}