import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Common Schemas
|--------------------------------------------------------------------------
*/

const emptyObjectSchema =
  z.preprocess(
    (value) => value ?? {},
    z.object({}).passthrough()
  );

const attachmentIdSchema =
  z
    .string()
    .uuid(
      "Invalid journal attachment ID."
    );

const entryIdSchema =
  z
    .string()
    .uuid(
      "Invalid journal entry ID."
    );

const attachmentTypeSchema =
  z.enum([
    "image",
    "video",
    "audio",
    "document"
  ]);

const processingStatusSchema =
  z.enum([
    "pending",
    "processing",
    "completed",
    "failed"
  ]);

/*
|--------------------------------------------------------------------------
| Multipart/Form-Data Helpers
|--------------------------------------------------------------------------
|
| Postman and browser FormData send non-file values as strings.
|
*/

const multipartBooleanSchema =
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

const booleanQuerySchema =
  z.preprocess(
    (value) => {
      if (
        value === true ||
        value === "true" ||
        value === "1" ||
        value === 1
      ) {
        return true;
      }

      if (
        value === false ||
        value === "false" ||
        value === "0" ||
        value === 0
      ) {
        return false;
      }

      return value;
    },
    z.boolean()
  );

const nullableBooleanQuerySchema =
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
        value === "1" ||
        value === 1
      ) {
        return true;
      }

      if (
        value === false ||
        value === "false" ||
        value === "0" ||
        value === 0
      ) {
        return false;
      }

      return value;
    },
    z.boolean().optional()
  );

const multipartIntegerSchema = ({
  minimum = 0,
  maximum = 10000,
  fieldName = "Value"
} = {}) =>
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({
        message:
          `${fieldName} must be a number.`
      })
      .int(
        `${fieldName} must be an integer.`
      )
      .min(
        minimum,
        `${fieldName} cannot be less than ${minimum}.`
      )
      .max(
        maximum,
        `${fieldName} cannot exceed ${maximum}.`
      )
      .optional()
  );

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

const paginationQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .min(
        1,
        "Page must be at least 1."
      )
      .optional(),

    limit: z.coerce
      .number()
      .int()
      .min(
        1,
        "Limit must be at least 1."
      )
      .max(
        100,
        "Limit cannot exceed 100."
      )
      .optional()
  });

/*
|--------------------------------------------------------------------------
| Attachment Metadata Fields
|--------------------------------------------------------------------------
*/

const captionSchema =
  z
    .string()
    .trim()
    .max(
      500,
      "Caption cannot exceed 500 characters."
    )
    .nullable();

const optionalMultipartCaptionSchema =
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
      .trim()
      .max(
        500,
        "Caption cannot exceed 500 characters."
      )
      .optional()
  );

const altTextSchema =
  z
    .string()
    .trim()
    .max(
      500,
      "Alternative text cannot exceed 500 characters."
    )
    .nullable();

const optionalMultipartAltTextSchema =
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
      .trim()
      .max(
        500,
        "Alternative text cannot exceed 500 characters."
      )
      .optional()
  );

const attachmentOrderSchema =
  z.coerce
    .number()
    .int()
    .min(
      0,
      "Attachment order cannot be negative."
    )
    .max(
      10000,
      "Attachment order is too large."
    );

/*
|--------------------------------------------------------------------------
| Multiple Upload JSON-String Validation
|--------------------------------------------------------------------------
|
| The controller accepts:
|
| captions: '["Caption one","Caption two"]'
| altTexts: '["Alt one","Alt two"]'
|
*/

function validateJsonStringArray(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  try {
    return Array.isArray(
      JSON.parse(value)
    );
  } catch {
    return false;
  }
}

const multipartArrayFieldSchema =
  z
    .union([
      z.string(),
      z.array(
        z
          .string()
          .max(500)
          .nullable()
      )
    ])
    .optional()
    .refine(
      validateJsonStringArray,
      {
        message:
          "Value must be a valid JSON array."
      }
    );

/*
|--------------------------------------------------------------------------
| Query Schemas
|--------------------------------------------------------------------------
*/

const attachmentListQuerySchema =
  paginationQuerySchema.extend({
    entryId:
      entryIdSchema.optional(),

    attachmentType:
      attachmentTypeSchema.optional(),

    processingStatus:
      processingStatusSchema.optional(),

    isDeleted:
      nullableBooleanQuerySchema
  });

const entryAttachmentQuerySchema =
  z.object({
    attachmentType:
      attachmentTypeSchema.optional(),

    includeDeleted:
      nullableBooleanQuerySchema
  });

/*
|--------------------------------------------------------------------------
| Upload One Attachment
|--------------------------------------------------------------------------
|
| POST /api/journal/attachments/entries/:entryId
|
| The actual file is available as req.file after Multer.
| Cloudinary metadata must not be required from req.body.
|
*/

export const addAttachmentRequestSchema = {
  body: z.object({
    caption:
      optionalMultipartCaptionSchema,

    altText:
      optionalMultipartAltTextSchema,

    isCover:
      multipartBooleanSchema,

    attachmentOrder:
      multipartIntegerSchema({
        minimum: 0,
        maximum: 10000,
        fieldName:
          "Attachment order"
      })
  }),

  params: z.object({
    entryId:
      entryIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Upload Multiple Attachments
|--------------------------------------------------------------------------
|
| POST /api/journal/attachments/entries/:entryId/multiple
|
| Files are available as req.files.
|
| Multipart fields:
| captions   = ["Caption one","Caption two"]
| altTexts   = ["Alt one","Alt two"]
| coverIndex = 0
|
*/

export const addAttachmentsRequestSchema = {
  body: z.object({
    captions:
      multipartArrayFieldSchema,

    altTexts:
      multipartArrayFieldSchema,

    coverIndex:
      multipartIntegerSchema({
        minimum: 0,
        maximum: 9,
        fieldName:
          "Cover index"
      })
  }),

  params: z.object({
    entryId:
      entryIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Get All Attachments
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments
|
*/

export const getAttachmentsRequestSchema = {
  body:
    emptyObjectSchema,

  params:
    emptyObjectSchema,

  query: z.preprocess(
    (value) => value ?? {},
    attachmentListQuerySchema
  )
};

/*
|--------------------------------------------------------------------------
| Get Total Attachment Storage
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/storage
|
*/

export const getAttachmentStorageRequestSchema = {
  body:
    emptyObjectSchema,

  params:
    emptyObjectSchema,

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Get Entry Attachments
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/entries/:entryId
|
*/

export const getEntryAttachmentsRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    entryId:
      entryIdSchema
  }),

  query: z.preprocess(
    (value) => value ?? {},
    entryAttachmentQuerySchema
  )
};

/*
|--------------------------------------------------------------------------
| Get Entry Attachment Storage
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/entries/:entryId/storage
|
*/

export const getEntryAttachmentStorageRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    entryId:
      entryIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Get One Attachment
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/:attachmentId
|
*/

export const getAttachmentRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Update Attachment Metadata
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId
|
*/

export const updateAttachmentRequestSchema = {
  body: z
    .object({
      caption:
        captionSchema.optional(),

      altText:
        altTextSchema.optional()
    })
    .refine(
      (data) =>
        Object.keys(data).length >
        0,
      {
        message:
          "Caption or alternative text must be provided."
      }
    ),

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Set Attachment Cover
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId/cover
|
*/

export const setAttachmentCoverRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Remove Attachment Cover
|--------------------------------------------------------------------------
|
| DELETE /api/journal/attachments/:attachmentId/cover
|
*/

export const removeAttachmentCoverRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Reorder Attachments
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/entries/:entryId/reorder
|
*/

export const reorderAttachmentsRequestSchema = {
  body: z.object({
    attachments: z
      .array(
        z.object({
          attachmentId:
            attachmentIdSchema,

          attachmentOrder:
            attachmentOrderSchema
        })
      )
      .min(
        1,
        "At least one attachment is required."
      )
      .max(
        10,
        "A maximum of 10 attachments can be reordered."
      )
      .superRefine(
        (
          attachments,
          context
        ) => {
          const attachmentIds =
            attachments.map(
              (attachment) =>
                attachment
                  .attachmentId
            );

          const orders =
            attachments.map(
              (attachment) =>
                attachment
                  .attachmentOrder
            );

          if (
            new Set(
              attachmentIds
            ).size !==
            attachmentIds.length
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              message:
                "Attachment IDs cannot be repeated.",

              path: [
                "attachments"
              ]
            });
          }

          if (
            new Set(
              orders
            ).size !==
            orders.length
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              message:
                "Attachment order values cannot be repeated.",

              path: [
                "attachments"
              ]
            });
          }
        }
      )
  }),

  params: z.object({
    entryId:
      entryIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Update Processing Status
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId/processing
|
*/

export const updateAttachmentProcessingRequestSchema = {
  body: z
    .object({
      processingStatus:
        processingStatusSchema,

      processingError: z
        .string()
        .trim()
        .max(
          2000,
          "Processing error cannot exceed 2000 characters."
        )
        .nullish()
    })
    .superRefine(
      (data, context) => {
        if (
          data.processingStatus ===
            "failed" &&
          !data.processingError
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "processingError"
            ],

            message:
              "Processing error is required when processing fails."
          });
        }

        if (
          data.processingStatus !==
            "failed" &&
          data.processingError
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "processingError"
            ],

            message:
              "Processing error can only be provided when processing has failed."
          });
        }
      }
    ),

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Soft Delete Attachment
|--------------------------------------------------------------------------
|
| DELETE /api/journal/attachments/:attachmentId
|
*/

export const deleteAttachmentRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Restore Attachment
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId/restore
|
*/

export const restoreAttachmentRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};

/*
|--------------------------------------------------------------------------
| Permanently Delete Attachment
|--------------------------------------------------------------------------
|
| DELETE /api/journal/attachments/:attachmentId/permanent
|
*/

export const permanentlyDeleteAttachmentRequestSchema = {
  body:
    emptyObjectSchema,

  params: z.object({
    attachmentId:
      attachmentIdSchema
  }),

  query:
    emptyObjectSchema
};