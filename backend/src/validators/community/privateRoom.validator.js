import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const roomIdSchema = z
  .string()
  .uuid("Invalid room ID.");

const userIdSchema = z
  .string()
  .uuid("Invalid user ID.");

const messageIdSchema = z
  .string()
  .uuid("Invalid message ID.");

const roomListQuerySchema = z.preprocess(
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

const messagePaginationQuerySchema = z.preprocess(
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

export const createPrivateRoomRequestSchema = {
  body: z.object({
    roomName: z
      .string()
      .trim()
      .min(
        2,
        "Room name must contain at least 2 characters."
      )
      .max(
        100,
        "Room name cannot exceed 100 characters."
      ),

    roomDescription: z
      .string()
      .trim()
      .max(
        500,
        "Room description cannot exceed 500 characters."
      )
      .nullish(),

    maxMembers: z.coerce
      .number()
      .int()
      .min(
        2,
        "A private room must allow at least 2 members."
      )
      .max(
        100,
        "A private room cannot allow more than 100 members."
      )
      .optional(),

    isLocked: z
      .boolean()
      .optional()
  }),

  params: emptyObjectSchema,

  query: emptyObjectSchema
};

export const joinPrivateRoomByCodeRequestSchema = {
  body: z.object({
    roomCode: z
      .string()
      .trim()
      .min(
        1,
        "Room code is required."
      )
      .max(
        50,
        "Room code is too long."
      )
  }),

  params: emptyObjectSchema,

  query: emptyObjectSchema
};

export const joinPrivateRoomByInviteRequestSchema = {
  body: z.object({
    inviteToken: z
      .string()
      .trim()
      .min(
        1,
        "Invite token is required."
      )
      .max(
        500,
        "Invite token is too long."
      )
  }),

  params: emptyObjectSchema,

  query: emptyObjectSchema
};

export const listPrivateRoomsRequestSchema = {
  body: emptyObjectSchema,

  params: emptyObjectSchema,

  query: roomListQuerySchema
};

export const getPrivateRoomRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const getPrivateRoomMembersRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const updatePrivateRoomRequestSchema = {
  body: z
    .object({
      roomName: z
        .string()
        .trim()
        .min(
          2,
          "Room name must contain at least 2 characters."
        )
        .max(
          100,
          "Room name cannot exceed 100 characters."
        )
        .optional(),

      roomDescription: z
        .string()
        .trim()
        .max(
          500,
          "Room description cannot exceed 500 characters."
        )
        .nullable()
        .optional(),

      maxMembers: z.coerce
        .number()
        .int()
        .min(
          2,
          "A private room must allow at least 2 members."
        )
        .max(
          100,
          "A private room cannot allow more than 100 members."
        )
        .optional()
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      {
        message: "At least one field must be provided."
      }
    ),

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const setPrivateRoomLockRequestSchema = {
  body: z.object({
    isLocked: z.boolean({
      required_error: "isLocked is required."
    })
  }),

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const regeneratePrivateRoomInviteRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const leavePrivateRoomRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const removePrivateRoomMemberRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema,
    memberUserId: userIdSchema
  }),

  query: emptyObjectSchema
};

export const setPrivateRoomMemberMuteRequestSchema = {
  body: z.object({
    isMuted: z.boolean({
      required_error: "isMuted is required."
    })
  }),

  params: z.object({
    roomId: roomIdSchema,
    memberUserId: userIdSchema
  }),

  query: emptyObjectSchema
};

export const transferPrivateRoomOwnerRequestSchema = {
  body: z.object({
    newOwnerUserId: userIdSchema
  }),

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const closePrivateRoomRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const sendPrivateRoomMessageRequestSchema = {
  body: z.object({
    messageText: z
      .string()
      .trim()
      .min(
        1,
        "Message cannot be empty."
      )
      .max(
        2000,
        "Message cannot exceed 2000 characters."
      ),

    messageType: z
      .enum([
        "text",
        "image",
        "video",
        "audio",
        "file"
      ])
      .optional(),

    replyToMessageId: messageIdSchema.nullish()
  }),

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const getPrivateRoomMessagesRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: messagePaginationQuerySchema
};

export const editPrivateRoomMessageRequestSchema = {
  body: z.object({
    messageText: z
      .string()
      .trim()
      .min(
        1,
        "Message cannot be empty."
      )
      .max(
        2000,
        "Message cannot exceed 2000 characters."
      )
  }),

  params: z.object({
    roomId: roomIdSchema,
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const deletePrivateRoomMessageRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema,
    messageId: messageIdSchema
  }),

  query: emptyObjectSchema
};

export const markPrivateRoomReadRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};

export const getPrivateRoomUnreadCountRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    roomId: roomIdSchema
  }),

  query: emptyObjectSchema
};