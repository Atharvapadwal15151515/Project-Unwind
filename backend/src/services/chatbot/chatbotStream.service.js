import {
  createGroqChatStream
} from "./providers/groqChatStream.provider.js";

import {
  createGeminiChatStream
} from "./providers/geminiChatStream.provider.js";

import {
  createCloudflareChatStream
} from "./providers/cloudflareChatStream.provider.js";

/*
|--------------------------------------------------------------------------
| Provider Stream Handlers
|--------------------------------------------------------------------------
*/

const streamHandlers = {
  groq: async (
    conversationHistory,
    signal
  ) =>
    createGroqChatStream(
      conversationHistory,
      process.env.GROQ_CHAT_MODEL,
      signal
    ),

  groq_fast: async (
    conversationHistory,
    signal
  ) =>
    createGroqChatStream(
      conversationHistory,
      process.env.GROQ_FAST_MODEL,
      signal
    ),

  cloudflare: async (
    conversationHistory,
    signal
  ) =>
    createCloudflareChatStream(
      conversationHistory,
      signal
    ),

  gemini: async (
    conversationHistory,
    signal
  ) =>
    createGeminiChatStream(
      conversationHistory,
      signal
    )
};

/*
|--------------------------------------------------------------------------
| Create Provider Stream
|--------------------------------------------------------------------------
*/

export async function createProviderStream(
  conversationHistory,
  signal
) {
  if (
    !Array.isArray(conversationHistory) ||
    conversationHistory.length === 0
  ) {
    throw new Error(
      "Conversation history is required"
    );
  }

  const fallbackEnabled =
    process.env.ENABLE_AI_FALLBACK ===
    "true";

  const fallbackOrder = (
    process.env.AI_FALLBACK_ORDER ||
    "groq,groq_fast,cloudflare,gemini"
  )
    .split(",")
    .map((provider) =>
      provider.trim()
    )
    .filter(Boolean);

  const providersToTry =
    fallbackEnabled
      ? fallbackOrder
      : [
          process.env.AI_PROVIDER ||
            "groq"
        ];

  const providerErrors = [];

  for (
    const providerName
    of providersToTry
  ) {
    if (signal?.aborted) {
      const abortError =
        new Error(
          "Streaming request aborted"
        );

      abortError.name =
        "AbortError";

      throw abortError;
    }

    const streamHandler =
      streamHandlers[providerName];

    if (!streamHandler) {
      providerErrors.push({
        provider:
          providerName,

        error:
          "Unknown streaming provider"
      });

      continue;
    }

    try {
      const stream =
        await streamHandler(
          conversationHistory,
          signal
        );

      return {
        stream,
        provider:
          providerName
      };
    } catch (error) {
      if (
        signal?.aborted ||
        error?.name === "AbortError"
      ) {
        throw error;
      }

      console.error(
        `${providerName} streaming error:`,
        error.message
      );

      providerErrors.push({
        provider:
          providerName,

        error:
          error.message
      });
    }
  }

  const error =
    new Error(
      "All streaming providers failed"
    );

  error.providerErrors =
    providerErrors;

  throw error;
}