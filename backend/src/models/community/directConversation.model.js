import pool from "../../config/database.js";

/**
 * Create a new direct conversation.
 */
export async function createDirectConversation({
  initiatedByUserId,
  conversationStatus = "pending",
  client = pool,
}) {
  const query = `
    INSERT INTO direct_conversations (
      initiated_by_user_id,
      conversation_status,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, TRUE, NOW(), NOW())
    RETURNING *
  `;

  const result = await client.query(query, [
    initiatedByUserId,
    conversationStatus,
  ]);

  return result.rows[0] || null;
}

/**
 * Find a conversation by ID.
 */
export async function findDirectConversationById(
  conversationId,
  client = pool
) {
  const query = `
    SELECT *
    FROM direct_conversations
    WHERE conversation_id = $1
    LIMIT 1
  `;

  const result = await client.query(query, [
    conversationId,
  ]);

  return result.rows[0] || null;
}

/**
 * Find an active conversation by ID.
 */
export async function findActiveDirectConversationById(
  conversationId,
  client = pool
) {
  const query = `
    SELECT *
    FROM direct_conversations
    WHERE conversation_id = $1
      AND is_active = TRUE
    LIMIT 1
  `;

  const result = await client.query(query, [
    conversationId,
  ]);

  return result.rows[0] || null;
}

/**
 * Find an existing conversation between two users.
 */
export async function findDirectConversationBetweenUsers(
  firstUserId,
  secondUserId,
  client = pool
) {
  const query = `
    SELECT conversation.*
    FROM direct_conversations conversation

    INNER JOIN direct_conversation_members first_member
      ON first_member.conversation_id =
         conversation.conversation_id
      AND first_member.user_id = $1

    INNER JOIN direct_conversation_members second_member
      ON second_member.conversation_id =
         conversation.conversation_id
      AND second_member.user_id = $2

    WHERE conversation.is_active = TRUE
    LIMIT 1
  `;

  const result = await client.query(query, [
    firstUserId,
    secondUserId,
  ]);

  return result.rows[0] || null;
}

/**
 * Return all active conversations for one user.
 */
export async function findDirectConversationsForUser({
  userId,
  limit = 30,
  offset = 0,
}) {
  const query = `
    SELECT
      conversation.*,

      current_member.conversation_member_id,
      current_member.visible_name AS current_visible_name,
      current_member.identity_mode AS current_identity_mode,
      current_member.member_role AS current_member_role,
      current_member.request_status AS current_request_status,
      current_member.is_muted,
      current_member.is_archived,
      current_member.joined_at,
      current_member.left_at,
      current_member.last_read_at,
      current_member.cleared_at,

      other_member.user_id AS other_user_id,
      other_member.visible_name AS other_visible_name,
      other_member.identity_mode AS other_identity_mode,
      other_member.member_role AS other_member_role,
      other_member.request_status AS other_request_status,

      latest_message.direct_message_id AS latest_message_id,
      latest_message.sender_user_id AS latest_sender_user_id,
      latest_message.sender_visible_name AS latest_sender_visible_name,
      latest_message.sender_identity_mode
        AS latest_sender_identity_mode,
      latest_message.message_text AS latest_message_text,
      latest_message.message_type AS latest_message_type,
      latest_message.is_deleted AS latest_message_is_deleted,
      latest_message.created_at AS latest_message_created_at,

      (
        SELECT COUNT(*)::INTEGER
        FROM direct_messages unread_message
        WHERE unread_message.conversation_id =
              conversation.conversation_id

          AND unread_message.sender_user_id IS DISTINCT FROM $1
          AND unread_message.is_deleted = FALSE

          AND unread_message.created_at >
              GREATEST(
                COALESCE(
                  current_member.last_read_at,
                  current_member.joined_at,
                  current_member.created_at
                ),
                COALESCE(
                  current_member.cleared_at,
                  '-infinity'::TIMESTAMPTZ
                )
              )
      ) AS unread_count

    FROM direct_conversations conversation

    INNER JOIN direct_conversation_members current_member
      ON current_member.conversation_id =
         conversation.conversation_id
      AND current_member.user_id = $1
      AND current_member.left_at IS NULL

    LEFT JOIN direct_conversation_members other_member
      ON other_member.conversation_id =
         conversation.conversation_id
      AND other_member.user_id <> $1
      AND other_member.left_at IS NULL

    LEFT JOIN LATERAL (
      SELECT message.*
      FROM direct_messages message
      WHERE message.conversation_id =
            conversation.conversation_id

        AND message.created_at >
            COALESCE(
              current_member.cleared_at,
              '-infinity'::TIMESTAMPTZ
            )

      ORDER BY message.created_at DESC
      LIMIT 1
    ) latest_message ON TRUE

    WHERE conversation.is_active = TRUE

    ORDER BY
      current_member.is_archived ASC,
      COALESCE(
        conversation.last_message_at,
        conversation.created_at
      ) DESC

    LIMIT $2
    OFFSET $3
  `;

  const result = await pool.query(query, [
    userId,
    limit,
    offset,
  ]);

  return result.rows;
}

/**
 * Count active conversations for one user.
 */
export async function countDirectConversationsForUser(
  userId
) {
  const query = `
    SELECT COUNT(*)::INTEGER AS conversation_count
    FROM direct_conversations conversation

    INNER JOIN direct_conversation_members member
      ON member.conversation_id =
         conversation.conversation_id

    WHERE member.user_id = $1
      AND member.left_at IS NULL
      AND conversation.is_active = TRUE
  `;

  const result = await pool.query(query, [
    userId,
  ]);

  return (
    result.rows[0]
      ?.conversation_count || 0
  );
}

/**
 * Update the conversation status.
 *
 * Examples:
 * pending
 * accepted
 * rejected
 * blocked
 */
export async function updateDirectConversationStatus({
  conversationId,
  conversationStatus,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversations
    SET
      conversation_status = $2,
      updated_at = NOW()
    WHERE conversation_id = $1
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    conversationStatus,
  ]);

  return result.rows[0] || null;
}

/**
 * Update the last-message timestamp.
 */
export async function updateDirectConversationLastActivity(
  conversationId,
  client = pool
) {
  const query = `
    UPDATE direct_conversations
    SET
      last_message_at = NOW(),
      updated_at = NOW()
    WHERE conversation_id = $1
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
  ]);

  return result.rows[0] || null;
}

/**
 * Set an exact last-message time.
 */
export async function updateDirectConversationLastMessageAt({
  conversationId,
  lastMessageAt,
  client = pool,
}) {
  const query = `
    UPDATE direct_conversations
    SET
      last_message_at = $2,
      updated_at = NOW()
    WHERE conversation_id = $1
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    lastMessageAt,
  ]);

  return result.rows[0] || null;
}

/**
 * Reactivate a conversation.
 */
export async function reactivateDirectConversation(
  conversationId,
  client = pool
) {
  const query = `
    UPDATE direct_conversations
    SET
      is_active = TRUE,
      updated_at = NOW()
    WHERE conversation_id = $1
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
  ]);

  return result.rows[0] || null;
}

/**
 * Deactivate a conversation.
 */
export async function deactivateDirectConversation(
  conversationId,
  client = pool
) {
  const query = `
    UPDATE direct_conversations
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE conversation_id = $1
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
  ]);

  return result.rows[0] || null;
}

/**
 * Check whether a conversation is active.
 */
export async function isDirectConversationActive(
  conversationId
) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM direct_conversations
      WHERE conversation_id = $1
        AND is_active = TRUE
    ) AS is_active
  `;

  const result = await pool.query(query, [
    conversationId,
  ]);

  return result.rows[0].is_active;
}