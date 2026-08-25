import pool from "../../config/database.js";

/**
 * Add a member to a private room.
 */
export async function addPrivateRoomMember({
  roomId,
  userId,
  visibleName,
  identityMode,
  memberRole = "member",
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
      joined_at
    )
    VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    roomId,
    userId,
    visibleName,
    identityMode,
    memberRole,
  ]);

  return result.rows[0];
}

/**
 * Find an active room member.
 */
export async function findPrivateRoomMember(roomId, userId) {
  const query = `
    SELECT *
    FROM chat_room_members
    WHERE room_id = $1
      AND user_id = $2
      AND left_at IS NULL
      AND is_removed = FALSE
    LIMIT 1
  `;

  const result = await pool.query(query, [roomId, userId]);
  return result.rows[0] || null;
}

/**
 * Rejoin a room.
 */
export async function rejoinPrivateRoomMember(
  roomId,
  userId,
  visibleName,
  identityMode
) {
  const query = `
    UPDATE chat_room_members
    SET
      left_at = NULL,
      is_removed = FALSE,
      visible_name = $3,
      identity_mode = $4,
      joined_at = NOW()
    WHERE room_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [
    roomId,
    userId,
    visibleName,
    identityMode,
  ]);

  return result.rows[0] || null;
}

/**
 * Leave a room.
 */
export async function leavePrivateRoom(roomId, userId) {
  const query = `
    UPDATE chat_room_members
    SET left_at = NOW()
    WHERE room_id = $1
      AND user_id = $2
      AND left_at IS NULL
    RETURNING *
  `;

  const result = await pool.query(query, [roomId, userId]);
  return result.rows[0] || null;
}

/**
 * Remove a member.
 */
export async function removePrivateRoomMember(roomId, userId) {
  const query = `
    UPDATE chat_room_members
    SET
      is_removed = TRUE,
      left_at = NOW()
    WHERE room_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [roomId, userId]);
  return result.rows[0] || null;
}

/**
 * Mute or unmute a member.
 */
export async function updatePrivateRoomMemberMuteStatus(
  roomId,
  userId,
  isMuted
) {
  const query = `
    UPDATE chat_room_members
    SET is_muted = $3
    WHERE room_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [
    roomId,
    userId,
    isMuted,
  ]);

  return result.rows[0] || null;
}

/**
 * Change member role.
 */
export async function updatePrivateRoomMemberRole(
  roomId,
  userId,
  memberRole
) {
  const query = `
    UPDATE chat_room_members
    SET member_role = $3
    WHERE room_id = $1
      AND user_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [
    roomId,
    userId,
    memberRole,
  ]);

  return result.rows[0] || null;
}

/**
 * Update last read timestamp.
 */
export async function updatePrivateRoomLastRead(
  roomId,
  userId
) {
  const query = `
    UPDATE chat_room_members
    SET last_read_at = NOW()
    WHERE room_id = $1
      AND user_id = $2
    RETURNING last_read_at
  `;

  const result = await pool.query(query, [
    roomId,
    userId,
  ]);

  return result.rows[0] || null;
}

/**
 * Get all active members.
 */
export async function getPrivateRoomMembers(roomId) {
  const query = `
    SELECT
      room_member_id,
      user_id,
      visible_name,
      identity_mode,
      member_role,
      is_muted,
      joined_at,
      last_read_at
    FROM chat_room_members
    WHERE room_id = $1
      AND left_at IS NULL
      AND is_removed = FALSE
    ORDER BY joined_at ASC
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows;
}

/**
 * Count active members.
 */
export async function countPrivateRoomMembers(roomId) {
  const query = `
    SELECT COUNT(*)::INTEGER AS member_count
    FROM chat_room_members
    WHERE room_id = $1
      AND left_at IS NULL
      AND is_removed = FALSE
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0].member_count;
}

/**
 * Check whether a member exists.
 */
export async function isPrivateRoomMember(roomId, userId) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM chat_room_members
      WHERE room_id = $1
        AND user_id = $2
        AND left_at IS NULL
        AND is_removed = FALSE
    ) AS is_member
  `;

  const result = await pool.query(query, [
    roomId,
    userId,
  ]);

  return result.rows[0].is_member;
}