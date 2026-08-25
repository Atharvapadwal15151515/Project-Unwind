import pool from "../../config/database.js";

function getDatabase(client) {
  return client || pool;
}

export async function createJournalPrompt(
  {
    userId,
    promptText,
    promptCategory = "daily_reflection",
    isSystem = false,
    isActive = true,
    displayOrder = 0
  },
  client = null
) {
  const db = getDatabase(client);

  const query = `
    INSERT INTO journal_prompts (
      user_id,
      prompt_text,
      prompt_category,
      is_system,
      is_active,
      display_order
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    isSystem ? null : userId,
    promptText,
    promptCategory,
    isSystem,
    isActive,
    displayOrder
  ];

  const result = await db.query(
    query,
    values
  );

  return result.rows[0];
}

export async function getJournalPromptById(
  promptId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      prompt_id,
      user_id,
      prompt_text,
      prompt_category,
      is_system,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM journal_prompts
    WHERE prompt_id = $1
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [promptId]
  );

  return result.rows[0] || null;
}

export async function getAccessibleJournalPromptById(
  promptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      prompt_id,
      user_id,
      prompt_text,
      prompt_category,
      is_system,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM journal_prompts
    WHERE prompt_id = $1
      AND (
        is_system = TRUE
        OR user_id = $2
      )
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [promptId, userId]
  );

  return result.rows[0] || null;
}

export async function getOwnedJournalPromptById(
  promptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      prompt_id,
      user_id,
      prompt_text,
      prompt_category,
      is_system,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM journal_prompts
    WHERE prompt_id = $1
      AND user_id = $2
      AND is_system = FALSE
    LIMIT 1
  `;

  const result = await db.query(
    query,
    [promptId, userId]
  );

  return result.rows[0] || null;
}

export async function getSystemJournalPrompts(
  {
    category = null,
    search = null,
    isActive = true,
    limit = 50,
    offset = 0
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "is_system = TRUE"
  ];

  const values = [];

  if (
    typeof isActive === "boolean"
  ) {
    values.push(isActive);

    conditions.push(
      `is_active = $${values.length}`
    );
  }

  if (category) {
    values.push(category);

    conditions.push(
      `prompt_category = $${values.length}`
    );
  }

  if (search) {
    values.push(`%${search}%`);

    conditions.push(
      `prompt_text ILIKE $${values.length}`
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
      prompt_id,
      user_id,
      prompt_text,
      prompt_category,
      is_system,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM journal_prompts
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      display_order ASC,
      created_at ASC
    LIMIT ${limitParameter}
    OFFSET ${offsetParameter}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows;
}

export async function getUserJournalPrompts(
  userId,
  {
    category = null,
    search = null,
    isActive = true,
    limit = 50,
    offset = 0
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "user_id = $1",
    "is_system = FALSE"
  ];

  const values = [userId];

  if (
    typeof isActive === "boolean"
  ) {
    values.push(isActive);

    conditions.push(
      `is_active = $${values.length}`
    );
  }

  if (category) {
    values.push(category);

    conditions.push(
      `prompt_category = $${values.length}`
    );
  }

  if (search) {
    values.push(`%${search}%`);

    conditions.push(
      `prompt_text ILIKE $${values.length}`
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
      prompt_id,
      user_id,
      prompt_text,
      prompt_category,
      is_system,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM journal_prompts
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      display_order ASC,
      created_at DESC
    LIMIT ${limitParameter}
    OFFSET ${offsetParameter}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows;
}

export async function getAvailableJournalPrompts(
  userId,
  {
    category = null,
    search = null,
    limit = 50,
    offset = 0
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "is_active = TRUE",
    `(
      is_system = TRUE
      OR (
        is_system = FALSE
        AND user_id = $1
      )
    )`
  ];

  const values = [userId];

  if (category) {
    values.push(category);

    conditions.push(
      `prompt_category = $${values.length}`
    );
  }

  if (search) {
    values.push(`%${search}%`);

    conditions.push(
      `prompt_text ILIKE $${values.length}`
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
      prompt_id,
      user_id,
      prompt_text,
      prompt_category,
      is_system,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM journal_prompts
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      is_system DESC,
      display_order ASC,
      created_at DESC
    LIMIT ${limitParameter}
    OFFSET ${offsetParameter}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows;
}

export async function countAvailableJournalPrompts(
  userId,
  {
    category = null,
    search = null
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "is_active = TRUE",
    `(
      is_system = TRUE
      OR (
        is_system = FALSE
        AND user_id = $1
      )
    )`
  ];

  const values = [userId];

  if (category) {
    values.push(category);

    conditions.push(
      `prompt_category = $${values.length}`
    );
  }

  if (search) {
    values.push(`%${search}%`);

    conditions.push(
      `prompt_text ILIKE $${values.length}`
    );
  }

  const query = `
    SELECT COUNT(*)::INTEGER AS total
    FROM journal_prompts
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0]?.total || 0;
}

export async function getRandomJournalPrompt(
  userId,
  {
    category = null,
    excludedPromptIds = []
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jp.is_active = TRUE",
    `(
      jp.is_system = TRUE
      OR (
        jp.is_system = FALSE
        AND jp.user_id = $1
      )
    )`
  ];

  const values = [userId];

  if (category) {
    values.push(category);

    conditions.push(
      `jp.prompt_category = $${values.length}`
    );
  }

  if (
    Array.isArray(excludedPromptIds) &&
    excludedPromptIds.length > 0
  ) {
    values.push(excludedPromptIds);

    conditions.push(
      `NOT (
        jp.prompt_id =
        ANY($${values.length}::UUID[])
      )`
    );
  }

  const query = `
    SELECT
      jp.prompt_id,
      jp.user_id,
      jp.prompt_text,
      jp.prompt_category,
      jp.is_system,
      jp.is_active,
      jp.display_order,
      jp.created_at,
      jp.updated_at
    FROM journal_prompts jp
    WHERE ${conditions.join(" AND ")}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0] || null;
}

export async function getDailyJournalPrompt(
  userId,
  {
    category = null,
    excludedPromptIds = []
  } = {},
  client = null
) {
  const db = getDatabase(client);

  const conditions = [
    "jp.is_active = TRUE",
    `(
      jp.is_system = TRUE
      OR (
        jp.is_system = FALSE
        AND jp.user_id = $1
      )
    )`
  ];

  const values = [userId];

  if (category) {
    values.push(category);

    conditions.push(
      `jp.prompt_category = $${values.length}`
    );
  }

  if (
    Array.isArray(excludedPromptIds) &&
    excludedPromptIds.length > 0
  ) {
    values.push(excludedPromptIds);

    conditions.push(
      `NOT (
        jp.prompt_id =
        ANY($${values.length}::UUID[])
      )`
    );
  }

  const query = `
    SELECT
      jp.prompt_id,
      jp.user_id,
      jp.prompt_text,
      jp.prompt_category,
      jp.is_system,
      jp.is_active,
      jp.display_order,
      jp.created_at,
      jp.updated_at
    FROM journal_prompts jp
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      MD5(
        jp.prompt_id::TEXT ||
        CURRENT_DATE::TEXT ||
        $1::TEXT
      )
    LIMIT 1
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0] || null;
}

export async function updateJournalPrompt(
  promptId,
  userId,
  {
    promptText,
    promptCategory,
    isActive,
    displayOrder
  },
  client = null
) {
  const db = getDatabase(client);

  const updates = [];
  const values = [];

  if (promptText !== undefined) {
    values.push(promptText);

    updates.push(
      `prompt_text = $${values.length}`
    );
  }

  if (promptCategory !== undefined) {
    values.push(promptCategory);

    updates.push(
      `prompt_category = $${values.length}`
    );
  }

  if (isActive !== undefined) {
    values.push(isActive);

    updates.push(
      `is_active = $${values.length}`
    );
  }

  if (displayOrder !== undefined) {
    values.push(displayOrder);

    updates.push(
      `display_order = $${values.length}`
    );
  }

  if (updates.length === 0) {
    return getOwnedJournalPromptById(
      promptId,
      userId,
      client
    );
  }

  values.push(promptId);

  const promptIdParameter =
    `$${values.length}`;

  values.push(userId);

  const userIdParameter =
    `$${values.length}`;

  const query = `
    UPDATE journal_prompts
    SET
      ${updates.join(", ")},
      updated_at = NOW()
    WHERE prompt_id = ${promptIdParameter}
      AND user_id = ${userIdParameter}
      AND is_system = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    values
  );

  return result.rows[0] || null;
}

export async function setJournalPromptActiveStatus(
  promptId,
  userId,
  isActive,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    UPDATE journal_prompts
    SET
      is_active = $3,
      updated_at = NOW()
    WHERE prompt_id = $1
      AND user_id = $2
      AND is_system = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [
      promptId,
      userId,
      isActive
    ]
  );

  return result.rows[0] || null;
}

export async function deleteJournalPrompt(
  promptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_prompts
    WHERE prompt_id = $1
      AND user_id = $2
      AND is_system = FALSE
    RETURNING *
  `;

  const result = await db.query(
    query,
    [promptId, userId]
  );

  return result.rows[0] || null;
}

export async function journalPromptExists(
  promptId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM journal_prompts
      WHERE prompt_id = $1
    ) AS exists
  `;

  const result = await db.query(
    query,
    [promptId]
  );

  return result.rows[0]?.exists === true;
}

export async function accessibleJournalPromptExists(
  promptId,
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM journal_prompts
      WHERE prompt_id = $1
        AND is_active = TRUE
        AND (
          is_system = TRUE
          OR user_id = $2
        )
    ) AS exists
  `;

  const result = await db.query(
    query,
    [promptId, userId]
  );

  return result.rows[0]?.exists === true;
}

export async function getJournalPromptCategories(
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      prompt_category,
      COUNT(*)::INTEGER AS prompt_count
    FROM journal_prompts
    WHERE is_active = TRUE
      AND (
        is_system = TRUE
        OR (
          is_system = FALSE
          AND user_id = $1
        )
      )
    GROUP BY prompt_category
    ORDER BY prompt_category ASC
  `;

  const result = await db.query(
    query,
    [userId]
  );

  return result.rows;
}