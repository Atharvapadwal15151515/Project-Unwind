import pool from "../../config/database.js";

function getDatabase(client) {
  return client || pool;
}

export async function createJournalPromptHistory(
  {
    userId,
    promptId,
    entryId = null,
    shownAt = null,
    usedAt = null,
    wasUsed = false
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    INSERT INTO journal_prompt_history (
      user_id,
      prompt_id,
      entry_id,
      shown_at,
      used_at,
      was_used
    )
    VALUES (
      $1,
      $2,
      $3,
      COALESCE($4, NOW()),
      $5,
      $6
    )
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      userId,
      promptId,
      entryId,
      shownAt,
      wasUsed ? usedAt || new Date() : null,
      wasUsed
    ]
  );

  return result.rows[0];
}

export async function getJournalPromptHistoryById(
  promptHistoryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      jph.prompt_history_id,
      jph.user_id,
      jph.prompt_id,
      jph.entry_id,
      jph.shown_at,
      jph.used_at,
      jph.was_used,
      jph.created_at
    FROM journal_prompt_history jph
    WHERE jph.prompt_history_id = $1
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [promptHistoryId]
  );

  return result.rows[0] || null;
}

export async function getOwnedJournalPromptHistoryById(
  promptHistoryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      jph.prompt_history_id,
      jph.user_id,
      jph.prompt_id,
      jph.entry_id,
      jph.shown_at,
      jph.used_at,
      jph.was_used,
      jph.created_at
    FROM journal_prompt_history jph
    WHERE jph.prompt_history_id = $1
      AND jph.user_id = $2
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [
      promptHistoryId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function getUserJournalPromptHistory(
  userId,
  {
    promptId = null,
    entryId = null,
    wasUsed = null,
    fromDate = null,
    toDate = null,
    limit = 50,
    offset = 0
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jph.user_id = $1"
  ];

  const values = [userId];

  if (promptId) {
    values.push(promptId);

    conditions.push(
      `jph.prompt_id = $${values.length}`
    );
  }

  if (entryId) {
    values.push(entryId);

    conditions.push(
      `jph.entry_id = $${values.length}`
    );
  }

  if (
    typeof wasUsed === "boolean"
  ) {
    values.push(wasUsed);

    conditions.push(
      `jph.was_used = $${values.length}`
    );
  }

  if (fromDate) {
    values.push(fromDate);

    conditions.push(
      `jph.shown_at >= $${values.length}`
    );
  }

  if (toDate) {
    values.push(toDate);

    conditions.push(
      `jph.shown_at <= $${values.length}`
    );
  }

  values.push(limit);

  const limitParameter =
    `$${values.length}`;

  values.push(offset);

  const offsetParameter =
    `$${values.length}`;

  const query = `
    SELECT
      jph.prompt_history_id,
      jph.user_id,
      jph.prompt_id,
      jph.entry_id,
      jph.shown_at,
      jph.used_at,
      jph.was_used,
      jph.created_at,

      jp.prompt_text,
      jp.prompt_category,
      jp.is_system,
      jp.is_active

    FROM journal_prompt_history jph

    INNER JOIN journal_prompts jp
      ON jp.prompt_id = jph.prompt_id

    WHERE ${conditions.join(" AND ")}

    ORDER BY
      jph.shown_at DESC,
      jph.created_at DESC

    LIMIT ${limitParameter}
    OFFSET ${offsetParameter}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows;
}

export async function countUserJournalPromptHistory(
  userId,
  {
    promptId = null,
    entryId = null,
    wasUsed = null,
    fromDate = null,
    toDate = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "user_id = $1"
  ];

  const values = [userId];

  if (promptId) {
    values.push(promptId);

    conditions.push(
      `prompt_id = $${values.length}`
    );
  }

  if (entryId) {
    values.push(entryId);

    conditions.push(
      `entry_id = $${values.length}`
    );
  }

  if (
    typeof wasUsed === "boolean"
  ) {
    values.push(wasUsed);

    conditions.push(
      `was_used = $${values.length}`
    );
  }

  if (fromDate) {
    values.push(fromDate);

    conditions.push(
      `shown_at >= $${values.length}`
    );
  }

  if (toDate) {
    values.push(toDate);

    conditions.push(
      `shown_at <= $${values.length}`
    );
  }

  const query = `
    SELECT COUNT(*)::INTEGER AS total
    FROM journal_prompt_history
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0]?.total || 0;
}

export async function markJournalPromptHistoryAsUsed(
  promptHistoryId,
  userId,
  {
    entryId = null,
    usedAt = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_prompt_history
    SET
      entry_id = COALESCE(
        $3,
        entry_id
      ),
      was_used = TRUE,
      used_at = COALESCE(
        $4,
        NOW()
      )
    WHERE prompt_history_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      promptHistoryId,
      userId,
      entryId,
      usedAt
    ]
  );

  return result.rows[0] || null;
}

export async function markLatestJournalPromptAsUsed(
  userId,
  promptId,
  {
    entryId = null,
    usedAt = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_prompt_history
    SET
      entry_id = COALESCE(
        $3,
        entry_id
      ),
      was_used = TRUE,
      used_at = COALESCE(
        $4,
        NOW()
      )
    WHERE prompt_history_id = (
      SELECT prompt_history_id
      FROM journal_prompt_history
      WHERE user_id = $1
        AND prompt_id = $2
        AND was_used = FALSE
      ORDER BY shown_at DESC
      LIMIT 1
    )
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      userId,
      promptId,
      entryId,
      usedAt
    ]
  );

  return result.rows[0] || null;
}

export async function attachEntryToPromptHistory(
  promptHistoryId,
  userId,
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_prompt_history
    SET entry_id = $3
    WHERE prompt_history_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      promptHistoryId,
      userId,
      entryId
    ]
  );

  return result.rows[0] || null;
}

export async function getRecentlyShownPromptIds(
  userId,
  {
    days = 14,
    category = null,
    limit = 100
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jph.user_id = $1",
    `jph.shown_at >= (
      NOW() - ($2::INTEGER * INTERVAL '1 day')
    )`
  ];

  const values = [
    userId,
    days
  ];

  if (category) {
    values.push(category);

    conditions.push(
      `jp.prompt_category = $${values.length}`
    );
  }

  values.push(limit);

  const limitParameter =
    `$${values.length}`;

  const query = `
    SELECT DISTINCT
      jph.prompt_id
    FROM journal_prompt_history jph

    INNER JOIN journal_prompts jp
      ON jp.prompt_id = jph.prompt_id

    WHERE ${conditions.join(" AND ")}

    ORDER BY jph.prompt_id

    LIMIT ${limitParameter}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows.map(
    (row) => row.prompt_id
  );
}

export async function getLastShownJournalPrompt(
  userId,
  {
    category = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jph.user_id = $1"
  ];

  const values = [userId];

  if (category) {
    values.push(category);

    conditions.push(
      `jp.prompt_category = $${values.length}`
    );
  }

  const query = `
    SELECT
      jph.prompt_history_id,
      jph.user_id,
      jph.prompt_id,
      jph.entry_id,
      jph.shown_at,
      jph.used_at,
      jph.was_used,
      jph.created_at,

      jp.prompt_text,
      jp.prompt_category,
      jp.is_system,
      jp.is_active

    FROM journal_prompt_history jph

    INNER JOIN journal_prompts jp
      ON jp.prompt_id = jph.prompt_id

    WHERE ${conditions.join(" AND ")}

    ORDER BY jph.shown_at DESC

    LIMIT 1
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0] || null;
}

export async function getJournalPromptUsageStatistics(
  userId,
  {
    fromDate = null,
    toDate = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jph.user_id = $1"
  ];

  const values = [userId];

  if (fromDate) {
    values.push(fromDate);

    conditions.push(
      `jph.shown_at >= $${values.length}`
    );
  }

  if (toDate) {
    values.push(toDate);

    conditions.push(
      `jph.shown_at <= $${values.length}`
    );
  }

  const query = `
    SELECT
      COUNT(*)::INTEGER AS total_shown,

      COUNT(*) FILTER (
        WHERE jph.was_used = TRUE
      )::INTEGER AS total_used,

      COUNT(DISTINCT jph.prompt_id)::INTEGER
        AS unique_prompts_shown,

      COUNT(DISTINCT jph.entry_id) FILTER (
        WHERE jph.entry_id IS NOT NULL
      )::INTEGER AS entries_created,

      ROUND(
        (
          COUNT(*) FILTER (
            WHERE jph.was_used = TRUE
          )::NUMERIC
          /
          NULLIF(
            COUNT(*)::NUMERIC,
            0
          )
        ) * 100,
        2
      ) AS usage_percentage

    FROM journal_prompt_history jph

    WHERE ${conditions.join(" AND ")}
  `;

  const result = await db.query(
    query,
    values
  );

  return (
    result.rows[0] || {
      total_shown: 0,
      total_used: 0,
      unique_prompts_shown: 0,
      entries_created: 0,
      usage_percentage: 0
    }
  );
}

export async function getMostUsedJournalPrompts(
  userId,
  {
    limit = 10,
    fromDate = null,
    toDate = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jph.user_id = $1",
    "jph.was_used = TRUE"
  ];

  const values = [userId];

  if (fromDate) {
    values.push(fromDate);

    conditions.push(
      `jph.used_at >= $${values.length}`
    );
  }

  if (toDate) {
    values.push(toDate);

    conditions.push(
      `jph.used_at <= $${values.length}`
    );
  }

  values.push(limit);

  const limitParameter =
    `$${values.length}`;

  const query = `
    SELECT
      jp.prompt_id,
      jp.prompt_text,
      jp.prompt_category,
      jp.is_system,

      COUNT(*)::INTEGER AS usage_count,

      MAX(jph.used_at)
        AS last_used_at

    FROM journal_prompt_history jph

    INNER JOIN journal_prompts jp
      ON jp.prompt_id = jph.prompt_id

    WHERE ${conditions.join(" AND ")}

    GROUP BY
      jp.prompt_id,
      jp.prompt_text,
      jp.prompt_category,
      jp.is_system

    ORDER BY
      usage_count DESC,
      last_used_at DESC

    LIMIT ${limitParameter}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows;
}

export async function journalPromptWasShownRecently(
  userId,
  promptId,
  days = 14,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM journal_prompt_history
      WHERE user_id = $1
        AND prompt_id = $2
        AND shown_at >= (
          NOW() - (
            $3::INTEGER *
            INTERVAL '1 day'
          )
        )
    ) AS exists
  `;

  const result = await db.query(
    query,
    [
      userId,
      promptId,
      days
    ]
  );

  return result.rows[0]?.exists === true;
}

export async function promptHistoryExistsForEntry(
  userId,
  promptId,
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM journal_prompt_history
      WHERE user_id = $1
        AND prompt_id = $2
        AND entry_id = $3
    ) AS exists
  `;

  const result = await db.query(
    query,
    [
      userId,
      promptId,
      entryId
    ]
  );

  return result.rows[0]?.exists === true;
}

export async function deleteJournalPromptHistory(
  promptHistoryId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_prompt_history
    WHERE prompt_history_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      promptHistoryId,
      userId
    ]
  );

  return result.rows[0] || null;
}

export async function deleteUserJournalPromptHistory(
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_prompt_history
    WHERE user_id = $1
    RETURNING prompt_history_id
  `;

  const result = await db.query(
    query,
    [userId]
  );

  return result.rowCount;
}

export async function deleteOldUnusedPromptHistory(
  {
    olderThanDays = 90
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_prompt_history
    WHERE was_used = FALSE
      AND entry_id IS NULL
      AND shown_at < (
        NOW() - (
          $1::INTEGER *
          INTERVAL '1 day'
        )
      )
    RETURNING prompt_history_id
  `;

  const result = await db.query(
    query,
    [olderThanDays]
  );

  return result.rowCount;
}