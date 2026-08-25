import {
  getPublicChatRoom,
  joinPublicChatRoom,
  leavePublicChatRoom,
  getPublicRoomMembers,
  getPublicRoomDetails,
  markRoomAsRead
} from "../../services/community/chatRoom.service.js";

export async function getPublicChatRoomController(req, res, next) {
  try {
    const room = await getPublicChatRoom();

    return res.status(200).json({
      success: true,
      message: "Public chat room fetched successfully.",
      data: {
        room
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function joinPublicChatRoomController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const result = await joinPublicChatRoom(userId);

    return res.status(200).json({
      success: true,
      message: "Joined public chat room successfully.",
      data: {
        room: result.room,
        membership: result.membership,
        member_count: result.memberCount
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function leavePublicChatRoomController(req, res, next) {
  try {
    const userId = req.user.user_id;

    const result = await leavePublicChatRoom(userId);

    return res.status(200).json({
      success: true,
      message: "Left public chat room successfully.",
      data: {
        room: result.room,
        member_count: result.memberCount
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicRoomMembersController(req, res, next) {
  try {
    const result = await getPublicRoomMembers();

    return res.status(200).json({
      success: true,
      message: "Public chat members fetched successfully.",
      data: {
        room: result.room,
        members: result.members,
        member_count: result.members.length
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicRoomDetailsController(req, res, next) {
  try {
    const room = await getPublicRoomDetails();

    return res.status(200).json({
      success: true,
      message: "Public chat room details fetched successfully.",
      data: {
        room
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function markRoomAsReadController(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { roomId } = req.params;

    const result = await markRoomAsRead(roomId, userId);

    return res.status(200).json({
      success: true,
      message: "Chat room marked as read.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}