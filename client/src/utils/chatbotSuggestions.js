import chatbotSuggestions
  from "../data/chatbotSuggestions";

function normalizeText(
  value
) {
  return String(
    value || ""
  )
    .trimStart()
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    );
}

function getWords(
  value
) {
  return normalizeText(
    value
  )
    .split(" ")
    .filter(Boolean);
}

function calculateSuggestionScore(
  suggestion,
  input
) {
  const suggestionText =
    suggestion.searchText ||
    normalizeText(
      suggestion.text
    );

  const normalizedInput =
    normalizeText(input);

  /*
  |--------------------------------------------------------------------------
  | Exact text
  |--------------------------------------------------------------------------
  */

  if (
    suggestionText ===
    normalizedInput
  ) {
    return 1000;
  }

  /*
  |--------------------------------------------------------------------------
  | User is typing the beginning
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | "I want to"
  | →
  | "I want to meditate"
  |
  */

  if (
    suggestionText.startsWith(
      normalizedInput
    )
  ) {
    const lengthPenalty =
      suggestionText.length -
      normalizedInput.length;

    return (
      900 -
      Math.min(
        lengthPenalty,
        200
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Word-prefix matching
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | "feeling anx"
  | →
  | "I am feeling anxious"
  |
  */

  const inputWords =
    getWords(
      normalizedInput
    );

  const suggestionWords =
    getWords(
      suggestionText
    );

  let matchingWords = 0;

  for (
    const inputWord of
    inputWords
  ) {
    const matched =
      suggestionWords.some(
        (
          suggestionWord
        ) =>
          suggestionWord.startsWith(
            inputWord
          )
      );

    if (matched) {
      matchingWords += 1;
    }
  }

  if (
    matchingWords ===
    inputWords.length &&
    inputWords.length >= 2
  ) {
    return (
      600 +
      matchingWords * 15
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Contains typed phrase
  |--------------------------------------------------------------------------
  */

  if (
    normalizedInput.length >=
      4 &&
    suggestionText.includes(
      normalizedInput
    )
  ) {
    return 450;
  }

  return 0;
}

export function getChatbotSuggestions(
  input,
  {
    limit = 5
  } = {}
) {
  const normalizedInput =
    normalizeText(
      input
    );

  /*
   * Don't spam suggestions after
   * one character.
   */
  if (
    normalizedInput.length < 2
  ) {
    return [];
  }

  const scoredSuggestions =
    chatbotSuggestions
      .map(
        (suggestion) => ({
          suggestion,

          score:
            calculateSuggestionScore(
              suggestion,
              normalizedInput
            )
        })
      )
      .filter(
        ({ score }) =>
          score > 0
      )
      .sort(
        (
          firstResult,
          secondResult
        ) => {
          if (
            secondResult.score !==
            firstResult.score
          ) {
            return (
              secondResult.score -
              firstResult.score
            );
          }

          return (
            firstResult
              .suggestion
              .text.length -
            secondResult
              .suggestion
              .text.length
          );
        }
      );

  const results = [];
  const seen = new Set();

  for (
    const {
      suggestion
    } of scoredSuggestions
  ) {
    const key =
      normalizeText(
        suggestion.text
      );

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    results.push(
      suggestion
    );

    if (
      results.length >=
      limit
    ) {
      break;
    }
  }

  return results;
}