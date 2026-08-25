import { z } from "zod";

import {
  addDateRangeIssue,
  addPaginationIssues,
  dateSchema,
  emptyBodySchema,
  emptyParamsSchema,
  emptyQuerySchema,
  limitQuerySchema,
  optionalNullableText,
  optionalNullableTimestampSchema,
  optionalUuidArraySchema,
  pageQuerySchema,
  requireAtLeastOneField,
  sortOrderQuerySchema,
  timestampSchema,
  uuidArraySchema,
  uuidSchema
} from "./trackerCommon.validator.js";

const moodLabelSchema = z.enum([
  "very_low",
  "low",
  "neutral",
  "good",
  "very_good"
]);

const moodScoreSchema = z
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
  );

const optionalOneToFiveSchema = (
  fieldName
) =>
  z
    .number({
      invalid_type_error:
        `${fieldName} must be a number`
    })
    .int(
      `${fieldName} must be a whole number`
    )
    .min(
      1,
      `${fieldName} must be at least 1`
    )
    .max(
      5,
      `${fieldName} cannot exceed 5`
    )
    .nullable()
    .optional();

const moodFields = {
  moodLabel:
    moodLabelSchema.optional(),

  moodScore:
    moodScoreSchema.optional(),

  intensity:
    optionalOneToFiveSchema(
      "Intensity"
    ),

  stressScore: z
    .number({
      invalid_type_error:
        "Stress score must be a number"
    })
    .int(
      "Stress score must be a whole number"
    )
    .min(
      1,
      "Stress score must be at least 1"
    )
    .max(
      10,
      "Stress score cannot exceed 10"
    )
    .nullable()
    .optional(),

  energyScore:
    optionalOneToFiveSchema(
      "Energy score"
    ),

  triggerCategory:
    optionalNullableText(
      80,
      "Trigger category"
    ),

  triggerNote:
    optionalNullableText(
      2000,
      "Trigger note"
    ),

  note:
    optionalNullableText(
      5000,
      "Note"
    ),

  loggedAt:
    optionalNullableTimestampSchema,

  emotionIds:
    optionalUuidArraySchema(
      "emotionIds",
      20
    ),

  activityIds:
    optionalUuidArraySchema(
      "activityIds",
      20
    )
};

export const moodEntryIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      moodEntryId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createMoodEntrySchema =
  z.object({
    body: z
      .object({
        ...moodFields,

        moodLabel:
          moodLabelSchema,

        moodScore:
          moodScoreSchema,

        emotionIds:
          uuidArraySchema(
            "emotionIds",
            20
          )
          .default([]),

        activityIds:
          uuidArraySchema(
            "activityIds",
            20
          )
          .default([])
      })
      .strict()
      .superRefine(
        (data, context) => {
          const labelScoreMap = {
            very_low: 1,
            low: 2,
            neutral: 3,
            good: 4,
            very_good: 5
          };

          if (
            labelScoreMap[
              data.moodLabel
            ] !== data.moodScore
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["moodScore"],
              message:
                "Mood score must match the selected mood label"
            });
          }
        }
      ),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateMoodEntrySchema =
  z.object({
    body: z
      .object({
        ...moodFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one mood entry field must be provided"
          );

          const labelScoreMap = {
            very_low: 1,
            low: 2,
            neutral: 3,
            good: 4,
            very_good: 5
          };

          if (
            data.moodLabel &&
            data.moodScore &&
            labelScoreMap[
              data.moodLabel
            ] !== data.moodScore
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["moodScore"],
              message:
                "Mood score must match the selected mood label"
            });
          }
        }
      ),

    params: z.object({
      moodEntryId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getMoodEntriesSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: z
      .object({
        page: pageQuerySchema,

        limit: limitQuerySchema,

        startDate:
          timestampSchema.optional(),

        endDate:
          timestampSchema.optional(),

        moodLabel:
          moodLabelSchema.optional(),

        moodScore: z
          .string()
          .regex(
            /^[1-5]$/,
            "Mood score must be between 1 and 5"
          )
          .optional(),

        emotionId: z
          .string()
          .uuid(
            "Emotion ID must be a valid UUID"
          )
          .optional(),

        activityId: z
          .string()
          .uuid(
            "Activity ID must be a valid UUID"
          )
          .optional(),

        sortOrder:
          sortOrderQuerySchema
      })
      .strict()
      .superRefine(
        (query, context) => {
          addPaginationIssues(
            query,
            context
          );

          addDateRangeIssue(
            query,
            context
          );
        }
      )
  });

export const getMoodCalendarSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: z
      .object({
        startDate:
          dateSchema.optional(),

        endDate:
          dateSchema.optional()
      })
      .strict()
      .superRefine(
        (query, context) => {
          addDateRangeIssue(
            query,
            context
          );
        }
      )
  });

export const getMoodSummarySchema =
  getMoodCalendarSchema;

export const restoreMoodEntrySchema =
  moodEntryIdParamSchema;

export const softDeleteMoodEntrySchema =
  moodEntryIdParamSchema;

export const permanentlyDeleteMoodEntrySchema =
  moodEntryIdParamSchema;
