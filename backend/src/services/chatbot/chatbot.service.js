import {
  findMatchingIntent
} from "./chatbotIntent.service.js";

import {
  generateProviderReply
} from "./chatbotProvider.service.js";

import {
  evaluateChatbotSafety
} from "./chatbotSafety.service.js";

import {
  getConversationContext
} from "./chatbotMessage.service.js";

import {
  CHATBOT_CRISIS_RESPONSE_TEMPLATE,
  buildChatbotCrisisPrompt
} from "../../prompts/chatbot/crisis.prompt.js";
import {
  getIndiaCrisisResources
} from "../../config/crisisResources.js";

/*
|--------------------------------------------------------------------------
| Chatbot Fallback Response
|--------------------------------------------------------------------------
*/

const CHATBOT_FALLBACK_RESPONSE =
  "I’m having trouble responding properly right now. Please try again in a moment 🌿";


/*
|--------------------------------------------------------------------------
| Build Base Response
|--------------------------------------------------------------------------
*/

function buildChatbotResponse({
  reply,
  intent = "unknown",
  matchedPattern = null,
  matchScore = null,
  source,
  provider = null,
  model = null,
  safetyLevel = "safe"
}) {
  return {
    reply,
    intent,
    matchedPattern,
    matchScore,
    source,
    provider,
    model,
    safetyLevel
  };
}


/*
|--------------------------------------------------------------------------
| Build Conversation History
|--------------------------------------------------------------------------
|
| Loads recent conversation context and appends the user's
| latest message.
|
*/

async function buildConversationHistory(
  userId,
  conversationId,
  normalizedMessage
) {
  const conversationHistory =
    await getConversationContext(
      userId,
      conversationId
    );

  /*
  |--------------------------------------------------------------------------
  | Defensive History Handling
  |--------------------------------------------------------------------------
  |
  | getConversationContext() should normally return an array.
  | We still guard against unexpected values.
  |
  */

  const safeHistory =
    Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

  safeHistory.push({
    role: "user",
    content: normalizedMessage
  });

  return safeHistory;
}


/*
|--------------------------------------------------------------------------
| Generate Crisis Reply
|--------------------------------------------------------------------------
|
| Crisis messages receive:
|
| - recent conversation context
| - dedicated crisis system prompt
| - provider fallback
| - static safety fallback if providers fail
|
*/

async function generateCrisisReply({
  userId,
  conversationId,
  normalizedMessage,
  safetyResult
}) {
  /*
  |--------------------------------------------------------------------------
  | AI Availability
  |--------------------------------------------------------------------------
  |
  | If AI responses are explicitly disabled, we must still return
  | a reliable crisis response.
  |
  */

  const aiEnabled =
    process.env.ENABLE_AI_RESPONSES !==
    "false";


  if (!aiEnabled) {
    return buildChatbotResponse({
      reply:
        CHATBOT_CRISIS_RESPONSE_TEMPLATE,

      intent:
        "crisis",

      matchedPattern:
        safetyResult.matchedKeyword,

      matchScore:
        100,

      source:
        "safety_fallback",

      safetyLevel:
        safetyResult.level
    });
  }


  /*
  |--------------------------------------------------------------------------
  | Conversation Context
  |--------------------------------------------------------------------------
  |
  | Context is important for crisis responses.
  |
  | Example:
  |
  | Previous:
  | "My relationship ended today."
  |
  | Current:
  | "I don't want to be here anymore."
  |
  | The AI should understand both messages instead of responding
  | only to the second sentence.
  |
  */

  const conversationHistory =
    await buildConversationHistory(
      userId,
      conversationId,
      normalizedMessage
    );


  /*
  |--------------------------------------------------------------------------
  | Verified Crisis Resources
  |--------------------------------------------------------------------------
  |
  | Keep this empty until a verified local-resource service is
  | connected.
  |
  | Do NOT insert random search-engine links or unverified phone
  | numbers here.
  |
  */

  const resourcesText =
  getIndiaCrisisResources({
    includeMaharashtra: true
  });


  /*
  |--------------------------------------------------------------------------
  | Build Dedicated Crisis Prompt
  |--------------------------------------------------------------------------
  */

  const crisisSystemPrompt =
    buildChatbotCrisisPrompt({
      resourcesText
    });


  /*
  |--------------------------------------------------------------------------
  | Generate Personalized Crisis Response
  |--------------------------------------------------------------------------
  */

  try {
    const aiResponse =
      await generateProviderReply(
        conversationHistory,
        crisisSystemPrompt
      );


    return buildChatbotResponse({
      reply:
        aiResponse.reply,

      intent:
        "crisis",

      matchedPattern:
        safetyResult.matchedKeyword,

      matchScore:
        100,

      source:
        "safety_ai",

      provider:
        aiResponse.provider,

      model:
        aiResponse.model,

      safetyLevel:
        safetyResult.level
    });
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Crisis Provider Failure
    |--------------------------------------------------------------------------
    |
    | A provider failure must NEVER leave the user without a safety
    | response.
    |
    | Therefore the static crisis template remains the final safety
    | fallback.
    |
    */

    console.error(
      "Crisis chatbot providers failed:",
      error.message
    );


    if (
      Array.isArray(
        error.providerErrors
      )
    ) {
      for (
        const providerError
        of error.providerErrors
      ) {
        console.error(
          `[${providerError.provider}]`,
          providerError.error
        );
      }
    }


    return buildChatbotResponse({
      reply:
        CHATBOT_CRISIS_RESPONSE_TEMPLATE,

      intent:
        "crisis",

      matchedPattern:
        safetyResult.matchedKeyword,

      matchScore:
        100,

      source:
        "safety_fallback",

      safetyLevel:
        safetyResult.level
    });
  }
}


/*
|--------------------------------------------------------------------------
| Generate Chatbot Reply
|--------------------------------------------------------------------------
*/

export async function generateChatbotReply(
  userId,
  conversationId,
  message
) {
  /*
  |--------------------------------------------------------------------------
  | Normalize Message
  |--------------------------------------------------------------------------
  */

  const normalizedMessage =
    typeof message === "string"
      ? message.trim()
      : "";


  if (!normalizedMessage) {
    throw new Error(
      "Chatbot message is required"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Safety Evaluation
  |--------------------------------------------------------------------------
  |
  | Safety ALWAYS runs before:
  |
  | - predefined responses
  | - normal AI responses
  | - ordinary conversational routing
  |
  */

  const safetyResult =
    evaluateChatbotSafety(
      normalizedMessage
    );


  /*
  |--------------------------------------------------------------------------
  | Crisis Flow
  |--------------------------------------------------------------------------
  |
  | Any message classified as unsafe bypasses:
  |
  | - predefined intents
  | - normal Unwind chatbot prompt
  | - ordinary fallback handling
  |
  | and moves directly into dedicated crisis handling.
  |
  */

  if (!safetyResult.safe) {
    return await generateCrisisReply({
      userId,
      conversationId,
      normalizedMessage,
      safetyResult
    });
  }


  /*
  |--------------------------------------------------------------------------
  | Predefined Responses
  |--------------------------------------------------------------------------
  */

  const predefinedEnabled =
    process.env
      .ENABLE_PREDEFINED_RESPONSES !==
    "false";


  if (predefinedEnabled) {
    const matchedIntent =
      findMatchingIntent(
        normalizedMessage
      );


    if (matchedIntent) {
      return buildChatbotResponse({
        reply:
          matchedIntent.reply,

        intent:
          matchedIntent.intent,

        matchedPattern:
          matchedIntent.matchedPattern,

        matchScore:
          Number(
            matchedIntent.score.toFixed(2)
          ),

        source:
          "predefined",

        safetyLevel:
          safetyResult.level
      });
    }
  }


  /*
  |--------------------------------------------------------------------------
  | AI Responses Disabled
  |--------------------------------------------------------------------------
  */

  const aiEnabled =
    process.env.ENABLE_AI_RESPONSES !==
    "false";


  if (!aiEnabled) {
    return buildChatbotResponse({
      reply:
        "I don’t have a predefined response for that yet. Please try one of the suggested messages 🌿",

      intent:
        "unknown",

      source:
        "fallback",

      safetyLevel:
        safetyResult.level
    });
  }


  /*
  |--------------------------------------------------------------------------
  | Conversation Context
  |--------------------------------------------------------------------------
  */

  const conversationHistory =
    await buildConversationHistory(
      userId,
      conversationId,
      normalizedMessage
    );


  /*
  |--------------------------------------------------------------------------
  | Normal AI Provider Response
  |--------------------------------------------------------------------------
  |
  | No custom system prompt is supplied here.
  |
  | Therefore:
  |
  | generateProviderReply(conversationHistory)
  |
  | will use CHATBOT_SYSTEM_PROMPT from provider.prompt.js.
  |
  */

  try {
    const aiResponse =
      await generateProviderReply(
        conversationHistory
      );


    return buildChatbotResponse({
      reply:
        aiResponse.reply,

      intent:
        "unknown",

      source:
        "ai",

      provider:
        aiResponse.provider,

      model:
        aiResponse.model,

      safetyLevel:
        safetyResult.level
    });
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Normal Provider Failure
    |--------------------------------------------------------------------------
    */

    console.error(
      "All chatbot providers failed:",
      error.message
    );


    if (
      Array.isArray(
        error.providerErrors
      )
    ) {
      for (
        const providerError
        of error.providerErrors
      ) {
        console.error(
          `[${providerError.provider}]`,
          providerError.error
        );
      }
    }


    return buildChatbotResponse({
      reply:
        CHATBOT_FALLBACK_RESPONSE,

      intent:
        "unknown",

      source:
        "fallback",

      safetyLevel:
        safetyResult.level
    });
  }
}