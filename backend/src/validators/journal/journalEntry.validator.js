import { z } from "zod";

/*
  Reusable validation fields
*/

const uuidSchema = z
  .string({
    required_error: "ID is required"
  })
  .uuid("ID must be a valid UUID");

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format"
  );

const optionalNullableText = (
  maximumLength,
  fieldName
) =>
  z
    .string()
    .trim()
    .max(
      maximumLength,
      `${fieldName} cannot exceed ${maximumLength} characters`
    )
    .nullable()
    .optional();

const uuidArraySchema = (
  fieldName,
  maximumItems = 20
) =>
  z
    .array(
      z
        .string()
        .uuid(
          `${fieldName} must contain valid UUIDs`
        )
    )
    .max(
      maximumItems,
      `${fieldName} cannot contain more than ${maximumItems} items`
    )
    .transform((ids) => [
      ...new Set(ids)
    ])
    .optional();

/*
  Journal entry fields shared by create,
  update and auto-save operations.
*/

const journalEntryFields = {
  title: optionalNullableText(
    255,
    "Title"
  ),

  content: z
    .string()
    .max(
      100000,
      "Content cannot exceed 100000 characters"
    )
    .nullable()
    .optional(),

  entryType: z
    .string()
    .trim()
    .min(
      1,
      "Entry type cannot be empty"
    )
    .max(
      50,
      "Entry type cannot exceed 50 characters"
    )
    .optional(),

  entryStatus: z
    .enum([
      "draft",
      "completed",
      "archived"
    ])
    .optional(),

 moodLabel: z
  .enum([
    "very_low",
    "low",
    "neutral",
    "good",
    "very_good"
  ])
  .nullable()
  .optional(),

  moodScore: z
  .number({
    invalid_type_error:
      "Mood score must be a number"
  })
  .int(
    "Mood score must be a whole number"
  )
  .min(
    1,
    "Mood score must be at least 1"
  )
  .max(
    5,
    "Mood score cannot exceed 5"
  )
  .nullable()
  .optional(),

  promptId: z
    .string()
    .uuid(
      "Prompt ID must be a valid UUID"
    )
    .nullable()
    .optional(),

  promptTextSnapshot:
    optionalNullableText(
      5000,
      "Prompt text"
    ),

  entryDate: dateSchema.optional(),

  isFavourite: z
    .boolean({
      invalid_type_error:
        "isFavourite must be a boolean"
    })
    .optional(),

  isLocked: z
    .boolean({
      invalid_type_error:
        "isLocked must be a boolean"
    })
    .optional(),

  hidePreview: z
    .boolean({
      invalid_type_error:
        "hidePreview must be a boolean"
    })
    .optional(),

  emotionIds: uuidArraySchema(
  "emotionIds",
  5
),

  tagIds: uuidArraySchema(
    "tagIds",
    30
  ),

  activityIds: uuidArraySchema(
    "activityIds",
    30
  )
};

/*
  Route parameter schema
*/

export const journalEntryIdParamSchema =
  z.object({
    body: z
      .object({})
      .passthrough()
      .optional(),

    params: z.object({
      entryId: uuidSchema
    }),

    query: z
      .object({})
      .passthrough()
      .optional()
  });

/*
  Create journal entry

  A draft is allowed to have an empty title and
  empty content because the frontend may create a
  draft before the user starts typing.
*/

export const createJournalEntrySchema =
  z.object({
    body: z
      .object({
        ...journalEntryFields,

        entryType: z
          .string()
          .trim()
          .min(
            1,
            "Entry type cannot be empty"
          )
          .max(
            50,
            "Entry type cannot exceed 50 characters"
          )
          .default("standard"),

        entryStatus: z
          .enum([
            "draft",
            "completed"
          ])
          .default("draft"),

        isFavourite: z
          .boolean()
          .default(false),

        isLocked: z
          .boolean()
          .default(false),

        hidePreview: z
          .boolean()
          .default(false),

        emotionIds: z
          .array(
            z
              .string()
              .uuid(
                "emotionIds must contain valid UUIDs"
              )
          )
          .max(
            20,
            "emotionIds cannot contain more than 20 items"
          )
          .transform((ids) => [
            ...new Set(ids)
          ])
          .default([]),

        tagIds: z
          .array(
            z
              .string()
              .uuid(
                "tagIds must contain valid UUIDs"
              )
          )
          .max(
            30,
            "tagIds cannot contain more than 30 items"
          )
          .transform((ids) => [
            ...new Set(ids)
          ])
          .default([]),

        activityIds: z
          .array(
            z
              .string()
              .uuid(
                "activityIds must contain valid UUIDs"
              )
          )
          .max(
            30,
            "activityIds cannot contain more than 30 items"
          )
          .transform((ids) => [
            ...new Set(ids)
          ])
          .default([])
      })
      .strict()
      .superRefine(
        (data, context) => {
          if (
            data.entryStatus ===
            "completed"
          ) {
            const hasTitle =
              Boolean(
                data.title?.trim()
              );

            const hasContent =
              Boolean(
                data.content?.trim()
              );

            if (
              !hasTitle &&
              !hasContent
            ) {
              context.addIssue({
                code:
                  z.ZodIssueCode.custom,
                path: ["content"],
                message:
                  "A completed journal entry must contain a title or content"
              });
            }
          }
        }
      ),

    params: z.object({}),

    query: z.object({})
  });

/*
  Update journal entry
*/

export const updateJournalEntrySchema =
  z.object({
    body: z
      .object({
        ...journalEntryFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          const suppliedFields =
            Object.values(
              data
            ).filter(
              (value) =>
                value !== undefined
            );

          if (
            suppliedFields.length === 0
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [],
              message:
                "At least one journal entry field must be provided"
            });
          }
        }
      ),

    params: z.object({
      entryId: uuidSchema
    }),

    query: z.object({})
  });

/*
  Auto-save journal entry

  Auto-save accepts only fields that can safely
  change while the user is writing.
*/

export const autoSaveJournalEntrySchema =
  z.object({
    body: z
      .object({
        title:
          journalEntryFields.title,

        content:
          journalEntryFields.content,

        entryType:
          journalEntryFields.entryType,

        moodLabel:
          journalEntryFields.moodLabel,

        moodScore:
          journalEntryFields.moodScore,

        promptId:
          journalEntryFields.promptId,

        promptTextSnapshot:
          journalEntryFields
            .promptTextSnapshot,

        entryDate:
          journalEntryFields.entryDate,

        hidePreview:
          journalEntryFields.hidePreview,

        emotionIds:
          journalEntryFields.emotionIds,

        tagIds:
          journalEntryFields.tagIds,

        activityIds:
          journalEntryFields
            .activityIds
      })
      .strict()
      .superRefine(
        (data, context) => {
          const suppliedFields =
            Object.values(
              data
            ).filter(
              (value) =>
                value !== undefined
            );

          if (
            suppliedFields.length === 0
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [],
              message:
                "At least one auto-save field must be provided"
            });
          }
        }
      ),

    params: z.object({
      entryId: uuidSchema
    }),

    query: z.object({})
  });

/*
  Journal entry listing query
*/

const booleanQuerySchema = z
  .union([
    z.literal("true"),
    z.literal("false"),
    z.literal("1"),
    z.literal("0")
  ])
  .optional();

export const getJournalEntriesSchema =
  z.object({
    body: z
      .object({})
      .passthrough()
      .optional(),

    params: z.object({}),

    query: z
      .object({
        page: z
          .string()
          .regex(
            /^\d+$/,
            "Page must be a positive integer"
          )
          .optional(),

        limit: z
          .string()
          .regex(
            /^\d+$/,
            "Limit must be a positive integer"
          )
          .optional(),

        search: z
          .string()
          .trim()
          .max(
            200,
            "Search cannot exceed 200 characters"
          )
          .optional(),

        entryType: z
          .string()
          .trim()
          .max(
            50,
            "Entry type cannot exceed 50 characters"
          )
          .optional(),

        status: z
          .enum([
            "draft",
            "completed",
            "archived"
          ])
          .optional(),

        mood: z
          .string()
          .trim()
          .max(
            50,
            "Mood cannot exceed 50 characters"
          )
          .optional(),

        tagId: z
          .string()
          .uuid(
            "Tag ID must be a valid UUID"
          )
          .optional(),

        activityId: z
          .string()
          .uuid(
            "Activity ID must be a valid UUID"
          )
          .optional(),

        emotionId: z
          .string()
          .uuid(
            "Emotion ID must be a valid UUID"
          )
          .optional(),

        dateFrom: dateSchema.optional(),

        dateTo: dateSchema.optional(),

        isFavourite:
          booleanQuerySchema,

        isArchived:
          booleanQuerySchema,

        isDeleted:
          booleanQuerySchema,

        sort: z
          .enum([
            "newest",
            "oldest",
            "updated_desc",
            "updated_asc",
            "title_asc",
            "title_desc"
          ])
          .optional()
      })
      .strict()
      .superRefine(
        (query, context) => {
          if (
            query.page &&
            Number(query.page) < 1
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["page"],
              message:
                "Page must be at least 1"
            });
          }

          if (
            query.limit &&
            Number(query.limit) > 100
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["limit"],
              message:
                "Limit cannot exceed 100"
            });
          }

          if (
            query.dateFrom &&
            query.dateTo &&
            query.dateFrom >
              query.dateTo
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["dateTo"],
              message:
                "dateTo cannot be earlier than dateFrom"
            });
          }
        }
      )
  });

/*
  Calendar query
*/

export const getJournalCalendarSchema =
  z.object({
    body: z
      .object({})
      .passthrough()
      .optional(),

    params: z.object({}),

    query: z
      .object({
        dateFrom: dateSchema.optional(),

        dateTo: dateSchema.optional()
      })
      .strict()
      .superRefine(
        (query, context) => {
          if (
            query.dateFrom &&
            query.dateTo &&
            query.dateFrom >
              query.dateTo
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["dateTo"],
              message:
                "dateTo cannot be earlier than dateFrom"
            });
          }
        }
      )
  });

/*
  Dedicated action schemas

  These currently validate only entryId but are
  separately exported so route names remain clear.
*/

export const completeJournalEntrySchema =
  journalEntryIdParamSchema;

export const favouriteJournalEntrySchema =
  journalEntryIdParamSchema;

export const archiveJournalEntrySchema =
  journalEntryIdParamSchema;

export const restoreJournalEntrySchema =
  journalEntryIdParamSchema;

export const softDeleteJournalEntrySchema =
  journalEntryIdParamSchema;

export const permanentlyDeleteJournalEntrySchema =
  journalEntryIdParamSchema;