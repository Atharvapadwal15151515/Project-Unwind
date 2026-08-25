import pool from "../../config/database.js";

/*
  Allow services to pass a PostgreSQL transaction client.
  When no client is supplied, the normal connection pool is used.
*/
function getDatabase(client) {
  return client || pool;
}

const EDITABLE_COLUMNS = new Set([
  "title",
  "content",
  "entry_type",
  "entry_status",
  "mood_label",
  "mood_score",
  "prompt_id",
  "prompt_text_snapshot",
  "entry_date",
  "is_favourite",
  "is_locked",
  "hide_preview",
  "last_auto_saved_at"
]);

const SORT_OPTIONS = {
  newest: "je.entry_date DESC, je.created_at DESC",
  oldest: "je.entry_date ASC, je.created_at ASC",
  updated_desc: "je.updated_at DESC",
  updated_asc: "je.updated_at ASC",
  title_asc:
    "LOWER(COALESCE(je.title, '')) ASC, je.created_at DESC",
  title_desc:
    "LOWER(COALESCE(je.title, '')) DESC, je.created_at DESC"
};

/*
  Create a journal entry.
*/
export async function createJournalEntry(
  userId,
  entryData,
  client = pool
) {
  const {
    title = null,
    content = null,
    entryType = "standard",
    entryStatus = "draft",
    moodLabel = null,
    moodScore = null,
    promptId = null,
    promptTextSnapshot = null,
    entryDate = null,
    isFavourite = false,
    isLocked = false,
    hidePreview = false
  } = entryData;

  const query = `
    INSERT INTO journal_entries (
      user_id,
      title,
      content,
      entry_type,
      entry_status,
      mood_label,
      mood_score,
      prompt_id,
      prompt_text_snapshot,
      entry_date,
      completed_at,
      is_favourite,
      is_locked,
      hide_preview
    )
    VALUES (
      $1::uuid,
      $2::varchar,
      $3::text,
      $4::varchar,
      $5::varchar,
      $6::varchar,
      $7::integer,
      $8::uuid,
      $9::text,
      COALESCE(
        $10::date,
        CURRENT_DATE
      ),
      CASE
        WHEN $5::varchar = 'completed'
        THEN NOW()
        ELSE NULL
      END,
      $11::boolean,
      $12::boolean,
      $13::boolean
    )
    RETURNING *;
  `;

  const values = [
    userId,
    title,
    content,
    entryType,
    entryStatus,
    moodLabel,
    moodScore,
    promptId,
    promptTextSnapshot,
    entryDate,
    isFavourite,
    isLocked,
    hidePreview
  ];

  const { rows } =
    await client.query(
      query,
      values
    );

  return rows[0];
}

/*
  Get one entry by ID without applying ownership.
  This function is useful for ownership middleware.
*/
export async function getJournalEntryById(
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_entries
    WHERE entry_id = $1
    LIMIT 1;
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows[0] || null;
}

/*
  Get one journal entry belonging to a particular user.
*/
export async function getJournalEntryByIdAndUserId(
  entryId,
  userId,
  options = {},
  client = null
) {
  const db = getDatabase(client);

  const includeDeleted =
    options.includeDeleted === true;

  const conditions = [
    "je.entry_id = $1",
    "je.user_id = $2"
  ];

  if (!includeDeleted) {
    conditions.push(
      "je.is_deleted = FALSE"
    );
  }

  const query = `
    SELECT je.*
    FROM journal_entries je
    WHERE ${conditions.join(" AND ")}
    LIMIT 1;
  `;

  const { rows } = await db.query(
    query,
    [entryId, userId]
  );

  return rows[0] || null;
}

/*
  Return journal entries with search, filters,
  sorting and pagination.

  Supported filter properties:

  search
  entryType
  status
  mood
  tagId
  activityId
  emotionId
  dateFrom
  dateTo
  isFavourite
  isArchived
  isDeleted
  page
  limit
  sort
*/
export async function getJournalEntriesByUserId(
  userId,
  filters = {},
  client = null
) {
  const db = getDatabase(client);

  const values = [userId];

  const conditions = [
    "je.user_id = $1"
  ];

  function addValue(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (filters.search) {
    const parameter = addValue(
      `%${filters.search}%`
    );

    conditions.push(`
      (
        COALESCE(je.title, '') ILIKE ${parameter}
        OR COALESCE(je.content, '') ILIKE ${parameter}
        OR COALESCE(je.mood_label, '') ILIKE ${parameter}
        OR COALESCE(
          je.prompt_text_snapshot,
          ''
        ) ILIKE ${parameter}
      )
    `);
  }

  if (filters.entryType) {
    const parameter = addValue(
      filters.entryType
    );

    conditions.push(
      `je.entry_type = ${parameter}`
    );
  }

  if (filters.status) {
    const parameter = addValue(
      filters.status
    );

    conditions.push(
      `je.entry_status = ${parameter}`
    );
  }

  if (filters.mood) {
    const parameter = addValue(
      filters.mood
    );

    conditions.push(
      `je.mood_label = ${parameter}`
    );
  }

  if (filters.dateFrom) {
    const parameter = addValue(
      filters.dateFrom
    );

    conditions.push(
      `je.entry_date >= ${parameter}`
    );
  }

  if (filters.dateTo) {
    const parameter = addValue(
      filters.dateTo
    );

    conditions.push(
      `je.entry_date <= ${parameter}`
    );
  }

  if (
    typeof filters.isFavourite ===
    "boolean"
  ) {
    const parameter = addValue(
      filters.isFavourite
    );

    conditions.push(
      `je.is_favourite = ${parameter}`
    );
  }

  if (
    typeof filters.isDeleted ===
    "boolean"
  ) {
    const parameter = addValue(
      filters.isDeleted
    );

    conditions.push(
      `je.is_deleted = ${parameter}`
    );
  } else {
    conditions.push(
      "je.is_deleted = FALSE"
    );
  }

  if (filters.isArchived === true) {
  conditions.push(
    "je.entry_status = 'archived'"
  );
} else if (
  filters.isArchived === false
) {
  conditions.push(
    "je.entry_status <> 'archived'"
  );
}

  if (filters.tagId) {
    const parameter = addValue(
      filters.tagId
    );

    conditions.push(`
      EXISTS (
        SELECT 1
        FROM journal_entry_tags jet
        WHERE jet.entry_id = je.entry_id
          AND jet.tag_id = ${parameter}
      )
    `);
  }

  if (filters.activityId) {
    const parameter = addValue(
      filters.activityId
    );

    conditions.push(`
      EXISTS (
        SELECT 1
        FROM journal_entry_activities jea
        WHERE jea.entry_id = je.entry_id
          AND jea.activity_id = ${parameter}
      )
    `);
  }

  if (filters.emotionId) {
    const parameter = addValue(
      filters.emotionId
    );

    conditions.push(`
      EXISTS (
        SELECT 1
        FROM journal_entry_emotions jee
        WHERE jee.entry_id = je.entry_id
          AND jee.emotion_id = ${parameter}
      )
    `);
  }

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

  const limitParameter =
    addValue(limit);

  const offsetParameter =
    addValue(offset);

  const sortClause =
    SORT_OPTIONS[filters.sort] ||
    SORT_OPTIONS.newest;

  const query = `
    SELECT
      je.*,

      (
        SELECT JSON_BUILD_OBJECT(
          'attachmentId',
            ja.attachment_id,
          'attachmentType',
            ja.attachment_type,
          'originalFileName',
            ja.original_file_name,
          'fileUrl',
            ja.file_url,
          'mimeType',
            ja.mime_type,
          'isCover',
            ja.is_cover
        )
        FROM journal_attachments ja
        WHERE ja.entry_id = je.entry_id
          AND ja.user_id = $1
          AND ja.is_deleted = FALSE
        ORDER BY
          ja.is_cover DESC,
          ja.attachment_order ASC,
          ja.created_at ASC
        LIMIT 1
      ) AS cover_attachment,

      (
        SELECT COUNT(*)::INTEGER
        FROM journal_attachments ja_count
        WHERE ja_count.entry_id =
            je.entry_id
          AND ja_count.user_id = $1
          AND ja_count.is_deleted = FALSE
      ) AS attachment_count,

      COUNT(*) OVER()::INTEGER
        AS total_count
    FROM journal_entries je
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${sortClause}
    LIMIT ${limitParameter}
    OFFSET ${offsetParameter};
  `;

  const { rows } = await db.query(
    query,
    values
  );

  const total =
    rows.length > 0
      ? Number(rows[0].total_count)
      : 0;

  const entries = rows.map(
    ({ total_count, ...entry }) =>
      entry
  );

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages:
        total === 0
          ? 0
          : Math.ceil(total / limit)
    }
  };
}

/*
  Dynamically update editable entry fields.

  Services must pass database column names,
  not JavaScript camelCase property names.
*/
export async function updateJournalEntry(
  entryId,
  userId,
  updates,
  client = null
) {
  const db = getDatabase(client);

  const entries = Object.entries(
    updates
  ).filter(
    ([column, value]) =>
      EDITABLE_COLUMNS.has(column) &&
      value !== undefined
  );

  if (entries.length === 0) {
    return getJournalEntryByIdAndUserId(
      entryId,
      userId,
      {
        includeDeleted: true
      },
      client
    );
  }

  const values = [
    entryId,
    userId
  ];

  const assignments =
    entries.map(
      ([column, value]) => {
        values.push(value);

        return `${column} = $${values.length}`;
      }
    );

  const query = `
    UPDATE journal_entries
    SET
      ${assignments.join(",\n      ")},
      is_edited = TRUE,
      edited_at = NOW(),
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows[0] || null;
}

/*
  Mark an auto-save without marking the entry
  as manually edited.
*/
export async function autoSaveJournalEntry(
  entryId,
  userId,
  updates,
  client = null
) {
  const db = getDatabase(client);

  const allowedAutoSaveColumns =
    new Set([
      "title",
      "content",
      "entry_type",
      "mood_label",
      "mood_score",
      "prompt_id",
      "prompt_text_snapshot",
      "entry_date",
      "hide_preview"
    ]);

  const entries = Object.entries(
    updates
  ).filter(
    ([column, value]) =>
      allowedAutoSaveColumns.has(
        column
      ) &&
      value !== undefined
  );

  const values = [
    entryId,
    userId
  ];

  const assignments =
    entries.map(
      ([column, value]) => {
        values.push(value);

        return `${column} = $${values.length}`;
      }
    );

  const optionalAssignments =
    assignments.length > 0
      ? `${assignments.join(",\n      ")},`
      : "";

  const query = `
    UPDATE journal_entries
    SET
      ${optionalAssignments}
      last_auto_saved_at = NOW(),
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows[0] || null;
}

/*
  Complete a draft journal entry.
*/
export async function completeJournalEntry(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_entries
    SET
      entry_status = 'completed',
      completed_at = NOW(),
      archived_at = NULL,
      is_deleted = FALSE,
      deleted_at = NULL,
      scheduled_permanent_delete_at = NULL,
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, userId]
  );

  return rows[0] || null;
}

/*
  Toggle the favourite status.
*/
export async function toggleJournalEntryFavourite(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_entries
    SET
      is_favourite = NOT is_favourite,
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, userId]
  );

  return rows[0] || null;
}

/*
  Archive an entry.
*/
export async function archiveJournalEntry(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_entries
    SET
      entry_status = 'archived',
      archived_at = NOW(),
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, userId]
  );

  return rows[0] || null;
}

/*
  Restore an archived or soft-deleted entry.

  A restored entry becomes completed when it had
  already been completed before deletion.
  Otherwise it becomes a draft.
*/
export async function restoreJournalEntry(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_entries
    SET
      entry_status = CASE
        WHEN completed_at IS NOT NULL
        THEN 'completed'
        ELSE 'draft'
      END,
      archived_at = NULL,
      is_deleted = FALSE,
      deleted_at = NULL,
      scheduled_permanent_delete_at = NULL,
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
      AND (
        is_deleted = TRUE
        OR entry_status = 'archived'
      )
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, userId]
  );

  return rows[0] || null;
}

/*
  Soft-delete an entry and schedule permanent
  deletion after 30 days.
*/
export async function softDeleteJournalEntry(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_entries
    SET
      is_deleted = TRUE,
      deleted_at = NOW(),
      scheduled_permanent_delete_at =
        NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE entry_id = $1
      AND user_id = $2
      AND is_deleted = FALSE
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, userId]
  );

  return rows[0] || null;
}

/*
  Permanently delete an entry.

  User ID is included to ensure that one user can
  never delete another user's journal entry.
*/
export async function permanentlyDeleteJournalEntry(
  entryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_entries
    WHERE entry_id = $1
      AND user_id = $2
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, userId]
  );

  return rows[0] || null;
}

/*
  Return entry dates and counts for calendar view.
*/
export async function getJournalCalendarByUserId(
  userId,
  filters = {},
  client = null
) {
  const db = getDatabase(client);

  const values = [userId];

  const conditions = [
    "user_id = $1",
    "is_deleted = FALSE"
  ];

  function addValue(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (filters.dateFrom) {
    const parameter = addValue(
      filters.dateFrom
    );

    conditions.push(
      `entry_date >= ${parameter}`
    );
  }

  if (filters.dateTo) {
    const parameter = addValue(
      filters.dateTo
    );

    conditions.push(
      `entry_date <= ${parameter}`
    );
  }

  const query = `
    SELECT
      entry_date,
      COUNT(*)::INTEGER AS entry_count,
      COUNT(*) FILTER (
        WHERE entry_status = 'draft'
      )::INTEGER AS draft_count,
      COUNT(*) FILTER (
        WHERE entry_status = 'completed'
      )::INTEGER AS completed_count,
      COUNT(*) FILTER (
        WHERE entry_status = 'archived'
      )::INTEGER AS archived_count
    FROM journal_entries
    WHERE ${conditions.join(" AND ")}
    GROUP BY entry_date
    ORDER BY entry_date ASC;
  `;

  const { rows } = await db.query(
    query,
    values
  );

  return rows;
}