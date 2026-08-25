import {
  createPrivateChatRoom,
  joinPrivateRoomByCode,
  joinPrivateRoomByInviteToken,
  leavePrivateChatRoom,
  getPrivateRoomDetails,
  listMyPrivateRooms,
  getPrivateRoomMembersList,
  updatePrivateChatRoom,
  setPrivateRoomLock,
  regeneratePrivateRoomInvite,
  removeMemberFromPrivateRoom,
  setPrivateRoomMemberMute,
  transferPrivateRoomOwner,
  closePrivateChatRoom,
  sendPrivateRoomMessage,
  getPrivateRoomMessageHistory,
  editPrivateRoomMessage,
  deletePrivateRoomMessage,
  markPrivateRoomAsRead,
  getPrivateRoomUnreadCount,
} from "../../services/community/privateRoom.service.js";

import {
  findPrivateRoomsForMember
} from "../../models/community/privateRoom.model.js";

/**
 * Create a private room.
 *
 * POST /api/private-rooms
 */
export async function createPrivateRoomController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const {
      roomName,
      roomDescription = null,
      maxMembers,
      isLocked = false,
    } = req.body;

 const room =
  await createPrivateChatRoom({
    userId:
      req.user.user_id,

    roomName:
      req.body.roomName,

    roomDescription:
      req.body.roomDescription,

    maximumMembers:
      req.body.maxMembers
  });

    return res.status(201).json({
      success: true,
      message: "Private room created.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Join a private room using its room code.
 *
 * POST /api/private-rooms/join/code
 */
export async function joinPrivateRoomByCodeController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomCode } = req.body;

    const membership = await joinPrivateRoomByCode({
      userId,
      roomCode,
    });

    return res.status(200).json({
      success: true,
      message: "Private room joined.",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Join a private room using an invite token.
 *
 * POST /api/private-rooms/join/invite
 */
export async function joinPrivateRoomByInviteController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { inviteToken } = req.body;

    const membership = await joinPrivateRoomByInviteToken({
      userId,
      inviteToken,
    });

    return res.status(200).json({
      success: true,
      message: "Private room joined.",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return all private rooms belonging to the authenticated user.
 *
 * GET /api/private-rooms
 */
export async function listPrivateRoomsController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const rooms =
      await findPrivateRoomsForMember(
        userId
      );

    return res.status(200).json({
      success: true,
      data: {
        rooms
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return one private room.
 *
 * GET /api/private-rooms/:roomId
 */
export async function getPrivateRoomController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const room = await getPrivateRoomDetails({
      roomId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return private-room members.
 *
 * GET /api/private-rooms/:roomId/members
 */
export async function getPrivateRoomMembersController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const members = await getPrivateRoomMembersList({
      roomId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update private-room details.
 *
 * PATCH /api/private-rooms/:roomId
 */
export async function updatePrivateRoomController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const {
      roomName,
      roomDescription,
      maximumMembers,
    } = req.body;

   const room =
  await updatePrivateChatRoom({
    roomId:
      req.params.roomId,

    userId:
      req.user.user_id,

    roomName:
      req.body.roomName,

    roomDescription:
      req.body.roomDescription,

    maximumMembers:
      req.body.maxMembers,

    expiresAt:
      req.body.expiresAt
  });

    return res.status(200).json({
      success: true,
      message: "Private room updated.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lock or unlock a private room.
 *
 * PATCH /api/private-rooms/:roomId/lock
 */
export async function setPrivateRoomLockController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;
    const { isLocked } = req.body;

    const room = await setPrivateRoomLock({
      roomId,
      userId,
      isLocked,
    });

    return res.status(200).json({
      success: true,
      message: isLocked
        ? "Private room locked."
        : "Private room unlocked.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate a new invite token.
 *
 * PATCH /api/private-rooms/:roomId/invite
 */
export async function regeneratePrivateRoomInviteController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const room = await regeneratePrivateRoomInvite({
      roomId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Private room invite regenerated.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Leave a private room.
 *
 * PATCH /api/private-rooms/:roomId/leave
 */
export async function leavePrivateRoomController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const membership = await leavePrivateChatRoom({
      roomId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "You left the private room.",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove another member from a private room.
 *
 * DELETE /api/private-rooms/:roomId/members/:memberUserId
 */
export async function removePrivateRoomMemberController(
  req,
  res,
  next
) {
  try {
    const ownerUserId = req.user.user_id;
    const { roomId, memberUserId } = req.params;

    const membership = await removeMemberFromPrivateRoom({
      roomId,
      ownerUserId,
      memberUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Member removed from private room.",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mute or unmute a private-room member.
 *
 * PATCH /api/private-rooms/:roomId/members/:memberUserId/mute
 */
export async function setPrivateRoomMemberMuteController(
  req,
  res,
  next
) {
  try {
    const ownerUserId = req.user.user_id;
    const { roomId, memberUserId } = req.params;
    const { isMuted } = req.body;

    const membership = await setPrivateRoomMemberMute({
      roomId,
      ownerUserId,
      memberUserId,
      isMuted,
    });

    return res.status(200).json({
      success: true,
      message: isMuted
        ? "Member muted."
        : "Member unmuted.",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Transfer private-room ownership.
 *
 * PATCH /api/private-rooms/:roomId/transfer-owner
 */
export async function transferPrivateRoomOwnerController(
  req,
  res,
  next
) {
  try {
    const currentOwnerUserId = req.user.user_id;
    const { roomId } = req.params;
    const { newOwnerUserId } = req.body;

    const room = await transferPrivateRoomOwner({
      roomId,
      currentOwnerUserId,
      newOwnerUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Private room ownership transferred.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Close a private room.
 *
 * DELETE /api/private-rooms/:roomId
 */
export async function closePrivateRoomController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const room = await closePrivateChatRoom({
      roomId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Private room closed.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a private-room message.
 *
 * POST /api/private-rooms/:roomId/messages
 */
export async function sendPrivateRoomMessageController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const {
      messageText,
      messageType = "text",
      replyToMessageId = null,
    } = req.body;

    const message = await sendPrivateRoomMessage({
      roomId,
      userId,
      messageText,
      messageType,
      replyToMessageId,
    });

    return res.status(201).json({
      success: true,
      message: "Private-room message sent.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return private-room message history.
 *
 * GET /api/private-rooms/:roomId/messages
 */
export async function getPrivateRoomMessagesController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;
    const { beforeMessageId, limit } = req.query;

    const messages = await getPrivateRoomMessageHistory({
      roomId,
      userId,
      beforeMessageId: beforeMessageId || null,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Edit a private-room message.
 *
 * PATCH /api/private-rooms/:roomId/messages/:messageId
 */
export async function editPrivateRoomMessageController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId, messageId } = req.params;
    const { messageText } = req.body;

    const message = await editPrivateRoomMessage({
      roomId,
      messageId,
      userId,
      messageText,
    });

    return res.status(200).json({
      success: true,
      message: "Private-room message updated.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft-delete a private-room message.
 *
 * DELETE /api/private-rooms/:roomId/messages/:messageId
 */
export async function deletePrivateRoomMessageController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId, messageId } = req.params;

    const message = await deletePrivateRoomMessage({
      roomId,
      messageId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Private-room message deleted.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a private room as read.
 *
 * PATCH /api/private-rooms/:roomId/read
 */
export async function markPrivateRoomReadController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const membership = await markPrivateRoomAsRead({
      roomId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Private room marked as read.",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return unread private-room message count.
 *
 * GET /api/private-rooms/:roomId/unread-count
 */
export async function getPrivateRoomUnreadCountController(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const unreadCount = await getPrivateRoomUnreadCount({
      roomId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: {
        roomId,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}