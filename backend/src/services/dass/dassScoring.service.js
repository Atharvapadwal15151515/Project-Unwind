import { getDassSeverity } from "../../utils/dass/dassSeverity.js";

export function calculateDassScores(responses) {
  const rawScores = {
    depression: 0,
    anxiety: 0,
    stress: 0,
  };

  for (const response of responses) {
    const { category, answer_value: answerValue } = response;

    if (!(category in rawScores)) {
      throw new Error(`Invalid DASS category: ${category}`);
    }

    rawScores[category] += Number(answerValue);
  }

  const scores = {
    depression: rawScores.depression * 2,
    anxiety: rawScores.anxiety * 2,
    stress: rawScores.stress * 2,
  };

  const severities = {
    depression: getDassSeverity(
      "depression",
      scores.depression
    ),
    anxiety: getDassSeverity(
      "anxiety",
      scores.anxiety
    ),
    stress: getDassSeverity(
      "stress",
      scores.stress
    ),
  };

  return {
    rawScores,
    scores,
    severities,
  };
}