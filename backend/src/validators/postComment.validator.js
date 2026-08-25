import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const uuidSchema = z
  .string()
  .uuid("Invalid UUID format");

const paginationSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    page: z.coerce
      .number()
      .int("Page must be an integer")
      .min(1, "Page must be at least 1")
      .default(1),

    limit: z.coerce
      .number()
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit cannot exceed 50")
      .default(20)
  })
);

export const createCommentSchema = z.object({
  comment_text: z
    .string({
      error: "Comment text is required"
    })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),

  parent_comment_id: z
    .union([
      uuidSchema,
      z.literal(""),
      z.null()
    ])
    .optional()
    .transform((value) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return null;
      }

      return value;
    })
});

export const updateCommentSchema = z.object({
  comment_text: z
    .string({
      error: "Comment text is required"
    })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters")
});

export const postIdParamSchema = z.object({
  postId: uuidSchema
});

export const commentIdParamSchema = z.object({
  commentId: uuidSchema
});

export const createCommentRequestSchema = z.object({
  body: createCommentSchema,
  params: postIdParamSchema,
  query: emptyObjectSchema
});

export const getPostCommentsRequestSchema = z.object({
  body: emptyObjectSchema,
  params: postIdParamSchema,
  query: paginationSchema
});

export const getCommentRepliesRequestSchema = z.object({
  body: emptyObjectSchema,
  params: commentIdParamSchema,
  query: paginationSchema
});

export const updateCommentRequestSchema = z.object({
  body: updateCommentSchema,
  params: commentIdParamSchema,
  query: emptyObjectSchema
});

export const deleteCommentRequestSchema = z.object({
  body: emptyObjectSchema,
  params: commentIdParamSchema,
  query: emptyObjectSchema
});

export const likeCommentRequestSchema = z.object({
  body: emptyObjectSchema,
  params: commentIdParamSchema,
  query: emptyObjectSchema
});

export const unlikeCommentRequestSchema = z.object({
  body: emptyObjectSchema,
  params: commentIdParamSchema,
  query: emptyObjectSchema
});