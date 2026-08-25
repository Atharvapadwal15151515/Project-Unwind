import { z } from "zod";

const assessmentIdSchema = z
  .string()
  .uuid("Invalid assessment ID");

export const assessmentIdParamSchema = z.object({
  params: z.object({
    assessmentId: assessmentIdSchema,
  }),
});

export const saveDassResponseSchema = z.object({
  params: z.object({
    assessmentId: assessmentIdSchema,
  }),

  body: z.object({
    questionId: z
      .number()
      .int()
      .positive(),

    answerValue: z
      .number()
      .int()
      .min(0)
      .max(3),
  }),
});

export const dassHistoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10),
  }),
});