import pool from "../../config/database.js";

export async function createEnergyEntry(
  userId,
  energyData
) {
  const {
    energyScore,
    fatigueScore,
    focusScore,
    motivationScore,
    physicalEnergyScore,
    mentalEnergyScore,
    contextCategory,
    note,
    loggedAt
  } = energyData;

  const query = `
    INSERT INTO energy_entries (
      user_id,
      energy_score,
      fatigue_score,
      focus_score,
      motivation_score,
      physical_energy_score,
      mental_energy_score,
      context_category,
      note,
      logged_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      COALESCE($10, NOW())
    )
    RETURNING *
  `;

  const values = [
    userId,
    energyScore,
    fatigueScore ?? null,
    focusScore ?? null,
    motivationScore ?? null,
    physicalEnergyScore ?? null,
    mentalEnergyScore ?? null,
    contextCategory ?? null,
    note ?? null,
    loggedAt ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function findEnergyEntryById(
  userId,
  energyEntryId,
  includeDeleted = false
) {
  const query = `
    SELECT *
    FROM energy_entries
    WHERE user_id = $1
      AND energy_entry_id = $2
      AND (
        $3::BOOLEAN = TRUE
        OR deleted_at IS NULL
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    energyEntryId,
    includeDeleted
  ]);

  return rows[0] ?? null;
}

export async function findEnergyEntriesByUserId(
  userId,
  filters = {}
) {
  const {
    startDate,
    endDate,
    minEnergyScore,
    maxEnergyScore,
    contextCategory,
    page = 1,
    limit = 20,
    sortOrder = "desc"
  } = filters;

  const offset = (page - 1) * limit;
  const direction =
    String(sortOrder).toLowerCase() === "asc"
      ? "ASC"
      : "DESC";

  const query = `
    SELECT
      ee.*,
      COUNT(*) OVER()::INTEGER AS total_items
    FROM energy_entries ee
    WHERE ee.user_id = $1
      AND ee.deleted_at IS NULL
      AND (
        $2::TIMESTAMPTZ IS NULL
        OR ee.logged_at >= $2
      )
      AND (
        $3::TIMESTAMPTZ IS NULL
        OR ee.logged_at <= $3
      )
      AND (
        $4::SMALLINT IS NULL
        OR ee.energy_score >= $4
      )
      AND (
        $5::SMALLINT IS NULL
        OR ee.energy_score <= $5
      )
      AND (
        $6::VARCHAR IS NULL
        OR ee.context_category = $6
      )
    ORDER BY ee.logged_at ${direction}
    LIMIT $7
    OFFSET $8
  `;

  const values = [
    userId,
    startDate ?? null,
    endDate ?? null,
    minEnergyScore ?? null,
    maxEnergyScore ?? null,
    contextCategory ?? null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function updateEnergyEntryById(
  userId,
  energyEntryId,
  energyData
) {
  const {
    energyScore,
    fatigueScore,
    focusScore,
    motivationScore,
    physicalEnergyScore,
    mentalEnergyScore,
    contextCategory,
    note,
    loggedAt
  } = energyData;

  const query = `
    UPDATE energy_entries
    SET
      energy_score = COALESCE(
        $3,
        energy_score
      ),
      fatigue_score = COALESCE(
        $4,
        fatigue_score
      ),
      focus_score = COALESCE(
        $5,
        focus_score
      ),
      motivation_score = COALESCE(
        $6,
        motivation_score
      ),
      physical_energy_score = COALESCE(
        $7,
        physical_energy_score
      ),
      mental_energy_score = COALESCE(
        $8,
        mental_energy_score
      ),
      context_category = COALESCE(
        $9,
        context_category
      ),
      note = COALESCE($10, note),
      logged_at = COALESCE($11, logged_at)
    WHERE user_id = $1
      AND energy_entry_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const values = [
    userId,
    energyEntryId,
    energyScore ?? null,
    fatigueScore ?? null,
    focusScore ?? null,
    motivationScore ?? null,
    physicalEnergyScore ?? null,
    mentalEnergyScore ?? null,
    contextCategory ?? null,
    note ?? null,
    loggedAt ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] ?? null;
}

export async function softDeleteEnergyEntryById(
  userId,
  energyEntryId
) {
  const query = `
    UPDATE energy_entries
    SET deleted_at = NOW()
    WHERE user_id = $1
      AND energy_entry_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    energyEntryId
  ]);

  return rows[0] ?? null;
}

export async function restoreEnergyEntryById(
  userId,
  energyEntryId
) {
  const query = `
    UPDATE energy_entries
    SET deleted_at = NULL
    WHERE user_id = $1
      AND energy_entry_id = $2
      AND deleted_at IS NOT NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    energyEntryId
  ]);

  return rows[0] ?? null;
}

export async function permanentlyDeleteEnergyEntryById(
  userId,
  energyEntryId
) {
  const query = `
    DELETE FROM energy_entries
    WHERE user_id = $1
      AND energy_entry_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    energyEntryId
  ]);

  return rows[0] ?? null;
}
