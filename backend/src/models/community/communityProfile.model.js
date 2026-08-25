import pool from "../../config/database.js";

export async function findCommunityProfileByUserId(userId) {
  const query = `
    SELECT *
    FROM community_profiles
    WHERE user_id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] || null;
}

export async function findCommunityProfileById(communityProfileId) {
  const query = `
    SELECT *
    FROM community_profiles
    WHERE community_profile_id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [communityProfileId]);

  return rows[0] || null;
}

export async function findCommunityProfileByAlias(anonymousAlias) {
  const query = `
    SELECT *
    FROM community_profiles
    WHERE anonymous_alias = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [anonymousAlias]);

  return rows[0] || null;
}

export async function createCommunityProfile({
  userId,
  displayName,
  anonymousAlias,
  identityMode = "anonymous",
  profileImageUrl = null,
  profileImagePublicId = null,
  bio = null
}) {
  const query = `
    INSERT INTO community_profiles (
      user_id,
      display_name,
      anonymous_alias,
      identity_mode,
      profile_image_url,
      profile_image_public_id,
      bio
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    userId,
    displayName,
    anonymousAlias,
    identityMode,
    profileImageUrl,
    profileImagePublicId,
    bio
  ];

  const { rows } = await pool.query(query, values);

  return rows[0];
}

export async function updateIdentityMode({
  userId,
  identityMode,
  displayName = null,
  anonymousAlias = null
}) {
  const query = `
    UPDATE community_profiles
    SET
      identity_mode = $2,
      display_name = COALESCE($3, display_name),
      anonymous_alias = COALESCE($4, anonymous_alias),
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const values = [
    userId,
    identityMode,
    displayName,
    anonymousAlias
  ];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
}

export async function updateCommunityProfile(userId, updates) {
  const {
    displayName,
    profileImageUrl,
    profileImagePublicId,
    bio,
    isActive
  } = updates;

  const query = `
    UPDATE community_profiles
    SET
      display_name = COALESCE($2, display_name),
      profile_image_url = COALESCE($3, profile_image_url),
      profile_image_public_id = COALESCE(
        $4,
        profile_image_public_id
      ),
      bio = COALESCE($5, bio),
      is_active = COALESCE($6, is_active),
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const values = [
    userId,
    displayName ?? null,
    profileImageUrl ?? null,
    profileImagePublicId ?? null,
    bio ?? null,
    isActive ?? null
  ];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
}

export async function updateCommunityProfileImage({
  userId,
  profileImageUrl,
  profileImagePublicId
}) {
  const query = `
    UPDATE community_profiles
    SET
      profile_image_url = $2,
      profile_image_public_id = $3,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const values = [
    userId,
    profileImageUrl,
    profileImagePublicId
  ];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
}

export async function removeCommunityProfileImage(userId) {
  const query = `
    UPDATE community_profiles
    SET
      profile_image_url = NULL,
      profile_image_public_id = NULL,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] || null;
}

export async function suspendCommunityProfile(userId) {
  const query = `
    UPDATE community_profiles
    SET
      is_suspended = TRUE,
      is_active = FALSE,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] || null;
}

export async function unsuspendCommunityProfile(userId) {
  const query = `
    UPDATE community_profiles
    SET
      is_suspended = FALSE,
      is_active = TRUE,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] || null;
}