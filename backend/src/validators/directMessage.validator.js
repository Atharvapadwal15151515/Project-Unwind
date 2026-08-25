import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const conversationIdSchema = z
  .string()
  .uuid("Invalid conversation ID.");

const messageIdSchema = z
  .string()
  .uuid("Invalid message ID.");

const paginationQuerySchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional(),

    beforeMessageId: messageIdSchema.optional()
  })
);

export const sendDirectMessageRequestSchema = {
  body: z.object({
    messageText: z
      .string()
      .trim()
      .min(1, "Message cannot be empty.")
      .max(2000, "Message cannot exceed 2000 characters."),

    messageType: z
      .enum(["text", "image", "video", "audio", "file"])
      .optional(),

    replyToMessageId: messageIdSchema.nullish()
  }),

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const getDirectMessageHistoryRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: paginationQuerySchema
};

export const getDirectMessageRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema,
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const editDirectMessageRequestSchema = {
  body: z.object({
    messageText: z
      .string()
      .trim()
      .min(1, "Message cannot be empty.")
      .max(2000, "Message cannot exceed 2000 characters.")
  }),

  params: z.object({
    conversationId: conversationIdSchema,
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const deleteDirectMessageRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema,
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const markDirectMessagesReadRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const getUnreadDirectMessageCountRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};