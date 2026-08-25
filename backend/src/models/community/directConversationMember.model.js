import pool from "../../config/database.js";

/**
 * Add a member to a direct conversation.
 */
export async function addDirectConversationMember({
  conversationId,
  userId,
  visibleName,
  identityMode,
  memberRole,
  requestStatus = "pending",
  joinedAt = null,
  client = pool,
}) {
  if (
    !["requester", "recipient"].includes(
      memberRole
    )
  ) {
    throw new Error(
      `Invalid direct conversation member role: ${memberRole}`
    );
  }

  const query = `
    INSERT INTO direct_conversation_members (
      conversation_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      request_status,
      is_muted,
      is_archived,
      joined_at,
      left_at,
      last_read_at,
      cleared_at,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      FALSE,
      FALSE,
      $7,
      NULL,
      NULL,
      NULL,
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
    visibleName,
    identityMode,
    memberRole,
    requestStatus,
    joinedAt,
  ]);

  return result.rows[0] || null;
}

/**
 * Find an active conversation member.
 */
export async function findDirectConversationMember(
  conversationId,
  userId,
  client = pool
) {
  const query = `
    SELECT *
    FROM direct_conversation_members
    WHERE conversation_id = $1
      AND user_id = $2
      AND left_at IS NULL
    LIMIT 1
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Find a member even if they have left.
 */
export async function findDirectConversationMemberIncludingLeft(
  conversationId,
  userId,
  client = pool
) {
  const query = `
    SELECT *
    FROM direct_conversation_members
    WHERE conversation_id = $1
      AND user_id = $2
    LIMIT 1
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Return active conversation members.
 */
export async function findDirectConversationMembers(
  conversationId,
  client = pool
) {
  const query = `
    SELECT
      member.*,

      CASE
        WHEN member.identity_mode = 'anonymous'
          THEN NULL
        ELSE profile.profile_image_url
      END AS profile_image_url

    FROM direct_conversation_members member

    LEFT JOIN community_profiles profile
      ON profile.user_id =
         member.user_id

    WHERE member.conversation_id = $1

    ORDER BY
      member.created_at ASC
  `;

  const result =
    await client.query(
      query,
      [
        conversationId
      ]
    );

  return result.rows;
}

/**
 * Return all members, including users who left.
 */
export async function findAllDirectConversationMembers(
  conversationId,
  client = pool
) {
  const query = `
    SELECT *
    FROM direct_conversation_members
    WHERE conversation_id = $1
    ORDER BY created_at ASC
  `;

  const result = await client.query(query, [
    conversationId,
  ]);

  return result.rows;
}

/**
 * Update a member's request status.
 *
 * Examples:
 * pending
 * accepted
 * rejected
 * blocked
 */
export async function updateDirectConversationRequestStatus({
  conversationId,
  userId,
  requestStatus,
  client = pool,
}) {
  const joinedAt =
    requestStatus === "accepted"
      ? "COALESCE(joined_at, NOW())"
      : "joined_at";

  const query = `
    INSERT INTO direct_conversation_members (
      conversation_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      request_status,
      is_muted,
      is_archived,
      joined_at,
      left_at,
      last_read_at,
      cleared_at,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      FALSE,
      FALSE,
      $7,
      NULL,
      NULL,
      NULL,
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
    visibleName,
    identityMode,
    memberRole,
    requestStatus,
    joinedAt,
  ]);

  return result.rows[0] || null;
}


/**
 * Mark a member as having joined.
 */
export async function acceptDirectConversationMember({
  conversationId,
  userId,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversation_members
    SET
      request_status = 'accepted',
      joined_at = COALESCE(joined_at, NOW()),
      left_at = NULL,
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Reject a direct-message request.
 */
export async function rejectDirectConversationMember({
  conversationId,
  userId,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversation_members
    SET
      request_status = 'rejected',
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Leave a direct conversation.
 */
export async function leaveDirectConversationMember(
  conversationId,
  userId,
  client = pool
) {
  const query = `
    UPDATE direct_conversation_members
    SET
      left_at = NOW(),
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
      AND left_at IS NULL
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Rejoin a previous direct conversation.
 */
export async function rejoinDirectConversationMember({
  conversationId,
  userId,
  visibleName,
  identityMode,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversation_members
    SET
      visible_name = $3,
      identity_mode = $4,
      request_status = 'accepted',
      joined_at = NOW(),
      left_at = NULL,
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
    visibleName,
    identityMode,
  ]);

  return result.rows[0] || null;
}

/**
 * Update a member's visible community identity.
 */
export async function updateDirectConversationMemberIdentity({
  conversationId,
  userId,
  visibleName,
  identityMode,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversation_members
    SET
      visible_name = $3,
      identity_mode = $4,
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
    visibleName,
    identityMode,
  ]);

  return result.rows[0] || null;
}

/**
 * Update member role.
 */
export async function updateDirectConversationMemberRole({
  conversationId,
  userId,
  memberRole,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversation_members
    SET
      member_role = $3,
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
    memberRole,
  ]);

  return result.rows[0] || null;
}

/**
 * Mute or unmute a conversation.
 */
export async function updateDirectConversationMemberMute({
  conversationId,
  userId,
  isMuted,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversation_members
    SET
      is_muted = $3,
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
      AND left_at IS NULL
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
    Boolean(isMuted),
  ]);

  return result.rows[0] || null;
}

/**
 * Archive or restore a conversation.
 */
export async function updateDirectConversationMemberArchive({
  conversationId,
  userId,
  isArchived,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversation_members
    SET
      is_archived = $3,
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
      AND left_at IS NULL
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
    Boolean(isArchived),
  ]);

  return result.rows[0] || null;
}

/**
 * Mark a conversation as read.
 */
export async function updateDirectConversationLastRead(
  conversationId,
  userId,
  client = pool
) {
  const query = `
    UPDATE direct_conversation_members
    SET
      last_read_at = NOW(),
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
      AND left_at IS NULL
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Clear the conversation for one user.
 *
 * Messages remain in the database, but older messages will
 * not be shown to this member.
 */
export async function clearDirectConversationForMember(
  conversationId,
  userId,
  client = pool
) {
  const query = `
    UPDATE direct_conversation_members
    SET
      cleared_at = NOW(),
      last_read_at = NOW(),
      updated_at = NOW()
    WHERE conversation_id = $1
      AND user_id = $2
      AND left_at IS NULL
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Check whether a user is an active member.
 */
export async function isDirectConversationMember(
  conversationId,
  userId
) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM direct_conversation_members
      WHERE conversation_id = $1
        AND user_id = $2
        AND left_at IS NULL
    ) AS is_member
  `;

  const result = await pool.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0].is_member;
}

/**
 * Count active conversation members.
 */
export async function countDirectConversationMembers(
  conversationId
) {
  const query = `
    SELECT COUNT(*)::INTEGER AS member_count
    FROM direct_conversation_members
    WHERE conversation_id = $1
      AND left_at IS NULL
  `;

  const result = await pool.query(query, [
    conversationId,
  ]);

  return result.rows[0].member_count;
}