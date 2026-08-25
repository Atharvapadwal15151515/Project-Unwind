import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";

import {
  findOrCreatePublicChatRoom,
  findActiveChatRoomById,
  updateChatRoomLastActivity
} from "../../models/community/chatRoom.model.js";

import {
  findRoomMember,
  addRoomMember,
  rejoinRoomMember,
  updateRoomMemberIdentity,
  leaveRoom,
  getRoomMembers,
  countRoomMembers,
  updateLastRead
} from "../../models/community/chatRoomMember.model.js";

import {
  getCommunityProfile
} from "./communityProfile.service.js";

export async function getPublicChatRoom() {
  return findOrCreatePublicChatRoom();
}

export async function joinPublicChatRoom(userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const room = await findOrCreatePublicChatRoom({
      client
    });

 const community = await getCommunityProfile(userId);

if (!community) {
  throw new AppError("Community profile not found.", 404);
}

const profile = community.profile;

if (!profile.is_active) {
  throw new AppError(
    "Community access is disabled for this account.",
    403
  );
}

    const existingMember = await findRoomMember({
      roomId: room.room_id,
      userId,
      client
    });

    let membership;

    if (!existingMember) {
  membership =
    await addRoomMember({
      roomId:
        room.room_id,

      userId,

      visibleName:
        community.visibleName,

      identityMode:
        profile.identity_mode,

      client
    });
} else if (
  existingMember.left_at !== null ||
  existingMember.is_removed
) {
  membership =
    await rejoinRoomMember({
      roomId:
        room.room_id,

      userId,

      visibleName:
        community.visibleName,

      identityMode:
        profile.identity_mode,

      client
    });
} else {
  /*
   * User is already a member.
   *
   * Refresh the public-facing
   * identity because they may have
   * switched between username and
   * anonymous mode.
   */
  membership =
    await updateRoomMemberIdentity({
      roomId:
        room.room_id,

      userId,

      visibleName:
        community.visibleName,

      identityMode:
        profile.identity_mode,

      client
    });
}

    await updateLastRead({
      roomId: room.room_id,
      userId,
      client
    });

    await updateChatRoomLastActivity({
      roomId: room.room_id,
      client
    });

    const memberCount = await countRoomMembers({
      roomId: room.room_id,
      client
    });

    await client.query("COMMIT");

    return {
      room,
      membership,
      memberCount
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function leavePublicChatRoom(userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const room = await findOrCreatePublicChatRoom({
      client
    });

    const member = await findRoomMember({
      roomId: room.room_id,
      userId,
      client
    });

    if (!member || member.left_at) {
      throw new AppError(
        "You are not currently in the public chat.",
        400
      );
    }

    await leaveRoom({
      roomId: room.room_id,
      userId,
      client
    });

    await updateChatRoomLastActivity({
      roomId: room.room_id,
      client
    });

    const memberCount = await countRoomMembers({
      roomId: room.room_id,
      client
    });

    await client.query("COMMIT");

    return {
      room,
      memberCount
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPublicRoomMembers() {
  const room = await findOrCreatePublicChatRoom();

  const members = await getRoomMembers({
    roomId: room.room_id
  });

  return {
    room,
    members
  };
}

export async function getPublicRoomDetails() {
  const room = await findOrCreatePublicChatRoom();

  const memberCount = await countRoomMembers({
    roomId: room.room_id
  });

  return {
    ...room,
    member_count: memberCount
  };
}

export async function getRoomById(roomId) {
  const room = await findActiveChatRoomById({
    roomId
  });

  if (!room) {
    throw new AppError("Chat room not found.", 404);
  }

  return room;
}

export async function markRoomAsRead(roomId, userId) {
  const room = await findActiveChatRoomById({
    roomId
  });

  if (!room) {
    throw new AppError("Chat room not found.", 404);
  }

  await updateLastRead({
    roomId,
    userId
  });

  return {
    success: true
  };
}