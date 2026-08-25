const severityMessages = {
  normal:
    "Your score falls within the normal range.",

  mild:
    "Your score falls within the mild range. You may benefit from monitoring how you feel and using healthy coping strategies.",

  moderate:
    "Your score falls within the moderate range. Consider discussing your symptoms with a qualified mental health professional.",

  severe:
    "Your score falls within the severe range. It is recommended that you seek support from a qualified mental health professional.",

  extremely_severe:
    "Your score falls within the extremely severe range. Please seek support from a qualified mental health professional as soon as possible.",
};

function formatSeverity(severity) {
  return severity.replaceAll("_", " ");
}

export function generateDassInterpretation(result) {
  const {
    depressionSeverity,
    anxietySeverity,
    stressSeverity,
  } = result;

  const depressionMessage =
    severityMessages[depressionSeverity];

  const anxietyMessage =
    severityMessages[anxietySeverity];

  const stressMessage =
    severityMessages[stressSeverity];

  if (
    !depressionMessage ||
    !anxietyMessage ||
    !stressMessage
  ) {
    throw new Error(
      "Invalid severity value provided for interpretation"
    );
  }

  return {
    depression: {
      severity: formatSeverity(depressionSeverity),
      message: depressionMessage,
    },

    anxiety: {
      severity: formatSeverity(anxietySeverity),
      message: anxietyMessage,
    },

    stress: {
      severity: formatSeverity(stressSeverity),
      message: stressMessage,
    },

    summary:
      "This assessment is a screening tool and not a medical diagnosis. The results should be considered alongside your recent experiences and discussed with a qualified professional when needed.",
  };
}