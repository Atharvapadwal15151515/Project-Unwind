import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Send Chat Message
|--------------------------------------------------------------------------
*/

export const sendChatMessageSchema =
  z.object({
    body: z
      .object({
        conversationId: z
          .string()
          .uuid(
            "Invalid conversation ID"
          ),

        message: z
          .string()
          .trim()
          .min(
            1,
            "Message is required"
          )
          .max(
            5000,
            "Message cannot exceed 5000 characters"
          )
      })
      .strict()
  });

/*
|--------------------------------------------------------------------------
| Conversation ID Params
|--------------------------------------------------------------------------
*/

export const conversationIdParamSchema =
  z.object({
    params: z.object({
      conversationId: z
        .uuid(
          "Invalid conversation ID"
        )
    })
  });

/*
|--------------------------------------------------------------------------
| Message ID Params
|--------------------------------------------------------------------------
*/

export const messageIdParamSchema =
  z.object({
    params: z.object({
      messageId: z.uuid(
        "Invalid message ID"
      )
    })
  });

/*
|--------------------------------------------------------------------------
| Create Conversation
|--------------------------------------------------------------------------
*/

export const createConversationSchema =
  z.object({
    body: z.object({
      title: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .optional()
    })
  });

/*
|--------------------------------------------------------------------------
| Update Conversation
|--------------------------------------------------------------------------
*/

export const updateConversationSchema =
  z.object({
    body: z
      .object({
        title: z
          .string()
          .trim()
          .min(1)
          .max(255)
          .optional(),

        conversationStatus: z
          .enum([
            "active",
            "archived",
            "deleted"
          ])
          .optional()
      })
      .refine(
        (body) =>
          Object.keys(body).length > 0,
        {
          message:
            "At least one field must be provided."
        }
      )
  });