import pool from "../../config/database.js";

function getDatabase(client) {
  return client || pool;
}

export async function getNextJournalAttachmentOrder(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  /*
    Serializes simultaneous uploads for the same entry.
  */
  await db.query(
    `
      SELECT entry_id
      FROM journal_entries
      WHERE entry_id = $1
        AND user_id = $2
      FOR UPDATE
    `,
    [entryId, userId]
  );

  /*
    Include deleted attachments because the current
    unique constraint includes them too.
  */
  const result = await db.query(
    `
      SELECT
        COALESCE(
          MAX(attachment_order),
          -1
        ) + 1 AS next_order
      FROM journal_attachments
      WHERE entry_id = $1
        AND user_id = $2
    `,
    [entryId, userId]
  );

  return Number(
    result.rows[0]?.next_order ?? 0
  );
}

export async function createJournalAttachment(
  {
    entryId,
    userId,
    attachmentType,
    originalFileName,
    storedFileName = null,
    fileUrl,
    filePublicId = null,
    fileFormat = null,
    mimeType,
    fileSizeBytes,
    fileExtension = null,
    width = null,
    height = null,
    durationSeconds = null,
    attachmentOrder = 0,
    caption = null,
    altText = null,
    isCover = false,
    isProcessed = true,
    processingStatus = "completed",
    processingError = null
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    INSERT INTO journal_attachments (
      entry_id,
      user_id,
      attachment_type,
      original_file_name,
      stored_file_name,
      file_url,
      file_public_id,
      file_format,
      mime_type,
      file_size_bytes,
      file_extension,
      width,
      height,
      duration_seconds,
      attachment_order,
      caption,
      alt_text,
      is_cover,
      is_processed,
      processing_status,
      processing_error
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20,
      $21
    )
    RETURNING *
  `;

  const values = [
    entryId,
    userId,
    attachmentType,
    originalFileName,
    storedFileName,
    fileUrl,
    filePublicId,
    fileFormat,
    mimeType,
    fileSizeBytes,
    fileExtension,
    width,
    height,
    durationSeconds,
    attachmentOrder,
    caption,
    altText,
    isCover,
    isProcessed,
    processingStatus,
    processingError
  ];

  const result = await db.query(
    query,
    values
  );

  return result.rows[0];
}

export async function getJournalAttachmentById(
  attachmentId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE attachment_id = $1
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [attachmentId]
  );

  return result.rows[0] || null;
}

export async function getOwnedJournalAttachmentById(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE attachment_id = $1
      AND user_id = $2
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function getActiveJournalAttachmentById(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function getDeletedJournalAttachmentById(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = TRUE
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function getJournalEntryCoverAttachment(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE entry_id = $1
      AND user_id = $2
      AND is_cover = TRUE
      AND is_deleted = FALSE
    ORDER BY updated_at DESC
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [entryId, userId]
  );

  return result.rows[0] || null;
}

export async function getJournalEntryAttachments(
  entryId,
  userId,
  {
    attachmentType = null,
    includeDeleted = false
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "entry_id = $1",
    "user_id = $2"
  ];

  const values = [
    entryId,
    userId
  ];

  if (!includeDeleted) {
    conditions.push(
      "is_deleted = FALSE"
    );
  }

  if (attachmentType) {
    values.push(attachmentType);

    conditions.push(
      `attachment_type = $${values.length}`
    );
  }

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      is_cover DESC,
      attachment_order ASC,
      created_at ASC
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows;
}

export async function getUserJournalAttachments(
  userId,
  {
    entryId = null,
    attachmentType = null,
    processingStatus = null,
    isDeleted = false,
    limit = 50,
    offset = 0
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "user_id = $1"
  ];

  const values = [userId];

  if (entryId) {
    values.push(entryId);

    conditions.push(
      `entry_id = $${values.length}`
    );
  }

  if (attachmentType) {
    values.push(attachmentType);

    conditions.push(
      `attachment_type = $${values.length}`
    );
  }

  if (processingStatus) {
    values.push(processingStatus);

    conditions.push(
      `processing_status = $${values.length}`
    );
  }

  if (
    typeof isDeleted === "boolean"
  ) {
    values.push(isDeleted);

    conditions.push(
      `is_deleted = $${values.length}`
    );
  }

  values.push(limit);

  const limitParameter =
    `$${values.length}`;

  values.push(offset);

  const offsetParameter =
    `$${values.length}`;

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT ${limitParameter}
    OFFSET ${offsetParameter}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows;
}

export async function countUserJournalAttachments(
  userId,
  {
    entryId = null,
    attachmentType = null,
    processingStatus = null,
    isDeleted = false
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "user_id = $1"
  ];

  const values = [userId];

  if (entryId) {
    values.push(entryId);

    conditions.push(
      `entry_id = $${values.length}`
    );
  }

  if (attachmentType) {
    values.push(attachmentType);

    conditions.push(
      `attachment_type = $${values.length}`
    );
  }

  if (processingStatus) {
    values.push(processingStatus);

    conditions.push(
      `processing_status = $${values.length}`
    );
  }

  if (
    typeof isDeleted === "boolean"
  ) {
    values.push(isDeleted);

    conditions.push(
      `is_deleted = $${values.length}`
    );
  }

  const query = `
    SELECT COUNT(*)::INTEGER AS total
    FROM journal_attachments
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0]?.total || 0;
}

export async function updateJournalAttachment(
  attachmentId,
  userId,
  {
    storedFileName,
    fileUrl,
    filePublicId,
    fileFormat,
    mimeType,
    fileSizeBytes,
    fileExtension,
    width,
    height,
    durationSeconds,
    attachmentOrder,
    caption,
    altText,
    isCover,
    isProcessed,
    processingStatus,
    processingError
  },
  client = null
) {
  const db = getDatabase(client);

  const updates = [];
  const values = [];

  if (storedFileName !== undefined) {
    values.push(storedFileName);

    updates.push(
      `stored_file_name = $${values.length}`
    );
  }

  if (fileUrl !== undefined) {
    values.push(fileUrl);

    updates.push(
      `file_url = $${values.length}`
    );
  }

  if (filePublicId !== undefined) {
    values.push(filePublicId);

    updates.push(
      `file_public_id = $${values.length}`
    );
  }

  if (fileFormat !== undefined) {
    values.push(fileFormat);

    updates.push(
      `file_format = $${values.length}`
    );
  }

  if (mimeType !== undefined) {
    values.push(mimeType);

    updates.push(
      `mime_type = $${values.length}`
    );
  }

  if (fileSizeBytes !== undefined) {
    values.push(fileSizeBytes);

    updates.push(
      `file_size_bytes = $${values.length}`
    );
  }

  if (fileExtension !== undefined) {
    values.push(fileExtension);

    updates.push(
      `file_extension = $${values.length}`
    );
  }

  if (width !== undefined) {
    values.push(width);

    updates.push(
      `width = $${values.length}`
    );
  }

  if (height !== undefined) {
    values.push(height);

    updates.push(
      `height = $${values.length}`
    );
  }

  if (durationSeconds !== undefined) {
    values.push(durationSeconds);

    updates.push(
      `duration_seconds = $${values.length}`
    );
  }

  if (attachmentOrder !== undefined) {
    values.push(attachmentOrder);

    updates.push(
      `attachment_order = $${values.length}`
    );
  }

  if (caption !== undefined) {
    values.push(caption);

    updates.push(
      `caption = $${values.length}`
    );
  }

  if (altText !== undefined) {
    values.push(altText);

    updates.push(
      `alt_text = $${values.length}`
    );
  }

  if (isCover !== undefined) {
    values.push(isCover);

    updates.push(
      `is_cover = $${values.length}`
    );
  }

  if (isProcessed !== undefined) {
    values.push(isProcessed);

    updates.push(
      `is_processed = $${values.length}`
    );
  }

  if (processingStatus !== undefined) {
    values.push(processingStatus);

    updates.push(
      `processing_status = $${values.length}`
    );
  }

  if (processingError !== undefined) {
    values.push(processingError);

    updates.push(
      `processing_error = $${values.length}`
    );
  }

  if (updates.length === 0) {
    return getActiveJournalAttachmentById(
      attachmentId,
      userId,
      client
    );
  }

  values.push(attachmentId);

  const attachmentIdParameter =
    `$${values.length}`;

  values.push(userId);

  const userIdParameter =
    `$${values.length}`;

  const query = `
    UPDATE journal_attachments
    SET
      ${updates.join(", ")},
      updated_at = NOW()
    WHERE attachment_id = ${attachmentIdParameter}
      AND user_id = ${userIdParameter}
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0] || null;
}

export async function updateJournalAttachmentProcessing(
  attachmentId,
  userId,
  {
    processingStatus,
    isProcessed,
    processingError = null
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_attachments
    SET
      processing_status = $3,
      is_processed = $4,
      processing_error = $5,
      updated_at = NOW()
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId,
      processingStatus,
      isProcessed,
      processingError
    ]
  );

  return result.rows[0] || null;
}

export async function unsetJournalEntryCoverAttachments(
  entryId,
  userId,
  excludedAttachmentId = null,
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "entry_id = $1",
    "user_id = $2",
    "is_cover = TRUE",
    "is_deleted = FALSE"
  ];

  const values = [
    entryId,
    userId
  ];

  if (excludedAttachmentId) {
    values.push(excludedAttachmentId);

    conditions.push(
      `attachment_id <> $${values.length}`
    );
  }

  const query = `
    UPDATE journal_attachments
    SET
      is_cover = FALSE,
      updated_at = NOW()
    WHERE ${conditions.join(" AND ")}
    RETURNING attachment_id
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rowCount;
}

export async function setJournalAttachmentAsCover(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_attachments
    SET
      is_cover = TRUE,
      updated_at = NOW()
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function clearJournalAttachmentCover(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_attachments
    SET
      is_cover = FALSE,
      updated_at = NOW()
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function reorderJournalAttachment(
  attachmentId,
  userId,
  attachmentOrder,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_attachments
    SET
      attachment_order = $3,
      updated_at = NOW()
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId,
      attachmentOrder
    ]
  );

  return result.rows[0] || null;
}

export async function reorderJournalEntryAttachments(
  entryId,
  userId,
  orderedAttachments,
  client = null
) {
  const db = getDatabase(client);

  if (
    !Array.isArray(orderedAttachments) ||
    orderedAttachments.length === 0
  ) {
    return [];
  }

  const attachmentIds =
    orderedAttachments.map(
      (attachment) =>
        attachment.attachmentId
    );

  const attachmentOrders =
    orderedAttachments.map(
      (attachment) =>
        attachment.attachmentOrder
    );

  const query = `
    UPDATE journal_attachments AS ja
    SET
      attachment_order =
        updates.attachment_order,
      updated_at = NOW()
    FROM (
      SELECT
        UNNEST($3::UUID[])
          AS attachment_id,
        UNNEST($4::INTEGER[])
          AS attachment_order
    ) AS updates
    WHERE ja.attachment_id =
        updates.attachment_id
      AND ja.entry_id = $1
      AND ja.user_id = $2
      AND ja.is_deleted = FALSE
    RETURNING ja.*
  `;

  const result = await db.query(
    query,
    [
      entryId,
      userId,
      attachmentIds,
      attachmentOrders
    ]
  );

  return result.rows;
}

export async function softDeleteJournalAttachment(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_attachments
    SET
      is_deleted = TRUE,
      deleted_at = NOW(),
      is_cover = FALSE,
      updated_at = NOW()
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function restoreJournalAttachment(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_attachments
    SET
      is_deleted = FALSE,
      deleted_at = NULL,
      is_cover = FALSE,
      updated_at = NOW()
    WHERE attachment_id = $1
      AND user_id = $2
      AND is_deleted = TRUE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function permanentlyDeleteJournalAttachment(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_attachments
    WHERE attachment_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function softDeleteJournalEntryAttachments(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_attachments
    SET
      is_deleted = TRUE,
      deleted_at = NOW(),
      is_cover = FALSE,
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING attachment_id
  `;

  const result = await db.query(
    query,
    [
      entryId,
      userId
    ]
  );

  return result.rowCount;
}

export async function permanentlyDeleteJournalEntryAttachments(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_attachments
    WHERE entry_id = $1
      AND user_id = $2
    RETURNING attachment_id
  `;

  const result = await db.query(
    query,
    [
      entryId,
      userId
    ]
  );

  return result.rowCount;
}

export async function journalAttachmentExists(
  attachmentId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM journal_attachments
      WHERE attachment_id = $1
    ) AS exists
  `;

  const result = await db.query(
    query,
    [attachmentId]
  );

  return result.rows[0]?.exists === true;
}

export async function ownedJournalAttachmentExists(
  attachmentId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM journal_attachments
      WHERE attachment_id = $1
        AND user_id = $2
        AND is_deleted = FALSE
    ) AS exists
  `;

  const result = await db.query(
    query,
    [
      attachmentId,
      userId
    ]
  );

  return result.rows[0]?.exists === true;
}

export async function countJournalEntryAttachments(
  entryId,
  userId,
  {
    attachmentType = null,
    includeDeleted = false
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "entry_id = $1",
    "user_id = $2"
  ];

  const values = [
    entryId,
    userId
  ];

  if (!includeDeleted) {
    conditions.push(
      "is_deleted = FALSE"
    );
  }

  if (attachmentType) {
    values.push(attachmentType);

    conditions.push(
      `attachment_type = $${values.length}`
    );
  }

  const query = `
    SELECT COUNT(*)::INTEGER AS total
    FROM journal_attachments
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0]?.total || 0;
}

export async function getJournalEntryAttachmentStorage(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      COUNT(*)::INTEGER
        AS attachment_count,

      COALESCE(
        SUM(file_size_bytes),
        0
      )::BIGINT
        AS total_size_bytes,

      COUNT(*) FILTER (
        WHERE attachment_type = 'image'
      )::INTEGER
        AS image_count,

      COUNT(*) FILTER (
        WHERE attachment_type = 'document'
      )::INTEGER
        AS document_count,

      COUNT(*) FILTER (
        WHERE attachment_type = 'audio'
      )::INTEGER
        AS audio_count,

      COUNT(*) FILTER (
        WHERE attachment_type = 'video'
      )::INTEGER
        AS video_count

    FROM journal_attachments
    WHERE entry_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
  `;

  const result = await db.query(
    query,
    [
      entryId,
      userId
    ]
  );

  return result.rows[0];
}

export async function getUserJournalAttachmentStorage(
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      COUNT(*)::INTEGER
        AS attachment_count,

      COALESCE(
        SUM(file_size_bytes),
        0
      )::BIGINT
        AS total_size_bytes,

      COUNT(DISTINCT entry_id)::INTEGER
        AS entries_with_attachments,

      COUNT(*) FILTER (
        WHERE attachment_type = 'image'
      )::INTEGER
        AS image_count,

      COUNT(*) FILTER (
        WHERE attachment_type = 'document'
      )::INTEGER
        AS document_count,

      COUNT(*) FILTER (
        WHERE attachment_type = 'audio'
      )::INTEGER
        AS audio_count,

      COUNT(*) FILTER (
        WHERE attachment_type = 'video'
      )::INTEGER
        AS video_count

    FROM journal_attachments
    WHERE user_id = $1
      AND is_deleted = FALSE
  `;

  const result = await db.query(
    query,
    [userId]
  );

  return result.rows[0];
}

export async function getDeletedJournalAttachmentsForCleanup(
  {
    olderThanDays = 30,
    limit = 100
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE is_deleted = TRUE
      AND deleted_at < (
        NOW() - (
          $1::INTEGER *
          INTERVAL '1 day'
        )
      )
    ORDER BY deleted_at ASC
    LIMIT $2
  `;

  const result = await db.query(
    query,
    [
      olderThanDays,
      limit
    ]
  );

  return result.rows;
}

export async function getFailedJournalAttachments(
  {
    limit = 100
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_attachments
    WHERE processing_status = 'failed'
      AND is_deleted = FALSE
    ORDER BY updated_at ASC
    LIMIT $1
  `;

  const result = await db.query(
    query,
    [limit]
  );

  return result.rows;
}