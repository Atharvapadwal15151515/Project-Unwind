import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Single Journal Entry PDF Export
|--------------------------------------------------------------------------
| Used for:
| GET /api/journal/export/entries/:entryId/pdf
*/

export const journalEntryPdfParamSchema =
  z.object({
    params: z.object({
      entryId: z
        .string()
        .uuid(
          "Invalid Journal entry ID"
        )
    })
  });

/*
|--------------------------------------------------------------------------
| Multiple Journal Entries PDF Export
|--------------------------------------------------------------------------
| Used for:
| POST /api/journal/export/pdf
*/

export const journalMultipleEntriesPdfSchema =
  z.object({
    body: z.object({
      entryIds: z
        .array(
          z
            .string()
            .uuid(
              "Every entry ID must be a valid UUID"
            )
        )
        .min(
          1,
          "At least one Journal entry ID is required"
        )
        .max(
          100,
          "A maximum of 100 Journal entries can be exported at once"
        )
        .refine(
          (entryIds) =>
            new Set(entryIds).size ===
            entryIds.length,
          {
            message:
              "Duplicate Journal entry IDs are not allowed"
          }
        ),

      includeAttachments: z
        .boolean()
        .optional()
        .default(false),

      includeMetadata: z
        .boolean()
        .optional()
        .default(true),

      includeDeleted: z
        .boolean()
        .optional()
        .default(false),

      documentTitle: z
        .string()
        .trim()
        .min(
          1,
          "Document title cannot be empty"
        )
        .max(
          100,
          "Document title cannot exceed 100 characters"
        )
        .optional()
    })
  });

/*
|--------------------------------------------------------------------------
| Complete Journal PDF Export Query
|--------------------------------------------------------------------------
| Used for:
| GET /api/journal/export/pdf
*/

export const completeJournalPdfQuerySchema =
  z.object({
    query: z
      .object({
        status: z
          .enum([
            "draft",
            "completed",
            "archived"
          ])
          .optional(),

        entryType: z
          .enum([
            "standard",
            "prompted",
            "voice",
            "photo",
            "video"
          ])
          .optional(),

        moodLabel: z
          .enum([
            "very_low",
            "low",
            "neutral",
            "good",
            "very_good",
            "anxious",
            "angry",
            "calm",
            "tired",
            "overwhelmed"
          ])
          .optional(),

        isFavourite: z
          .enum([
            "true",
            "false"
          ])
          .transform(
            (value) =>
              value === "true"
          )
          .optional(),

        includeAttachments: z
          .enum([
            "true",
            "false"
          ])
          .transform(
            (value) =>
              value === "true"
          )
          .optional()
          .default(false),

        includeMetadata: z
          .enum([
            "true",
            "false"
          ])
          .transform(
            (value) =>
              value === "true"
          )
          .optional()
          .default(true),

        includeDeleted: z
          .enum([
            "true",
            "false"
          ])
          .transform(
            (value) =>
              value === "true"
          )
          .optional()
          .default(false),

        fromDate: z
          .string()
          .date(
            "fromDate must use YYYY-MM-DD format"
          )
          .optional(),

        toDate: z
          .string()
          .date(
            "toDate must use YYYY-MM-DD format"
          )
          .optional(),

        sortBy: z
          .enum([
            "createdAt",
            "updatedAt",
            "entryDate",
            "title",
            "moodScore"
          ])
          .optional()
          .default("entryDate"),

        sortOrder: z
          .enum([
            "asc",
            "desc"
          ])
          .optional()
          .default("desc"),

        documentTitle: z
          .string()
          .trim()
          .min(
            1,
            "Document title cannot be empty"
          )
          .max(
            100,
            "Document title cannot exceed 100 characters"
          )
          .optional()
      })
      .superRefine(
        (query, context) => {
          if (
            query.fromDate &&
            query.toDate &&
            new Date(
              query.fromDate
            ) >
              new Date(
                query.toDate
              )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["toDate"],
              message:
                "toDate must be on or after fromDate"
            });
          }
        }
      )
  });