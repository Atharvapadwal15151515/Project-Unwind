import { z } from "zod";

export const dassReportParamSchema = z.object({
  params: z.object({
    assessmentId: z
      .string()
      .uuid("Invalid assessment ID"),
  }),
});