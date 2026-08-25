import { SOCKET_EVENTS } from "./socketEvents.js";
import {
  requireSocketCommunityAccess
} from "../middleware/socketCommunityGuard.js";

export default function registerDirectMessage(io, socket) {
  /**
   * Join a direct conversation.
   * Room name example:
   * direct_<conversation_id>
   */
  socket.on(
    SOCKET_EVENTS.DIRECT_JOIN,
    async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const room = `direct_${conversationId}`;

        socket.join(room);

        socket.emit(SOCKET_EVENTS.DIRECT_JOINED, {
          success: true,
          conversationId,
        });
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          success: false,
          message:
            error.message ||
            "Unable to join conversation.",
        });
      }
    }
  );

  /**
   * Leave conversation
   */
  socket.on(
    SOCKET_EVENTS.DIRECT_LEAVE,
    ({ conversationId }) => {
      if (!conversationId) return;

      socket.leave(`direct_${conversationId}`);
    }
  );

  /**
   * Typing indicator
   */
  socket.on(
    SOCKET_EVENTS.DIRECT_TYPING,
    ({ conversationId, username }) => {
      socket.to(`direct_${conversationId}`).emit(
        SOCKET_EVENTS.DIRECT_TYPING,
        {
          username,
        }
      );
    }
  );

  /**
   * Stop typing
   */
  socket.on(
    SOCKET_EVENTS.DIRECT_STOP_TYPING,
    ({ conversationId }) => {
      socket.to(`direct_${conversationId}`).emit(
        SOCKET_EVENTS.DIRECT_STOP_TYPING
      );
    }
  );

  /**
   * Send new message
   *
   * Message is already saved through REST API.
   * This socket simply broadcasts it.
   */
 socket.on(
  SOCKET_EVENTS.DIRECT_MESSAGE,
  async (
    {
      conversationId,
      message
    },
    callback
  ) => {
    try {
      await requireSocketCommunityAccess(
        socket.user.user_id
      );

      if (!conversationId) {
        return callback?.({
          success: false,
          message:
            "Conversation ID is required."
        });
      }

      io.to(
        `direct_${conversationId}`
      ).emit(
        SOCKET_EVENTS.DIRECT_MESSAGE,
        message
      );

      callback?.({
        success: true
      });

    } catch (error) {
      callback?.({
        success: false,

        message:
          error.message,

        code:
          error.code ||
          "DIRECT_MESSAGE_BLOCKED",

        status_code:
          error.statusCode ||
          500
      });
    }
  }
);

  /**
   * Edit message
   */
  socket.on(
    SOCKET_EVENTS.DIRECT_MESSAGE_EDITED,
    ({ conversationId, message }) => {
      io.to(`direct_${conversationId}`).emit(
        SOCKET_EVENTS.DIRECT_MESSAGE_EDITED,
        message
      );
    }
  );

  /**
   * Delete message
   */
  socket.on(
    SOCKET_EVENTS.DIRECT_MESSAGE_DELETED,
    ({ conversationId, messageId }) => {
      io.to(`direct_${conversationId}`).emit(
        SOCKET_EVENTS.DIRECT_MESSAGE_DELETED,
        {
          messageId,
        }
      );
    }
  );

  /**
   * Seen / Read receipts
   */
  socket.on(
    SOCKET_EVENTS.DIRECT_MESSAGE_SEEN,
    ({ conversationId, messageId, userId }) => {
      socket.to(`direct_${conversationId}`).emit(
        SOCKET_EVENTS.DIRECT_MESSAGE_SEEN,
        {
          messageId,
          userId,
        }
      );
    }
  );
}