import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Base body schemas
|--------------------------------------------------------------------------
*/

export const createPostSchema = z
  .object({
    caption: z
      .string()
      .trim()
      .max(3000, "Caption cannot exceed 3000 characters")
      .nullable()
      .optional(),

    post_type: z
      .enum(["text", "image", "video", "mixed"])
      .default("text"),

    visibility: z
      .enum(["community", "private"])
      .default("community"),

   comments_enabled: z.preprocess(
  (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },
  z.boolean().default(true)
)
  })
  .superRefine((data, ctx) => {
    if (data.post_type === "text" && !data.caption) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["caption"],
        message: "Caption is required for a text post"
      });
    }
  });

export const updatePostSchema = z
  .object({
    caption: z
      .string()
      .trim()
      .max(3000, "Caption cannot exceed 3000 characters")
      .nullable()
      .optional(),

    visibility: z
      .enum(["community", "private"])
      .optional(),

  comments_enabled: z.preprocess(
  (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },
  z.boolean().default(true)
)
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

/*
|--------------------------------------------------------------------------
| Params schemas
|--------------------------------------------------------------------------
*/

export const postIdParamSchema = z.object({
  postId: z.string().uuid("Invalid post ID")
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID")
});

/*
|--------------------------------------------------------------------------
| Query schemas
|--------------------------------------------------------------------------
*/

export const getFeedQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(10),

  post_type: z
    .enum(["text", "image", "video", "mixed"])
    .optional()
});

export const getUserPostsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(10)
});

/*
|--------------------------------------------------------------------------
| Complete request schemas
|--------------------------------------------------------------------------
|
| Your validate middleware passes this structure to Zod:
|
| {
|   body: req.body,
|   params: req.params,
|   query: req.query
| }
|
|--------------------------------------------------------------------------
*/

export const createPostRequestSchema = z.object({
  body: createPostSchema,
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updatePostRequestSchema = z.object({
  body: updatePostSchema,
  params: postIdParamSchema,
  query: z.object({}).optional()
});

export const getPostRequestSchema = z.object({
  body: z.object({}).optional(),
  params: postIdParamSchema,
  query: z.object({}).optional()
});

export const deletePostRequestSchema = z.object({
  body: z.object({}).optional(),
  params: postIdParamSchema,
  query: z.object({}).optional()
});

export const getFeedRequestSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: getFeedQuerySchema
});

export const getUserPostsRequestSchema = z.object({
  body: z.object({}).optional(),
  params: userIdParamSchema,
  query: getUserPostsQuerySchema
});