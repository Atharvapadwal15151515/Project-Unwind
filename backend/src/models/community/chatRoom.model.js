import pool from "../../config/database.js";

export async function createPublicChatRoom({
  roomName = "Public Community Chat",
  roomDescription = "A shared public space for the UNWIND community.",
  maximumMembers = 500,
  client = pool
}) {
  const query = `
    INSERT INTO chat_rooms (
      owner_user_id,
      room_name,
      room_description,
      room_type,
      room_code,
      maximum_members,
      is_locked,
      is_active
    )
    VALUES (
      NULL,
      $1,
      $2,
      'public',
      NULL,
      $3,
      false,
      true
    )
    RETURNING
      room_id,
      owner_user_id,
      room_name,
      room_description,
      room_type,
      room_code,
      invite_token,
      maximum_members,
      is_locked,
      is_active,
      expires_at,
      last_activity_at,
      created_at,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    roomName,
    roomDescription,
    maximumMembers
  ]);

  return rows[0];
}

export async function findPublicChatRoom({
  client = pool
} = {}) {
  const query = `
    SELECT
      room_id,
      owner_user_id,
      room_name,
      room_description,
      room_type,
      room_code,
      invite_token,
      maximum_members,
      is_locked,
      is_active,
      expires_at,
      last_activity_at,
      created_at,
      updated_at
    FROM chat_rooms
    WHERE room_type = 'public'
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
  `;

  const { rows } = await client.query(query);

  return rows[0] ?? null;
}

export async function findOrCreatePublicChatRoom({
  client = pool
} = {}) {
  const existingRoom = await findPublicChatRoom({
    client
  });

  if (existingRoom) {
    return existingRoom;
  }

  return createPublicChatRoom({
    client
  });
}

export async function findChatRoomById({
  roomId,
  client = pool
}) {
  const query = `
    SELECT
      room_id,
      owner_user_id,
      room_name,
      room_description,
      room_type,
      room_code,
      invite_token,
      maximum_members,
      is_locked,
      is_active,
      expires_at,
      last_activity_at,
      created_at,
      updated_at
    FROM chat_rooms
    WHERE room_id = $1
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows[0] ?? null;
}

export async function findActiveChatRoomById({
  roomId,
  client = pool
}) {
  const query = `
    SELECT
      room_id,
      owner_user_id,
      room_name,
      room_description,
      room_type,
      room_code,
      invite_token,
      maximum_members,
      is_locked,
      is_active,
      expires_at,
      last_activity_at,
      created_at,
      updated_at
    FROM chat_rooms
    WHERE room_id = $1
      AND is_active = true
      AND (
        expires_at IS NULL
        OR expires_at > now()
      )
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows[0] ?? null;
}

export async function updateChatRoomLastActivity({
  roomId,
  client = pool
}) {
  const query = `
    UPDATE chat_rooms
    SET
      last_activity_at = now(),
      updated_at = now()
    WHERE room_id = $1
    RETURNING
      room_id,
      last_activity_at,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows[0] ?? null;
}

export async function countActiveRoomMembers({
  roomId,
  client = pool
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS member_count
    FROM chat_room_members
    WHERE room_id = $1
      AND is_removed = false
      AND left_at IS NULL;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows[0]?.member_count ?? 0;
}

export async function lockChatRoom({
  roomId,
  client = pool
}) {
  const query = `
    UPDATE chat_rooms
    SET
      is_locked = true,
      updated_at = now()
    WHERE room_id = $1
    RETURNING
      room_id,
      is_locked,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows[0] ?? null;
}

export async function unlockChatRoom({
  roomId,
  client = pool
}) {
  const query = `
    UPDATE chat_rooms
    SET
      is_locked = false,
      updated_at = now()
    WHERE room_id = $1
    RETURNING
      room_id,
      is_locked,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows[0] ?? null;
}

export async function deactivateChatRoom({
  roomId,
  client = pool
}) {
  const query = `
    UPDATE chat_rooms
    SET
      is_active = false,
      updated_at = now()
    WHERE room_id = $1
    RETURNING
      room_id,
      is_active,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows[0] ?? null;
}