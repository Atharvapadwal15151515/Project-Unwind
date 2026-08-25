import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared Fields
|--------------------------------------------------------------------------
*/

const messageSchema = z
  .string({
    required_error: "Message is required",
    invalid_type_error:
      "Message must be a string"
  })
  .trim()
  .min(
    1,
    "Message cannot be empty"
  )
  .max(
    5000,
    "Message cannot exceed 5000 characters"
  );

/*
|--------------------------------------------------------------------------
| Send Chat Message
|--------------------------------------------------------------------------
*/

export const sendChatMessageSchema =
  z.object({
    body: z.object({
      conversationId: z
        .string({
          required_error:
            "Conversation ID is required",
          invalid_type_error:
            "Conversation ID must be a string"
        })
        .uuid(
          "Conversation ID must be a valid UUID"
        ),

      message: messageSchema
    }),

    params: z
      .object({})
      .passthrough()
      .optional(),

    query: z
      .object({})
      .passthrough()
      .optional()
  });