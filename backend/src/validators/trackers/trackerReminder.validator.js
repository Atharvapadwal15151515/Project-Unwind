import { z } from "zod";

import {
  emptyBodySchema,
  emptyParamsSchema,
  emptyQuerySchema,
  optionalNullableText,
  requireAtLeastOneField,
  timeSchema,
  uuidSchema
} from "./trackerCommon.validator.js";

const trackerTypeSchema = z.enum([
  "mood",
  "sleep",
  "energy",
  "water"
]);

const frequencyTypeSchema = z.enum([
  "daily",
  "weekdays",
  "custom"
]);

const reminderDaysSchema = z
  .array(
    z
      .number({
        invalid_type_error:
          "Reminder days must contain numbers"
      })
      .int(
        "Reminder days must contain whole numbers"
      )
      .min(
        0,
        "Reminder day cannot be lower than 0"
      )
      .max(
        6,
        "Reminder day cannot be greater than 6"
      )
  )
  .max(
    7,
    "Reminder days cannot contain more than 7 items"
  )
  .transform((days) => [
    ...new Set(days)
  ]);

const trackerReminderFields = {
  trackerType:
    trackerTypeSchema.optional(),

  reminderName:
    optionalNullableText(
      100,
      "Reminder name"
    ),

  reminderTime:
    timeSchema.optional(),

  frequencyType:
    frequencyTypeSchema.optional(),

  reminderDays:
    reminderDaysSchema.optional(),

  isEnabled: z
    .boolean({
      invalid_type_error:
        "isEnabled must be a boolean"
    })
    .optional()
};

function validateReminderRules(
  data,
  context
) {
  if (
    data.frequencyType ===
      "custom" &&
    (
      !data.reminderDays ||
      data.reminderDays.length === 0
    )
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: ["reminderDays"],
      message:
        "Reminder days are required for a custom frequency"
    });
  }
}

export const trackerReminderIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      trackerReminderId:
        uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createTrackerReminderSchema =
  z.object({
    body: z
      .object({
        ...trackerReminderFields,

        trackerType:
          trackerTypeSchema,

        reminderTime:
          timeSchema,

        frequencyType:
          frequencyTypeSchema
            .default("daily"),

        reminderDays:
          reminderDaysSchema
            .default([]),

        isEnabled:
          trackerReminderFields
            .isEnabled
            .default(true)
      })
      .strict()
      .superRefine(
        validateReminderRules
      ),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateTrackerReminderSchema =
  z.object({
    body: z
      .object({
        ...trackerReminderFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one tracker reminder field must be provided"
          );

          validateReminderRules(
            data,
            context
          );
        }
      ),

    params: z.object({
      trackerReminderId:
        uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getTrackerRemindersSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: z
      .object({
        trackerType:
          trackerTypeSchema
            .optional()
      })
      .strict()
  });

export const restoreTrackerReminderSchema =
  trackerReminderIdParamSchema;

export const softDeleteTrackerReminderSchema =
  trackerReminderIdParamSchema;

export const permanentlyDeleteTrackerReminderSchema =
  trackerReminderIdParamSchema;
