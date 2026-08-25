import { z } from "zod";

import {
  emptyBodySchema,
  emptyParamsSchema,
  emptyQuerySchema,
  optionalNullableText,
  requiredTrimmedText,
  requireAtLeastOneField,
  uuidSchema
} from "./trackerCommon.validator.js";

const metadataFields = {
  displayOrder: z
    .number({
      invalid_type_error:
        "Display order must be a number"
    })
    .int(
      "Display order must be a whole number"
    )
    .min(
      0,
      "Display order cannot be negative"
    )
    .optional(),

  isActive: z
    .boolean({
      invalid_type_error:
        "isActive must be a boolean"
    })
    .optional()
};

export const trackerEmotionIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      emotionId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createTrackerEmotionSchema =
  z.object({
    body: z
      .object({
        emotionName:
          requiredTrimmedText(
            1,
            80,
            "Emotion name"
          ),

        emotionKey:
          requiredTrimmedText(
            1,
            80,
            "Emotion key"
          )
          .regex(
            /^[a-z0-9_]+$/,
            "Emotion key can contain only lowercase letters, numbers and underscores"
          ),

        displayOrder:
          metadataFields.displayOrder
            .default(0)
      })
      .strict(),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateTrackerEmotionSchema =
  z.object({
    body: z
      .object({
        emotionName:
          requiredTrimmedText(
            1,
            80,
            "Emotion name"
          )
          .optional(),

        emotionKey:
          requiredTrimmedText(
            1,
            80,
            "Emotion key"
          )
          .regex(
            /^[a-z0-9_]+$/,
            "Emotion key can contain only lowercase letters, numbers and underscores"
          )
          .optional(),

        ...metadataFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one emotion field must be provided"
          );
        }
      ),

    params: z.object({
      emotionId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const trackerActivityIdParamSchema =
  z.object({
    body: emptyBodySchema,

    params: z.object({
      activityId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const createTrackerActivitySchema =
  z.object({
    body: z
      .object({
        activityName:
          requiredTrimmedText(
            1,
            100,
            "Activity name"
          ),

        activityKey:
          requiredTrimmedText(
            1,
            100,
            "Activity key"
          )
          .regex(
            /^[a-z0-9_]+$/,
            "Activity key can contain only lowercase letters, numbers and underscores"
          ),

        category:
          optionalNullableText(
            50,
            "Category"
          ),

        displayOrder:
          metadataFields.displayOrder
            .default(0)
      })
      .strict(),

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });

export const updateTrackerActivitySchema =
  z.object({
    body: z
      .object({
        activityName:
          requiredTrimmedText(
            1,
            100,
            "Activity name"
          )
          .optional(),

        activityKey:
          requiredTrimmedText(
            1,
            100,
            "Activity key"
          )
          .regex(
            /^[a-z0-9_]+$/,
            "Activity key can contain only lowercase letters, numbers and underscores"
          )
          .optional(),

        category:
          optionalNullableText(
            50,
            "Category"
          ),

        ...metadataFields
      })
      .strict()
      .superRefine(
        (data, context) => {
          requireAtLeastOneField(
            data,
            context,
            "At least one activity field must be provided"
          );
        }
      ),

    params: z.object({
      activityId: uuidSchema
    }),

    query: emptyQuerySchema
  });

export const getTrackerMetadataSchema =
  z.object({
    body: emptyBodySchema,

    params: emptyParamsSchema,

    query: emptyQuerySchema
  });
