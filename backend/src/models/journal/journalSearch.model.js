import pool from "../../config/database.js";

/*
|--------------------------------------------------------------------------
| Search Journal Entries
|--------------------------------------------------------------------------
*/

export async function searchJournalEntries({
  userId,
  filters,
  pagination,
  sorting,
  searchText
}) {
  const values = [userId];

  let parameterIndex = 2;

  const whereConditions = [
    "je.user_id = $1"
  ];

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  if (searchText) {
    values.push(`%${searchText}%`);

    whereConditions.push(`
      (
        je.title ILIKE $${parameterIndex}
        OR je.content ILIKE $${parameterIndex}
      )
    `);

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Basic filters
  |--------------------------------------------------------------------------
  */

  const simpleFilters = [
    ["status", "je.entry_status"],
    ["entryType", "je.entry_type"],
    ["moodLabel", "je.mood_label"],
    ["moodScore", "je.mood_score"],
    ["isFavourite", "je.is_favourite"],
    ["isLocked", "je.is_locked"],
    ["hidePreview", "je.hide_preview"],
    ["isDeleted", "je.is_deleted"]
  ];

  for (const [
    filterKey,
    column
  ] of simpleFilters) {
    if (
      filters[filterKey] !==
      undefined
    ) {
      values.push(
        filters[filterKey]
      );

      whereConditions.push(
        `${column} = $${parameterIndex}`
      );

      parameterIndex++;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Date range
  |--------------------------------------------------------------------------
  */

  if (filters.fromDate) {
    values.push(
      filters.fromDate
    );

    whereConditions.push(
      `je.created_at >= $${parameterIndex}`
    );

    parameterIndex++;
  }

  if (filters.toDate) {
    values.push(
      filters.toDate
    );

    whereConditions.push(
      `je.created_at <= $${parameterIndex}`
    );

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Tag
  |--------------------------------------------------------------------------
  */

  if (filters.tagId) {
    values.push(filters.tagId);

    whereConditions.push(`
      EXISTS (
        SELECT 1
        FROM journal_entry_tags jet
        WHERE
          jet.entry_id = je.entry_id
          AND jet.tag_id = $${parameterIndex}
      )
    `);

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Activity
  |--------------------------------------------------------------------------
  */

  if (
    filters.activityId
  ) {
    values.push(
      filters.activityId
    );

    whereConditions.push(`
      EXISTS (
        SELECT 1
        FROM journal_entry_activities jea
        WHERE
          jea.entry_id = je.entry_id
          AND jea.activity_id = $${parameterIndex}
      )
    `);

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Emotion
  |--------------------------------------------------------------------------
  */

  if (
    filters.emotionId
  ) {
    values.push(
      filters.emotionId
    );

    whereConditions.push(`
      EXISTS (
        SELECT 1
        FROM journal_entry_emotions jee
        WHERE
          jee.entry_id = je.entry_id
          AND jee.emotion_id = $${parameterIndex}
      )
    `);

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Attachments
  |--------------------------------------------------------------------------
  */

  if (
    filters.hasAttachments ===
    true
  ) {
    whereConditions.push(`
      EXISTS (
        SELECT 1
        FROM journal_attachments ja
        WHERE
          ja.entry_id = je.entry_id
          AND ja.is_deleted = FALSE
      )
    `);
  }

  const whereClause =
    whereConditions.join(
      "\nAND "
    );

  /*
  |--------------------------------------------------------------------------
  | Total Count
  |--------------------------------------------------------------------------
  */

  const countQuery = `
    SELECT COUNT(*)::INTEGER AS total
    FROM journal_entries je
    WHERE ${whereClause}
  `;

  const countResult =
    await pool.query(
      countQuery,
      values
    );

  const totalItems =
    countResult.rows[0]
      .total;

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  values.push(
    pagination.limit
  );

  const limitIndex =
    parameterIndex;

  parameterIndex++;

  values.push(
    pagination.offset
  );

  const offsetIndex =
    parameterIndex;

  /*
  |--------------------------------------------------------------------------
  | Main Query
  |--------------------------------------------------------------------------
  */

  const query = `
    SELECT
      je.*
    FROM journal_entries je
    WHERE ${whereClause}

    ORDER BY
      ${sorting.sortColumn}
      ${sorting.sortOrder}

    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const result =
    await pool.query(
      query,
      values
    );

  return {
    entries: result.rows,
    totalItems
  };
}