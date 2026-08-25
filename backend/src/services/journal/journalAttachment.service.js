import pool from "../../config/database.js";

import cloudinary from "../../config/cloudinary.js";

import AppError from "../../utils/AppError.js";

import {
  createJournalAttachment,
  getActiveJournalAttachmentById,
  getDeletedJournalAttachmentById,
  getJournalEntryAttachments,
  getUserJournalAttachments,
  countUserJournalAttachments,
  updateJournalAttachment,
  updateJournalAttachmentProcessing,
  unsetJournalEntryCoverAttachments,
  setJournalAttachmentAsCover,
  clearJournalAttachmentCover,
  reorderJournalEntryAttachments,
  softDeleteJournalAttachment,
  restoreJournalAttachment,
  permanentlyDeleteJournalAttachment,
  countJournalEntryAttachments,
  getJournalEntryAttachmentStorage,
  getUserJournalAttachmentStorage,
  getNextJournalAttachmentOrder
} from "../../models/journal/journalAttachment.model.js";

import {
  getJournalEntryByIdAndUserId
} from "../../models/journal/journalEntry.model.js";

const MAX_ATTACHMENTS_PER_ENTRY = 10;

const DEFAULT_USER_STORAGE_LIMIT =
  100 * 1024 * 1024;

/*
  Normalize pagination values.
*/
function normalizePagination(
  filters = {}
) {
  const requestedLimit =
    Number(filters.limit) || 20;

  const limit = Math.min(
    Math.max(requestedLimit, 1),
    100
  );

  const requestedPage =
    Number(filters.page) || 1;

  const page = Math.max(
    requestedPage,
    1
  );

  const offset =
    (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
}

/*
  Return a consistent pagination object.
*/
function buildPagination({
  page,
  limit,
  total
}) {
  return {
    page,
    limit,
    total,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(
            total / limit
          )
  };
}

/*
  Convert PostgreSQL BIGINT strings into numbers
  where the value is safe for JavaScript.
*/
function normalizeStorageResult(
  storage
) {
  if (!storage) {
    return null;
  }

  return {
    ...storage,

    attachment_count:
      Number(
        storage.attachment_count ||
          0
      ),

    total_size_bytes:
      Number(
        storage.total_size_bytes ||
          0
      ),

    entries_with_attachments:
      storage.entries_with_attachments !==
        undefined
        ? Number(
            storage.entries_with_attachments ||
              0
          )
        : undefined,

    image_count:
      Number(
        storage.image_count || 0
      ),

    document_count:
      Number(
        storage.document_count ||
          0
      ),

    audio_count:
      Number(
        storage.audio_count || 0
      ),

    video_count:
      Number(
        storage.video_count || 0
      )
  };
}

/*
  Load an active journal entry and verify ownership.
*/
async function requireJournalEntry(
  userId,
  entryId,
  client = null
) {
  const entry =
    await getJournalEntryByIdAndUserId(
      entryId,
      userId,
      {
        includeDeleted: false
      },
      client
    );

  if (!entry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return entry;
}

/*
  Load an active attachment and verify ownership.
*/
async function requireActiveAttachment(
  userId,
  attachmentId,
  client = null
) {
  const attachment =
    await getActiveJournalAttachmentById(
      attachmentId,
      userId,
      client
    );

  if (!attachment) {
    throw new AppError(
      "Journal attachment not found",
      404
    );
  }

  return attachment;
}

/*
  Load a soft-deleted attachment.
*/
async function requireDeletedAttachment(
  userId,
  attachmentId,
  client = null
) {
  const attachment =
    await getDeletedJournalAttachmentById(
      attachmentId,
      userId,
      client
    );

  if (!attachment) {
    throw new AppError(
      "Deleted journal attachment not found",
      404
    );
  }

  return attachment;
}

/*
  Infer the Cloudinary resource type from the saved
  attachment type.

  Cloudinary treats PDFs and many documents as raw.
*/
function getCloudinaryResourceType(
  attachment
) {
  if (
    attachment.attachment_type ===
    "image"
  ) {
    return "image";
  }

  if (
    attachment.attachment_type ===
      "video" ||
    attachment.attachment_type ===
      "audio"
  ) {
    return "video";
  }

  return "raw";
}

/*
  Delete a Cloudinary resource.

  The error is thrown so the caller can decide
  whether deletion should fail or continue.
*/
async function destroyCloudinaryFile(
  attachment
) {
  if (!attachment.file_public_id) {
    return;
  }

  const result =
    await cloudinary.uploader.destroy(
      attachment.file_public_id,
      {
        resource_type:
          getCloudinaryResourceType(
            attachment
          ),

        invalidate: true
      }
    );

  if (
    result?.result !== "ok" &&
    result?.result !==
      "not found"
  ) {
    throw new AppError(
      "The attachment could not be removed from cloud storage",
      502
    );
  }
}

/*
  Convert uploaded file metadata into the model
  input structure.

  The controller or upload middleware can supply
  Cloudinary result fields using either camelCase
  names or common Cloudinary property names.
*/
function mapAttachmentData(
  userId,
  entryId,
  attachmentData = {}
) {
  return {
    entryId,
    userId,

    attachmentType:
      attachmentData
        .attachmentType,

    originalFileName:
      attachmentData
        .originalFileName ||
      attachmentData
        .originalname,

    storedFileName:
      attachmentData
        .storedFileName ||
      attachmentData.filename ||
      null,

    fileUrl:
      attachmentData.fileUrl ||
      attachmentData.secure_url ||
      attachmentData.path,

    filePublicId:
      attachmentData
        .filePublicId ||
      attachmentData.public_id ||
      attachmentData.filename ||
      null,

    fileFormat:
      attachmentData.fileFormat ||
      attachmentData.format ||
      null,

    mimeType:
      attachmentData.mimeType ||
      attachmentData.mimetype,

    fileSizeBytes:
      Number(
        attachmentData
          .fileSizeBytes ||
        attachmentData.bytes ||
        attachmentData.size
      ),

    fileExtension:
      attachmentData
        .fileExtension ||
      attachmentData.format ||
      null,

    width:
      attachmentData.width ||
      null,

    height:
      attachmentData.height ||
      null,

    durationSeconds:
      attachmentData
        .durationSeconds ||
      attachmentData.duration ||
      null,

    attachmentOrder:
      Number(
        attachmentData
          .attachmentOrder
      ) || 0,

    caption:
      attachmentData.caption ||
      null,

    altText:
      attachmentData.altText ||
      null,

    isCover:
      attachmentData.isCover ===
      true,

    isProcessed:
      attachmentData
        .isProcessed !== false,

    processingStatus:
      attachmentData
        .processingStatus ||
      "completed",

    processingError:
      attachmentData
        .processingError ||
      null
  };
}

/*
  Create one attachment.

  The entry ownership, attachment count and user
  storage limit are validated before insertion.
*/
export async function addAttachment(
  userId,
  entryId,
  attachmentData
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    await requireJournalEntry(
      userId,
      entryId,
      client
    );

    const nextAttachmentOrder =
  await getNextJournalAttachmentOrder(
    entryId,
    userId,
    client
  );

    const currentCount =
      await countJournalEntryAttachments(
        entryId,
        userId,
        {
          includeDeleted: false
        },
        client
      );

    if (
      currentCount >=
      MAX_ATTACHMENTS_PER_ENTRY
    ) {
      throw new AppError(
        `A journal entry cannot contain more than ${MAX_ATTACHMENTS_PER_ENTRY} attachments`,
        400
      );
    }

    const mappedData =
      mapAttachmentData(
        userId,
        entryId,
        attachmentData
      );

    if (
      !mappedData.fileUrl ||
      !mappedData.originalFileName ||
      !mappedData.mimeType ||
      !mappedData.fileSizeBytes
    ) {
      throw new AppError(
        "Complete uploaded file metadata is required",
        400
      );
    }

    const userStorage =
      normalizeStorageResult(
        await getUserJournalAttachmentStorage(
          userId,
          client
        )
      );

    const storageLimit =
      Number(
        process.env
          .JOURNAL_STORAGE_LIMIT_BYTES
      ) ||
      DEFAULT_USER_STORAGE_LIMIT;

    const projectedStorage =
      userStorage.total_size_bytes +
      mappedData.fileSizeBytes;

    if (
      projectedStorage >
      storageLimit
    ) {
      throw new AppError(
        "Journal attachment storage limit exceeded",
        400
      );
    }

    /*
      Remove an existing cover before inserting the
      new cover to satisfy the unique cover index.
    */
    if (mappedData.isCover) {
      await unsetJournalEntryCoverAttachments(
        entryId,
        userId,
        null,
        client
      );
    }

    /*
      Put attachments at the end unless the caller
      explicitly supplied another valid order.
    */
   mappedData.attachmentOrder =
  nextAttachmentOrder;

    const attachment =
      await createJournalAttachment(
        mappedData,
        client
      );

    await client.query("COMMIT");

    return attachment;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Create several attachments in one transaction.

  This is used when the upload middleware accepts
  multiple files.
*/
export async function addAttachments(
  userId,
  entryId,
  attachmentDataList = []
) {
  if (
    !Array.isArray(
      attachmentDataList
    ) ||
    attachmentDataList.length === 0
  ) {
    throw new AppError(
      "At least one attachment is required",
      400
    );
  }

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    await requireJournalEntry(
      userId,
      entryId,
      client
    );

    const nextAttachmentOrder =
      await getNextJournalAttachmentOrder(
        entryId,
        userId,
        client
      );

    const currentCount =
      await countJournalEntryAttachments(
        entryId,
        userId,
        {
          includeDeleted: false
        },
        client
      );

    if (
      currentCount +
        attachmentDataList.length >
      MAX_ATTACHMENTS_PER_ENTRY
    ) {
      throw new AppError(
        `A journal entry cannot contain more than ${MAX_ATTACHMENTS_PER_ENTRY} attachments`,
        400
      );
    }

   const mappedFiles =
  attachmentDataList.map(
    (
      attachmentData,
      index
    ) => ({
      ...mapAttachmentData(
        userId,
        entryId,
        attachmentData
      ),

      attachmentOrder:
        nextAttachmentOrder +
        index
    })
  );

    for (
      const attachment of
      mappedFiles
    ) {
      if (
        !attachment.fileUrl ||
        !attachment.originalFileName ||
        !attachment.mimeType ||
        !attachment.fileSizeBytes
      ) {
        throw new AppError(
          "Complete uploaded file metadata is required for every attachment",
          400
        );
      }
    }

    const uploadSize =
      mappedFiles.reduce(
        (
          total,
          attachment
        ) =>
          total +
          attachment.fileSizeBytes,
        0
      );

    const userStorage =
      normalizeStorageResult(
        await getUserJournalAttachmentStorage(
          userId,
          client
        )
      );

    const storageLimit =
      Number(
        process.env
          .JOURNAL_STORAGE_LIMIT_BYTES
      ) ||
      DEFAULT_USER_STORAGE_LIMIT;

    if (
      userStorage.total_size_bytes +
        uploadSize >
      storageLimit
    ) {
      throw new AppError(
        "Journal attachment storage limit exceeded",
        400
      );
    }

    const coverFiles =
      mappedFiles.filter(
        (attachment) =>
          attachment.isCover
      );

    if (coverFiles.length > 1) {
      throw new AppError(
        "Only one attachment can be selected as the cover",
        400
      );
    }

    if (coverFiles.length === 1) {
      await unsetJournalEntryCoverAttachments(
        entryId,
        userId,
        null,
        client
      );
    }

    const attachments = [];

    for (
      const attachmentData of
      mappedFiles
    ) {
      const attachment =
        await createJournalAttachment(
          attachmentData,
          client
        );

      attachments.push(
        attachment
      );
    }

    await client.query("COMMIT");

    return attachments;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Return one active attachment.
*/
export async function getAttachment(
  userId,
  attachmentId
) {
  return requireActiveAttachment(
    userId,
    attachmentId
  );
}

/*
  Return attachments belonging to one entry.
*/
export async function getEntryAttachments(
  userId,
  entryId,
  filters = {}
) {
  await requireJournalEntry(
    userId,
    entryId
  );

  return getJournalEntryAttachments(
    entryId,
    userId,
    {
      attachmentType:
        filters.attachmentType ||
        null,

      includeDeleted:
        filters.includeDeleted ===
        true
    }
  );
}

/*
  Return paginated attachments belonging to a user.
*/
export async function getAttachments(
  userId,
  filters = {}
) {
  const {
    page,
    limit,
    offset
  } = normalizePagination(filters);

  const modelFilters = {
    entryId:
      filters.entryId ||
      null,

    attachmentType:
      filters.attachmentType ||
      null,

    processingStatus:
      filters.processingStatus ||
      null,

    isDeleted:
      filters.isDeleted !==
        undefined
        ? filters.isDeleted
        : false,

    limit,
    offset
  };

  const [
    attachments,
    total
  ] = await Promise.all([
    getUserJournalAttachments(
      userId,
      modelFilters
    ),

    countUserJournalAttachments(
      userId,
      modelFilters
    )
  ]);

  return {
    attachments,
    pagination:
      buildPagination({
        page,
        limit,
        total
      })
  };
}

/*
  Update editable attachment metadata.
*/
export async function editAttachment(
  userId,
  attachmentId,
  attachmentData
) {
  await requireActiveAttachment(
    userId,
    attachmentId
  );

  const attachment =
    await updateJournalAttachment(
      attachmentId,
      userId,
      {
        caption:
          attachmentData.caption,

        altText:
          attachmentData.altText
      }
    );

  if (!attachment) {
    throw new AppError(
      "Journal attachment could not be updated",
      400
    );
  }

  return attachment;
}

/*
  Set one attachment as the entry cover.
*/
export async function setAttachmentCover(
  userId,
  attachmentId
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const attachment =
      await requireActiveAttachment(
        userId,
        attachmentId,
        client
      );

    await unsetJournalEntryCoverAttachments(
      attachment.entry_id,
      userId,
      attachmentId,
      client
    );

    const coverAttachment =
      await setJournalAttachmentAsCover(
        attachmentId,
        userId,
        client
      );

    if (!coverAttachment) {
      throw new AppError(
        "Journal attachment could not be set as the cover",
        400
      );
    }

    await client.query("COMMIT");

    return coverAttachment;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Remove cover status from an attachment.
*/
export async function removeAttachmentCover(
  userId,
  attachmentId
) {
  await requireActiveAttachment(
    userId,
    attachmentId
  );

  const attachment =
    await clearJournalAttachmentCover(
      attachmentId,
      userId
    );

  if (!attachment) {
    throw new AppError(
      "Journal attachment cover could not be removed",
      400
    );
  }

  return attachment;
}

/*
  Reorder all active attachments for one entry.

  The unique index on entry_id and attachment_order
  means the final orders must be unique.
*/
export async function reorderAttachments(
  userId,
  entryId,
  orderedAttachments
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    await requireJournalEntry(
      userId,
      entryId,
      client
    );

    const existingAttachments =
      await getJournalEntryAttachments(
        entryId,
        userId,
        {
          includeDeleted: false
        },
        client
      );

    if (
      orderedAttachments.length !==
      existingAttachments.length
    ) {
      throw new AppError(
        "The reorder request must include every active attachment",
        400
      );
    }

    const existingIds =
      new Set(
        existingAttachments.map(
          (attachment) =>
            attachment.attachment_id
        )
      );

    const suppliedIds =
      orderedAttachments.map(
        (attachment) =>
          attachment.attachmentId
      );

    if (
      new Set(suppliedIds).size !==
      suppliedIds.length
    ) {
      throw new AppError(
        "Attachment IDs cannot be repeated",
        400
      );
    }

    for (
      const attachmentId of
      suppliedIds
    ) {
      if (
        !existingIds.has(
          attachmentId
        )
      ) {
        throw new AppError(
          "One or more attachments do not belong to this journal entry",
          400
        );
      }
    }

    const normalizedOrder =
      suppliedIds.map(
        (
          attachmentId,
          index
        ) => ({
          attachmentId,
          attachmentOrder:
            index
        })
      );

    /*
      Temporarily move existing values outside the
      normal range so the unique index does not fail
      while values are swapped.
    */
    await client.query(
      `
        UPDATE journal_attachments
        SET attachment_order =
          attachment_order + 10000
        WHERE entry_id = $1
          AND user_id = $2
          AND is_deleted = FALSE
      `,
      [
        entryId,
        userId
      ]
    );

    const attachments =
      await reorderJournalEntryAttachments(
        entryId,
        userId,
        normalizedOrder,
        client
      );

    await client.query("COMMIT");

    return attachments.sort(
      (first, second) =>
        first.attachment_order -
        second.attachment_order
    );
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Mark attachment processing as pending,
  processing, completed or failed.
*/
export async function updateAttachmentProcessing(
  userId,
  attachmentId,
  processingData
) {
  await requireActiveAttachment(
    userId,
    attachmentId
  );

  const status =
    processingData.processingStatus;

  const isProcessed =
    status === "completed";

  const attachment =
    await updateJournalAttachmentProcessing(
      attachmentId,
      userId,
      {
        processingStatus:
          status,

        isProcessed,

        processingError:
          status === "failed"
            ? processingData
                .processingError ||
              "Attachment processing failed"
            : null
      }
    );

  if (!attachment) {
    throw new AppError(
      "Journal attachment processing status could not be updated",
      400
    );
  }

  return attachment;
}

/*
  Soft-delete an attachment.

  The Cloudinary resource remains available during
  the restore period.
*/
export async function deleteAttachment(
  userId,
  attachmentId
) {
  const existingAttachment =
    await requireActiveAttachment(
      userId,
      attachmentId
    );

  const attachment =
    await softDeleteJournalAttachment(
      attachmentId,
      userId
    );

  if (!attachment) {
    throw new AppError(
      "Journal attachment could not be deleted",
      400
    );
  }

  return {
    ...attachment,

    was_cover:
      existingAttachment.is_cover
  };
}

/*
  Restore a soft-deleted attachment.

  Restored files do not automatically become the
  cover.
*/
export async function restoreAttachment(
  userId,
  attachmentId
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const deletedAttachment =
      await requireDeletedAttachment(
        userId,
        attachmentId,
        client
      );

    await requireJournalEntry(
      userId,
      deletedAttachment.entry_id,
      client
    );

    const activeCount =
      await countJournalEntryAttachments(
        deletedAttachment.entry_id,
        userId,
        {
          includeDeleted: false
        },
        client
      );

    if (
      activeCount >=
      MAX_ATTACHMENTS_PER_ENTRY
    ) {
      throw new AppError(
        `A journal entry cannot contain more than ${MAX_ATTACHMENTS_PER_ENTRY} active attachments`,
        400
      );
    }

    /*
      The restored record may conflict with an order
      now used by another attachment. Place it last.
    */
    await updateJournalAttachment(
      attachmentId,
      userId,
      {
        attachmentOrder:
          activeCount
      },
      client
    );

    const attachment =
      await restoreJournalAttachment(
        attachmentId,
        userId,
        client
      );

    if (!attachment) {
      throw new AppError(
        "Journal attachment could not be restored",
        400
      );
    }

    await client.query("COMMIT");

    return attachment;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Permanently delete an attachment.

  Database deletion happens first. Cloudinary
  deletion follows. A failed Cloudinary deletion is
  reported but the database record is already gone,
  so scheduled orphan cleanup should also be added
  later.
*/
export async function permanentlyRemoveAttachment(
  userId,
  attachmentId
) {
  const client =
    await pool.connect();

  let deletedAttachment;

  try {
    await client.query("BEGIN");

    await requireDeletedAttachment(
      userId,
      attachmentId,
      client
    );

    deletedAttachment =
      await permanentlyDeleteJournalAttachment(
        attachmentId,
        userId,
        client
      );

    if (!deletedAttachment) {
      throw new AppError(
        "Deleted journal attachment not found",
        404
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }

  try {
    await destroyCloudinaryFile(
      deletedAttachment
    );
  } catch (error) {
    console.error(
      "Journal Cloudinary cleanup failed:",
      error.message
    );
  }

  return deletedAttachment;
}

/*
  Return storage usage for one entry.
*/
export async function getEntryAttachmentStorage(
  userId,
  entryId
) {
  await requireJournalEntry(
    userId,
    entryId
  );

  const storage =
    await getJournalEntryAttachmentStorage(
      entryId,
      userId
    );

  return normalizeStorageResult(
    storage
  );
}

/*
  Return total journal attachment storage for a user.
*/
export async function getAttachmentStorage(
  userId
) {
  const storage =
    normalizeStorageResult(
      await getUserJournalAttachmentStorage(
        userId
      )
    );

  const storageLimit =
    Number(
      process.env
        .JOURNAL_STORAGE_LIMIT_BYTES
    ) ||
    DEFAULT_USER_STORAGE_LIMIT;

  return {
    ...storage,

    storage_limit_bytes:
      storageLimit,

    remaining_bytes:
      Math.max(
        storageLimit -
          storage.total_size_bytes,
        0
      ),

    usage_percentage:
      Number(
        (
          (
            storage.total_size_bytes /
            storageLimit
          ) *
          100
        ).toFixed(2)
      )
  };
}
