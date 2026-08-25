/*
|--------------------------------------------------------------------------
| Generate Chatbot Conversation Title
|--------------------------------------------------------------------------
*/

export function generateChatbotConversationTitle(
  message
) {
  const normalizedMessage =
    typeof message === "string"
      ? message
          .trim()
          .replace(/\s+/g, " ")
      : "";

  if (!normalizedMessage) {
    return "New Chat";
  }

  const words =
    normalizedMessage
      .split(" ")
      .filter(Boolean)
      .slice(0, 6);

  const title =
    words
      .join(" ")
      .replace(
        /[.!?,;:]+$/g,
        ""
      );

  if (!title) {
    return "New Chat";
  }

  return title
    .charAt(0)
    .toUpperCase() +
    title.slice(1);
}