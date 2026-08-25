import {
  generateGroqChatReply
} from "./providers/groqChat.provider.js";

import {
  generateGeminiChatReply
} from "./providers/geminiChat.provider.js";

import {
  generateCloudflareChatReply
} from "./providers/cloudflareChat.provider.js";


/*
|--------------------------------------------------------------------------
| Provider Handlers
|--------------------------------------------------------------------------
|
| Every provider now accepts:
|
| 1. conversationHistory
| 2. optional systemPrompt
|
| Normal chatbot flow:
| systemPrompt = null
| → provider uses CHATBOT_SYSTEM_PROMPT
|
| Crisis flow:
| systemPrompt = crisisSystemPrompt
| → provider uses dedicated crisis prompt
|
*/

const providerHandlers = {
  groq: async (
    conversationHistory,
    systemPrompt
  ) =>
    generateGroqChatReply(
      conversationHistory,
      process.env.GROQ_CHAT_MODEL,
      systemPrompt
    ),

  groq_fast: async (
    conversationHistory,
    systemPrompt
  ) =>
    generateGroqChatReply(
      conversationHistory,
      process.env.GROQ_FAST_MODEL,
      systemPrompt
    ),

  gemini: async (
    conversationHistory,
    systemPrompt
  ) =>
    generateGeminiChatReply(
      conversationHistory,
      systemPrompt
    ),

  cloudflare: async (
    conversationHistory,
    systemPrompt
  ) =>
    generateCloudflareChatReply(
      conversationHistory,
      systemPrompt
    )
};


/*
|--------------------------------------------------------------------------
| Generate Provider Reply
|--------------------------------------------------------------------------
*/

export async function generateProviderReply(
  conversationHistory,
  systemPrompt = null
) {
  /*
  |--------------------------------------------------------------------------
  | Validate Conversation History
  |--------------------------------------------------------------------------
  */

  if (
    !Array.isArray(conversationHistory) ||
    conversationHistory.length === 0
  ) {
    throw new Error(
      "Conversation history is required"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Fallback Configuration
  |--------------------------------------------------------------------------
  */

  const fallbackEnabled =
    process.env.ENABLE_AI_FALLBACK ===
    "true";


  const fallbackOrder = (
    process.env.AI_FALLBACK_ORDER ||
    "groq,groq_fast,cloudflare,gemini"
  )
    .split(",")
    .map(
      (provider) =>
        provider.trim()
    )
    .filter(Boolean);


  /*
  |--------------------------------------------------------------------------
  | Providers To Try
  |--------------------------------------------------------------------------
  |
  | If fallback is enabled:
  |
  | groq
  | ↓
  | groq_fast
  | ↓
  | cloudflare
  | ↓
  | gemini
  |
  | Otherwise only AI_PROVIDER is attempted.
  |
  */

  const providersToTry =
    fallbackEnabled
      ? fallbackOrder
      : [
          process.env.AI_PROVIDER ||
            "groq"
        ];


  /*
  |--------------------------------------------------------------------------
  | Provider Error Collection
  |--------------------------------------------------------------------------
  */

  const providerErrors = [];


  /*
  |--------------------------------------------------------------------------
  | Provider Fallback Loop
  |--------------------------------------------------------------------------
  */

  for (
    const providerName
    of providersToTry
  ) {
    const providerHandler =
      providerHandlers[
        providerName
      ];


    /*
    |--------------------------------------------------------------------------
    | Unknown Provider
    |--------------------------------------------------------------------------
    */

    if (!providerHandler) {
      providerErrors.push({
        provider:
          providerName,

        error:
          "Unknown provider"
      });

      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | Attempt Provider
    |--------------------------------------------------------------------------
    */

    try {
      return await providerHandler(
        conversationHistory,
        systemPrompt
      );
    } catch (error) {
      console.error(
        `${providerName} chatbot error:`,
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


  /*
  |--------------------------------------------------------------------------
  | All Providers Failed
  |--------------------------------------------------------------------------
  */

  const error =
    new Error(
      "All AI providers failed"
    );


  error.providerErrors =
    providerErrors;


  throw error;
}