import {
  io
} from "socket.io-client";

import {
  getAccessToken
} from "./api";

const API_URL =
  import.meta.env
    .VITE_API_URL ||
  "http://localhost:5000/api";

/*
 * VITE_API_URL normally ends in /api.
 *
 * Socket.IO runs at the server root,
 * therefore:
 *
 * http://localhost:5000/api
 * becomes
 * http://localhost:5000
 */

function getSocketServerUrl() {
  return API_URL.replace(
    /\/api\/?$/,
    ""
  );
}

let socket = null;

/*
|--------------------------------------------------------------------------
| Connect
|--------------------------------------------------------------------------
*/

export function connectSocket() {
  const accessToken =
    getAccessToken();

  if (!accessToken) {
    return null;
  }

  /*
   * Reuse an existing active
   * connection.
   */
  if (
    socket?.connected
  ) {
    return socket;
  }

  /*
   * Recreate if the previous
   * socket was destroyed.
   */
  if (!socket) {
    socket = io(
      getSocketServerUrl(),
      {
        autoConnect: false,

        transports: [
          "websocket",
          "polling"
        ],

        withCredentials: true,

        auth: {
          accessToken
        }
      }
    );
  } else {
    socket.auth = {
      accessToken
    };
  }

  socket.connect();

  return socket;
}

/*
|--------------------------------------------------------------------------
| Get socket
|--------------------------------------------------------------------------
*/

export function getSocket() {
  return socket;
}

/*
|--------------------------------------------------------------------------
| Connection state
|--------------------------------------------------------------------------
*/

export function isSocketConnected() {
  return Boolean(
    socket?.connected
  );
}

/*
|--------------------------------------------------------------------------
| Disconnect
|--------------------------------------------------------------------------
*/

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}

/*
|--------------------------------------------------------------------------
| Update authentication
|--------------------------------------------------------------------------
|
| Access tokens may change after refresh.
|--------------------------------------------------------------------------
*/

export function reconnectSocketWithCurrentToken() {
  const accessToken =
    getAccessToken();

  if (!accessToken) {
    disconnectSocket();
    return null;
  }

  if (socket) {
    socket.auth = {
      accessToken
    };

    if (
      socket.connected
    ) {
      socket.disconnect();
    }

    socket.connect();

    return socket;
  }

  return connectSocket();
}

/*
|--------------------------------------------------------------------------
| Listen
|--------------------------------------------------------------------------
*/

export function onSocketEvent(
  eventName,
  handler
) {
  const activeSocket =
    socket ||
    connectSocket();

  if (
    !activeSocket ||
    typeof handler !==
      "function"
  ) {
    return () => {};
  }

  activeSocket.on(
    eventName,
    handler
  );

  return () => {
    activeSocket.off(
      eventName,
      handler
    );
  };
}

/*
|--------------------------------------------------------------------------
| Remove listener
|--------------------------------------------------------------------------
*/

export function offSocketEvent(
  eventName,
  handler
) {
  socket?.off(
    eventName,
    handler
  );
}

/*
|--------------------------------------------------------------------------
| Emit
|--------------------------------------------------------------------------
*/

export function emitSocketEvent(
  eventName,
  payload = {}
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const activeSocket =
        socket ||
        connectSocket();

      if (!activeSocket) {
        reject(
          new Error(
            "Socket connection is unavailable."
          )
        );

        return;
      }

      activeSocket.emit(
        eventName,
        payload,
        (response) => {
          if (
            response?.success ===
            false
          ) {
            reject(
              Object.assign(
                new Error(
                  response.message ||
                    "Socket request failed."
                ),
                {
                  code:
                    response.code,

                  statusCode:
                    response.status_code,

                  response
                }
              )
            );

            return;
          }

          resolve(
            response
          );
        }
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| Standard lifecycle listeners
|--------------------------------------------------------------------------
*/

export function registerSocketLifecycle({
  onReady,
  onError,
  onConnect,
  onDisconnect,
  onConnectError
} = {}) {
  const activeSocket =
    socket ||
    connectSocket();

  if (!activeSocket) {
    return () => {};
  }

  const handleReady =
    (payload) => {
      onReady?.(
        payload
      );
    };

  const handleSocketError =
    (error) => {
      console.error(
        "Socket error:",
        error
      );

      onError?.(
        error
      );
    };

  const handleConnect =
    () => {
      onConnect?.(
        activeSocket.id
      );
    };

  const handleDisconnect =
    (reason) => {
      onDisconnect?.(
        reason
      );
    };

  const handleConnectError =
    (error) => {
      console.error(
        "Socket connection error:",
        error
      );

      onConnectError?.(
        error
      );
    };

  activeSocket.on(
    "socket:ready",
    handleReady
  );

  activeSocket.on(
    "socket:error",
    handleSocketError
  );

  activeSocket.on(
    "connect",
    handleConnect
  );

  activeSocket.on(
    "disconnect",
    handleDisconnect
  );

  activeSocket.on(
    "connect_error",
    handleConnectError
  );

  return () => {
    activeSocket.off(
      "socket:ready",
      handleReady
    );

    activeSocket.off(
      "socket:error",
      handleSocketError
    );

    activeSocket.off(
      "connect",
      handleConnect
    );

    activeSocket.off(
      "disconnect",
      handleDisconnect
    );

    activeSocket.off(
      "connect_error",
      handleConnectError
    );
  };
}