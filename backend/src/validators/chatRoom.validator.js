import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const roomIdSchema = z.string().uuid("Invalid room ID.");

export const getPublicChatRoomRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema
};

export const joinPublicChatRoomRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema
};

export const leavePublicChatRoomRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema
};

export const getPublicRoomMembersRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema
};

export const getPublicRoomDetailsRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema
};

export const markRoomAsReadRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};