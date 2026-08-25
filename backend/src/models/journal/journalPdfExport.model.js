import pool from "../../config/database.js";

/*
|--------------------------------------------------------------------------
| Get Single Journal Entry For PDF Export
|--------------------------------------------------------------------------
*/

export async function getJournalEntryForPdf(
  userId,
  entryId
) {
  const query = `
    SELECT
      je.*
    FROM journal_entries je
    WHERE
      je.user_id = $1
      AND je.entry_id = $2
      AND je.is_deleted = FALSE
    LIMIT 1
  `;

  const result =
    await pool.query(query, [
      userId,
      entryId
    ]);

  return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Get Multiple Journal Entries For PDF Export
|--------------------------------------------------------------------------
*/

export async function getMultipleJournalEntriesForPdf(
  userId,
  entryIds
) {
  const query = `
    SELECT
      je.*
    FROM journal_entries je
    WHERE
      je.user_id = $1
      AND je.entry_id = ANY($2::uuid[])
      AND je.is_deleted = FALSE
    ORDER BY
      je.entry_date DESC,
      je.created_at DESC
  `;

  const result =
    await pool.query(query, [
      userId,
      entryIds
    ]);

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Get Complete Journal For PDF Export
|--------------------------------------------------------------------------
*/

export async function getJournalEntriesForPdf({
  userId,
  filters,
  sorting
}) {
  const values = [userId];

  let parameterIndex = 2;

  const whereConditions = [
    "je.user_id = $1"
  ];

  /*
  |--------------------------------------------------------------------------
  | Deleted entries
  |--------------------------------------------------------------------------
  */

  if (
    !filters.includeDeleted
  ) {
    whereConditions.push(
      "je.is_deleted = FALSE"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  if (filters.status) {
    values.push(filters.status);

    whereConditions.push(
      `je.entry_status = $${parameterIndex}`
    );

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Entry Type
  |--------------------------------------------------------------------------
  */

  if (
    filters.entryType
  ) {
    values.push(
      filters.entryType
    );

    whereConditions.push(
      `je.entry_type = $${parameterIndex}`
    );

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Mood
  |--------------------------------------------------------------------------
  */

  if (
    filters.moodLabel
  ) {
    values.push(
      filters.moodLabel
    );

    whereConditions.push(
      `je.mood_label = $${parameterIndex}`
    );

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Favourite
  |--------------------------------------------------------------------------
  */

  if (
    filters.isFavourite !==
    undefined
  ) {
    values.push(
      filters.isFavourite
    );

    whereConditions.push(
      `je.is_favourite = $${parameterIndex}`
    );

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Date Range
  |--------------------------------------------------------------------------
  */

  if (
    filters.fromDate
  ) {
    values.push(
      filters.fromDate
    );

    whereConditions.push(
      `je.entry_date >= $${parameterIndex}`
    );

    parameterIndex++;
  }

  if (
    filters.toDate
  ) {
    values.push(
      filters.toDate
    );

    whereConditions.push(
      `je.entry_date <= $${parameterIndex}`
    );

    parameterIndex++;
  }

  /*
  |--------------------------------------------------------------------------
  | Query
  |--------------------------------------------------------------------------
  */

  const query = `
    SELECT
      je.*
    FROM journal_entries je
    WHERE
      ${whereConditions.join(
        "\nAND "
      )}
    ORDER BY
      ${sorting.sortColumn}
      ${sorting.sortOrder}
  `;

  const result =
    await pool.query(
      query,
      values
    );

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Get Attachments
|--------------------------------------------------------------------------
*/

export async function getJournalAttachmentsForPdf(
  entryIds
) {
  if (
    !entryIds ||
    entryIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT
      ja.*
    FROM journal_attachments ja
    WHERE
      ja.entry_id = ANY($1::uuid[])
      AND ja.is_deleted = FALSE
    ORDER BY
      ja.entry_id,
      ja.attachment_order ASC,
      ja.created_at ASC
  `;

  const result =
    await pool.query(query, [
      entryIds
    ]);

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Get Tags
|--------------------------------------------------------------------------
*/

export async function getJournalTagsForPdf(
  entryIds
) {
  if (
    !entryIds ||
    entryIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT
      jet.entry_id,
      jt.tag_name
    FROM journal_entry_tags jet
    INNER JOIN journal_tags jt
      ON jt.tag_id = jet.tag_id
    WHERE
      jet.entry_id = ANY($1::uuid[])
    ORDER BY
      jet.entry_id,
      jt.tag_name ASC
  `;

  const result =
    await pool.query(query, [
      entryIds
    ]);

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Get Activities
|--------------------------------------------------------------------------
*/

export async function getJournalActivitiesForPdf(
  entryIds
) {
  if (
    !entryIds ||
    entryIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT
      jea.entry_id,
      ja.activity_name
    FROM journal_entry_activities jea
    INNER JOIN journal_activities ja
      ON ja.activity_id =
      jea.activity_id
    WHERE
      jea.entry_id = ANY($1::uuid[])
    ORDER BY
      jea.entry_id,
      ja.activity_name ASC
  `;

  const result =
    await pool.query(query, [
      entryIds
    ]);

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Get Emotions
|--------------------------------------------------------------------------
*/

export async function getJournalEmotionsForPdf(
  entryIds
) {
  if (
    !entryIds ||
    entryIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT
      jee.entry_id,
      je.emotion_name
    FROM journal_entry_emotions jee
    INNER JOIN journal_emotions je
      ON je.emotion_id =
      jee.emotion_id
    WHERE
      jee.entry_id = ANY($1::uuid[])
    ORDER BY
      jee.entry_id,
      je.display_order ASC,
      je.emotion_name ASC
  `;

  const result =
    await pool.query(query, [
      entryIds
    ]);

  return result.rows;
}