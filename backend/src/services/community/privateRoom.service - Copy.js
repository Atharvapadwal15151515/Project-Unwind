import crypto from "crypto";

import {
  createPrivateRoom,
  findPrivateRoomById,
  findPrivateRoomByCode,
  findPrivateRoomByInviteToken,
  findPrivateRoomsForMember,
  updatePrivateRoomDetails,
  updatePrivateRoomLockStatus,
  updatePrivateRoomInviteToken,
  updatePrivateRoomLastActivity,
  transferPrivateRoomOwnership,
  deactivatePrivateRoom,
  countPrivateRoomMembers,
  isPrivateRoomOwner,
} from "../../models/community/privateRoom.model.js";

import {
  addPrivateRoomMember,
  findPrivateRoomMember,
  rejoinPrivateRoomMember,
  leavePrivateRoom,
  removePrivateRoomMember,
  updatePrivateRoomMemberMuteStatus,
  updatePrivateRoomMemberRole,
  updatePrivateRoomLastRead,
  getPrivateRoomMembers,
} from "../../models/community/privateRoomMember.model.js";

import {
  createPrivateRoomMessage,
  findPrivateRoomMessageById,
  findPrivateRoomMessagesByCursor,
  findPrivateRoomReplyTarget,
  updatePrivateRoomMessage,
  softDeletePrivateRoomMessage,
  countUnreadPrivateRoomMessages,
} from "../../models/community/privateRoomMessage.model.js";

import {
  getCommunityProfile,
} from "./communityProfile.service.js";

import {
  generateRoomCode,
} from "../../utils/generateRoomCode.js";

import pool from "../../config/database.js";

const MAX_MESSAGE_LENGTH = 2000;
const EDIT_WINDOW_MINUTES = 10;
const DEFAULT_MAX_MEMBERS = 20;

function createServiceError(message, statusCode = 400, code = "PRIVATE_ROOM_ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function generateInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

function validateMessageText(messageText) {
  if (typeof messageText !== "string" || !messageText.trim()) {
    throw createServiceError(
      "Message text is required.",
      400,
      "MESSAGE_REQUIRED"
    );
  }

  const trimmedText = messageText.trim();

  if (trimmedText.length > MAX_MESSAGE_LENGTH) {
    throw createServiceError(
      `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      400,
      "MESSAGE_TOO_LONG"
    );
  }

  return trimmedText;
}

async function getActiveCommunityIdentity(userId) {
  const community = await getCommunityProfile(userId);

  if (!community?.profile) {
    throw createServiceError(
      "Community profile not found.",
      404,
      "COMMUNITY_PROFILE_NOT_FOUND"
    );
  }

  if (!community.profile.is_active) {
    throw createServiceError(
      "Community access is currently disabled.",
      403,
      "COMMUNITY_ACCESS_DISABLED"
    );
  }

  return {
    profile: community.profile,
    visibleName: community.visibleName,
    identityMode: community.profile.identity_mode,
  };
}

async function requirePrivateRoom(roomId) {
  const room = await findPrivateRoomById(roomId);

  if (!room) {
    throw createServiceError(
      "Private room not found or no longer active.",
      404,
      "PRIVATE_ROOM_NOT_FOUND"
    );
  }

  return room;
}

async function requirePrivateRoomMember(roomId, userId) {
  const member = await findPrivateRoomMember(roomId, userId);

  if (!member) {
    throw createServiceError(
      "You are not an active member of this room.",
      403,
      "ROOM_MEMBERSHIP_REQUIRED"
    );
  }

  return member;
}

async function requirePrivateRoomOwner(roomId, userId) {
  const ownsRoom = await isPrivateRoomOwner(roomId, userId);

  if (!ownsRoom) {
    throw createServiceError(
      "Only the room owner can perform this action.",
      403,
      "ROOM_OWNER_REQUIRED"
    );
  }
}

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const roomCode = generateRoomCode();
    const existingRoom = await findPrivateRoomByCode(roomCode);

    if (!existingRoom) {
      return roomCode;
    }
  }

  throw createServiceError(
    "Unable to generate a unique room code.",
    500,
    "ROOM_CODE_GENERATION_FAILED"
  );
}

export async function createPrivateChatRoom({
  userId,
  roomName,
  roomDescription = null,
  maximumMembers = DEFAULT_MAX_MEMBERS,
  expiresAt = null,
}) {
  const community = await getActiveCommunityIdentity(userId);

  const normalizedName = roomName?.trim();

  if (!normalizedName) {
    throw createServiceError(
      "Room name is required.",
      400,
      "ROOM_NAME_REQUIRED"
    );
  }

  if (
    !Number.isInteger(maximumMembers) ||
    maximumMembers < 2 ||
    maximumMembers > 100
  ) {
    throw createServiceError(
      "Maximum members must be between 2 and 100.",
      400,
      "INVALID_MEMBER_LIMIT"
    );
  }

  if (expiresAt && new Date(expiresAt) <= new Date()) {
    throw createServiceError(
      "Room expiry must be in the future.",
      400,
      "INVALID_EXPIRY_DATE"
    );
  }

  const roomCode = await createUniqueRoomCode();
  const inviteToken = generateInviteToken();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roomQuery = `
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

    const roomResult = await client.query(roomQuery, [
      userId,
      normalizedName,
      roomDescription?.trim() || null,
      roomCode,
      inviteToken,
      maximumMembers,
      expiresAt,
    ]);

    const room = roomResult.rows[0];

    const memberQuery = `
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
      VALUES ($1, $2, $3, $4, 'owner', FALSE, FALSE, NOW())
      RETURNING *
    `;

    const memberResult = await client.query(memberQuery, [
      room.room_id,
      userId,
      community.visibleName,
      community.identityMode,
    ]);

    await client.query("COMMIT");

    return {
      room,
      membership: memberResult.rows[0],
      member_count: 1,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function joinPrivateRoomByCode({
  userId,
  roomCode,
}) {
  const normalizedCode = String(roomCode || "").trim();

  if (!normalizedCode) {
    throw createServiceError(
      "Room code is required.",
      400,
      "ROOM_CODE_REQUIRED"
    );
  }

  const room = await findPrivateRoomByCode(normalizedCode);

  if (!room) {
    throw createServiceError(
      "Invalid or expired room code.",
      404,
      "ROOM_NOT_FOUND"
    );
  }

  return joinPrivateRoom({
    userId,
    room,
  });
}

export async function joinPrivateRoomByInviteToken({
  userId,
  inviteToken,
}) {
  const normalizedToken = String(inviteToken || "").trim();

  if (!normalizedToken) {
    throw createServiceError(
      "Invite token is required.",
      400,
      "INVITE_TOKEN_REQUIRED"
    );
  }

  const room = await findPrivateRoomByInviteToken(normalizedToken);

  if (!room) {
    throw createServiceError(
      "Invalid or expired invite token.",
      404,
      "ROOM_NOT_FOUND"
    );
  }

  return joinPrivateRoom({
    userId,
    room,
  });
}

async function joinPrivateRoom({
  userId,
  room,
}) {
  const community = await getActiveCommunityIdentity(userId);

  if (room.is_locked && room.owner_user_id !== userId) {
    throw createServiceError(
      "This room is currently locked.",
      403,
      "ROOM_LOCKED"
    );
  }

  const existingMember = await findPrivateRoomMember(room.room_id, userId);

  if (existingMember) {
    return {
      room,
      membership: existingMember,
      member_count: await countPrivateRoomMembers(room.room_id),
      already_joined: true,
    };
  }

  const memberCount = await countPrivateRoomMembers(room.room_id);

  if (memberCount >= room.maximum_members) {
    throw createServiceError(
      "This room has reached its member limit.",
      409,
      "ROOM_FULL"
    );
  }

  const rejoined = await rejoinPrivateRoomMember(
    room.room_id,
    userId,
    community.visibleName,
    community.identityMode
  );

  const membership =
    rejoined ||
    (await addPrivateRoomMember({
      roomId: room.room_id,
      userId,
      visibleName: community.visibleName,
      identityMode: community.identityMode,
      memberRole: "member",
    }));

  await updatePrivateRoomLastActivity(room.room_id);

  return {
    room,
    membership,
    member_count: memberCount + 1,
    already_joined: false,
  };
}

export async function leavePrivateChatRoom({
  roomId,
  userId,
}) {
  const room = await requirePrivateRoom(roomId);
  const member = await requirePrivateRoomMember(roomId, userId);

  if (room.owner_user_id === userId) {
    const members = await getPrivateRoomMembers(roomId);

    const nextOwner = members.find(
      (roomMember) => roomMember.user_id !== userId
    );

    if (nextOwner) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `
            UPDATE chat_rooms
            SET owner_user_id = $2, updated_at = NOW()
            WHERE room_id = $1
              AND room_type = 'private'
          `,
          [roomId, nextOwner.user_id]
        );

        await client.query(
          `
            UPDATE chat_room_members
            SET member_role = 'member'
            WHERE room_id = $1
              AND user_id = $2
          `,
          [roomId, userId]
        );

        await client.query(
          `
            UPDATE chat_room_members
            SET member_role = 'owner'
            WHERE room_id = $1
              AND user_id = $2
          `,
          [roomId, nextOwner.user_id]
        );

        await client.query(
          `
            UPDATE chat_room_members
            SET left_at = NOW()
            WHERE room_id = $1
              AND user_id = $2
          `,
          [roomId, userId]
        );

        await client.query("COMMIT");

        return {
          left: true,
          room_deactivated: false,
          ownership_transferred_to: nextOwner.user_id,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    await deactivatePrivateRoom(roomId);
    await leavePrivateRoom(roomId, userId);

    return {
      left: true,
      room_deactivated: true,
      ownership_transferred_to: null,
    };
  }

  await leavePrivateRoom(roomId, userId);

  return {
    left: true,
    room_deactivated: false,
    ownership_transferred_to: null,
    membership: member,
  };
}

export async function getPrivateRoomDetails({
  roomId,
  userId,
}) {
  const room = await requirePrivateRoom(roomId);
  const membership = await requirePrivateRoomMember(roomId, userId);

  return {
    room,
    membership,
    member_count: await countPrivateRoomMembers(roomId),
  };
}

export async function listMyPrivateRooms(userId) {
  return findPrivateRoomsForMember(userId);
}

export async function getPrivateRoomMembersList({
  roomId,
  userId,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomMember(roomId, userId);

  return getPrivateRoomMembers(roomId);
}

export async function updatePrivateChatRoom({
  roomId,
  userId,
  roomName,
  roomDescription,
  maximumMembers,
  expiresAt,
}) {
  const room = await requirePrivateRoom(roomId);
  await requirePrivateRoomOwner(roomId, userId);

  if (roomName !== undefined && !roomName.trim()) {
    throw createServiceError(
      "Room name cannot be empty.",
      400,
      "INVALID_ROOM_NAME"
    );
  }

  if (maximumMembers !== undefined) {
    const currentCount = await countPrivateRoomMembers(roomId);

    if (
      !Number.isInteger(maximumMembers) ||
      maximumMembers < currentCount ||
      maximumMembers > 100
    ) {
      throw createServiceError(
        `Maximum members must be between ${currentCount} and 100.`,
        400,
        "INVALID_MEMBER_LIMIT"
      );
    }
  }

  if (expiresAt !== undefined && expiresAt !== null) {
    if (new Date(expiresAt) <= new Date()) {
      throw createServiceError(
        "Room expiry must be in the future.",
        400,
        "INVALID_EXPIRY_DATE"
      );
    }
  }

  return updatePrivateRoomDetails(roomId, {
    roomName: roomName?.trim(),
    roomDescription:
      roomDescription === undefined
        ? undefined
        : roomDescription?.trim() || null,
    maximumMembers,
    expiresAt,
  });
}

export async function setPrivateRoomLock({
  roomId,
  userId,
  isLocked,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomOwner(roomId, userId);

  return updatePrivateRoomLockStatus(roomId, Boolean(isLocked));
}

export async function regeneratePrivateRoomInvite({
  roomId,
  userId,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomOwner(roomId, userId);

  const inviteToken = generateInviteToken();

  const room = await updatePrivateRoomInviteToken(
    roomId,
    inviteToken
  );

  return {
    room,
    invite_token: inviteToken,
  };
}

export async function removeMemberFromPrivateRoom({
  roomId,
  ownerUserId,
  targetUserId,
}) {
  const room = await requirePrivateRoom(roomId);
  await requirePrivateRoomOwner(roomId, ownerUserId);

  if (targetUserId === ownerUserId) {
    throw createServiceError(
      "The room owner cannot remove themselves.",
      400,
      "OWNER_CANNOT_BE_REMOVED"
    );
  }

  const targetMember = await requirePrivateRoomMember(
    roomId,
    targetUserId
  );

  const removedMember = await removePrivateRoomMember(
    roomId,
    targetUserId
  );

  return {
    room,
    removed_member: removedMember || targetMember,
  };
}

export async function setPrivateRoomMemberMute({
  roomId,
  ownerUserId,
  targetUserId,
  isMuted,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomOwner(roomId, ownerUserId);

  if (targetUserId === ownerUserId) {
    throw createServiceError(
      "The room owner cannot mute themselves.",
      400,
      "OWNER_CANNOT_BE_MUTED"
    );
  }

  await requirePrivateRoomMember(roomId, targetUserId);

  return updatePrivateRoomMemberMuteStatus(
    roomId,
    targetUserId,
    Boolean(isMuted)
  );
}

export async function transferPrivateRoomOwner({
  roomId,
  ownerUserId,
  newOwnerUserId,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomOwner(roomId, ownerUserId);

  if (newOwnerUserId === ownerUserId) {
    throw createServiceError(
      "This user already owns the room.",
      400,
      "ALREADY_ROOM_OWNER"
    );
  }

  await requirePrivateRoomMember(roomId, newOwnerUserId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE chat_rooms
        SET owner_user_id = $2, updated_at = NOW()
        WHERE room_id = $1
          AND room_type = 'private'
      `,
      [roomId, newOwnerUserId]
    );

    await client.query(
      `
        UPDATE chat_room_members
        SET member_role = 'member'
        WHERE room_id = $1
          AND user_id = $2
      `,
      [roomId, ownerUserId]
    );

    await client.query(
      `
        UPDATE chat_room_members
        SET member_role = 'owner'
        WHERE room_id = $1
          AND user_id = $2
      `,
      [roomId, newOwnerUserId]
    );

    await client.query("COMMIT");

    return {
      transferred: true,
      previous_owner_user_id: ownerUserId,
      new_owner_user_id: newOwnerUserId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePrivateChatRoom({
  roomId,
  userId,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomOwner(roomId, userId);

  return deactivatePrivateRoom(roomId);
}

export async function sendPrivateRoomMessage({
  roomId,
  userId,
  messageText,
  replyToMessageId = null,
  messageType = "text",
}) {
  const room = await requirePrivateRoom(roomId);
  const member = await requirePrivateRoomMember(roomId, userId);

  if (member.is_muted) {
    throw createServiceError(
      "You are muted in this room.",
      403,
      "ROOM_MEMBER_MUTED"
    );
  }

  const normalizedMessage = validateMessageText(messageText);

  if (replyToMessageId) {
    const replyTarget = await findPrivateRoomReplyTarget(
      roomId,
      replyToMessageId
    );

    if (!replyTarget) {
      throw createServiceError(
        "Reply target was not found in this room.",
        404,
        "REPLY_TARGET_NOT_FOUND"
      );
    }
  }

  const message = await createPrivateRoomMessage({
    roomId,
    senderUserId: userId,
    senderVisibleName: member.visible_name,
    senderIdentityMode: member.identity_mode,
    messageText: normalizedMessage,
    replyToMessageId,
    messageType,
  });

  if (!message) {
    throw createServiceError(
      "Unable to send message.",
      500,
      "MESSAGE_CREATION_FAILED"
    );
  }

  await updatePrivateRoomLastActivity(room.room_id);

  return findPrivateRoomMessageById(message.chat_message_id);
}

export async function getPrivateRoomMessageHistory({
  roomId,
  userId,
  beforeMessageId = null,
  limit = 30,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomMember(roomId, userId);

  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  return findPrivateRoomMessagesByCursor({
    roomId,
    beforeMessageId,
    limit: normalizedLimit,
  });
}

export async function editPrivateRoomMessage({
  messageId,
  userId,
  messageText,
}) {
  const normalizedMessage = validateMessageText(messageText);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const messageResult = await client.query(
      `
        SELECT message.*
        FROM chat_messages message
        INNER JOIN chat_rooms room
          ON room.room_id = message.room_id
          AND room.room_type = 'private'
        WHERE message.chat_message_id = $1
        FOR UPDATE
      `,
      [messageId]
    );

    const message = messageResult.rows[0];

    if (!message) {
      throw createServiceError(
        "Message not found.",
        404,
        "MESSAGE_NOT_FOUND"
      );
    }

    if (message.sender_user_id !== userId) {
      throw createServiceError(
        "You can edit only your own messages.",
        403,
        "MESSAGE_EDIT_FORBIDDEN"
      );
    }

    if (message.is_deleted) {
      throw createServiceError(
        "Deleted messages cannot be edited.",
        400,
        "MESSAGE_ALREADY_DELETED"
      );
    }

    const editableUntil = new Date(message.created_at);
    editableUntil.setMinutes(
      editableUntil.getMinutes() + EDIT_WINDOW_MINUTES
    );

    if (new Date() > editableUntil) {
      throw createServiceError(
        `Messages can only be edited within ${EDIT_WINDOW_MINUTES} minutes.`,
        403,
        "EDIT_WINDOW_EXPIRED"
      );
    }

    await client.query(
      `
        UPDATE chat_messages
        SET
          message_text = $2,
          is_edited = TRUE,
          edited_at = NOW(),
          updated_at = NOW()
        WHERE chat_message_id = $1
      `,
      [messageId, normalizedMessage]
    );

    await client.query("COMMIT");

    return findPrivateRoomMessageById(messageId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePrivateRoomMessage({
  messageId,
  userId,
}) {
  const message = await findPrivateRoomMessageById(messageId);

  if (!message) {
    throw createServiceError(
      "Message not found.",
      404,
      "MESSAGE_NOT_FOUND"
    );
  }

  const membership = await requirePrivateRoomMember(
    message.room_id,
    userId
  );

  const roomOwner = await isPrivateRoomOwner(
    message.room_id,
    userId
  );

  const canDelete =
    message.sender_user_id === userId ||
    roomOwner ||
    membership.member_role === "moderator";

  if (!canDelete) {
    throw createServiceError(
      "You cannot delete this message.",
      403,
      "MESSAGE_DELETE_FORBIDDEN"
    );
  }

  if (message.is_deleted) {
    throw createServiceError(
      "Message is already deleted.",
      400,
      "MESSAGE_ALREADY_DELETED"
    );
  }

  await softDeletePrivateRoomMessage({
    messageId,
    deletedBy: userId,
  });

  return findPrivateRoomMessageById(messageId);
}

export async function markPrivateRoomAsRead({
  roomId,
  userId,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomMember(roomId, userId);

  return updatePrivateRoomLastRead(roomId, userId);
}

export async function getPrivateRoomUnreadCount({
  roomId,
  userId,
}) {
  await requirePrivateRoom(roomId);
  await requirePrivateRoomMember(roomId, userId);

  return countUnreadPrivateRoomMessages(roomId, userId);
}