import { z } from "zod";

import {
  addDateRangeIssue,
  addPaginationIssues,
  dateSchema,
  emptyBodySchema,
  emptyQuerySchema,
  limitQuerySchema,
  optionalNullableText,
  optionalNullableTimestampSchema,
  pageQuerySchema,
  requireAtLeastOneField,
  sortOrderQuerySchema,
  uuidSchema
} from "./trackerCommon.validator.js";

const habitLogStatusSchema =
  z.enum([
    "completed",
    "partial",
    "skipped",
    "missed"
  ]);

const habitLogFields = {
  logDate:
    dateSchema.optional(),

  status:
    habitLogStatusSchema.optional(),

  value: z
    .number({
      invalid_type_error:
        "Value must be a number"
    })
    .int(
      "Value must be a whole number"
    )
    .min(
      0,
      "Value cannot be negative"
    )
    .max(
      1000000,
      "Value cannot exceed 1000000"
    )
    .optional(),

  note:
    optionalNullableText(
      2000,
      "Note"
    ),

  completedAt:
    optionalNullableTimestampSchema
};

function validateHabitLog(
  data,
  context
) {
  if (
    data.status ===
      "completed" &&
    data.value !== undefined &&
    data.value < 1
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["value"],
      message:
        "A completed habit log must have a value of at least 1"
    });
  }

  if (
    (
      data.status === "skipped" ||
      data.status === "missed"
    ) &&
    data.value !== undefined &&
    data.value !== 0
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["value"],
      message:
        "Skipped or missed habit logs must use a value of 0"
    });
  }
}

export const habitLogIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      habitId: uuidSchema,
      habitLogId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const habitIdForLogParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      habitId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createHabitLogSchema =
  z.object({
    body: z
      .object({
        ...habitLogFields,

        status:
          habitLogStatusSchema
            .default("completed"),

        value:
          habitLogFields.value
            .default(1)
      })
      .strict()
      .superRefine(
        validateHabitLog
      ),

    params: z.object({
      habitId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const updateHabitLogSchema =
  z.object({
    body: z
      .object({
        ...habitLogFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one habit log field must be provided"
          );

          validateHabitLog(
            data,
            context
          );
        }
      ),

    params: z.object({
      habitId: uuidSchema,
      habitLogId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getHabitLogsSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      habitId: uuidSchema
    }),

    query: z
      .object({
        page: pageQuerySchema,

        limit: limitQuerySchema,

        startDate:
          dateSchema.optional(),

        endDate:
          dateSchema.optional(),

        status:
          habitLogStatusSchema
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

export const completeHabitSchema =
  z.object({
    body: z
      .object({
        logDate:
          dateSchema.optional(),

        value: z
          .number()
          .int()
          .min(1)
          .max(1000000)
          .default(1),

        note:
          optionalNullableText(
            2000,
            "Note"
          ),

        completedAt:
          optionalNullableTimestampSchema
      })
      .strict(),

    params: z.object({
      habitId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const skipHabitSchema =
  z.object({
    body: z
      .object({
        logDate:
          dateSchema.optional(),

        note:
          optionalNullableText(
            2000,
            "Note"
          )
      })
      .strict(),

    params: z.object({
      habitId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const restoreHabitLogSchema =
  habitLogIdParamSchema;

export const softDeleteHabitLogSchema =
  habitLogIdParamSchema;

export const permanentlyDeleteHabitLogSchema =
  habitLogIdParamSchema;
