import {
  getPrivateRoomDetails,
  joinPrivateRoomByCode,
  joinPrivateRoomByInviteToken,
  leavePrivateChatRoom,
  sendPrivateRoomMessage,
  editPrivateRoomMessage,
  deletePrivateRoomMessage,
  markPrivateRoomAsRead,
  getPrivateRoomUnreadCount
} from "../services/community/privateRoom.service.js";
import {
  requireSocketCommunityAccess
} from "../middleware/socketCommunityGuard.js";
import { SOCKET_EVENTS } from "./socketEvents.js";

/*
|--------------------------------------------------------------------------
| Private-room Socket.IO room name
|--------------------------------------------------------------------------
*/

function getPrivateRoomChannel(roomId) {
  return `private-room:${roomId}`;
}

/*
|--------------------------------------------------------------------------
| Socket response helpers
|--------------------------------------------------------------------------
*/

function createSocketError(
  message,
  code = "PRIVATE_ROOM_SOCKET_ERROR",
  statusCode = 500
) {
  return {
    success: false,
    message,
    code,
    status_code: statusCode
  };
}

function formatSocketError(error) {
  return {
    success: false,
    message:
      error?.message ||
      "An unexpected private-room socket error occurred.",
    code:
      error?.data?.code ||
      error?.code ||
      "PRIVATE_ROOM_SOCKET_ERROR",
    status_code:
      error?.data?.status_code ||
      error?.statusCode ||
      500
  };
}

function sendAcknowledgement(acknowledgement, response) {
  if (typeof acknowledgement === "function") {
    acknowledgement(response);
  }
}

/*
|--------------------------------------------------------------------------
| Payload validation helpers
|--------------------------------------------------------------------------
*/

function requireRoomId(roomId) {
  const parsedRoomId = Number(roomId);

  if (
    !Number.isInteger(parsedRoomId) ||
    parsedRoomId <= 0
  ) {
    throw Object.assign(
      new Error("A valid roomId is required."),
      {
        code: "INVALID_ROOM_ID",
        statusCode: 400
      }
    );
  }

  return parsedRoomId;
}

function requireMessageId(messageId) {
  const parsedMessageId = Number(messageId);

  if (
    !Number.isInteger(parsedMessageId) ||
    parsedMessageId <= 0
  ) {
    throw Object.assign(
      new Error("A valid messageId is required."),
      {
        code: "INVALID_MESSAGE_ID",
        statusCode: 400
      }
    );
  }

  return parsedMessageId;
}

function requireMessageText(messageText) {
  if (
    typeof messageText !== "string" ||
    !messageText.trim()
  ) {
    throw Object.assign(
      new Error("Message text is required."),
      {
        code: "MESSAGE_TEXT_REQUIRED",
        statusCode: 400
      }
    );
  }

  return messageText.trim();
}

/*
|--------------------------------------------------------------------------
| Register private-room socket handlers
|--------------------------------------------------------------------------
*/

export default function registerPrivateRoom(io, socket) {
  const userId = socket.user.user_id;

  /*
  |--------------------------------------------------------------------------
  | Join an existing private room
  |--------------------------------------------------------------------------
  |
  | This does not add the user to the database.
  | It only joins the Socket.IO channel after checking database membership.
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_JOIN,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        const room = await getPrivateRoomDetails({
          roomId,
          userId
        });

        const channel = getPrivateRoomChannel(roomId);

        await socket.join(channel);

        const response = {
          success: true,
          message: "Private room joined successfully.",
          room
        };

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_JOINED,
          response
        );

        socket.to(channel).emit(
          SOCKET_EVENTS.PRIVATE_ROOM_MEMBER_ONLINE,
          {
            success: true,
            roomId,
            userId
          }
        );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Join a private room using its room code
  |--------------------------------------------------------------------------
  |
  | This adds or restores the user as a database member and then joins the
  | corresponding Socket.IO room.
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_JOIN_BY_CODE,
    async (payload = {}, acknowledgement) => {
      try {
        const roomCode =
          typeof payload.roomCode === "string"
            ? payload.roomCode.trim()
            : "";

        if (!roomCode) {
          throw Object.assign(
            new Error("Room code is required."),
            {
              code: "ROOM_CODE_REQUIRED",
              statusCode: 400
            }
          );
        }

        const result = await joinPrivateRoomByCode({
          userId,
          roomCode
        });

        const roomId = requireRoomId(
          result?.roomId ||
          result?.room_id ||
          result?.room?.roomId ||
          result?.room?.room_id
        );

        const channel = getPrivateRoomChannel(roomId);

        await socket.join(channel);

        const response = {
          success: true,
          message:
            "Private room joined using room code.",
          data: result
        };

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_JOINED,
          response
        );

        socket.to(channel).emit(
          SOCKET_EVENTS.PRIVATE_ROOM_MEMBER_JOINED,
          {
            success: true,
            roomId,
            member:
              result?.member || {
                userId
              }
          }
        );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Join a private room using an invite token
  |--------------------------------------------------------------------------
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_JOIN_BY_INVITE,
    async (payload = {}, acknowledgement) => {
      try {
        const inviteToken =
          typeof payload.inviteToken === "string"
            ? payload.inviteToken.trim()
            : "";

        if (!inviteToken) {
          throw Object.assign(
            new Error("Invite token is required."),
            {
              code: "INVITE_TOKEN_REQUIRED",
              statusCode: 400
            }
          );
        }

        const result =
          await joinPrivateRoomByInviteToken({
            userId,
            inviteToken
          });

        const roomId = requireRoomId(
          result?.roomId ||
          result?.room_id ||
          result?.room?.roomId ||
          result?.room?.room_id
        );

        const channel = getPrivateRoomChannel(roomId);

        await socket.join(channel);

        const response = {
          success: true,
          message:
            "Private room joined using invite token.",
          data: result
        };

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_JOINED,
          response
        );

        socket.to(channel).emit(
          SOCKET_EVENTS.PRIVATE_ROOM_MEMBER_JOINED,
          {
            success: true,
            roomId,
            member:
              result?.member || {
                userId
              }
          }
        );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Leave private room
  |--------------------------------------------------------------------------
  |
  | leaveDatabaseRoom:
  | true  -> leave the room membership in PostgreSQL
  | false -> only leave the live Socket.IO channel
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_LEAVE,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        const leaveDatabaseRoom =
          payload.leaveDatabaseRoom === true;

        const channel = getPrivateRoomChannel(roomId);

        let result = null;

        if (leaveDatabaseRoom) {
          result = await leavePrivateChatRoom({
            roomId,
            userId
          });
        }

        await socket.leave(channel);

        const response = {
          success: true,
          message: leaveDatabaseRoom
            ? "Private room left successfully."
            : "Private room socket channel left.",
          roomId,
          data: result
        };

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_LEFT,
          response
        );

        socket.to(channel).emit(
          SOCKET_EVENTS.PRIVATE_ROOM_MEMBER_LEFT,
          {
            success: true,
            roomId,
            userId
          }
        );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Send private-room message
  |--------------------------------------------------------------------------
  */

  socket.on(
  SOCKET_EVENTS.PRIVATE_ROOM_MESSAGE_SEND,
  async (payload = {}, acknowledgement) => {
    try {
      /*
      |----------------------------------------------------------------------
      | Check Current Account + Chat Restrictions
      |----------------------------------------------------------------------
      */

      await requireSocketCommunityAccess(
        userId
      );

      const roomId = requireRoomId(
        payload.roomId
      );

      const messageText = requireMessageText(
        payload.messageText
      );

        const replyToMessageId =
          payload.replyToMessageId === null ||
          payload.replyToMessageId === undefined
            ? null
            : requireMessageId(
                payload.replyToMessageId
              );

        const message = await sendPrivateRoomMessage({
          roomId,
          senderUserId: userId,
          messageText,
          messageType:
            payload.messageType || "text",
          replyToMessageId
        });

        const channel = getPrivateRoomChannel(roomId);

        const response = {
          success: true,
          message:
            "Private-room message sent successfully.",
          roomId,
          data: message
        };

        io.to(channel).emit(
          SOCKET_EVENTS.PRIVATE_ROOM_MESSAGE_CREATED,
          response
        );

        sendAcknowledgement(
          acknowledgement,
          response
        );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Edit private-room message
  |--------------------------------------------------------------------------
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_MESSAGE_EDIT,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        const messageId = requireMessageId(
          payload.messageId
        );

        const messageText = requireMessageText(
          payload.messageText
        );

        const message = await editPrivateRoomMessage({
          roomId,
          messageId,
          userId,
          messageText
        });

        const response = {
          success: true,
          message:
            "Private-room message edited successfully.",
          roomId,
          messageId,
          data: message
        };

        io.to(
          getPrivateRoomChannel(roomId)
        ).emit(
          SOCKET_EVENTS.PRIVATE_ROOM_MESSAGE_UPDATED,
          response
        );

        sendAcknowledgement(
          acknowledgement,
          response
        );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Delete private-room message
  |--------------------------------------------------------------------------
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_MESSAGE_DELETE,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        const messageId = requireMessageId(
          payload.messageId
        );

        const result = await deletePrivateRoomMessage({
          roomId,
          messageId,
          userId
        });

        const response = {
          success: true,
          message:
            "Private-room message deleted successfully.",
          roomId,
          messageId,
          data: result
        };

        io.to(
          getPrivateRoomChannel(roomId)
        ).emit(
          SOCKET_EVENTS.PRIVATE_ROOM_MESSAGE_DELETED,
          response
        );

        sendAcknowledgement(
          acknowledgement,
          response
        );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Typing indicator
  |--------------------------------------------------------------------------
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_TYPING_START,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        await getPrivateRoomDetails({
          roomId,
          userId
        });

        socket
          .to(getPrivateRoomChannel(roomId))
          .emit(
            SOCKET_EVENTS.PRIVATE_ROOM_USER_TYPING,
            {
              success: true,
              roomId,
              user: {
                userId,
                username: socket.user.username
              },
              isTyping: true
            }
          );

        sendAcknowledgement(acknowledgement, {
          success: true
        });
      } catch (error) {
        sendAcknowledgement(
          acknowledgement,
          formatSocketError(error)
        );
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_TYPING_STOP,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        await getPrivateRoomDetails({
          roomId,
          userId
        });

        socket
          .to(getPrivateRoomChannel(roomId))
          .emit(
            SOCKET_EVENTS.PRIVATE_ROOM_USER_TYPING,
            {
              success: true,
              roomId,
              user: {
                userId,
                username: socket.user.username
              },
              isTyping: false
            }
          );

        sendAcknowledgement(acknowledgement, {
          success: true
        });
      } catch (error) {
        sendAcknowledgement(
          acknowledgement,
          formatSocketError(error)
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Mark room messages as read
  |--------------------------------------------------------------------------
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_MARK_READ,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        const result = await markPrivateRoomAsRead({
          roomId,
          userId
        });

        const response = {
          success: true,
          message:
            "Private-room messages marked as read.",
          roomId,
          userId,
          data: result
        };

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket
          .to(getPrivateRoomChannel(roomId))
          .emit(
            SOCKET_EVENTS.PRIVATE_ROOM_READ_UPDATED,
            response
          );
      } catch (error) {
        const response = formatSocketError(error);

        sendAcknowledgement(
          acknowledgement,
          response
        );

        socket.emit(
          SOCKET_EVENTS.PRIVATE_ROOM_ERROR,
          response
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Get unread message count
  |--------------------------------------------------------------------------
  */

  socket.on(
    SOCKET_EVENTS.PRIVATE_ROOM_UNREAD_COUNT,
    async (payload = {}, acknowledgement) => {
      try {
        const roomId = requireRoomId(payload.roomId);

        const unreadCount =
          await getPrivateRoomUnreadCount({
            roomId,
            userId
          });

        sendAcknowledgement(acknowledgement, {
          success: true,
          roomId,
          unreadCount
        });
      } catch (error) {
        sendAcknowledgement(
          acknowledgement,
          formatSocketError(error)
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Disconnect cleanup
  |--------------------------------------------------------------------------
  |
  | Socket.IO automatically removes the socket from every joined channel.
  | This loop only informs remaining room members that this user went offline.
  */

  socket.on(SOCKET_EVENTS.DISCONNECTING, () => {
    for (const channel of socket.rooms) {
      if (!channel.startsWith("private-room:")) {
        continue;
      }

      const roomId = Number(
        channel.replace("private-room:", "")
      );

      socket.to(channel).emit(
        SOCKET_EVENTS.PRIVATE_ROOM_MEMBER_OFFLINE,
        {
          success: true,
          roomId,
          userId
        }
      );
    }
  });
}