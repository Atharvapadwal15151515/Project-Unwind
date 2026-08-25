import generatedData
  from "./chatbotSuggestions.generated.json";

const chatbotSuggestions =
  Array.isArray(
    generatedData?.suggestions
  )
    ? generatedData.suggestions
    : [];

export const chatbotSuggestionCount =
  Number(
    generatedData?.count ||
    chatbotSuggestions.length
  );

export default chatbotSuggestions;