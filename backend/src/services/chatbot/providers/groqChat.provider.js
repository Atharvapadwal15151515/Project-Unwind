import Groq from "groq-sdk";

import {
  CHATBOT_SYSTEM_PROMPT
} from "../../../prompts/chatbot/provider.prompt.js";


const groqClient =
  new Groq({
    apiKey:
      process.env.GROQ_CHAT_API_KEY
  });


export async function generateGroqChatReply(
  conversationHistory,
  model = process.env.GROQ_CHAT_MODEL,
  systemPrompt = null
) {
  /*
  |--------------------------------------------------------------------------
  | Active System Prompt
  |--------------------------------------------------------------------------
  |
  | Normal chatbot request:
  | systemPrompt = null
  | → CHATBOT_SYSTEM_PROMPT is used
  |
  | Crisis chatbot request:
  | systemPrompt = buildChatbotCrisisPrompt(...)
  | → crisis-specific prompt is used
  |
  */

  const activeSystemPrompt =
    systemPrompt ||
    CHATBOT_SYSTEM_PROMPT;


  const completion =
    await groqClient.chat.completions.create({
      model,

      messages: [
        {
          role: "system",
          content:
            activeSystemPrompt
        },

        ...conversationHistory
      ],

      temperature: Number(
        process.env
          .CHAT_TEMPERATURE || 0.7
      ),

      max_tokens: Number(
        process.env
          .MAX_RESPONSE_TOKENS || 1024
      )
    });


  const reply =
    completion.choices?.[0]?.message
      ?.content?.trim();


  if (!reply) {
    throw new Error(
      "Groq returned an empty response"
    );
  }


  return {
    reply,

    provider:
      model ===
      process.env.GROQ_FAST_MODEL
        ? "groq_fast"
        : "groq",

    model,

    promptTokens:
      completion.usage
        ?.prompt_tokens ?? 0,

    completionTokens:
      completion.usage
        ?.completion_tokens ?? 0,

    totalTokens:
      completion.usage
        ?.total_tokens ?? 0,

    finishReason:
      completion.choices?.[0]
        ?.finish_reason ?? null
  };
}