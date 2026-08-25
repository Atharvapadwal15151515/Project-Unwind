import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const reportIdSchema = z
  .string()
  .uuid("Invalid report ID.");

const userIdSchema = z
  .string()
  .uuid("Invalid user ID.");

const targetIdSchema = z
  .string()
  .uuid("Invalid target ID.");

const targetTypeSchema = z.enum([
  "post",
  "comment",
  "chat_message",
  "private_room",
  "direct_message",
  "user"
]);

const reportStatusSchema = z.enum([
  "pending",
  "reviewing",
  "resolved",
  "rejected"
]);

const reportReasonSchema = z.enum([
  "harassment",
  "hate_speech",
  "spam",
  "sexual_content",
  "violence",
  "self_harm",
  "misinformation",
  "privacy_violation",
  "impersonation",
  "scam",
  "inappropriate_content",
  "other"
]);

const actionTakenSchema = z.enum([
  "no_action",
  "content_removed",
  "user_warned",
  "user_suspended",
  "user_banned",
  "room_closed",
  "message_removed",
  "post_removed",
  "comment_removed"
]);

const paginationFields = {
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
};

export const createReportRequestSchema = {
  body: z.object({
    reportedUserId: userIdSchema.nullish(),

    targetType: targetTypeSchema,

    targetId: targetIdSchema,

    reason: reportReasonSchema,

    description: z
      .string()
      .trim()
      .max(
        2000,
        "Description cannot exceed 2000 characters."
      )
      .nullish()
  }),

  params: emptyObjectSchema,

  query: emptyObjectSchema
};

export const getMyReportRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};

export const listMyReportsRequestSchema = {
  body: emptyObjectSchema,

  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    z.object({
      status: reportStatusSchema.optional(),
      ...paginationFields
    })
  )
};

export const getReportForModerationRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};

export const listReportsForModerationRequestSchema = {
  body: emptyObjectSchema,

  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    z.object({
      status: reportStatusSchema.optional(),

      targetType: targetTypeSchema.optional(),

      reason: reportReasonSchema.optional(),

      reportedUserId: userIdSchema.optional(),

      ...paginationFields
    })
  )
};

export const listReportsAgainstUserRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    reportedUserId: userIdSchema
  }),

  query: z.preprocess(
    (value) => value ?? {},
    z.object({
      status: reportStatusSchema.optional(),
      ...paginationFields
    })
  )
};

export const listReportsForTargetRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    targetType: targetTypeSchema,
    targetId: targetIdSchema
  }),

  query: z.preprocess(
    (value) => value ?? {},
    z.object({
      status: reportStatusSchema.optional(),
      ...paginationFields
    })
  )
};

export const beginReportReviewRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};

export const resolveReportRequestSchema = {
  body: z.object({
    actionTaken: actionTakenSchema,

    moderationNotes: z
      .string()
      .trim()
      .max(
        3000,
        "Moderation notes cannot exceed 3000 characters."
      )
      .nullish()
  }),

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};

export const rejectReportRequestSchema = {
  body: z.object({
    actionTaken: actionTakenSchema.optional(),

    moderationNotes: z
      .string()
      .trim()
      .max(
        3000,
        "Moderation notes cannot exceed 3000 characters."
      )
      .nullish()
  }),

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};

export const updateReportNotesRequestSchema = {
  body: z.object({
    moderationNotes: z
      .string()
      .trim()
      .min(
        1,
        "Moderation notes cannot be empty."
      )
      .max(
        3000,
        "Moderation notes cannot exceed 3000 characters."
      )
  }),

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};

export const updateReportStatusRequestSchema = {
  body: z.object({
    reportStatus: reportStatusSchema
  }),

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};

export const getReportedUserStatisticsRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    reportedUserId: userIdSchema
  }),

  query: emptyObjectSchema
};

export const getTargetReportCountRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    targetType: targetTypeSchema,
    targetId: targetIdSchema
  }),

  query: z.preprocess(
    (value) => value ?? {},
    z.object({
      activeOnly: z
        .enum(["true", "false"])
        .optional()
    })
  )
};

export const permanentlyDeleteReportRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    reportId: reportIdSchema
  }),

  query: emptyObjectSchema
};