import {
  CHATBOT_SYSTEM_PROMPT
} from "../../../prompts/chatbot/provider.prompt.js";


export async function generateCloudflareChatReply(
  conversationHistory,
  systemPrompt = null
) {
  /*
  |--------------------------------------------------------------------------
  | Cloudflare Configuration
  |--------------------------------------------------------------------------
  */

  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID;

  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN;

  const model =
    process.env.CLOUDFLARE_MODEL;


  /*
  |--------------------------------------------------------------------------
  | Active System Prompt
  |--------------------------------------------------------------------------
  |
  | Normal chatbot request:
  | systemPrompt = null
  | → CHATBOT_SYSTEM_PROMPT
  |
  | Crisis chatbot request:
  | systemPrompt = buildChatbotCrisisPrompt(...)
  | → crisis-specific prompt
  |
  */

  const activeSystemPrompt =
    systemPrompt ||
    CHATBOT_SYSTEM_PROMPT;


  /*
  |--------------------------------------------------------------------------
  | Cloudflare AI Request
  |--------------------------------------------------------------------------
  */

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${apiToken}`,

        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
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
            .CHAT_TEMPERATURE ||
            0.7
        ),

        max_tokens: Number(
          process.env
            .MAX_RESPONSE_TOKENS ||
            1024
        )
      })
    }
  );


  /*
  |--------------------------------------------------------------------------
  | Parse Response
  |--------------------------------------------------------------------------
  */

  const data =
    await response.json();


  /*
  |--------------------------------------------------------------------------
  | Cloudflare Error Handling
  |--------------------------------------------------------------------------
  */

  if (
    !response.ok ||
    !data.success
  ) {
    throw new Error(
      data.errors?.[0]?.message ||
        `Cloudflare request failed with status ${response.status}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Extract Reply
  |--------------------------------------------------------------------------
  */

  const reply =
    data.result?.response?.trim();


  if (!reply) {
    throw new Error(
      "Cloudflare returned an empty response"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Standard Provider Response
  |--------------------------------------------------------------------------
  */

  return {
    reply,

    provider:
      "cloudflare",

    model
  };
}