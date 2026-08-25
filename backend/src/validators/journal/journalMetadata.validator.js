import { z } from "zod";

const uuidSchema = z
  .string()
  .uuid("ID must be a valid UUID");

const metadataNameSchema = z
  .string({
    required_error: "Name is required",
    invalid_type_error:
      "Name must be a string"
  })
  .trim()
  .min(1, "Name cannot be empty")
  .max(
    60,
    "Name cannot exceed 60 characters"
  )
  .refine(
    (value) =>
      /[a-zA-Z0-9]/.test(value),
    {
      message:
        "Name must contain at least one letter or number"
    }
  );

// =========================================================
// TAG SCHEMAS
// =========================================================

export const createJournalTagSchema =
  z.object({
    body: z.object({
      tagName: metadataNameSchema
    })
  });

export const updateJournalTagSchema =
  z.object({
    params: z.object({
      tagId: uuidSchema
    }),

    body: z.object({
      tagName: metadataNameSchema
    })
  });

export const deleteJournalTagSchema =
  z.object({
    params: z.object({
      tagId: uuidSchema
    })
  });

// =========================================================
// ACTIVITY SCHEMAS
// =========================================================

export const createJournalActivitySchema =
  z.object({
    body: z.object({
      activityName:
        metadataNameSchema
    })
  });

export const updateJournalActivitySchema =
  z.object({
    params: z.object({
      activityId: uuidSchema
    }),

    body: z.object({
      activityName:
        metadataNameSchema
    })
  });

export const deleteJournalActivitySchema =
  z.object({
    params: z.object({
      activityId: uuidSchema
    })
  });

// =========================================================
// JOURNAL ENTRY RELATION FIELDS
// =========================================================

export const journalEmotionIdsSchema =
  z
    .array(
      z
        .string()
        .uuid(
          "Each emotion ID must be a valid UUID"
        )
    )
    .max(
      5,
      "A journal entry can have at most 5 emotions"
    )
    .refine(
      (values) =>
        new Set(values).size ===
        values.length,
      {
        message:
          "Emotion IDs cannot contain duplicates"
      }
    );

export const journalTagIdsSchema =
  z
    .array(
      z
        .string()
        .uuid(
          "Each tag ID must be a valid UUID"
        )
    )
    .max(
      10,
      "A journal entry can have at most 10 tags"
    )
    .refine(
      (values) =>
        new Set(values).size ===
        values.length,
      {
        message:
          "Tag IDs cannot contain duplicates"
      }
    );

export const journalActivityIdsSchema =
  z
    .array(
      z
        .string()
        .uuid(
          "Each activity ID must be a valid UUID"
        )
    )
    .max(
      10,
      "A journal entry can have at most 10 activities"
    )
    .refine(
      (values) =>
        new Set(values).size ===
        values.length,
      {
        message:
          "Activity IDs cannot contain duplicates"
      }
    );

export const journalRelationFields = {
  emotionIds:
    journalEmotionIdsSchema.optional(),

  tagIds:
    journalTagIdsSchema.optional(),

  activityIds:
    journalActivityIdsSchema.optional()
};

export const journalRelationsSchema =
  z.object({
    body: z.object({
      ...journalRelationFields
    })
  });