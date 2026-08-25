import { z } from "zod";

import {
  addPaginationIssues,
  booleanQuerySchema,
  dateSchema,
  emptyBodySchema,
  emptyParamsSchema,
  emptyQuerySchema,
  limitQuerySchema,
  optionalNullableText,
  pageQuerySchema,
  requireAtLeastOneField,
  requiredTrimmedText,
  sortOrderQuerySchema,
  timeSchema,
  uuidSchema
} from "./trackerCommon.validator.js";

const habitCategorySchema = z.enum([
  "wellness",
  "fitness",
  "study",
  "sleep",
  "self_care",
  "nutrition",
  "productivity",
  "custom"
]);

const trackingTypeSchema = z.enum([
  "boolean",
  "count",
  "duration"
]);

const frequencyTypeSchema = z.enum([
  "daily",
  "weekly",
  "custom"
]);

const targetDaysSchema = z
  .array(
    z
      .number({
        invalid_type_error:
          "Target days must contain numbers"
      })
      .int(
        "Target days must contain whole numbers"
      )
      .min(
        0,
        "Target day cannot be lower than 0"
      )
      .max(
        6,
        "Target day cannot be greater than 6"
      )
  )
  .max(
    7,
    "Target days cannot contain more than 7 items"
  )
  .transform((days) => [
    ...new Set(days)
  ]);

const habitFields = {
  habitName:
    requiredTrimmedText(
      1,
      120,
      "Habit name"
    )
    .optional(),

  description:
    optionalNullableText(
      5000,
      "Description"
    ),

  category:
    habitCategorySchema.optional(),

  trackingType:
    trackingTypeSchema.optional(),

  targetValue: z
    .number({
      invalid_type_error:
        "Target value must be a number"
    })
    .int(
      "Target value must be a whole number"
    )
    .min(
      1,
      "Target value must be at least 1"
    )
    .max(
      100000,
      "Target value cannot exceed 100000"
    )
    .optional(),

  targetUnit: z
    .string()
    .trim()
    .min(
      1,
      "Target unit cannot be empty"
    )
    .max(
      40,
      "Target unit cannot exceed 40 characters"
    )
    .optional(),

  frequencyType:
    frequencyTypeSchema.optional(),

  targetDays:
    targetDaysSchema.optional(),

  targetCountPerPeriod: z
    .number({
      invalid_type_error:
        "Target count per period must be a number"
    })
    .int(
      "Target count per period must be a whole number"
    )
    .min(
      1,
      "Target count per period must be at least 1"
    )
    .max(
      1000,
      "Target count per period cannot exceed 1000"
    )
    .nullable()
    .optional(),

  startDate:
    dateSchema.optional(),

  endDate:
    dateSchema
      .nullable()
      .optional(),

  reminderEnabled: z
    .boolean({
      invalid_type_error:
        "reminderEnabled must be a boolean"
    })
    .optional(),

  reminderTime:
    timeSchema
      .nullable()
      .optional(),

  isActive: z
    .boolean({
      invalid_type_error:
        "isActive must be a boolean"
    })
    .optional()
};

function validateHabitRules(
  data,
  context
) {
  if (
    data.startDate &&
    data.endDate &&
    data.endDate <
      data.startDate
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["endDate"],
      message:
        "End date cannot be earlier than start date"
    });
  }

  if (
    data.frequencyType ===
      "custom" &&
    (
      !data.targetDays ||
      data.targetDays.length === 0
    )
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["targetDays"],
      message:
        "Target days are required for a custom frequency"
    });
  }

  if (
    data.reminderEnabled ===
      true &&
    !data.reminderTime
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["reminderTime"],
      message:
        "Reminder time is required when reminders are enabled"
    });
  }

  if (
    data.trackingType ===
      "boolean" &&
    data.targetValue !== undefined &&
    data.targetValue !== 1
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["targetValue"],
      message:
        "Boolean habits must use a target value of 1"
    });
  }
}

export const habitIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      habitId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createHabitSchema =
  z.object({
    body: z
      .object({
        ...habitFields,

        habitName:
          requiredTrimmedText(
            1,
            120,
            "Habit name"
          ),

        category:
          habitCategorySchema
            .default("custom"),

        trackingType:
          trackingTypeSchema,

        targetValue:
          habitFields
            .targetValue
            .default(1),

        targetUnit: z
          .string()
          .trim()
          .min(
            1,
            "Target unit cannot be empty"
          )
          .max(
            40,
            "Target unit cannot exceed 40 characters"
          )
          .default("times"),

        frequencyType:
          frequencyTypeSchema
            .default("daily"),

        targetDays:
          targetDaysSchema
            .default([]),

        reminderEnabled:
          habitFields
            .reminderEnabled
            .default(false)
      })
      .strict()
      .superRefine(
        validateHabitRules
      ),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateHabitSchema =
  z.object({
    body: z
      .object({
        ...habitFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one habit field must be provided"
          );

          validateHabitRules(
            data,
            context
          );
        }
      ),

    params: z.object({
      habitId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getHabitsSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: z
      .object({
        page: pageQuerySchema,

        limit: limitQuerySchema,

        category:
          habitCategorySchema
            .optional(),

        trackingType:
          trackingTypeSchema
            .optional(),

        frequencyType:
          frequencyTypeSchema
            .optional(),

        isActive:
          booleanQuerySchema,

        search: z
          .string()
          .trim()
          .max(
            200,
            "Search cannot exceed 200 characters"
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
        }
      )
  });

export const getHabitsForDateSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: z
      .object({
        date:
          dateSchema
      })
      .strict()
  });

export const pauseHabitSchema =
  habitIdParamSchema;

export const resumeHabitSchema =
  habitIdParamSchema;

export const restoreHabitSchema =
  habitIdParamSchema;

export const softDeleteHabitSchema =
  habitIdParamSchema;

export const permanentlyDeleteHabitSchema =
  habitIdParamSchema;
