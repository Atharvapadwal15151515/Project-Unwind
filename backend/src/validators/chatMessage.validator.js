import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const roomIdSchema = z.string().uuid("Invalid room ID.");

const messageIdSchema = z.string().uuid("Invalid message ID.");

const paginationQuerySchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional(),

    before_created_at: z
      .string()
      .datetime()
      .optional(),

    before_message_id: messageIdSchema.optional()
  })
);

export const getPublicChatHistoryRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema
};

export const sendPublicChatMessageRequestSchema = {
  body: z.object({
    message_text: z
      .string()
      .trim()
      .min(1, "Message cannot be empty.")
      .max(2000, "Message cannot exceed 2000 characters."),

    reply_to_message_id: messageIdSchema.nullish()
  }),

  params: emptyObjectSchema,

  query: emptyObjectSchema
};

export const getChatMessageRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const editChatMessageRequestSchema = {
  body: z.object({
    message_text: z
      .string()
      .trim()
      .min(1, "Message cannot be empty.")
      .max(2000, "Message cannot exceed 2000 characters.")
  }),

  params: z.object({
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const deleteChatMessageRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const getUnreadMessageCountRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const markMessagesAsReadRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};