import pool from "../../config/database.js";

const MESSAGE_FIELDS = `
  cm.chat_message_id,
  cm.room_id,
  cm.sender_user_id,
  cm.sender_visible_name,
  cm.sender_identity_mode,
  cm.message_text,
  cm.reply_to_message_id,
  cm.message_type,
  cm.is_edited,
  cm.edited_at,
  cm.is_deleted,
  cm.deleted_at,
  cm.deleted_by,
  cm.created_at,
  cm.updated_at
`;

const REPLY_FIELDS = `
  reply.chat_message_id AS reply_message_id,
  reply.sender_visible_name AS reply_sender_visible_name,
  reply.sender_identity_mode AS reply_sender_identity_mode,
  reply.message_text AS reply_message_text,
  reply.message_type AS reply_message_type,
  reply.is_deleted AS reply_is_deleted
`;

export async function createChatMessage({
  roomId,
  senderUserId,
  senderVisibleName,
  senderIdentityMode,
  messageText = null,
  replyToMessageId = null,
  messageType = "text",
  client = pool
}) {
  const query = `
    INSERT INTO chat_messages (
      room_id,
      sender_user_id,
      sender_visible_name,
      sender_identity_mode,
      message_text,
      reply_to_message_id,
      message_type
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
    RETURNING
      chat_message_id,
      room_id,
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
      updated_at;
  `;

  const values = [
    roomId,
    senderUserId,
    senderVisibleName,
    senderIdentityMode,
    messageText,
    replyToMessageId,
    messageType
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
}

export async function findChatMessageById({
  messageId,
  client = pool
}) {
  const query = `
    SELECT
      ${MESSAGE_FIELDS},
      ${REPLY_FIELDS}
    FROM chat_messages cm
    LEFT JOIN chat_messages reply
      ON reply.chat_message_id = cm.reply_to_message_id
    WHERE cm.chat_message_id = $1
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [messageId]);

  return rows[0] ?? null;
}

export async function findChatMessageByIdForUpdate({
  messageId,
  client = pool
}) {
  const query = `
    SELECT
      chat_message_id,
      room_id,
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
    FROM chat_messages
    WHERE chat_message_id = $1
    LIMIT 1
    FOR UPDATE;
  `;

  const { rows } = await client.query(query, [messageId]);

  return rows[0] ?? null;
}

export async function findRoomMessages({
  roomId,
  limit = 30,
  before = null,
  client = pool
}) {
  const query = `
    SELECT
      ${MESSAGE_FIELDS},
      ${REPLY_FIELDS}
    FROM chat_messages cm
    LEFT JOIN chat_messages reply
      ON reply.chat_message_id = cm.reply_to_message_id
    WHERE cm.room_id = $1
      AND (
        $2::timestamptz IS NULL
        OR cm.created_at < $2::timestamptz
      )
    ORDER BY cm.created_at DESC, cm.chat_message_id DESC
    LIMIT $3;
  `;

  const { rows } = await client.query(query, [
    roomId,
    before,
    limit
  ]);

  return rows.reverse();
}

export async function findRoomMessagesByCursor({
  roomId,
  limit = 30,
  beforeCreatedAt = null,
  beforeMessageId = null,
  client = pool
}) {
  const query = `
    SELECT
      ${MESSAGE_FIELDS},
      ${REPLY_FIELDS}
    FROM chat_messages cm
    LEFT JOIN chat_messages reply
      ON reply.chat_message_id = cm.reply_to_message_id
    WHERE cm.room_id = $1
      AND (
        $2::timestamptz IS NULL
        OR $3::uuid IS NULL
        OR (
          cm.created_at,
          cm.chat_message_id
        ) < (
          $2::timestamptz,
          $3::uuid
        )
      )
    ORDER BY cm.created_at DESC, cm.chat_message_id DESC
    LIMIT $4;
  `;

  const { rows } = await client.query(query, [
    roomId,
    beforeCreatedAt,
    beforeMessageId,
    limit
  ]);

  return rows.reverse();
}

export async function countRoomMessages({
  roomId,
  client = pool
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS message_count
    FROM chat_messages
    WHERE room_id = $1;
  `;

  const { rows } = await client.query(query, [roomId]);

  return rows[0]?.message_count ?? 0;
}

export async function countUnreadRoomMessages({
  roomId,
  userId,
  lastReadAt = null,
  client = pool
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS unread_count
    FROM chat_messages
    WHERE room_id = $1
      AND is_deleted = false
      AND sender_user_id IS DISTINCT FROM $2
      AND (
        $3::timestamptz IS NULL
        OR created_at > $3::timestamptz
      );
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId,
    lastReadAt
  ]);

  return rows[0]?.unread_count ?? 0;
}

export async function updateChatMessage({
  messageId,
  messageText,
  client = pool
}) {
  const query = `
    UPDATE chat_messages
    SET
      message_text = $2,
      is_edited = true,
      edited_at = now(),
      updated_at = now()
    WHERE chat_message_id = $1
      AND is_deleted = false
    RETURNING
      chat_message_id,
      room_id,
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
      updated_at;
  `;

  const { rows } = await client.query(query, [
    messageId,
    messageText
  ]);

  return rows[0] ?? null;
}

export async function softDeleteChatMessage({
  messageId,
  deletedBy = "sender",
  client = pool
}) {
  const query = `
    UPDATE chat_messages
    SET
      message_text = NULL,
      is_deleted = true,
      deleted_at = now(),
      deleted_by = $2,
      updated_at = now()
    WHERE chat_message_id = $1
      AND is_deleted = false
    RETURNING
      chat_message_id,
      room_id,
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
      updated_at;
  `;

  const { rows } = await client.query(query, [
    messageId,
    deletedBy
  ]);

  return rows[0] ?? null;
}

export async function findReplyTarget({
  messageId,
  roomId,
  client = pool
}) {
  const query = `
    SELECT
      chat_message_id,
      room_id,
      sender_user_id,
      sender_visible_name,
      sender_identity_mode,
      message_text,
      message_type,
      is_deleted,
      created_at
    FROM chat_messages
    WHERE chat_message_id = $1
      AND room_id = $2
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [
    messageId,
    roomId
  ]);

  return rows[0] ?? null;
}

export async function findLatestRoomMessage({
  roomId,
  client = pool
}) {
  const query = `
    SELECT
      ${MESSAGE_FIELDS},
      ${REPLY_FIELDS}
    FROM chat_messages cm
    LEFT JOIN chat_messages reply
      ON reply.chat_message_id = cm.reply_to_message_id
    WHERE cm.room_id = $1
    ORDER BY cm.created_at DESC, cm.chat_message_id DESC
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [roomId]);

  return rows[0] ?? null;
}

export async function deleteRoomMessages({
  roomId,
  deletedBy = "system",
  client = pool
}) {
  const query = `
    UPDATE chat_messages
    SET
      message_text = NULL,
      is_deleted = true,
      deleted_at = now(),
      deleted_by = $2,
      updated_at = now()
    WHERE room_id = $1
      AND is_deleted = false
    RETURNING chat_message_id;
  `;

  const { rows } = await client.query(query, [
    roomId,
    deletedBy
  ]);

  return rows;
}