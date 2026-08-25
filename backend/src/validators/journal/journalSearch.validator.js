import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Reusable query helpers
|--------------------------------------------------------------------------
*/

const optionalBooleanQuery = z
  .enum(["true", "false"])
  .transform(
    (value) => value === "true"
  )
  .optional();

const optionalPositiveIntegerQuery = (
  defaultValue,
  maximum
) =>
  z
    .string()
    .regex(
      /^\d+$/,
      "Must be a positive integer"
    )
    .transform(Number)
    .refine(
      (value) =>
        value >= 1 &&
        value <= maximum,
      {
        message: `Must be between 1 and ${maximum}`
      }
    )
    .default(String(defaultValue));

const optionalDateQuery = z
  .string()
  .date(
    "Date must use YYYY-MM-DD format"
  )
  .optional();

const optionalUuidQuery = z
  .string()
  .uuid("Invalid UUID")
  .optional();

/*
|--------------------------------------------------------------------------
| Journal search query schema
|--------------------------------------------------------------------------
*/

export const journalSearchQuerySchema =
  z.object({
    query: z
      .object({
        /*
         * Search entry title and content.
         */
        q: z
          .string()
          .trim()
          .min(
            1,
            "Search text cannot be empty"
          )
          .max(
            200,
            "Search text cannot exceed 200 characters"
          )
          .optional(),

        /*
         * Entry filters.
         */
        status: z
          .enum([
            "draft",
            "completed",
            "archived"
          ])
          .optional(),

        entryType: z
          .enum([
            "standard",
            "prompted",
            "voice",
            "photo",
            "video"
          ])
          .optional(),

        moodLabel: z
          .enum([
            "very_low",
            "low",
            "neutral",
            "good",
            "very_good",
            "anxious",
            "angry",
            "calm",
            "tired",
            "overwhelmed"
          ])
          .optional(),

        moodScore: z
          .string()
          .regex(
            /^[1-5]$/,
            "Mood score must be between 1 and 5"
          )
          .transform(Number)
          .optional(),

        isFavourite:
          optionalBooleanQuery,

        isLocked:
          optionalBooleanQuery,

        hidePreview:
          optionalBooleanQuery,

        isDeleted:
          optionalBooleanQuery,

        hasAttachments:
          optionalBooleanQuery,

        /*
         * Relationship filters.
         */
        tagId:
          optionalUuidQuery,

        activityId:
          optionalUuidQuery,

        emotionId:
          optionalUuidQuery,

        promptId:
          optionalUuidQuery,

        /*
         * Date range filters.
         */
        fromDate:
          optionalDateQuery,

        toDate:
          optionalDateQuery,

        /*
         * Sorting.
         */
        sortBy: z
          .enum([
            "createdAt",
            "updatedAt",
            "entryDate",
            "title",
            "moodScore",
            "lastAutoSavedAt",
            "completedAt"
          ])
          .default("createdAt"),

        sortOrder: z
          .enum([
            "asc",
            "desc"
          ])
          .default("desc"),

        /*
         * Pagination.
         */
        page:
          optionalPositiveIntegerQuery(
            1,
            100000
          ),

        limit:
          optionalPositiveIntegerQuery(
            20,
            100
          )
      })
      .superRefine(
        (query, context) => {
          if (
            query.fromDate &&
            query.toDate &&
            new Date(query.fromDate) >
              new Date(query.toDate)
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["toDate"],
              message:
                "toDate must be on or after fromDate"
            });
          }
        }
      )
  });