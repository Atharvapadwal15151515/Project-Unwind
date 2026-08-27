import {
  SOCKET_EVENTS,
  SOCKET_ROOMS
} from "./socketEvents.js";

import {
  joinPublicChatRoom,
  leavePublicChatRoom
} from "../services/community/chatRoom.service.js";

import {
  requireSocketCommunityAccess
} from "../middleware/socketCommunityGuard.js";

import {
  sendPublicChatMessage,
  editChatMessage,
  deleteChatMessage,
  markChatMessagesAsRead
} from "../services/community/chatMessage.service.js";

const onlineUsers = new Map();
const typingUsers = new Map();

function getOnlineUsers(roomId) {
  return Array.from(
    onlineUsers.get(roomId)?.values() || []
  );
}

function broadcastOnlineUsers(io, roomId) {
  io.to(roomId).emit(
    SOCKET_EVENTS.PUBLIC_CHAT_ONLINE_USERS,
    getOnlineUsers(roomId)
  );
}

function broadcastTypingUsers(io, roomId) {
  io.to(roomId).emit(
    SOCKET_EVENTS.PUBLIC_CHAT_TYPING_UPDATE,
    Array.from(
      typingUsers.get(roomId)?.values() || []
    )
  );
}

const COMMUNITY_ACCESS_CACHE_MS = 15000;

async function ensureCommunityAccessCached(socket) {
  const now = Date.now();

  const lastChecked =
    socket.data.communityAccessCheckedAt || 0;

  if (
    now - lastChecked <
    COMMUNITY_ACCESS_CACHE_MS
  ) {
    return;
  }

  await requireSocketCommunityAccess(
    socket.user.user_id
  );

  socket.data.communityAccessCheckedAt =
    now;
}

export default function registerPublicChat(io, socket) {
  socket.on(
    SOCKET_EVENTS.PUBLIC_CHAT_JOIN,
    async (_, callback) => {
      try {
        const result = await joinPublicChatRoom(
          socket.user.user_id
        );

        const room = result.room;

        socket.join(room.room_id);
        socket.join(SOCKET_ROOMS.PUBLIC_CHAT);

        socket.data.publicRoomId = room.room_id;

        if (!onlineUsers.has(room.room_id)) {
          onlineUsers.set(room.room_id, new Map());
        }

        onlineUsers.get(room.room_id).set(
          socket.user.user_id,
          {
            user_id: socket.user.user_id,
            visible_name:
              result.membership.visible_name,
            identity_mode:
              result.membership.identity_mode
          }
        );

        io.to(room.room_id).emit(
          SOCKET_EVENTS.PUBLIC_CHAT_USER_JOINED,
          {
            user: {
              user_id: socket.user.user_id,
              visible_name:
                result.membership.visible_name,
              identity_mode:
                result.membership.identity_mode
            }
          }
        );

        broadcastOnlineUsers(io, room.room_id);

        callback?.({
          success: true,
          room,
          member_count: result.memberCount
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    }
  );

socket.on(
  SOCKET_EVENTS.PUBLIC_CHAT_SEND_MESSAGE,
  async (payload = {}, callback) => {
    try {
      await ensureCommunityAccessCached(
  socket
);
      /*
       * We already stored this when
       * PUBLIC_CHAT_JOIN succeeded.
       *
       * Do not query the database
       * again just to discover the
       * same public room.
       */
      const roomId =
        socket.data.publicRoomId;

      if (!roomId) {
        return callback?.({
          success: false,
          message:
            "Join the public chat before sending messages.",
          code:
            "PUBLIC_CHAT_NOT_JOINED",
          status_code: 400
        });
      }

      const message =
        await sendPublicChatMessage({
          roomId,

          userId:
            socket.user.user_id,

          messageText:
            payload.message_text,

          replyToMessageId:
            payload.reply_to_message_id ??
            null
        });

      /*
       * Broadcast the saved message
       * immediately to everyone
       * currently inside this room.
       */
      io.to(roomId).emit(
        SOCKET_EVENTS.PUBLIC_CHAT_NEW_MESSAGE,
        message
      );

      callback?.({
        success: true,
        message
      });

    } catch (error) {
      callback?.({
        success: false,

        message:
          error.message ||
          "Unable to send message.",

        code:
          error.code ||
          "MESSAGE_SEND_FAILED",

        status_code:
          error.statusCode ||
          500
      });
    }
  }
);

  socket.on(
    SOCKET_EVENTS.PUBLIC_CHAT_EDIT_MESSAGE,
    async (payload, callback) => {
      try {
        const message =
          await editChatMessage({
            messageId: payload.message_id,
            userId: socket.user.user_id,
            messageText: payload.message_text
          });

        io.to(message.room_id).emit(
          SOCKET_EVENTS.PUBLIC_CHAT_MESSAGE_EDITED,
          message
        );

        callback?.({
          success: true,
          message
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.PUBLIC_CHAT_DELETE_MESSAGE,
    async (payload, callback) => {
      try {
        const message =
          await deleteChatMessage({
            messageId: payload.message_id,
            userId: socket.user.user_id
          });

        io.to(message.room_id).emit(
          SOCKET_EVENTS.PUBLIC_CHAT_MESSAGE_DELETED,
          message
        );

        callback?.({
          success: true
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.PUBLIC_CHAT_TYPING_START,
    async () => {
      const roomId =
        socket.data.publicRoomId;

      if (!roomId) {
        return;
      }

      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Map());
      }

      const onlineUser =
  onlineUsers
    .get(roomId)
    ?.get(socket.user.user_id);

typingUsers.get(roomId).set(
  socket.user.user_id,
  onlineUser?.visible_name ||
    socket.user.username
);

      broadcastTypingUsers(io, roomId);
    }
  );

  socket.on(
    SOCKET_EVENTS.PUBLIC_CHAT_TYPING_STOP,
    async () => {
      const roomId =
        socket.data.publicRoomId;

      if (!roomId) {
        return;
      }

      typingUsers
        .get(roomId)
        ?.delete(socket.user.user_id);

      broadcastTypingUsers(io, roomId);
    }
  );

  socket.on(
    SOCKET_EVENTS.PUBLIC_CHAT_MARK_READ,
    async (_, callback) => {
      try {
        const roomId =
          socket.data.publicRoomId;

        const result =
          await markChatMessagesAsRead({
            roomId,
            userId: socket.user.user_id
          });

        callback?.({
          success: true,
          ...result
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.PUBLIC_CHAT_LEAVE,
    async (_, callback) => {
      try {
        const roomId =
          socket.data.publicRoomId;
if (!roomId) {
  return callback?.({
    success: false,
    message:
      "Public chat room not joined"
  });
}
        await leavePublicChatRoom(
          socket.user.user_id
        );

        socket.leave(roomId);

        onlineUsers
          .get(roomId)
          ?.delete(socket.user.user_id);

        typingUsers
          .get(roomId)
          ?.delete(socket.user.user_id);

        io.to(roomId).emit(
          SOCKET_EVENTS.PUBLIC_CHAT_USER_LEFT,
          {
            user_id:
              socket.user.user_id
          }
        );

        broadcastOnlineUsers(io, roomId);
        broadcastTypingUsers(io, roomId);

        callback?.({
          success: true
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    }
  );

  socket.on("disconnect", async () => {
    const roomId =
      socket.data.publicRoomId;

    if (!roomId) {
      return;
    }

    onlineUsers
      .get(roomId)
      ?.delete(socket.user.user_id);

    typingUsers
      .get(roomId)
      ?.delete(socket.user.user_id);

    io.to(roomId).emit(
      SOCKET_EVENTS.PUBLIC_CHAT_USER_LEFT,
      {
        user_id: socket.user.user_id
      }
    );

    broadcastOnlineUsers(io, roomId);
    broadcastTypingUsers(io, roomId);
  });
}