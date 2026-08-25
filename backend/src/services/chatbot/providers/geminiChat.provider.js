import {
  GoogleGenAI
} from "@google/genai";

import {
  CHATBOT_SYSTEM_PROMPT
} from "../../../prompts/chatbot/provider.prompt.js";


const geminiClient =
  new GoogleGenAI({
    apiKey:
      process.env.GEMINI_API_KEY
  });


export async function generateGeminiChatReply(
  conversationHistory,
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


  /*
  |--------------------------------------------------------------------------
  | Convert Conversation History
  |--------------------------------------------------------------------------
  |
  | Gemini expects:
  |
  | user      → user
  | assistant → model
  |
  */

  const contents =
    conversationHistory.map(
      (message) => ({
        role:
          message.role ===
          "assistant"
            ? "model"
            : "user",

        parts: [
          {
            text:
              message.content
          }
        ]
      })
    );


  /*
  |--------------------------------------------------------------------------
  | Generate Gemini Response
  |--------------------------------------------------------------------------
  */

  const response =
    await geminiClient.models.generateContent({
      model:
        process.env.GEMINI_MODEL,

      contents,

      config: {
        systemInstruction:
          activeSystemPrompt,

        temperature: Number(
          process.env
            .CHAT_TEMPERATURE ||
            0.7
        ),

        maxOutputTokens: Number(
          process.env
            .MAX_RESPONSE_TOKENS ||
            1024
        )
      }
    });


  /*
  |--------------------------------------------------------------------------
  | Extract Response
  |--------------------------------------------------------------------------
  */

  const reply =
    response.text?.trim();


  if (!reply) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Return Standard Provider Response
  |--------------------------------------------------------------------------
  */

  return {
    reply,

    provider:
      "gemini",

    model:
      process.env.GEMINI_MODEL
  };
}