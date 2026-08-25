import pool from "../../config/database.js";

export async function findRoomMember({
  roomId,
  userId,
  client = pool
}) {
  const query = `
    SELECT
      room_member_id,
      room_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      is_muted,
      is_removed,
      joined_at,
      left_at,
      last_read_at
    FROM chat_room_members
    WHERE room_id = $1
      AND user_id = $2
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function addRoomMember({
  roomId,
  userId,
  visibleName,
  identityMode,
  memberRole = "member",
  client = pool
}) {
  const query = `
    INSERT INTO chat_room_members (
      room_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      is_muted,
      is_removed,
      joined_at,
      left_at,
      last_read_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      false,
      false,
      now(),
      NULL,
      now()
    )
    RETURNING
      room_member_id,
      room_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      is_muted,
      is_removed,
      joined_at,
      left_at,
      last_read_at;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId,
    visibleName,
    identityMode,
    memberRole
  ]);

  return rows[0];
}

export async function rejoinRoomMember({
  roomId,
  userId,
  visibleName,
  identityMode,
  client = pool
}) {
  const query = `
    UPDATE chat_room_members
    SET
      visible_name = $3,
      identity_mode = $4,
      is_removed = false,
      left_at = NULL,
      joined_at = now()
    WHERE room_id = $1
      AND user_id = $2
    RETURNING
      room_member_id,
      room_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      is_muted,
      is_removed,
      joined_at,
      left_at,
      last_read_at;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId,
    visibleName,
    identityMode
  ]);

  return rows[0] ?? null;
}

export async function updateRoomMemberIdentity({
  roomId,
  userId,
  visibleName,
  identityMode,
  client = pool
}) {
  const query = `
    UPDATE chat_room_members
    SET
      visible_name = $3,
      identity_mode = $4
    WHERE room_id = $1
      AND user_id = $2
      AND is_removed = false
      AND left_at IS NULL
    RETURNING
      room_member_id,
      room_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      is_muted,
      is_removed,
      joined_at,
      left_at,
      last_read_at;
  `;

  const { rows } =
    await client.query(
      query,
      [
        roomId,
        userId,
        visibleName,
        identityMode
      ]
    );

  return rows[0] ?? null;
}

export async function leaveRoom({
  roomId,
  userId,
  client = pool
}) {
  const query = `
    UPDATE chat_room_members
    SET
      left_at = now()
    WHERE room_id = $1
      AND user_id = $2
    RETURNING
      room_member_id,
      room_id,
      user_id,
      left_at;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function removeRoomMember({
  roomId,
  userId,
  client = pool
}) {
  const query = `
    UPDATE chat_room_members
    SET
      is_removed = true,
      left_at = now()
    WHERE room_id = $1
      AND user_id = $2
    RETURNING
      room_member_id,
      room_id,
      user_id,
      is_removed,
      left_at;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function updateLastRead({
  roomId,
  userId,
  client = pool
}) {
  const query = `
    UPDATE chat_room_members
    SET
      last_read_at = now()
    WHERE room_id = $1
      AND user_id = $2
    RETURNING
      room_member_id,
      last_read_at;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function getRoomMembers({
  roomId,
  client = pool
}) {
  const query = `
    SELECT
      room_member_id,
      room_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      is_muted,
      is_removed,
      joined_at,
      left_at,
      last_read_at
    FROM chat_room_members
    WHERE room_id = $1
      AND is_removed = false
      AND left_at IS NULL
    ORDER BY joined_at ASC;
  `;

  const { rows } = await client.query(query, [
    roomId
  ]);

  return rows;
}

export async function countRoomMembers({
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

export async function updateMemberMuteStatus({
  roomId,
  userId,
  isMuted,
  client = pool
}) {
  const query = `
    UPDATE chat_room_members
    SET
      is_muted = $3
    WHERE room_id = $1
      AND user_id = $2
    RETURNING
      room_member_id,
      is_muted;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId,
    isMuted
  ]);

  return rows[0] ?? null;
}

export async function updateMemberRole({
  roomId,
  userId,
  memberRole,
  client = pool
}) {
  const query = `
    UPDATE chat_room_members
    SET
      member_role = $3
    WHERE room_id = $1
      AND user_id = $2
    RETURNING
      room_member_id,
      member_role;
  `;

  const { rows } = await client.query(query, [
    roomId,
    userId,
    memberRole
  ]);

  return rows[0] ?? null;
}