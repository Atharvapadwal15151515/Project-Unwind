import api, {
  getAccessToken
} from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| Conversations
|--------------------------------------------------------------------------
*/

export async function createConversation({
  title = null
} = {}) {
  const response =
    await api.post(
      "/chatbot/conversations",
      {
        title
      }
    );

  const responseData =
    response.data;

  const data =
    responseData?.data;

  console.log(
    "CREATE CHATBOT CONVERSATION RESPONSE:",
    responseData
  );

  if (
    data?.conversation &&
    typeof data.conversation ===
      "object"
  ) {
    return data.conversation;
  }

  if (
    data?.chatbotConversation &&
    typeof data.chatbotConversation ===
      "object"
  ) {
    return data.chatbotConversation;
  }

  if (
    data &&
    typeof data === "object" &&
    (
      data.conversation_id ||
      data.conversationId ||
      data.id
    )
  ) {
    return data;
  }

  if (
    responseData?.conversation &&
    typeof responseData.conversation ===
      "object"
  ) {
    return responseData.conversation;
  }

  console.error(
    "Unexpected create conversation response:",
    responseData
  );

  return null;
}

export async function getConversations() {
  const response =
    await api.get(
      "/chatbot/conversations"
    );

  const data =
    response.data?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.conversations
    )
  ) {
    return data.conversations;
  }

  if (
    Array.isArray(
      response.data?.conversations
    )
  ) {
    return response.data.conversations;
  }

  return [];
}

export async function getConversation(
  conversationId
) {
  const response =
    await api.get(
      `/chatbot/conversations/${conversationId}`
    );

  return (
    response.data?.data
      ?.conversation ||
    null
  );
}

export async function deleteConversation(
  conversationId
) {
  const response =
    await api.delete(
      `/chatbot/conversations/${conversationId}`
    );

  return (
    response.data?.data
      ?.conversation ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Messages
|--------------------------------------------------------------------------
*/

export async function getConversationMessages(
  conversationId
) {
  const response =
    await api.get(
      `/chatbot/messages/conversation/${conversationId}`
    );

  const data =
    response.data?.data;

  if (Array.isArray(data)) {
    return data;
  }

  return (
    data?.messages ||
    []
  );
}

/*
|--------------------------------------------------------------------------
| Streaming message
|--------------------------------------------------------------------------
*/

export async function streamChatMessage({
  conversationId,
  message,
  onChunk,
  signal
}) {
  const accessToken =
    getAccessToken();

  const response =
    await fetch(
      `${API_BASE_URL}/chatbot/message/stream`,
      {
        method: "POST",

        credentials:
          "include",

        signal,

        headers: {
          "Content-Type":
            "application/json",

          ...(accessToken
            ? {
                Authorization:
                  `Bearer ${accessToken}`
              }
            : {})
        },

        body: JSON.stringify({
          conversationId,
          message
        })
      }
    );

  if (!response.ok) {
    let message =
      "Unable to send your message.";

    try {
      const errorData =
        await response.json();

      message =
        errorData?.message ||
        message;
    } catch {
      // Response was not JSON.
    }

    throw new Error(message);
  }

  const reader =
    response.body?.getReader();

  if (!reader) {
    throw new Error(
      "Streaming is not supported by this browser."
    );
  }

  const decoder =
    new TextDecoder();

  let fullText = "";

  while (true) {
    const {
      value,
      done
    } = await reader.read();

    if (done) {
      break;
    }

    const chunk =
      decoder.decode(
        value,
        {
          stream: true
        }
      );

    if (!chunk) {
      continue;
    }

    fullText += chunk;

    onChunk?.(
      chunk,
      fullText
    );
  }

  fullText +=
    decoder.decode();

  return {
    text: fullText,

    source:
      response.headers.get(
        "X-Chatbot-Source"
      ),

    intent:
      response.headers.get(
        "X-Chatbot-Intent"
      ),

    provider:
      response.headers.get(
        "X-AI-Provider"
      )
  };
}