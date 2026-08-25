import { z } from "zod";

import {
  addDateRangeIssue,
  addPaginationIssues,
  booleanQuerySchema,
  dateSchema,
  emptyBodySchema,
  emptyParamsSchema,
  emptyQuerySchema,
  limitQuerySchema,
  optionalNullableText,
  optionalNullableTimestampSchema,
  pageQuerySchema,
  requireAtLeastOneField,
  requiredTrimmedText,
  sortOrderQuerySchema,
  timestampSchema,
  uuidSchema
} from "./trackerCommon.validator.js";

const amountMlSchema = z
  .number({
    required_error:
      "Water amount is required",
    invalid_type_error:
      "Water amount must be a number"
  })
  .int(
    "Water amount must be a whole number"
  )
  .min(
    1,
    "Water amount must be at least 1 ml"
  )
  .max(
    10000,
    "Water amount cannot exceed 10000 ml"
  );

const containerAmountSchema = z
  .number({
    required_error:
      "Container amount is required",
    invalid_type_error:
      "Container amount must be a number"
  })
  .int(
    "Container amount must be a whole number"
  )
  .min(
    10,
    "Container amount must be at least 10 ml"
  )
  .max(
    5000,
    "Container amount cannot exceed 5000 ml"
  );

const waterLogFields = {
  waterContainerId: z
    .string()
    .uuid(
      "Water container ID must be a valid UUID"
    )
    .nullable()
    .optional(),

  amountMl:
    amountMlSchema.optional(),

  containerType:
    optionalNullableText(
      80,
      "Container type"
    ),

  note:
    optionalNullableText(
      2000,
      "Note"
    ),

  loggedAt:
    optionalNullableTimestampSchema
};

export const waterLogIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      waterLogId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createWaterLogSchema =
  z.object({
    body: z
      .object({
        ...waterLogFields,

        amountMl:
          amountMlSchema
      })
      .strict(),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateWaterLogSchema =
  z.object({
    body: z
      .object({
        ...waterLogFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one water log field must be provided"
          );
        }
      ),

    params: z.object({
      waterLogId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getWaterLogsSchema =
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

        waterContainerId: z
          .string()
          .uuid(
            "Water container ID must be a valid UUID"
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
            context,
            200
          );

          addDateRangeIssue(
            query,
            context
          );
        }
      )
  });

export const getWaterTotalSchema =
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

export const waterContainerIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      waterContainerId:
        uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createWaterContainerSchema =
  z.object({
    body: z
      .object({
        containerName:
          requiredTrimmedText(
            1,
            80,
            "Container name"
          ),

        amountMl:
          containerAmountSchema,

        isDefault: z
          .boolean({
            invalid_type_error:
              "isDefault must be a boolean"
          })
          .default(false)
      })
      .strict(),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateWaterContainerSchema =
  z.object({
    body: z
      .object({
        containerName:
          requiredTrimmedText(
            1,
            80,
            "Container name"
          )
          .optional(),

        amountMl:
          containerAmountSchema
            .optional(),

        isDefault: z
          .boolean({
            invalid_type_error:
              "isDefault must be a boolean"
          })
          .optional(),

        isActive: z
          .boolean({
            invalid_type_error:
              "isActive must be a boolean"
          })
          .optional()
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one water container field must be provided"
          );
        }
      ),

    params: z.object({
      waterContainerId:
        uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getWaterContainersSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: z
      .object({
        includeInactive:
          booleanQuerySchema
      })
      .strict()
  });

export const restoreWaterLogSchema =
  waterLogIdParamSchema;

export const softDeleteWaterLogSchema =
  waterLogIdParamSchema;

export const permanentlyDeleteWaterLogSchema =
  waterLogIdParamSchema;

export const softDeleteWaterContainerSchema =
  waterContainerIdParamSchema;
