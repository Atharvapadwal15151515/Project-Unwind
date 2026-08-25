/*
|--------------------------------------------------------------------------
| High Risk Keywords
|--------------------------------------------------------------------------
*/

const HIGH_RISK_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "don't want to live",
  "i want to die",
  "i wish i were dead",
  "self harm",
  "self-harm",
  "cut myself",
  "hurt myself",
  "overdose",
  "jump off",
  "hang myself",
  "no reason to live",
  "better off dead",
  "life is pointless",
  "i cannot go on",
  "everyone would be better without me",
  "i'm done",
  "goodbye forever"
];

/*
|--------------------------------------------------------------------------
| Medium Risk Keywords
|--------------------------------------------------------------------------
*/

const MEDIUM_RISK_KEYWORDS = [
  "hopeless",
  "worthless",
  "empty",
  "broken",
  "depressed",
  "panic attack",
  "panic",
  "anxiety attack",
  "crying",
  "can't cope",
  "can't handle it",
  "nobody loves me",
  "i hate myself",
  "i feel trapped",
  "i'm exhausted",
  "i feel alone"
];

/*
|--------------------------------------------------------------------------
| Normalize
|--------------------------------------------------------------------------
*/

function normalize(text) {
  return text
    .toLowerCase()
    .trim();
}

/*
|--------------------------------------------------------------------------
| Evaluate Chatbot Safety
|--------------------------------------------------------------------------
*/

export function evaluateChatbotSafety(
  message
) {
  const normalized =
    normalize(message);

  const matchedHighRisk =
    HIGH_RISK_KEYWORDS.find(
      (keyword) =>
        normalized.includes(keyword)
    );

  if (matchedHighRisk) {
    return {
      safe: false,
      level: "high",
      matchedKeyword:
        matchedHighRisk
    };
  }

  const matchedMediumRisk =
    MEDIUM_RISK_KEYWORDS.find(
      (keyword) =>
        normalized.includes(keyword)
    );

  if (matchedMediumRisk) {
    return {
      safe: true,
      level: "medium",
      matchedKeyword:
        matchedMediumRisk
    };
  }

  return {
    safe: true,
    level: "safe",
    matchedKeyword: null
  };
}