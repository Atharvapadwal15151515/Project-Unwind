import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Reusable Schemas
|--------------------------------------------------------------------------
*/

const emptyObjectSchema =
  z
    .object({})
    .passthrough();

const voiceTranscriptIdSchema =
  z
    .string({
      message:
        "Voice transcript ID is required."
    })
    .uuid(
      "Voice transcript ID must be a valid UUID."
    );

const entryIdSchema =
  z
    .string({
      message:
        "Journal entry ID is required."
    })
    .uuid(
      "Journal entry ID must be a valid UUID."
    );

const attachmentIdSchema =
  z
    .string({
      message:
        "Attachment ID is required."
    })
    .uuid(
      "Attachment ID must be a valid UUID."
    );

const transcriptStatusSchema =
  z.enum(
    [
      "pending",
      "processing",
      "completed",
      "failed"
    ],
    {
      message:
        "Transcript status must be pending, processing, completed, or failed."
    }
  );

const languageSchema =
  z
    .string()
    .trim()
    .min(
      2,
      "Language code must contain at least 2 characters."
    )
    .max(
      20,
      "Language code cannot exceed 20 characters."
    );

const providerSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "Transcription provider cannot be empty."
    )
    .max(
      50,
      "Transcription provider cannot exceed 50 characters."
    );

const modelSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "Transcription model cannot be empty."
    )
    .max(
      100,
      "Transcription model cannot exceed 100 characters."
    );

const transcriptTextSchema =
  z
    .string({
      message:
        "Transcript must be a string."
    })
    .trim()
    .min(
      1,
      "Transcript cannot be empty."
    )
    .max(
      200000,
      "Transcript cannot exceed 200000 characters."
    );

const nullableLanguageSchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === ""
      ) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      return value;
    },
    languageSchema
      .nullable()
      .optional()
  );

const nullableProviderSchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === ""
      ) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      return value;
    },
    providerSchema
      .nullable()
      .optional()
  );

const nullableModelSchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === ""
      ) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      return value;
    },
    modelSchema
      .nullable()
      .optional()
  );

const nullableConfidenceSchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === ""
      ) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      return Number(value);
    },
    z
      .number({
        message:
          "Transcription confidence must be a number."
      })
      .min(
        0,
        "Transcription confidence cannot be less than 0."
      )
      .max(
        1,
        "Transcription confidence cannot exceed 1."
      )
      .nullable()
      .optional()
  );

/*
|--------------------------------------------------------------------------
| Boolean Query Helpers
|--------------------------------------------------------------------------
*/

const optionalBooleanQuerySchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return undefined;
      }

      if (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
      ) {
        return true;
      }

      if (
        value === false ||
        value === "false" ||
        value === 0 ||
        value === "0"
      ) {
        return false;
      }

      return value;
    },
    z
      .boolean({
        message:
          "Value must be true or false."
      })
      .optional()
  );

/*
|--------------------------------------------------------------------------
| Date Query Helpers
|--------------------------------------------------------------------------
*/

const optionalDateTimeQuerySchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return undefined;
      }

      return value;
    },
    z
      .string()
      .datetime({
        offset: true,
        message:
          "Date must be a valid ISO 8601 date and time."
      })
      .optional()
  );

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

const pageSchema =
  z.coerce
    .number({
      message:
        "Page must be a number."
    })
    .int(
      "Page must be a whole number."
    )
    .min(
      1,
      "Page must be at least 1."
    )
    .default(1);

const limitSchema =
  z.coerce
    .number({
      message:
        "Limit must be a number."
    })
    .int(
      "Limit must be a whole number."
    )
    .min(
      1,
      "Limit must be at least 1."
    )
    .max(
      100,
      "Limit cannot exceed 100."
    )
    .default(20);

/*
|--------------------------------------------------------------------------
| Shared Request Parts
|--------------------------------------------------------------------------
*/

const voiceTranscriptParamsSchema =
  z.object({
    voiceTranscriptId:
      voiceTranscriptIdSchema
  });

const entryParamsSchema =
  z.object({
    entryId: entryIdSchema
  });

const emptyQuerySchema =
  emptyObjectSchema.optional();

const emptyBodySchema =
  emptyObjectSchema.optional();

/*
|--------------------------------------------------------------------------
| Create Voice Transcript
|--------------------------------------------------------------------------
|
| The audio file is uploaded through the existing journal attachment
| middleware. These fields contain only voice-transcription options.
|
*/

export const createJournalVoiceTranscriptRequestSchema =
  z.object({
    body: z
      .object({
        attachmentId:
          attachmentIdSchema,

        transcriptLanguage:
          nullableLanguageSchema,

        transcriptionProvider:
          nullableProviderSchema,

        transcriptionModel:
          nullableModelSchema,

        autoTranscribe: z.preprocess(
          (value) => {
            if (
              value === undefined ||
              value === null ||
              value === ""
            ) {
              return true;
            }

            if (
              value === true ||
              value === "true" ||
              value === 1 ||
              value === "1"
            ) {
              return true;
            }

            if (
              value === false ||
              value === "false" ||
              value === 0 ||
              value === "0"
            ) {
              return false;
            }

            return value;
          },
          z
            .boolean({
              message:
                "autoTranscribe must be true or false."
            })
            .default(true)
        )
      })
      .strict(),

    params:
      entryParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Get One Voice Transcript
|--------------------------------------------------------------------------
*/

export const getJournalVoiceTranscriptRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Get Entry Voice Transcripts
|--------------------------------------------------------------------------
*/

export const getJournalEntryVoiceTranscriptsRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      entryParamsSchema,

    query: z
      .object({
        transcriptStatus:
          transcriptStatusSchema
            .optional(),

        includeDeleted:
          optionalBooleanQuerySchema
      })
      .strict()
  });

/*
|--------------------------------------------------------------------------
| Get All User Voice Transcripts
|--------------------------------------------------------------------------
*/

export const getJournalVoiceTranscriptsRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      emptyObjectSchema.optional(),

    query: z
      .object({
        page:
          pageSchema,

        limit:
          limitSchema,

        entryId:
          entryIdSchema.optional(),

        attachmentId:
          attachmentIdSchema.optional(),

        transcriptStatus:
          transcriptStatusSchema
            .optional(),

        transcriptLanguage:
          languageSchema.optional(),

        transcriptionProvider:
          providerSchema.optional(),

        isTranscriptEdited:
          optionalBooleanQuerySchema,

        isDeleted:
          optionalBooleanQuerySchema,

        dateFrom:
          optionalDateTimeQuerySchema,

        dateTo:
          optionalDateTimeQuerySchema,

        search: z
          .string()
          .trim()
          .min(
            1,
            "Search text cannot be empty."
          )
          .max(
            200,
            "Search text cannot exceed 200 characters."
          )
          .optional()
      })
      .strict()
      .superRefine(
        (
          data,
          context
        ) => {
          if (
            data.dateFrom &&
            data.dateTo &&
            new Date(
              data.dateFrom
            ) >
              new Date(
                data.dateTo
              )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "dateTo"
              ],

              message:
                "dateTo must be later than or equal to dateFrom."
            });
          }
        }
      )
  });

/*
|--------------------------------------------------------------------------
| Search Voice Transcripts
|--------------------------------------------------------------------------
*/

export const searchJournalVoiceTranscriptsRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      emptyObjectSchema.optional(),

    query: z
      .object({
        search: z
          .string({
            message:
              "Search text is required."
          })
          .trim()
          .min(
            1,
            "Search text cannot be empty."
          )
          .max(
            200,
            "Search text cannot exceed 200 characters."
          ),

        entryId:
          entryIdSchema.optional(),

        transcriptLanguage:
          languageSchema.optional(),

        page:
          pageSchema,

        limit:
          limitSchema
      })
      .strict()
  });

/*
|--------------------------------------------------------------------------
| Update Transcript Text
|--------------------------------------------------------------------------
*/

export const updateJournalVoiceTranscriptRequestSchema =
  z.object({
    body: z
      .object({
        transcript:
          transcriptTextSchema
      })
      .strict(),

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Restore Original AI Transcript
|--------------------------------------------------------------------------
*/

export const restoreOriginalJournalVoiceTranscriptRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Update Voice Transcript Metadata
|--------------------------------------------------------------------------
*/

export const updateJournalVoiceTranscriptMetadataRequestSchema =
  z.object({
    body: z
      .object({
        transcriptLanguage:
          nullableLanguageSchema,

        detectedLanguage:
          nullableLanguageSchema,

        transcriptionProvider:
          nullableProviderSchema,

        transcriptionModel:
          nullableModelSchema,

        transcriptionConfidence:
          nullableConfidenceSchema
      })
      .strict()
      .superRefine(
        (
          data,
          context
        ) => {
          const hasUpdate =
            data.transcriptLanguage !==
              undefined ||
            data.detectedLanguage !==
              undefined ||
            data.transcriptionProvider !==
              undefined ||
            data.transcriptionModel !==
              undefined ||
            data.transcriptionConfidence !==
              undefined;

          if (!hasUpdate) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [],

              message:
                "At least one metadata field is required."
            });
          }
        }
      ),

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Start Transcription
|--------------------------------------------------------------------------
*/

export const transcribeJournalVoiceRequestSchema =
  z.object({
    body: z
      .object({
        transcriptLanguage:
          nullableLanguageSchema,

        transcriptionProvider:
          nullableProviderSchema,

        transcriptionModel:
          nullableModelSchema
      })
      .strict(),

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Retry Transcription
|--------------------------------------------------------------------------
*/

export const retryJournalVoiceTranscriptionRequestSchema =
  z.object({
    body: z
      .object({
        transcriptLanguage:
          nullableLanguageSchema,

        transcriptionProvider:
          nullableProviderSchema,

        transcriptionModel:
          nullableModelSchema
      })
      .strict(),

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Get Transcription Status
|--------------------------------------------------------------------------
*/

export const getJournalVoiceTranscriptStatusRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Soft Delete Voice Transcript
|--------------------------------------------------------------------------
*/

export const deleteJournalVoiceTranscriptRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Restore Deleted Voice Transcript
|--------------------------------------------------------------------------
*/

export const restoreJournalVoiceTranscriptRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Permanently Delete Voice Transcript
|--------------------------------------------------------------------------
*/

export const permanentlyDeleteJournalVoiceTranscriptRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      voiceTranscriptParamsSchema,

    query:
      emptyQuerySchema
  });

  const attachmentParamsSchema =
  z.object({
    attachmentId:
      attachmentIdSchema
  });

export const getJournalVoiceTranscriptByAttachmentRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      attachmentParamsSchema,

    query: z
      .object({
        includeDeleted:
          optionalBooleanQuerySchema
      })
      .strict()
  });

export const deleteJournalVoiceTranscriptByAttachmentRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      attachmentParamsSchema,

    query:
      emptyQuerySchema
  });

export const restoreJournalVoiceTranscriptByAttachmentRequestSchema =
  z.object({
    body:
      emptyBodySchema,

    params:
      attachmentParamsSchema,

    query:
      emptyQuerySchema
  });