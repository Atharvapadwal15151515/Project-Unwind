import asyncHandler from "../../utils/asyncHandler.js";

import {
  addAttachment,
  addAttachments,
  getAttachment,
  getEntryAttachments,
  getAttachments,
  editAttachment,
  setAttachmentCover,
  removeAttachmentCover,
  reorderAttachments,
  updateAttachmentProcessing,
  deleteAttachment,
  restoreAttachment,
  permanentlyRemoveAttachment,
  getEntryAttachmentStorage,
  getAttachmentStorage
} from "../../services/journal/journalAttachment.service.js";

import {
  validateJournalFile,
  validateJournalFiles,
  normalizeCloudinaryUpload,
  formatJournalAttachment,
  formatJournalAttachments,
  formatFileSize
} from "../../utils/journal/journalAttachment.utils.js";

import {
  uploadBufferToCloudinary
} from "../../utils/cloudinaryUpload.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getAuthenticatedUserId(req) {
  return (
    req.user?.user_id ||
    req.user?.userId ||
    req.user?.id ||
    null
  );
}

function parseBoolean(value) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function parseOptionalBoolean(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  return parseBoolean(value);
}

function parseArrayField(
  value,
  fallback = []
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  try {
    const parsed =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

function normalizePagination(
  result
) {
  if (result?.pagination) {
    return result.pagination;
  }

  return {
    page:
      Number(result?.page) || 1,

    limit:
      Number(result?.limit) || 20,

    total:
      Number(result?.total) || 0,

    totalPages:
      Number(
        result?.totalPages
      ) || 0,

    hasNextPage:
      Boolean(
        result?.hasNextPage
      ),

    hasPreviousPage:
      Boolean(
        result?.hasPreviousPage
      )
  };
}

function getStorageValue(
  storage,
  camelCaseKey,
  snakeCaseKey,
  fallback = 0
) {
  return Number(
    storage?.[camelCaseKey] ??
      storage?.[snakeCaseKey] ??
      fallback
  );
}

/*
|--------------------------------------------------------------------------
| Cloudinary Upload Helper
|--------------------------------------------------------------------------
*/

async function uploadJournalFile({
  file,
  userId,
  entryId,
  attachmentOrder,
  caption,
  altText,
  isCover
}) {
  const validation =
    validateJournalFile(file);

  if (!validation.isValid) {
    const error =
      new Error(
        validation.message
      );

    error.statusCode = 400;

    throw error;
  }

  let resourceType;

  if (
    validation.attachmentType ===
    "image"
  ) {
    resourceType = "image";
  } else if (
    validation.attachmentType ===
    "document"
  ) {
    resourceType = "raw";
  } else {
    resourceType = "video";
  }

  const uploadResult =
    await uploadBufferToCloudinary({
      buffer:
        file.buffer,

      folder:
        `unwind/journal/${userId}/${entryId}`,

      resourceType,

      originalFileName:
        file.originalname
    });

  return normalizeCloudinaryUpload({
    file,
    uploadResult,
    userId,
    entryId,
    attachmentOrder,
    caption,
    altText,
    isCover
  });
}

/*
|--------------------------------------------------------------------------
| Upload One Attachment
|--------------------------------------------------------------------------
|
| POST /api/journal/attachments/entries/:entryId
|
*/

export const addAttachmentController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const entryId =
        req.params.entryId;

      if (!req.file) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Journal attachment file is required."
          });
      }

      const attachmentData =
        await uploadJournalFile({
          file:
            req.file,

          userId,

          entryId,

          attachmentOrder:
            req.body
              .attachmentOrder,

          caption:
            req.body.caption,

          altText:
            req.body.altText,

          isCover:
            parseBoolean(
              req.body.isCover
            )
        });

      const attachment =
        await addAttachment(
          userId,
          entryId,
          attachmentData
        );

      res.status(201).json({
        success: true,
        message:
          "Journal attachment uploaded successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Upload Multiple Attachments
|--------------------------------------------------------------------------
|
| POST /api/journal/attachments/entries/:entryId/multiple
|
*/

export const addAttachmentsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const entryId =
        req.params.entryId;

      if (
        !Array.isArray(
          req.files
        ) ||
        req.files.length === 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "At least one journal attachment file is required."
          });
      }

      const validation =
        validateJournalFiles(
          req.files
        );

      if (!validation.isValid) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              validation.message
          });
      }

      const captions =
        parseArrayField(
          req.body.captions
        );

      const altTexts =
        parseArrayField(
          req.body.altTexts
        );

      const coverIndex =
        req.body.coverIndex !==
          undefined &&
        req.body.coverIndex !==
          ""
          ? Number(
              req.body.coverIndex
            )
          : -1;

      const attachmentDataList =
        [];

      for (
        let index = 0;
        index <
        req.files.length;
        index += 1
      ) {
        const file =
          req.files[index];

        const normalizedFile =
          await uploadJournalFile({
            file,

            userId,

            entryId,

            attachmentOrder:
              index,

            caption:
              captions[index] ??
              null,

            altText:
              altTexts[index] ??
              null,

            isCover:
              index ===
              coverIndex
          });

        attachmentDataList.push(
          normalizedFile
        );
      }

      const attachments =
        await addAttachments(
          userId,
          entryId,
          attachmentDataList
        );

      res.status(201).json({
        success: true,
        message:
          "Journal attachments uploaded successfully.",
        data: {
          attachments:
            formatJournalAttachments(
              attachments
            ),

          count:
            attachments.length
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get One Attachment
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/:attachmentId
|
*/

export const getAttachmentController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      const attachment =
        await getAttachment(
          userId,
          attachmentId
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment retrieved successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Entry Attachments
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/entries/:entryId
|
*/

export const getEntryAttachmentsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const entryId =
        req.params.entryId;

      const attachments =
        await getEntryAttachments(
          userId,
          entryId,
          {
            attachmentType:
              req.query
                .attachmentType,

            includeDeleted:
              parseBoolean(
                req.query
                  .includeDeleted
              )
          }
        );

      res.status(200).json({
        success: true,
        message:
          "Journal entry attachments retrieved successfully.",
        data: {
          attachments:
            formatJournalAttachments(
              attachments
            ),

          count:
            attachments.length
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get All User Attachments
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments
|
*/

export const getAttachmentsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const result =
        await getAttachments(
          userId,
          {
            page:
              req.query.page,

            limit:
              req.query.limit,

            entryId:
              req.query.entryId,

            attachmentType:
              req.query
                .attachmentType,

            processingStatus:
              req.query
                .processingStatus,

            isDeleted:
              parseOptionalBoolean(
                req.query
                  .isDeleted
              )
          }
        );

      const attachments =
        result.attachments ||
        result.rows ||
        [];

      res.status(200).json({
        success: true,
        message:
          "Journal attachments retrieved successfully.",
        data: {
          attachments:
            formatJournalAttachments(
              attachments
            ),

          pagination:
            normalizePagination(
              result
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Update Attachment Metadata
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId
|
*/

export const editAttachmentController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      const attachment =
        await editAttachment(
          userId,
          attachmentId,
          {
            caption:
              req.body.caption,

            altText:
              req.body.altText
          }
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment updated successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Set Attachment As Cover
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId/cover
|
*/

export const setAttachmentCoverController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      const attachment =
        await setAttachmentCover(
          userId,
          attachmentId
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment set as cover successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Remove Attachment Cover
|--------------------------------------------------------------------------
|
| DELETE /api/journal/attachments/:attachmentId/cover
|
*/

export const removeAttachmentCoverController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      const attachment =
        await removeAttachmentCover(
          userId,
          attachmentId
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment cover removed successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Reorder Entry Attachments
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/entries/:entryId/reorder
|
*/

export const reorderAttachmentsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const entryId =
        req.params.entryId;

      const attachments =
        await reorderAttachments(
          userId,
          entryId,
          req.body.attachments
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachments reordered successfully.",
        data: {
          attachments:
            formatJournalAttachments(
              attachments
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Update Processing Status
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId/processing
|
*/

export const updateAttachmentProcessingController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      const attachment =
        await updateAttachmentProcessing(
          userId,
          attachmentId,
          {
            processingStatus:
              req.body
                .processingStatus,

            processingError:
              req.body
                .processingError
          }
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment processing status updated successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Soft Delete Attachment
|--------------------------------------------------------------------------
|
| DELETE /api/journal/attachments/:attachmentId
|
*/

export const deleteAttachmentController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      const attachment =
        await deleteAttachment(
          userId,
          attachmentId
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment deleted successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Restore Attachment
|--------------------------------------------------------------------------
|
| PATCH /api/journal/attachments/:attachmentId/restore
|
*/

export const restoreAttachmentController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      const attachment =
        await restoreAttachment(
          userId,
          attachmentId
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment restored successfully.",
        data: {
          attachment:
            formatJournalAttachment(
              attachment
            )
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Permanently Delete Attachment
|--------------------------------------------------------------------------
|
| DELETE /api/journal/attachments/:attachmentId/permanent
|
*/

export const permanentlyRemoveAttachmentController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const attachmentId =
        req.params
          .attachmentId;

      await permanentlyRemoveAttachment(
        userId,
        attachmentId
      );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment permanently deleted successfully."
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Entry Attachment Storage
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/entries/:entryId/storage
|
*/

export const getEntryAttachmentStorageController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const entryId =
        req.params.entryId;

      const storage =
        await getEntryAttachmentStorage(
          userId,
          entryId
        );

      const usedBytes =
        getStorageValue(
          storage,
          "usedBytes",
          "total_size_bytes",
          0
        );

      res.status(200).json({
        success: true,
        message:
          "Journal entry attachment storage retrieved successfully.",
        data: {
          storage: {
            ...storage,

            usedBytes,

            formattedUsedStorage:
              formatFileSize(
                usedBytes
              )
          }
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Total User Attachment Storage
|--------------------------------------------------------------------------
|
| GET /api/journal/attachments/storage
|
*/

export const getAttachmentStorageController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const storage =
        await getAttachmentStorage(
          userId
        );

      const usedBytes =
        getStorageValue(
          storage,
          "usedBytes",
          "total_size_bytes",
          0
        );

      const limitBytes =
        getStorageValue(
          storage,
          "limitBytes",
          "storage_limit_bytes",
          0
        );

      const remainingBytes =
        getStorageValue(
          storage,
          "remainingBytes",
          "remaining_bytes",
          Math.max(
            limitBytes -
              usedBytes,
            0
          )
        );

      const usagePercentage =
        Number(
          storage
            ?.usagePercentage ??
            storage
              ?.usage_percentage ??
            0
        );

      res.status(200).json({
        success: true,
        message:
          "Journal attachment storage retrieved successfully.",
        data: {
          storage: {
            ...storage,

            usedBytes,

            limitBytes,

            remainingBytes,

            usagePercentage,

            formattedUsedStorage:
              formatFileSize(
                usedBytes
              ),

            formattedStorageLimit:
              formatFileSize(
                limitBytes
              ),

            formattedRemainingStorage:
              formatFileSize(
                remainingBytes
              )
          }
        }
      });
    }
  );