import { z } from "zod";

import {
  emptyParamsSchema,
  emptyQuerySchema,
  requireAtLeastOneField
} from "./trackerCommon.validator.js";

const trackerSettingsFields = {
  timezone: z
    .string()
    .trim()
    .min(
      1,
      "Timezone cannot be empty"
    )
    .max(
      100,
      "Timezone cannot exceed 100 characters"
    )
    .optional(),

  preferredWaterUnit: z
    .enum([
      "ml",
      "litres"
    ])
    .optional(),

  dailyWaterGoalMl: z
    .number({
      invalid_type_error:
        "Daily water goal must be a number"
    })
    .int(
      "Daily water goal must be a whole number"
    )
    .min(
      250,
      "Daily water goal must be at least 250 ml"
    )
    .max(
      10000,
      "Daily water goal cannot exceed 10000 ml"
    )
    .optional(),

  moodTrackerEnabled: z
    .boolean({
      invalid_type_error:
        "moodTrackerEnabled must be a boolean"
    })
    .optional(),

  sleepTrackerEnabled: z
    .boolean({
      invalid_type_error:
        "sleepTrackerEnabled must be a boolean"
    })
    .optional(),

  habitTrackerEnabled: z
    .boolean({
      invalid_type_error:
        "habitTrackerEnabled must be a boolean"
    })
    .optional(),

  energyTrackerEnabled: z
    .boolean({
      invalid_type_error:
        "energyTrackerEnabled must be a boolean"
    })
    .optional(),

  waterTrackerEnabled: z
    .boolean({
      invalid_type_error:
        "waterTrackerEnabled must be a boolean"
    })
    .optional()
};

export const updateTrackerSettingsSchema =
  z.object({
    body: z
      .object({
        ...trackerSettingsFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one tracker setting must be provided"
          );
        }
      ),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const getTrackerSettingsSchema =
  z.object({
    body: z
      .object({})
      .passthrough()
      .optional(),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });
