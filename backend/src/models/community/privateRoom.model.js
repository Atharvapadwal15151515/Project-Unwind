import pool from "../../config/database.js";

/**
 * Create a private chat room.
 */
export async function createPrivateRoom({
  ownerUserId,
  roomName,
  roomDescription = null,
  roomCode,
  inviteToken,
  maximumMembers,
  expiresAt = null,
}) {
  const query = `
    INSERT INTO chat_rooms (
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
      last_activity_at
    )
    VALUES ($1, $2, $3, 'private', $4, $5, $6, FALSE, TRUE, $7, NOW())
    RETURNING *
  `;

  const values = [
    ownerUserId,
    roomName,
    roomDescription,
    roomCode,
    inviteToken,
    maximumMembers,
    expiresAt,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Find an active private room using its room ID.
 */
export async function findPrivateRoomById(roomId) {
  const query = `
    SELECT *
    FROM chat_rooms
    WHERE room_id = $1
      AND room_type = 'private'
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0] || null;
}

/**
 * Find a private room even when it is inactive.
 * Useful for ownership and moderation checks.
 */
export async function findPrivateRoomByIdIncludingInactive(roomId) {
  const query = `
    SELECT *
    FROM chat_rooms
    WHERE room_id = $1
      AND room_type = 'private'
    LIMIT 1
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0] || null;
}

/**
 * Find an active private room using its 8-digit room code.
 */
export async function findPrivateRoomByCode(roomCode) {
  const query = `
    SELECT *
    FROM chat_rooms
    WHERE room_code = $1
      AND room_type = 'private'
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `;

  const result = await pool.query(query, [roomCode]);
  return result.rows[0] || null;
}

/**
 * Find an active private room using its invite token.
 */
export async function findPrivateRoomByInviteToken(inviteToken) {
  const query = `
    SELECT *
    FROM chat_rooms
    WHERE invite_token = $1
      AND room_type = 'private'
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `;

  const result = await pool.query(query, [inviteToken]);
  return result.rows[0] || null;
}

/**
 * Return private rooms owned by a user.
 */
export async function findPrivateRoomsOwnedByUser(userId) {
  const query = `
    SELECT
      cr.*,
      COUNT(
        CASE
          WHEN crm.left_at IS NULL
            AND crm.is_removed = FALSE
          THEN 1
        END
      )::INTEGER AS current_member_count
    FROM chat_rooms cr
    LEFT JOIN chat_room_members crm
      ON crm.room_id = cr.room_id
    WHERE cr.owner_user_id = $1
      AND cr.room_type = 'private'
      AND cr.is_active = TRUE
      AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
    GROUP BY cr.room_id
    ORDER BY cr.last_activity_at DESC, cr.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Return every active private room joined by a user.
 */
export async function findPrivateRoomsForMember(userId) {
  const query = `
    SELECT
      cr.*,
      crm.member_role,
      crm.identity_mode,
      crm.visible_name,
      crm.is_muted,
      crm.joined_at,
      crm.last_read_at,
      (
        SELECT COUNT(*)::INTEGER
        FROM chat_room_members active_members
        WHERE active_members.room_id = cr.room_id
          AND active_members.left_at IS NULL
          AND active_members.is_removed = FALSE
      ) AS current_member_count
    FROM chat_room_members crm
    INNER JOIN chat_rooms cr
      ON cr.room_id = crm.room_id
    WHERE crm.user_id = $1
      AND crm.left_at IS NULL
      AND crm.is_removed = FALSE
      AND cr.room_type = 'private'
      AND cr.is_active = TRUE
      AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
    ORDER BY cr.last_activity_at DESC, cr.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Check whether a room code is already in use.
 */
export async function privateRoomCodeExists(roomCode) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE room_code = $1
    ) AS exists
  `;

  const result = await pool.query(query, [roomCode]);
  return result.rows[0].exists;
}

/**
 * Check whether an invite token is already in use.
 */
export async function privateRoomInviteTokenExists(inviteToken) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE invite_token = $1
    ) AS exists
  `;

  const result = await pool.query(query, [inviteToken]);
  return result.rows[0].exists;
}

/**
 * Update the basic details of a private room.
 */
export async function updatePrivateRoomDetails(
  roomId,
  {
    roomName,
    roomDescription,
    maximumMembers,
    expiresAt,
  }
) {
  const query = `
    UPDATE chat_rooms
    SET
      room_name = COALESCE($2, room_name),
      room_description = CASE
        WHEN $3::BOOLEAN = TRUE THEN $4
        ELSE room_description
      END,
      maximum_members = COALESCE($5, maximum_members),
      expires_at = CASE
        WHEN $6::BOOLEAN = TRUE THEN $7
        ELSE expires_at
      END,
      updated_at = NOW()
    WHERE room_id = $1
      AND room_type = 'private'
    RETURNING *
  `;

  const hasRoomDescription = roomDescription !== undefined;
  const hasExpiresAt = expiresAt !== undefined;

  const values = [
    roomId,
    roomName ?? null,
    hasRoomDescription,
    roomDescription ?? null,
    maximumMembers ?? null,
    hasExpiresAt,
    expiresAt ?? null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Lock or unlock a private room.
 */
export async function updatePrivateRoomLockStatus(roomId, isLocked) {
  const query = `
    UPDATE chat_rooms
    SET
      is_locked = $2,
      updated_at = NOW()
    WHERE room_id = $1
      AND room_type = 'private'
    RETURNING *
  `;

  const result = await pool.query(query, [roomId, isLocked]);
  return result.rows[0] || null;
}

/**
 * Generate and replace the room's invite token.
 */
export async function updatePrivateRoomInviteToken(roomId, inviteToken) {
  const query = `
    UPDATE chat_rooms
    SET
      invite_token = $2,
      updated_at = NOW()
    WHERE room_id = $1
      AND room_type = 'private'
    RETURNING *
  `;

  const result = await pool.query(query, [roomId, inviteToken]);
  return result.rows[0] || null;
}

/**
 * Update the latest room activity timestamp.
 */
export async function updatePrivateRoomLastActivity(roomId) {
  const query = `
    UPDATE chat_rooms
    SET
      last_activity_at = NOW(),
      updated_at = NOW()
    WHERE room_id = $1
      AND room_type = 'private'
    RETURNING last_activity_at
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0] || null;
}

/**
 * Transfer room ownership to another member.
 */
export async function transferPrivateRoomOwnership(roomId, newOwnerUserId) {
  const query = `
    UPDATE chat_rooms
    SET
      owner_user_id = $2,
      updated_at = NOW()
    WHERE room_id = $1
      AND room_type = 'private'
    RETURNING *
  `;

  const result = await pool.query(query, [roomId, newOwnerUserId]);
  return result.rows[0] || null;
}

/**
 * Deactivate a private room.
 */
export async function deactivatePrivateRoom(roomId) {
  const query = `
    UPDATE chat_rooms
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE room_id = $1
      AND room_type = 'private'
    RETURNING *
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0] || null;
}

/**
 * Reactivate a private room when required by an administrator.
 */
export async function reactivatePrivateRoom(roomId) {
  const query = `
    UPDATE chat_rooms
    SET
      is_active = TRUE,
      updated_at = NOW()
    WHERE room_id = $1
      AND room_type = 'private'
    RETURNING *
  `;

  const result = await pool.query(query, [roomId]);
  return result.rows[0] || null;
}

/**
 * Return the current number of active members.
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
 * Verify whether a user owns a private room.
 */
export async function isPrivateRoomOwner(roomId, userId) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE room_id = $1
        AND owner_user_id = $2
        AND room_type = 'private'
    ) AS is_owner
  `;

  const result = await pool.query(query, [roomId, userId]);
  return result.rows[0].is_owner;
}