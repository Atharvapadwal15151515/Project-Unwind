import { z } from "zod";

const emptyObjectSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough()
);

const uuidSchema = z
  .string()
  .uuid("Invalid UUID.");

const promptIdSchema = z
  .string()
  .uuid("Invalid journal prompt ID.");

const promptHistoryIdSchema = z
  .string()
  .uuid(
    "Invalid journal prompt history ID."
  );

const entryIdSchema = z
  .string()
  .uuid("Invalid journal entry ID.");

const promptCategorySchema = z
  .string()
  .trim()
  .min(
    1,
    "Prompt category is required."
  )
  .max(
    50,
    "Prompt category cannot exceed 50 characters."
  )
  .regex(
    /^[a-z0-9_]+$/,
    "Prompt category can contain only lowercase letters, numbers, and underscores."
  );

const promptTextSchema = z
  .string()
  .trim()
  .min(
    3,
    "Prompt text must contain at least 3 characters."
  )
  .max(
    1000,
    "Prompt text cannot exceed 1000 characters."
  );

const booleanQuerySchema = z.preprocess(
  (value) => {
    if (
      value === true ||
      value === "true"
    ) {
      return true;
    }

    if (
      value === false ||
      value === "false"
    ) {
      return false;
    }

    return value;
  },
  z.boolean()
);

const nullableBooleanQuerySchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return undefined;
      }

      if (
        value === true ||
        value === "true"
      ) {
        return true;
      }

      if (
        value === false ||
        value === "false"
      ) {
        return false;
      }

      return value;
    },
    z.boolean().optional()
  );

const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
});

const dateTimeSchema = z
  .string()
  .datetime({
    offset: true,
    message:
      "Date must be a valid ISO date and time."
  });

const promptFiltersSchema =
  paginationQuerySchema.extend({
    category:
      promptCategorySchema.optional(),

    search: z
      .string()
      .trim()
      .min(
        1,
        "Search cannot be empty."
      )
      .max(
        200,
        "Search cannot exceed 200 characters."
      )
      .optional(),

    isActive:
      nullableBooleanQuerySchema
  });

const promptSelectionQuerySchema =
  z.object({
    category:
      promptCategorySchema.optional(),

    recentDays: z.coerce
      .number()
      .int()
      .min(
        1,
        "Recent days must be at least 1."
      )
      .max(
        365,
        "Recent days cannot exceed 365."
      )
      .optional()
  });

const promptHistoryFiltersSchema =
  paginationQuerySchema
    .extend({
      promptId:
        promptIdSchema.optional(),

      entryId:
        entryIdSchema.optional(),

      wasUsed:
        nullableBooleanQuerySchema,

      fromDate:
        dateTimeSchema.optional(),

      toDate:
        dateTimeSchema.optional()
    })
    .superRefine(
      (data, context) => {
        if (
          data.fromDate &&
          data.toDate &&
          new Date(data.fromDate) >
            new Date(data.toDate)
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["toDate"],
            message:
              "To date must be later than or equal to from date."
          });
        }
      }
    );

const statisticsQuerySchema =
  z.object({
    fromDate:
      dateTimeSchema.optional(),

    toDate:
      dateTimeSchema.optional(),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
  }).superRefine(
    (data, context) => {
      if (
        data.fromDate &&
        data.toDate &&
        new Date(data.fromDate) >
          new Date(data.toDate)
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: ["toDate"],
          message:
            "To date must be later than or equal to from date."
        });
      }
    }
  );

/*
  POST /api/journal/prompts
*/
export const createCustomPromptRequestSchema = {
  body: z.object({
    promptText:
      promptTextSchema,

    promptCategory:
      promptCategorySchema
        .optional()
        .default(
          "daily_reflection"
        ),

    isActive: z
      .boolean()
      .optional()
      .default(true),

    displayOrder: z.coerce
      .number()
      .int()
      .min(
        0,
        "Display order cannot be negative."
      )
      .max(
        10000,
        "Display order is too large."
      )
      .optional()
      .default(0)
  }),

  params: emptyObjectSchema,
  query: emptyObjectSchema
};

/*
  GET /api/journal/prompts
*/
export const getPromptsRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    promptFiltersSchema
  )
};

/*
  GET /api/journal/prompts/system
*/
export const getSystemPromptsRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    promptFiltersSchema
  )
};

/*
  GET /api/journal/prompts/custom
*/
export const getCustomPromptsRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    promptFiltersSchema
  )
};

/*
  GET /api/journal/prompts/categories
*/
export const getPromptCategoriesRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema
};

/*
  GET /api/journal/prompts/daily
*/
export const getDailyPromptRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    promptSelectionQuerySchema
  )
};

/*
  GET /api/journal/prompts/random
*/
export const getRandomPromptRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    promptSelectionQuerySchema
  )
};

/*
  GET /api/journal/prompts/history
*/
export const getPromptHistoryRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    promptHistoryFiltersSchema
  )
};

/*
  GET /api/journal/prompts/statistics
*/
export const getPromptStatisticsRequestSchema = {
  body: emptyObjectSchema,
  params: emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    statisticsQuerySchema
  )
};

/*
  GET /api/journal/prompts/:promptId
*/
export const getPromptRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    promptId:
      promptIdSchema
  }),

  query: emptyObjectSchema
};

/*
  PATCH /api/journal/prompts/:promptId
*/
export const updateCustomPromptRequestSchema = {
  body: z
    .object({
      promptText:
        promptTextSchema.optional(),

      promptCategory:
        promptCategorySchema.optional(),

      isActive:
        z.boolean().optional(),

      displayOrder: z.coerce
        .number()
        .int()
        .min(
          0,
          "Display order cannot be negative."
        )
        .max(
          10000,
          "Display order is too large."
        )
        .optional()
    })
    .refine(
      (data) =>
        Object.keys(data).length >
        0,
      {
        message:
          "At least one prompt field must be provided."
      }
    ),

  params: z.object({
    promptId:
      promptIdSchema
  }),

  query: emptyObjectSchema
};

/*
  PATCH /api/journal/prompts/:promptId/status
*/
export const updateCustomPromptStatusRequestSchema = {
  body: z.object({
    isActive: z.boolean({
      required_error:
        "Active status is required."
    })
  }),

  params: z.object({
    promptId:
      promptIdSchema
  }),

  query: emptyObjectSchema
};

/*
  DELETE /api/journal/prompts/:promptId
*/
export const deleteCustomPromptRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    promptId:
      promptIdSchema
  }),

  query: emptyObjectSchema
};

/*
  POST /api/journal/prompts/:promptId/shown
*/
export const recordPromptShownRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    promptId:
      promptIdSchema
  }),

  query: emptyObjectSchema
};

/*
  PATCH /api/journal/prompts/history/:promptHistoryId/use
*/
export const markPromptUsedRequestSchema = {
  body: z.object({
    entryId:
      entryIdSchema.nullish(),

    usedAt:
      dateTimeSchema.nullish()
  }),

  params: z.object({
    promptHistoryId:
      promptHistoryIdSchema
  }),

  query: emptyObjectSchema
};

/*
  PATCH /api/journal/prompts/:promptId/use-latest
*/
export const markLatestPromptUsedRequestSchema = {
  body: z.object({
    entryId:
      entryIdSchema.nullish(),

    usedAt:
      dateTimeSchema.nullish()
  }),

  params: z.object({
    promptId:
      promptIdSchema
  }),

  query: emptyObjectSchema
};

/*
  DELETE /api/journal/prompts/history/:promptHistoryId
*/
export const deletePromptHistoryRequestSchema = {
  body: emptyObjectSchema,

  params: z.object({
    promptHistoryId:
      promptHistoryIdSchema
  }),

  query: emptyObjectSchema
};