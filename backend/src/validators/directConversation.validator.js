import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const conversationIdSchema = z
  .string()
  .uuid("Invalid conversation ID.");

const userIdSchema = z
  .string()
  .uuid("Invalid user ID.");

const paginationQuerySchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional(),

    offset: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
  })
);

export const createDirectConversationRequestSchema = {
  body: z.object({
    recipientUserId: userIdSchema
  }),

  params: emptyObjectSchema,

  query: emptyObjectSchema
};

export const getDirectConversationRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const listDirectConversationsRequestSchema = {
  body: emptyObjectSchema,

  params: emptyObjectSchema,

  query: paginationQuerySchema
};

export const markDirectConversationReadRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const refreshDirectConversationIdentityRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const setDirectConversationMuteRequestSchema = {
  body: z.object({
    isMuted: z.boolean()
  }),

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const setDirectConversationArchiveRequestSchema = {
  body: z.object({
    isArchived: z.boolean()
  }),

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const leaveDirectConversationRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};

export const rejoinDirectConversationRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    conversationId: conversationIdSchema
  }),

  query: emptyObjectSchema
};