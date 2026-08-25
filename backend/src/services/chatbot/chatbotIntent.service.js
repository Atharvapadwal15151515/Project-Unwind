import chatbotData from "../../data/chatbot/intents.json" with {
  type: "json"
};

import kbData from "../../data/chatbot/KB.json" with {
  type: "json"
};

/*
|--------------------------------------------------------------------------
| Normalize Text
|--------------------------------------------------------------------------
*/

function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/i'm/g, "i am")
    .replace(/i’m/g, "i am")
    .replace(/can't/g, "cannot")
    .replace(/can’t/g, "cannot")
    .replace(/won't/g, "will not")
    .replace(/won’t/g, "will not")
    .replace(/(.)\1{2,}/g, "$1")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| Select Random Response
|--------------------------------------------------------------------------
*/

function getRandomResponse(responses) {
  const randomIndex = Math.floor(
    Math.random() * responses.length
  );

  return responses[randomIndex];
}

/*
|--------------------------------------------------------------------------
| Find Exact Matching Intent
|--------------------------------------------------------------------------
*/

export function findMatchingIntent(
  userMessage
) {
  const normalizedUserMessage =
    normalizeText(userMessage);

  const allIntents = [
    ...chatbotData.intents,
    ...kbData.intents
  ];

  for (const intent of allIntents) {
    if (
      !Array.isArray(intent.patterns) ||
      !Array.isArray(intent.responses) ||
      intent.responses.length === 0
    ) {
      continue;
    }

    for (const pattern of intent.patterns) {
      if (
        typeof pattern !== "string" ||
        !pattern.trim()
      ) {
        continue;
      }

      const normalizedPattern =
        normalizeText(pattern);

      if (
        normalizedUserMessage ===
        normalizedPattern
      ) {
        return {
          intent: intent.tag,
          matchedPattern: pattern,
          score: 100,
          reply: getRandomResponse(
            intent.responses
          )
        };
      }
    }
  }

  return null;
}