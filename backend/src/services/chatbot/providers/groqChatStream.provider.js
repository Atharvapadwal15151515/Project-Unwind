import Groq from "groq-sdk";

import {
  CHATBOT_SYSTEM_PROMPT
} from "../../../prompts/chatbot/provider.prompt.js";


const groqClient =
  new Groq({
    apiKey:
      process.env.GROQ_CHAT_API_KEY
  });


/*
|--------------------------------------------------------------------------
| Create Groq Chat Stream
|--------------------------------------------------------------------------
*/

export async function createGroqChatStream(
  conversationHistory,
  model = process.env.GROQ_CHAT_MODEL,
  signal,
  systemPrompt = null
) {
  const activeSystemPrompt =
    systemPrompt ||
    CHATBOT_SYSTEM_PROMPT;


  const completion =
    await groqClient.chat.completions.create(
      {
        model,

        stream: true,

        messages: [
          {
            role: "system",
            content:
              activeSystemPrompt
          },

          ...conversationHistory
        ],

        temperature: Number(
          process.env.CHAT_TEMPERATURE ||
            0.7
        ),

        max_tokens: Number(
          process.env.MAX_RESPONSE_TOKENS ||
            1024
        )
      },
      {
        signal
      }
    );


  async function* streamGenerator() {
    try {
      for await (
        const chunk of completion
      ) {
        if (signal?.aborted) {
          const abortError =
            new Error(
              "Groq streaming request aborted"
            );

          abortError.name =
            "AbortError";

          throw abortError;
        }


        const text =
          chunk.choices?.[0]
            ?.delta?.content;


        if (
          typeof text === "string" &&
          text.length > 0
        ) {
          yield text;
        }
      }
    } catch (error) {
      if (
        signal?.aborted ||
        error?.name === "AbortError"
      ) {
        const abortError =
          new Error(
            "Groq streaming request aborted"
          );

        abortError.name =
          "AbortError";

        throw abortError;
      }

      throw error;
    }
  }


  return streamGenerator();
}