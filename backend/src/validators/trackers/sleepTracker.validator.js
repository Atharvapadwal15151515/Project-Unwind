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
  pageQuerySchema,
  requireAtLeastOneField,
  sortOrderQuerySchema,
  timestampSchema,
  uuidSchema
} from "./trackerCommon.validator.js";

const sleepQualitySchema = z
  .number({
    invalid_type_error:
      "Sleep quality must be a number"
  })
  .int(
    "Sleep quality must be a whole number"
  )
  .min(
    1,
    "Sleep quality must be at least 1"
  )
  .max(
    5,
    "Sleep quality cannot exceed 5"
  );

const wakeMoodSchema = z
  .enum([
    "very_low",
    "low",
    "neutral",
    "good",
    "very_good"
  ])
  .nullable()
  .optional();

const nonNegativeMinutesSchema = (
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
      0,
      `${fieldName} cannot be negative`
    )
    .max(
      1440,
      `${fieldName} cannot exceed 1440 minutes`
    )
    .optional();

const sleepFactorSchema = z
  .object({
    sleepFactorId: uuidSchema,

    factorValue:
      optionalNullableText(
        150,
        "Factor value"
      ),

    note:
      optionalNullableText(
        1000,
        "Factor note"
      )
  })
  .strict();

const sleepFields = {
  sleepDate:
    dateSchema.optional(),

  bedtime:
    timestampSchema.optional(),

  sleepStartTime:
    timestampSchema.optional(),

  wakeTime:
    timestampSchema.optional(),

  gotOutOfBedTime:
    optionalNullableTimestampSchema,

  sleepQuality:
    sleepQualitySchema.optional(),

  wakeMood:
    wakeMoodSchema,

  interruptionsCount: z
    .number({
      invalid_type_error:
        "Interruptions count must be a number"
    })
    .int(
      "Interruptions count must be a whole number"
    )
    .min(
      0,
      "Interruptions count cannot be negative"
    )
    .max(
      100,
      "Interruptions count cannot exceed 100"
    )
    .optional(),

  interruptionMinutes:
    nonNegativeMinutesSchema(
      "Interruption minutes"
    ),

  napMinutes:
    nonNegativeMinutesSchema(
      "Nap minutes"
    ),

  note:
    optionalNullableText(
      5000,
      "Note"
    ),

  factors: z
    .array(
      sleepFactorSchema
    )
    .max(
      20,
      "Factors cannot contain more than 20 items"
    )
    .superRefine(
      (factors, context) => {
        const ids = factors.map(
          (factor) =>
            factor.sleepFactorId
        );

        if (
          new Set(ids).size !==
          ids.length
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [],
            message:
              "Factors cannot contain duplicate sleep factor IDs"
          });
        }
      }
    )
    .optional()
};

function validateSleepTimes(
  data,
  context
) {
  if (
    data.bedtime &&
    data.sleepStartTime &&
    new Date(
      data.sleepStartTime
    ) <
      new Date(data.bedtime)
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["sleepStartTime"],
      message:
        "Sleep start time cannot be earlier than bedtime"
    });
  }

  if (
    data.sleepStartTime &&
    data.wakeTime &&
    new Date(
      data.wakeTime
    ) <=
      new Date(
        data.sleepStartTime
      )
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["wakeTime"],
      message:
        "Wake time must be later than sleep start time"
    });
  }

  if (
    data.wakeTime &&
    data.gotOutOfBedTime &&
    new Date(
      data.gotOutOfBedTime
    ) <
      new Date(data.wakeTime)
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["gotOutOfBedTime"],
      message:
        "Got out of bed time cannot be earlier than wake time"
    });
  }
}

export const sleepEntryIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      sleepEntryId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createSleepEntrySchema =
  z.object({
    body: z
      .object({
        ...sleepFields,

        sleepDate:
          dateSchema,

        bedtime:
          timestampSchema,

        sleepStartTime:
          timestampSchema,

        wakeTime:
          timestampSchema,

        sleepQuality:
          sleepQualitySchema,

        interruptionsCount:
          sleepFields
            .interruptionsCount
            .default(0),

        interruptionMinutes:
          sleepFields
            .interruptionMinutes
            .default(0),

        napMinutes:
          sleepFields
            .napMinutes
            .default(0),

        factors:
          sleepFields.factors
            .default([])
      })
      .strict()
      .superRefine(
        validateSleepTimes
      ),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateSleepEntrySchema =
  z.object({
    body: z
      .object({
        ...sleepFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one sleep entry field must be provided"
          );

          validateSleepTimes(
            data,
            context
          );
        }
      ),

    params: z.object({
      sleepEntryId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getSleepEntriesSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: z
      .object({
        page: pageQuerySchema,

        limit: limitQuerySchema,

        startDate:
          dateSchema.optional(),

        endDate:
          dateSchema.optional(),

        minQuality: z
          .string()
          .regex(
            /^[1-5]$/,
            "Minimum quality must be between 1 and 5"
          )
          .optional(),

        maxQuality: z
          .string()
          .regex(
            /^[1-5]$/,
            "Maximum quality must be between 1 and 5"
          )
          .optional(),

        minDurationMinutes: z
          .string()
          .regex(
            /^\d+$/,
            "Minimum duration must be a non-negative integer"
          )
          .optional(),

        maxDurationMinutes: z
          .string()
          .regex(
            /^\d+$/,
            "Maximum duration must be a non-negative integer"
          )
          .optional(),

        factorId: z
          .string()
          .uuid(
            "Factor ID must be a valid UUID"
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

          if (
            query.minQuality &&
            query.maxQuality &&
            Number(
              query.minQuality
            ) >
              Number(
                query.maxQuality
              )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["maxQuality"],
              message:
                "Maximum quality cannot be lower than minimum quality"
            });
          }

          if (
            query.minDurationMinutes &&
            query.maxDurationMinutes &&
            Number(
              query.minDurationMinutes
            ) >
              Number(
                query.maxDurationMinutes
              )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [
                "maxDurationMinutes"
              ],
              message:
                "Maximum duration cannot be lower than minimum duration"
            });
          }

          if (
            query.maxDurationMinutes &&
            Number(
              query.maxDurationMinutes
            ) > 1440
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [
                "maxDurationMinutes"
              ],
              message:
                "Maximum duration cannot exceed 1440 minutes"
            });
          }
        }
      )
  });

export const sleepDateParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      sleepDate: dateSchema
    }),

    query: emptyQuerySchema
  });

export const getSleepCalendarSchema =
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

export const getSleepSummarySchema =
  getSleepCalendarSchema;

export const restoreSleepEntrySchema =
  sleepEntryIdParamSchema;

export const softDeleteSleepEntrySchema =
  sleepEntryIdParamSchema;

export const permanentlyDeleteSleepEntrySchema =
  sleepEntryIdParamSchema;
