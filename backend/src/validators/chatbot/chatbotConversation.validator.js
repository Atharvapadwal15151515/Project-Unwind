import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared Schemas
|--------------------------------------------------------------------------
*/

const conversationIdSchema =
  z.uuid(
    "Invalid conversation ID"
  );

const conversationStatusSchema =
  z.enum([
    "active",
    "archived",
    "deleted"
  ]);

const titleSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "Conversation title cannot be empty"
    )
    .max(
      255,
      "Conversation title cannot exceed 255 characters"
    );

/*
|--------------------------------------------------------------------------
| Create Conversation
|--------------------------------------------------------------------------
*/

export const createConversationSchema =
  z.object({
    body: z
      .object({
        title:
          titleSchema.optional()
      })
      .strict(),

    params: z
      .object({})
      .passthrough()
      .optional(),

    query: z
      .object({})
      .passthrough()
      .optional()
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
        title:
          titleSchema.optional(),

        conversationStatus:
          conversationStatusSchema
            .optional(),

        isPinned:
          z.boolean().optional()
      })
      .strict()
      .refine(
        (body) =>
          Object.keys(body).length > 0,
        {
          message:
            "At least one conversation field must be provided"
        }
      ),

    params: z
      .object({
        conversationId:
          conversationIdSchema
      })
      .strict(),

    query: z
      .object({})
      .passthrough()
      .optional()
  });

/*
|--------------------------------------------------------------------------
| Conversation ID Params
|--------------------------------------------------------------------------
*/

export const conversationIdParamSchema =
  z.object({
    params: z
      .object({
        conversationId:
          conversationIdSchema
      })
      .strict(),

    body: z
      .object({})
      .passthrough()
      .optional(),

    query: z
      .object({})
      .passthrough()
      .optional()
  });

/*
|--------------------------------------------------------------------------
| List Conversations Query
|--------------------------------------------------------------------------
*/

export const listConversationsQuerySchema =
  z.object({
    query: z
      .object({
        status:
          conversationStatusSchema
            .optional(),

        search: z
          .string()
          .trim()
          .min(
            1,
            "Search text cannot be empty"
          )
          .max(
            255,
            "Search text cannot exceed 255 characters"
          )
          .optional(),

        isPinned: z
          .preprocess(
            (value) => {
              if (
                value === "true" ||
                value === true
              ) {
                return true;
              }

              if (
                value === "false" ||
                value === false
              ) {
                return false;
              }

              return value;
            },
            z.boolean()
          )
          .optional(),

        limit: z
          .coerce
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20),

        offset: z
          .coerce
          .number()
          .int()
          .min(0)
          .default(0)
      })
      .strict(),

    body: z
      .object({})
      .passthrough()
      .optional(),

    params: z
      .object({})
      .passthrough()
      .optional()
  });