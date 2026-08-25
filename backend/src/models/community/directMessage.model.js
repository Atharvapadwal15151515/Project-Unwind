import pool from "../../config/database.js";

/**
 * Create a direct message.
 */
export async function createDirectMessage({
  conversationId,
  senderUserId,
  senderVisibleName,
  senderIdentityMode,
  messageText = null,
  replyToMessageId = null,
  messageType = "text",
  client = pool,
}) {
  const query = `
    INSERT INTO direct_messages (
      conversation_id,
      sender_user_id,
      sender_visible_name,
      sender_identity_mode,
      message_text,
      reply_to_message_id,
      message_type,
      is_edited,
      edited_at,
      is_deleted,
      deleted_at,
      deleted_by,
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
      $7,
      FALSE,
      NULL,
      FALSE,
      NULL,
      NULL,
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const result = await client.query(query, [
    conversationId,
    senderUserId,
    senderVisibleName,
    senderIdentityMode,
    messageText,
    replyToMessageId,
    messageType,
  ]);

  return result.rows[0] || null;
}

/**
 * Find one message with reply details.
 */
export async function findDirectMessageById(
  messageId,
  client = pool
) {
  const query = `
    SELECT
      message.*,

      reply_message.sender_user_id
        AS reply_sender_user_id,

      reply_message.sender_visible_name
        AS reply_sender_visible_name,

      reply_message.sender_identity_mode
        AS reply_sender_identity_mode,

      reply_message.message_text
        AS reply_message_text,

      reply_message.message_type
        AS reply_message_type,

      reply_message.is_deleted
        AS reply_message_is_deleted

    FROM direct_messages message

    LEFT JOIN direct_messages reply_message
      ON reply_message.direct_message_id =
         message.reply_to_message_id

    WHERE message.direct_message_id = $1
    LIMIT 1
  `;

  const result = await client.query(query, [
    messageId,
  ]);

  return result.rows[0] || null;
}

/**
 * Find and lock one direct message.
 */
export async function findDirectMessageByIdForUpdate(
  messageId,
  client
) {
  const query = `
    SELECT *
    FROM direct_messages
    WHERE direct_message_id = $1
    FOR UPDATE
  `;

  const result = await client.query(query, [
    messageId,
  ]);

  return result.rows[0] || null;
}

/**
 * Return direct messages with offset pagination.
 */
export async function findDirectMessages({
  conversationId,
  userId,
  limit = 30,
  offset = 0,
}) {
  const query = `
    SELECT
      message.*,

      reply_message.sender_user_id
        AS reply_sender_user_id,

      reply_message.sender_visible_name
        AS reply_sender_visible_name,

      reply_message.message_text
        AS reply_message_text,

      reply_message.message_type
        AS reply_message_type,

      reply_message.is_deleted
        AS reply_message_is_deleted

    FROM direct_messages message

    INNER JOIN direct_conversation_members member
      ON member.conversation_id =
         message.conversation_id
      AND member.user_id = $2
      AND member.left_at IS NULL

    LEFT JOIN direct_messages reply_message
      ON reply_message.direct_message_id =
         message.reply_to_message_id

    WHERE message.conversation_id = $1

      AND message.created_at >
          COALESCE(
            member.cleared_at,
            '-infinity'::TIMESTAMPTZ
          )

    ORDER BY message.created_at DESC

    LIMIT $3
    OFFSET $4
  `;

  const result = await pool.query(query, [
    conversationId,
    userId,
    limit,
    offset,
  ]);

  return result.rows;
}

/**
 * Return direct messages using cursor pagination.
 */
export async function findDirectMessagesByCursor({
  conversationId,
  userId,
  beforeMessageId = null,
  limit = 30,
}) {
  const query = `
    SELECT
      message.*,

      reply_message.sender_user_id
        AS reply_sender_user_id,

      reply_message.sender_visible_name
        AS reply_sender_visible_name,

      reply_message.message_text
        AS reply_message_text,

      reply_message.message_type
        AS reply_message_type,

      reply_message.is_deleted
        AS reply_message_is_deleted

    FROM direct_messages message

    INNER JOIN direct_conversation_members member
      ON member.conversation_id =
         message.conversation_id
      AND member.user_id = $2
      AND member.left_at IS NULL

    LEFT JOIN direct_messages reply_message
      ON reply_message.direct_message_id =
         message.reply_to_message_id

    WHERE message.conversation_id = $1

      AND message.created_at >
          COALESCE(
            member.cleared_at,
            '-infinity'::TIMESTAMPTZ
          )

      AND (
        $3::UUID IS NULL

        OR message.created_at < (
          SELECT cursor_message.created_at
          FROM direct_messages cursor_message
          WHERE cursor_message.direct_message_id = $3
            AND cursor_message.conversation_id = $1
        )
      )

    ORDER BY message.created_at DESC
    LIMIT $4
  `;

  const result = await pool.query(query, [
    conversationId,
    userId,
    beforeMessageId,
    limit,
  ]);

  return result.rows;
}

/**
 * Count messages in a conversation.
 */
export async function countDirectMessages({
  conversationId,
  userId,
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS message_count
    FROM direct_messages message

    INNER JOIN direct_conversation_members member
      ON member.conversation_id =
         message.conversation_id
      AND member.user_id = $2
      AND member.left_at IS NULL

    WHERE message.conversation_id = $1

      AND message.created_at >
          COALESCE(
            member.cleared_at,
            '-infinity'::TIMESTAMPTZ
          )
  `;

  const result = await pool.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0].message_count;
}

/**
 * Find a valid reply target in the same conversation.
 */
export async function findDirectMessageReplyTarget(
  conversationId,
  replyToMessageId,
  client = pool
) {
  const query = `
    SELECT *
    FROM direct_messages
    WHERE direct_message_id = $2
      AND conversation_id = $1
    LIMIT 1
  `;

  const result = await client.query(query, [
    conversationId,
    replyToMessageId,
  ]);

  return result.rows[0] || null;
}

/**
 * Edit a direct message.
 */
export async function updateDirectMessage({
  messageId,
  messageText,
  client = pool,
}) {
  const query = `
    UPDATE direct_messages
    SET
      message_text = $2,
      is_edited = TRUE,
      edited_at = NOW(),
      updated_at = NOW()
    WHERE direct_message_id = $1
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await client.query(query, [
    messageId,
    messageText,
  ]);

  return result.rows[0] || null;
}

/**
 * Soft-delete a direct message.
 *
 * deleted_by is VARCHAR in your database, so this can store:
 * - the deleting user's UUID as text
 * - "moderator"
 * - "admin"
 * - "system"
 */
export async function softDeleteDirectMessage({
  messageId,
  deletedBy,
  client = pool,
}) {
  const query = `
    UPDATE direct_messages
    SET
      message_text = NULL,
      is_deleted = TRUE,
      deleted_at = NOW(),
      deleted_by = $2,
      updated_at = NOW()
    WHERE direct_message_id = $1
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await client.query(query, [
    messageId,
    String(deletedBy),
  ]);

  return result.rows[0] || null;
}

/**
 * Return the latest visible message.
 */
export async function findLatestDirectMessage(
  conversationId
) {
  const query = `
    SELECT *
    FROM direct_messages
    WHERE conversation_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [
    conversationId,
  ]);

  return result.rows[0] || null;
}

/**
 * Count unread messages for one member.
 */
export async function countUnreadDirectMessages(
  conversationId,
  userId
) {
  const query = `
    SELECT COUNT(*)::INTEGER AS unread_count
    FROM direct_messages message

    INNER JOIN direct_conversation_members member
      ON member.conversation_id =
         message.conversation_id
      AND member.user_id = $2
      AND member.left_at IS NULL

    WHERE message.conversation_id = $1

      AND message.sender_user_id IS DISTINCT FROM $2

      AND message.is_deleted = FALSE

      AND message.created_at >
          GREATEST(
            COALESCE(
              member.last_read_at,
              member.joined_at,
              member.created_at
            ),
            COALESCE(
              member.cleared_at,
              '-infinity'::TIMESTAMPTZ
            )
          )
  `;

  const result = await pool.query(query, [
    conversationId,
    userId,
  ]);

  return result.rows[0].unread_count;
}

/**
 * Verify that a message belongs to a conversation.
 */
export async function directMessageBelongsToConversation({
  messageId,
  conversationId,
}) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM direct_messages
      WHERE direct_message_id = $1
        AND conversation_id = $2
    ) AS belongs_to_conversation
  `;

  const result = await pool.query(query, [
    messageId,
    conversationId,
  ]);

  return result.rows[0].belongs_to_conversation;
}

/**
 * Permanently delete all messages in a conversation.
 *
 * Use only for cleanup, account deletion or test data.
 */
export async function permanentlyDeleteDirectMessages(
  conversationId,
  client = pool
) {
  const query = `
    DELETE FROM direct_messages
    WHERE conversation_id = $1
    RETURNING direct_message_id
  `;

  const result = await client.query(query, [
    conversationId,
  ]);

  return result.rows;
}