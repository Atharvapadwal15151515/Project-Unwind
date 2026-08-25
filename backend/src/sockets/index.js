import socketAuthenticate from "../middleware/socketAuthenticate.js";

import registerPublicChat from "./publicChat.socket.js";
import registerPrivateRoom from "./privateRoom.socket.js";
import registerDirectMessage from "./directMessage.socket.js";

import {
  SOCKET_EVENTS
} from "./socketEvents.js";

function formatSocketError(error) {
  return {
    success: false,
    message:
      error?.message ||
      "An unexpected socket error occurred.",
    code:
      error?.data?.code ||
      "SOCKET_INTERNAL_ERROR",
    status_code:
      error?.data?.status_code ||
      error?.statusCode ||
      500
  };
}

export default function registerSocketHandlers(io) {
  io.use(socketAuthenticate);

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User: ${socket.user.user_id}`
    );
    /*
|--------------------------------------------------------------------------
| Personal Notification Channel
|--------------------------------------------------------------------------
*/

socket.join(
  `user:${socket.user.user_id}`
);

    socket.emit(SOCKET_EVENTS.SOCKET_READY, {
      success: true,
      socket_id: socket.id,
      user: {
        user_id: socket.user.user_id,
        username: socket.user.username,
        role: socket.user.role
      }
    });

    registerPublicChat(io, socket);
    registerPrivateRoom(io, socket);
    registerDirectMessage(io, socket);

    socket.on("error", (error) => {
      console.error(
        `Socket error for ${socket.id}:`,
        error
      );

      socket.emit(
        SOCKET_EVENTS.SOCKET_ERROR,
        formatSocketError(error)
      );
    });

    socket.on(
      SOCKET_EVENTS.DISCONNECT,
      (reason) => {
        console.log(
          `Socket disconnected: ${socket.id} | Reason: ${reason}`
        );
      }
    );
  });

  io.engine.on(
    "connection_error",
    (error) => {
      console.error(
        "Socket.IO connection error:",
        {
          code: error.code,
          message: error.message,
          context: error.context
        }
      );
    }
  );
}