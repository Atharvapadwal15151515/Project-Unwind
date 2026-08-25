import { Server } from "socket.io";

import registerSocketHandlers from "../sockets/index.js";

let ioInstance = null;

export function initializeSocket(server) {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
      ]
    },

    transports: [
      "websocket",
      "polling"
    ],

    pingInterval: 25000,
    pingTimeout: 20000,

    allowEIO3: false,

    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false
    }
  });

  registerSocketHandlers(ioInstance);

  console.log("✅ Socket.IO initialized.");

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error(
      "Socket.IO has not been initialized."
    );
  }

  return ioInstance;
}

export default initializeSocket;