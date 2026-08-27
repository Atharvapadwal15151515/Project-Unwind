export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  DISCONNECTING: "disconnecting",

  SOCKET_READY: "socket:ready",
  SOCKET_ERROR: "socket:error",
  ERROR: "socket:error",

  // =========================================================
  // PUBLIC CHAT
  // =========================================================

  PUBLIC_CHAT_JOIN:
    "public-chat:join",

  PUBLIC_CHAT_JOINED:
    "public-chat:joined",

  PUBLIC_CHAT_LEAVE:
    "public-chat:leave",

  PUBLIC_CHAT_LEFT:
    "public-chat:left",

  PUBLIC_CHAT_SEND_MESSAGE:
    "public-chat:message:send",

  PUBLIC_CHAT_NEW_MESSAGE:
    "public-chat:message:new",

  PUBLIC_CHAT_EDIT_MESSAGE:
    "public-chat:message:edit",

  PUBLIC_CHAT_MESSAGE_EDITED:
    "public-chat:message:edited",

  PUBLIC_CHAT_DELETE_MESSAGE:
    "public-chat:message:delete",

  PUBLIC_CHAT_MESSAGE_DELETED:
    "public-chat:message:deleted",

  PUBLIC_CHAT_TYPING_START:
    "public-chat:typing:start",

  PUBLIC_CHAT_TYPING_STOP:
    "public-chat:typing:stop",

  PUBLIC_CHAT_TYPING_UPDATE:
    "public-chat:typing:update",

  PUBLIC_CHAT_MARK_READ:
    "public-chat:read",

  PUBLIC_CHAT_READ_UPDATED:
    "public-chat:read:updated",

  PUBLIC_CHAT_ONLINE_USERS:
    "public-chat:online-users",

  PUBLIC_CHAT_USER_JOINED:
    "public-chat:user:joined",

  PUBLIC_CHAT_USER_LEFT:
    "public-chat:user:left",

  // =========================================================
  // PRIVATE ROOM
  // =========================================================

  PRIVATE_ROOM_JOIN:
    "private-room:join",

  PRIVATE_ROOM_JOINED:
    "private-room:joined",

  PRIVATE_ROOM_JOIN_BY_CODE:
    "private-room:join:code",

  PRIVATE_ROOM_JOIN_BY_INVITE:
    "private-room:join:invite",

  PRIVATE_ROOM_LEAVE:
    "private-room:leave",

  PRIVATE_ROOM_LEFT:
    "private-room:left",

  /*
   * Canonical message event names
   */

  PRIVATE_ROOM_SEND_MESSAGE:
    "private-room:message:send",

  PRIVATE_ROOM_NEW_MESSAGE:
    "private-room:message:new",

  PRIVATE_ROOM_EDIT_MESSAGE:
    "private-room:message:edit",

  PRIVATE_ROOM_MESSAGE_EDITED:
    "private-room:message:edited",

  PRIVATE_ROOM_DELETE_MESSAGE:
    "private-room:message:delete",

  PRIVATE_ROOM_MESSAGE_DELETED:
    "private-room:message:deleted",

  /*
   * Compatibility aliases.
   *
   * Your current privateRoom.socket.js
   * still uses these names.
   *
   * Keep them temporarily so we do
   * not break the frontend while
   * cleaning the handlers.
   */

  PRIVATE_ROOM_MESSAGE_SEND:
    "private-room:message:send",

  PRIVATE_ROOM_MESSAGE_CREATED:
    "private-room:message:new",

  PRIVATE_ROOM_MESSAGE_EDIT:
    "private-room:message:edit",

  PRIVATE_ROOM_MESSAGE_UPDATED:
    "private-room:message:edited",

  PRIVATE_ROOM_MESSAGE_DELETE:
    "private-room:message:delete",

  PRIVATE_ROOM_TYPING_START:
    "private-room:typing:start",

  PRIVATE_ROOM_TYPING_STOP:
    "private-room:typing:stop",

  PRIVATE_ROOM_TYPING_UPDATE:
    "private-room:typing:update",

  PRIVATE_ROOM_USER_TYPING:
    "private-room:typing:update",

  PRIVATE_ROOM_MARK_READ:
    "private-room:read",

  PRIVATE_ROOM_READ_UPDATED:
    "private-room:read:updated",

  PRIVATE_ROOM_UNREAD_COUNT:
    "private-room:unread-count",

  PRIVATE_ROOM_USER_JOINED:
    "private-room:user:joined",

  PRIVATE_ROOM_USER_LEFT:
    "private-room:user:left",

  PRIVATE_ROOM_MEMBER_JOINED:
    "private-room:member:joined",

  PRIVATE_ROOM_MEMBER_LEFT:
    "private-room:member:left",

  PRIVATE_ROOM_MEMBER_ONLINE:
    "private-room:member:online",

  PRIVATE_ROOM_MEMBER_OFFLINE:
    "private-room:member:offline",

  PRIVATE_ROOM_ERROR:
    "private-room:error",

  // =========================================================
  // DIRECT MESSAGES
  // =========================================================

  DIRECT_JOIN:
    "direct:join",

  DIRECT_JOINED:
    "direct:joined",

  DIRECT_LEAVE:
    "direct:leave",

  DIRECT_LEFT:
    "direct:left",

  /*
   * Canonical event names
   */

  DIRECT_SEND_MESSAGE:
    "direct:message:send",

  DIRECT_NEW_MESSAGE:
    "direct:message:new",

  DIRECT_EDIT_MESSAGE:
    "direct:message:edit",

  DIRECT_MESSAGE_EDITED:
    "direct:message:edited",

  DIRECT_DELETE_MESSAGE:
    "direct:message:delete",

  DIRECT_MESSAGE_DELETED:
    "direct:message:deleted",

  DIRECT_TYPING_START:
    "direct:typing:start",

  DIRECT_TYPING_STOP:
    "direct:typing:stop",

  DIRECT_TYPING_UPDATE:
    "direct:typing:update",

  DIRECT_MARK_READ:
    "direct:read",

  DIRECT_READ_UPDATED:
    "direct:read:updated",

  /*
   * Compatibility aliases for your
   * current directMessage.socket.js.
   */

  DIRECT_MESSAGE:
    "direct:message",

  DIRECT_TYPING:
    "direct:typing",

  DIRECT_STOP_TYPING:
    "direct:stop-typing",

  DIRECT_MESSAGE_SEEN:
    "direct:message:seen"
};

export const SOCKET_ROOMS = {
  PUBLIC_CHAT:
    "public-chat",

  PRIVATE_ROOM_PREFIX:
    "private-room:",

  DIRECT_PREFIX:
    "direct:"
};

export const SOCKET_ERROR_CODES = {
  UNAUTHORIZED:
    "UNAUTHORIZED",

  FORBIDDEN:
    "FORBIDDEN",

  VALIDATION_ERROR:
    "VALIDATION_ERROR",

  ROOM_NOT_FOUND:
    "ROOM_NOT_FOUND",

  CONVERSATION_NOT_FOUND:
    "CONVERSATION_NOT_FOUND",

  MESSAGE_NOT_FOUND:
    "MESSAGE_NOT_FOUND",

  INTERNAL_ERROR:
    "INTERNAL_ERROR"
};