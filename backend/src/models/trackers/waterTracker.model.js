import pool from "../../config/database.js";

export async function createWaterLog(
  userId,
  waterData
) {
  const {
    waterContainerId,
    amountMl,
    containerType,
    note,
    loggedAt
  } = waterData;

  const query = `
    INSERT INTO water_logs (
      user_id,
      water_container_id,
      amount_ml,
      container_type,
      note,
      logged_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      COALESCE($6, NOW())
    )
    RETURNING *
  `;

  const values = [
    userId,
    waterContainerId ?? null,
    amountMl,
    containerType ?? null,
    note ?? null,
    loggedAt ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function findWaterLogById(
  userId,
  waterLogId,
  includeDeleted = false
) {
  const query = `
    SELECT
      wl.*,
      wc.container_name,
      wc.amount_ml AS container_amount_ml
    FROM water_logs wl
    LEFT JOIN water_containers wc
      ON wc.water_container_id =
        wl.water_container_id
    WHERE wl.user_id = $1
      AND wl.water_log_id = $2
      AND (
        $3::BOOLEAN = TRUE
        OR wl.deleted_at IS NULL
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    waterLogId,
    includeDeleted
  ]);

  return rows[0] ?? null;
}

export async function findWaterLogsByUserId(
  userId,
  filters = {}
) {
  const {
    startDate,
    endDate,
    waterContainerId,
    page = 1,
    limit = 50,
    sortOrder = "desc"
  } = filters;

  const offset = (page - 1) * limit;
  const direction =
    String(sortOrder).toLowerCase() === "asc"
      ? "ASC"
      : "DESC";

  const query = `
    SELECT
      wl.*,
      wc.container_name,
      COUNT(*) OVER()::INTEGER AS total_items
    FROM water_logs wl
    LEFT JOIN water_containers wc
      ON wc.water_container_id =
        wl.water_container_id
    WHERE wl.user_id = $1
      AND wl.deleted_at IS NULL
      AND (
        $2::TIMESTAMPTZ IS NULL
        OR wl.logged_at >= $2
      )
      AND (
        $3::TIMESTAMPTZ IS NULL
        OR wl.logged_at <= $3
      )
      AND (
        $4::UUID IS NULL
        OR wl.water_container_id = $4
      )
    ORDER BY wl.logged_at ${direction}
    LIMIT $5
    OFFSET $6
  `;

  const values = [
    userId,
    startDate ?? null,
    endDate ?? null,
    waterContainerId ?? null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function findWaterTotalForDate(
  userId,
  startOfDay,
  endOfDay
) {
  const query = `
    SELECT
      COALESCE(
        SUM(amount_ml),
        0
      )::INTEGER AS total_amount_ml,
      COUNT(*)::INTEGER AS total_logs
    FROM water_logs
    WHERE user_id = $1
      AND deleted_at IS NULL
      AND logged_at >= $2
      AND logged_at < $3
  `;

  const { rows } = await pool.query(query, [
    userId,
    startOfDay,
    endOfDay
  ]);

  return rows[0];
}

export async function updateWaterLogById(
  userId,
  waterLogId,
  waterData
) {
  const {
    waterContainerId,
    amountMl,
    containerType,
    note,
    loggedAt
  } = waterData;

  const query = `
    UPDATE water_logs
    SET
      water_container_id = COALESCE(
        $3,
        water_container_id
      ),
      amount_ml = COALESCE($4, amount_ml),
      container_type = COALESCE(
        $5,
        container_type
      ),
      note = COALESCE($6, note),
      logged_at = COALESCE($7, logged_at)
    WHERE user_id = $1
      AND water_log_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const values = [
    userId,
    waterLogId,
    waterContainerId ?? null,
    amountMl ?? null,
    containerType ?? null,
    note ?? null,
    loggedAt ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] ?? null;
}

export async function softDeleteWaterLogById(
  userId,
  waterLogId
) {
  const query = `
    UPDATE water_logs
    SET deleted_at = NOW()
    WHERE user_id = $1
      AND water_log_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    waterLogId
  ]);

  return rows[0] ?? null;
}

export async function restoreWaterLogById(
  userId,
  waterLogId
) {
  const query = `
    UPDATE water_logs
    SET deleted_at = NULL
    WHERE user_id = $1
      AND water_log_id = $2
      AND deleted_at IS NOT NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    waterLogId
  ]);

  return rows[0] ?? null;
}

export async function permanentlyDeleteWaterLogById(
  userId,
  waterLogId
) {
  const query = `
    DELETE FROM water_logs
    WHERE user_id = $1
      AND water_log_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    waterLogId
  ]);

  return rows[0] ?? null;
}

export async function createWaterContainer(
  userId,
  containerData
) {
  const {
    containerName,
    amountMl,
    isDefault
  } = containerData;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (isDefault === true) {
      await client.query(
        `
          UPDATE water_containers
          SET is_default = FALSE
          WHERE user_id = $1
            AND deleted_at IS NULL
        `,
        [userId]
      );
    }

    const query = `
      INSERT INTO water_containers (
        user_id,
        container_name,
        amount_ml,
        is_default
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await client.query(query, [
      userId,
      containerName,
      amountMl,
      isDefault ?? false
    ]);

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findWaterContainersByUserId(
  userId,
  includeInactive = false
) {
  const query = `
    SELECT *
    FROM water_containers
    WHERE user_id = $1
      AND deleted_at IS NULL
      AND (
        $2::BOOLEAN = TRUE
        OR is_active = TRUE
      )
    ORDER BY
      is_default DESC,
      created_at ASC
  `;

  const { rows } = await pool.query(query, [
    userId,
    includeInactive
  ]);

  return rows;
}

export async function findWaterContainerById(
  userId,
  waterContainerId
) {
  const query = `
    SELECT *
    FROM water_containers
    WHERE user_id = $1
      AND water_container_id = $2
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    waterContainerId
  ]);

  return rows[0] ?? null;
}

export async function updateWaterContainerById(
  userId,
  waterContainerId,
  containerData
) {
  const {
    containerName,
    amountMl,
    isDefault,
    isActive
  } = containerData;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (isDefault === true) {
      await client.query(
        `
          UPDATE water_containers
          SET is_default = FALSE
          WHERE user_id = $1
            AND water_container_id <> $2
            AND deleted_at IS NULL
        `,
        [userId, waterContainerId]
      );
    }

    const query = `
      UPDATE water_containers
      SET
        container_name = COALESCE(
          $3,
          container_name
        ),
        amount_ml = COALESCE($4, amount_ml),
        is_default = COALESCE(
          $5,
          is_default
        ),
        is_active = COALESCE(
          $6,
          is_active
        )
      WHERE user_id = $1
        AND water_container_id = $2
        AND deleted_at IS NULL
      RETURNING *
    `;

    const { rows } = await client.query(query, [
      userId,
      waterContainerId,
      containerName ?? null,
      amountMl ?? null,
      isDefault ?? null,
      isActive ?? null
    ]);

    await client.query("COMMIT");
    return rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteWaterContainerById(
  userId,
  waterContainerId
) {
  const query = `
    UPDATE water_containers
    SET
      deleted_at = NOW(),
      is_active = FALSE,
      is_default = FALSE
    WHERE user_id = $1
      AND water_container_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    waterContainerId
  ]);

  return rows[0] ?? null;
}
