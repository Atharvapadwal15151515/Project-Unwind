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


export async function createGeminiChatStream(
  conversationHistory,
  signal,
  systemPrompt = null
) {
  const activeSystemPrompt =
    systemPrompt ||
    CHATBOT_SYSTEM_PROMPT;


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


  if (signal?.aborted) {
    const abortError =
      new Error(
        "Gemini streaming request aborted"
      );

    abortError.name =
      "AbortError";

    throw abortError;
  }


  const response =
    await geminiClient.models
      .generateContentStream({
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


  async function* streamGenerator() {
    for await (
      const chunk of response
    ) {
      if (signal?.aborted) {
        const abortError =
          new Error(
            "Gemini streaming request aborted"
          );

        abortError.name =
          "AbortError";

        throw abortError;
      }


      const text =
        chunk.text;


      if (
        typeof text === "string" &&
        text.length > 0
      ) {
        yield text;
      }
    }
  }


  return streamGenerator();
}