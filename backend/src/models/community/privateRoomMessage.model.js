import pool from "../../config/database.js";

/**
 * Create a message inside a private room.
 */
export async function createPrivateRoomMessage({
  roomId,
  senderUserId,
  senderVisibleName,
  senderIdentityMode,
  messageText,
  replyToMessageId = null,
  messageType = "text",
}) {
  const query = `
    INSERT INTO chat_messages (
      room_id,
      sender_user_id,
      sender_visible_name,
      sender_identity_mode,
      message_text,
      reply_to_message_id,
      message_type,
      is_edited,
      is_deleted,
      created_at,
      updated_at
    )
    SELECT
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      FALSE,
      FALSE,
      NOW(),
      NOW()
    WHERE EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE room_id = $1
        AND room_type = 'private'
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    )
    RETURNING *
  `;

  const values = [
    roomId,
    senderUserId,
    senderVisibleName,
    senderIdentityMode,
    messageText,
    replyToMessageId,
    messageType,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Find one private-room message by its ID.
 */
export async function findPrivateRoomMessageById(messageId) {
  const query = `
    SELECT
      message.*,

      reply.chat_message_id AS reply_message_id,
      reply.sender_visible_name AS reply_sender_visible_name,
      reply.sender_identity_mode AS reply_sender_identity_mode,
      reply.message_text AS reply_message_text,
      reply.message_type AS reply_message_type,
      reply.is_deleted AS reply_is_deleted

    FROM chat_messages message

    INNER JOIN chat_rooms room
      ON room.room_id = message.room_id
      AND room.room_type = 'private'

    LEFT JOIN chat_messages reply
      ON reply.chat_message_id = message.reply_to_message_id

    WHERE message.chat_message_id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [messageId]);
  return result.rows[0] || null;
}

/**
 * Find a message and lock it for update.
 *
 * Use this inside a database transaction when editing or deleting.
 */
export async function findPrivateRoomMessageByIdForUpdate(
  messageId,
  client = pool
) {
  const query = `
    SELECT message.*
    FROM chat_messages message

    INNER JOIN chat_rooms room
      ON room.room_id = message.room_id
      AND room.room_type = 'private'

    WHERE message.chat_message_id = $1
    FOR UPDATE
  `;

  const result = await client.query(query, [messageId]);
  return result.rows[0] || null;
}

/**
 * Get private-room messages using page and limit pagination.
 */
export async function findPrivateRoomMessages({
  roomId,
  limit = 30,
  offset = 0,
}) {
  const query = `
    SELECT
      message.*,

      reply.chat_message_id AS reply_message_id,
      reply.sender_visible_name AS reply_sender_visible_name,
      reply.sender_identity_mode AS reply_sender_identity_mode,
      reply.message_text AS reply_message_text,
      reply.message_type AS reply_message_type,
      reply.is_deleted AS reply_is_deleted

    FROM chat_messages message

    INNER JOIN chat_rooms room
      ON room.room_id = message.room_id
      AND room.room_type = 'private'

    LEFT JOIN chat_messages reply
      ON reply.chat_message_id = message.reply_to_message_id

    WHERE message.room_id = $1

    ORDER BY
      message.created_at DESC,
      message.chat_message_id DESC

    LIMIT $2
    OFFSET $3
  `;

  const result = await pool.query(query, [roomId, limit, offset]);
  return result.rows;
}

/**
 * Get private-room messages using cursor pagination.
 *
 * Pass the oldest message ID currently visible as beforeMessageId.
 */
export async function findPrivateRoomMessagesByCursor({
  roomId,
  beforeMessageId = null,
  limit = 30,
}) {
  const query = `
    SELECT
      message.*,

      reply.chat_message_id AS reply_message_id,
      reply.sender_visible_name AS reply_sender_visible_name,
      reply.sender_identity_mode AS reply_sender_identity_mode,
      reply.message_text AS reply_message_text,
      reply.message_type AS reply_message_type,
      reply.is_deleted AS reply_is_deleted

    FROM chat_messages message

    INNER JOIN chat_rooms room
      ON room.room_id = message.room_id
      AND room.room_type = 'private'

    LEFT JOIN chat_messages reply
      ON reply.chat_message_id = message.reply_to_message_id

    WHERE message.room_id = $1

      AND (
        $2::UUID IS NULL

        OR (
          message.created_at,
          message.chat_message_id
        ) < (
          SELECT
            cursor_message.created_at,
            cursor_message.chat_message_id

          FROM chat_messages cursor_message

          WHERE cursor_message.chat_message_id = $2
            AND cursor_message.room_id = $1
        )
      )

    ORDER BY
      message.created_at DESC,
      message.chat_message_id DESC

    LIMIT $3
  `;

  const result = await pool.query(query, [
    roomId,
    beforeMessageId,
    limit,
  ]);

  return result.rows;
}

/**
 * Count all messages inside a private room.
 */
export async function countPrivateRoomMessages(roomId) {
  const query = `
    SELECT COUNT(*)::INTEGER AS message_count
    FROM chat_messages message

    INNER JOIN chat_rooms room
      ON room.room_id = message.room_id
      AND room.room_type = 'private'

    WHERE message.room_id = $1
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0].message_count;
}

/**
 * Find the reply target.
 *
 * The reply target must belong to the same private room.
 */
export async function findPrivateRoomReplyTarget(
  roomId,
  replyToMessageId
) {
  const query = `
    SELECT
      message.chat_message_id,
      message.room_id,
      message.sender_user_id,
      message.sender_visible_name,
      message.sender_identity_mode,
      message.message_text,
      message.message_type,
      message.is_deleted,
      message.created_at

    FROM chat_messages message

    INNER JOIN chat_rooms room
      ON room.room_id = message.room_id
      AND room.room_type = 'private'

    WHERE message.chat_message_id = $2
      AND message.room_id = $1

    LIMIT 1
  `;

  const result = await pool.query(query, [
    roomId,
    replyToMessageId,
  ]);

  return result.rows[0] || null;
}

/**
 * Edit a private-room message.
 */
export async function updatePrivateRoomMessage({
  messageId,
  messageText,
  client = pool,
}) {
  const query = `
    UPDATE chat_messages AS message
    SET
      message_text = $2,
      is_edited = TRUE,
      edited_at = NOW(),
      updated_at = NOW()

    FROM chat_rooms AS room

    WHERE message.chat_message_id = $1
      AND room.room_id = message.room_id
      AND room.room_type = 'private'
      AND message.is_deleted = FALSE

    RETURNING message.*
  `;

  const result = await client.query(query, [
    messageId,
    messageText,
  ]);

  return result.rows[0] || null;
}

/**
 * Soft-delete a private-room message.
 */
export async function softDeletePrivateRoomMessage({
  messageId,
  deletedBy,
  client = pool,
}) {
  const query = `
    UPDATE chat_messages AS message
    SET
      message_text = NULL,
      is_deleted = TRUE,
      deleted_at = NOW(),
      deleted_by = $2,
      updated_at = NOW()

    FROM chat_rooms AS room

    WHERE message.chat_message_id = $1
      AND room.room_id = message.room_id
      AND room.room_type = 'private'
      AND message.is_deleted = FALSE

    RETURNING message.*
  `;

  const result = await client.query(query, [
    messageId,
    deletedBy,
  ]);

  return result.rows[0] || null;
}

/**
 * Get the latest message from a private room.
 */
export async function findLatestPrivateRoomMessage(roomId) {
  const query = `
    SELECT message.*
    FROM chat_messages message

    INNER JOIN chat_rooms room
      ON room.room_id = message.room_id
      AND room.room_type = 'private'

    WHERE message.room_id = $1

    ORDER BY
      message.created_at DESC,
      message.chat_message_id DESC

    LIMIT 1
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0] || null;
}

/**
 * Count unread messages for a private-room member.
 */
export async function countUnreadPrivateRoomMessages(
  roomId,
  userId
) {
  const query = `
    SELECT COUNT(message.chat_message_id)::INTEGER AS unread_count

    FROM chat_room_members member

    INNER JOIN chat_rooms room
      ON room.room_id = member.room_id
      AND room.room_type = 'private'

    LEFT JOIN chat_messages message
      ON message.room_id = member.room_id
      AND message.sender_user_id <> member.user_id
      AND message.created_at > COALESCE(
        member.last_read_at,
        member.joined_at
      )

    WHERE member.room_id = $1
      AND member.user_id = $2
      AND member.left_at IS NULL
      AND member.is_removed = FALSE

    GROUP BY member.room_member_id
  `;

  const result = await pool.query(query, [roomId, userId]);

  return result.rows[0]?.unread_count ?? 0;
}

/**
 * Delete every message in a private room.
 *
 * This should normally be used only during permanent cleanup.
 */
export async function deletePrivateRoomMessages(
  roomId,
  client = pool
) {
  const query = `
    DELETE FROM chat_messages AS message
    USING chat_rooms AS room

    WHERE message.room_id = $1
      AND room.room_id = message.room_id
      AND room.room_type = 'private'

    RETURNING message.chat_message_id
  `;

  const result = await client.query(query, [roomId]);
  return result.rows;
}

/**
 * Check whether a message belongs to a particular private room.
 */
export async function privateRoomMessageBelongsToRoom(
  messageId,
  roomId
) {
  const query = `
    SELECT EXISTS (
      SELECT 1

      FROM chat_messages message

      INNER JOIN chat_rooms room
        ON room.room_id = message.room_id
        AND room.room_type = 'private'

      WHERE message.chat_message_id = $1
        AND message.room_id = $2
    ) AS belongs_to_room
  `;

  const result = await pool.query(query, [
    messageId,
    roomId,
  ]);

  return result.rows[0].belongs_to_room;
}