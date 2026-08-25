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

const scoreSchema = (
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
    );

const optionalScoreSchema = (
  fieldName
) =>
  scoreSchema(fieldName)
    .nullable()
    .optional();

const energyFields = {
  energyScore:
    scoreSchema(
      "Energy score"
    )
    .optional(),

  fatigueScore:
    optionalScoreSchema(
      "Fatigue score"
    ),

  focusScore:
    optionalScoreSchema(
      "Focus score"
    ),

  motivationScore:
    optionalScoreSchema(
      "Motivation score"
    ),

  physicalEnergyScore:
    optionalScoreSchema(
      "Physical energy score"
    ),

  mentalEnergyScore:
    optionalScoreSchema(
      "Mental energy score"
    ),

  contextCategory:
    optionalNullableText(
      80,
      "Context category"
    ),

  note:
    optionalNullableText(
      5000,
      "Note"
    ),

  loggedAt:
    optionalNullableTimestampSchema
};

export const energyEntryIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      energyEntryId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createEnergyEntrySchema =
  z.object({
    body: z
      .object({
        ...energyFields,

        energyScore:
          scoreSchema(
            "Energy score"
          )
      })
      .strict(),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateEnergyEntrySchema =
  z.object({
    body: z
      .object({
        ...energyFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one energy entry field must be provided"
          );
        }
      ),

    params: z.object({
      energyEntryId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getEnergyEntriesSchema =
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

        minEnergyScore: z
          .string()
          .regex(
            /^[1-5]$/,
            "Minimum energy score must be between 1 and 5"
          )
          .optional(),

        maxEnergyScore: z
          .string()
          .regex(
            /^[1-5]$/,
            "Maximum energy score must be between 1 and 5"
          )
          .optional(),

        contextCategory: z
          .string()
          .trim()
          .max(
            80,
            "Context category cannot exceed 80 characters"
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
            query.minEnergyScore &&
            query.maxEnergyScore &&
            Number(
              query.minEnergyScore
            ) >
              Number(
                query.maxEnergyScore
              )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [
                "maxEnergyScore"
              ],
              message:
                "Maximum energy score cannot be lower than minimum energy score"
            });
          }
        }
      )
  });

export const getEnergyCalendarSchema =
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

export const getEnergySummarySchema =
  getEnergyCalendarSchema;

export const restoreEnergyEntrySchema =
  energyEntryIdParamSchema;

export const softDeleteEnergyEntrySchema =
  energyEntryIdParamSchema;

export const permanentlyDeleteEnergyEntrySchema =
  energyEntryIdParamSchema;
