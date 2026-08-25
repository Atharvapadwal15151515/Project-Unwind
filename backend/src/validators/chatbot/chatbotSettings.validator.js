import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Update Chatbot Settings
|--------------------------------------------------------------------------
*/

export const updateChatbotSettingsSchema = {
  body: z
    .object({
      preferredProvider: z
        .enum([
          "groq",
          "groq_fast",
          "gemini",
          "cloudflare"
        ])
        .optional(),

      preferredLanguage: z
        .string()
        .trim()
        .min(2)
        .max(10)
        .optional(),

      preferredResponseStyle: z
        .enum([
          "concise",
          "balanced",
          "detailed"
        ])
        .optional(),

      allowConversationHistory:
        z.boolean().optional(),

      allowPersonalizedContext:
        z.boolean().optional(),

      allowPredefinedResponses:
        z.boolean().optional(),

      allowAIResponses:
        z.boolean().optional(),

      enableStreaming:
        z.boolean().optional(),

      dailyAIMessageLimit: z
        .number()
        .int()
        .min(0)
        .max(1000)
        .optional()
    })
    .strict()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "At least one setting must be provided."
      }
    )
};

/*
|--------------------------------------------------------------------------
| Conversation Params
|--------------------------------------------------------------------------
*/

export const conversationIdParamSchema = {
  params: z.object({
    conversationId: z.uuid()
  })
};

/*
|--------------------------------------------------------------------------
| Message Params
|--------------------------------------------------------------------------
*/

export const messageIdParamSchema = {
  params: z.object({
    messageId: z.uuid()
  })
};

/*
|--------------------------------------------------------------------------
| Safety Event Params
|--------------------------------------------------------------------------
*/

export const safetyEventIdParamSchema = {
  params: z.object({
    safetyEventId: z.uuid()
  })
};