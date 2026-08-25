import api from "./api";

const PRIVATE_ROOMS_BASE =
  "/community/private-rooms";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function extractData(response) {
  return response?.data?.data ?? null;
}

/*
|--------------------------------------------------------------------------
| Rooms
|--------------------------------------------------------------------------
*/

export async function getPrivateRooms() {
  const response =
    await api.get(
      PRIVATE_ROOMS_BASE
    );

  const data =
    response.data?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.rooms
    )
  ) {
    return data.rooms;
  }

  if (
    Array.isArray(
      data?.privateRooms
    )
  ) {
    return data.privateRooms;
  }

  if (
    Array.isArray(
      response.data?.rooms
    )
  ) {
    return response.data.rooms;
  }

  return [];
}

export async function getPrivateRoom(
  roomId
) {
  const response = await api.get(
    `${PRIVATE_ROOMS_BASE}/${roomId}`
  );

  return extractData(response);
}

export async function createPrivateRoom({
  roomName,
  roomDescription = null,
  maxMembers = 20,
  isLocked = false
}) {
  const response =
    await api.post(
      PRIVATE_ROOMS_BASE,
      {
        roomName,

        roomDescription:
          roomDescription?.trim() ||
          null,

        maxMembers:
          Number(maxMembers)
      }
    );

  const data =
    response.data?.data;

  const room =
    data?.room ||
    data?.privateRoom ||
    data ||
    null;

  const roomId =
    room?.room_id ??
    room?.roomId ??
    room?.id ??
    null;

  if (
    isLocked &&
    roomId
  ) {
    await setPrivateRoomLock(
      roomId,
      true
    );

    const refreshed =
      await getPrivateRoom(
        roomId
      );

    return (
      refreshed?.room ||
      refreshed?.privateRoom ||
      refreshed ||
      room
    );
  }

  return room;
}

/*
|--------------------------------------------------------------------------
| Join room
|--------------------------------------------------------------------------
*/

export async function joinPrivateRoomByCode(
  roomCode
) {
  const response = await api.post(
    `${PRIVATE_ROOMS_BASE}/join/code`,
    {
      roomCode:
        String(roomCode || "")
          .trim()
    }
  );

  return extractData(response);
}

export async function joinPrivateRoomByInvite(
  inviteToken
) {
  const response = await api.post(
    `${PRIVATE_ROOMS_BASE}/join/invite`,
    {
      inviteToken:
        String(
          inviteToken || ""
        ).trim()
    }
  );

  return extractData(response);
}

/*
|--------------------------------------------------------------------------
| Room members
|--------------------------------------------------------------------------
*/

export async function getPrivateRoomMembers(
  roomId
) {
  const response = await api.get(
    `${PRIVATE_ROOMS_BASE}/${roomId}/members`
  );

  const data =
    extractData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.members
    )
  ) {
    return data.members;
  }

  return [];
}

export async function removePrivateRoomMember(
  roomId,
  memberUserId
) {
  const response =
    await api.delete(
      `${PRIVATE_ROOMS_BASE}/${roomId}/members/${memberUserId}`
    );

  return extractData(response);
}

export async function setPrivateRoomMemberMute(
  roomId,
  memberUserId,
  isMuted
) {
  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}/members/${memberUserId}/mute`,
      {
        isMuted:
          Boolean(isMuted)
      }
    );

  return extractData(response);
}

/*
|--------------------------------------------------------------------------
| Room messages
|--------------------------------------------------------------------------
*/

export async function getPrivateRoomMessages(
  roomId,
  {
    limit = 50,
    beforeMessageId = null
  } = {}
) {
  const response =
    await api.get(
      `${PRIVATE_ROOMS_BASE}/${roomId}/messages`,
      {
        params: {
          limit,

          ...(beforeMessageId
            ? {
                beforeMessageId
              }
            : {})
        }
      }
    );

  const data =
    extractData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.messages
    )
  ) {
    return data.messages;
  }

  return [];
}

export async function sendPrivateRoomMessage(
  roomId,
  {
    messageText,
    messageType = "text",
    replyToMessageId = null
  }
) {
  const response =
    await api.post(
      `${PRIVATE_ROOMS_BASE}/${roomId}/messages`,
      {
        messageText:
          String(
            messageText || ""
          ).trim(),

        messageType,

        replyToMessageId:
          replyToMessageId ||
          null
      }
    );

  return extractData(response);
}

export async function editPrivateRoomMessage(
  roomId,
  messageId,
  messageText
) {
  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}/messages/${messageId}`,
      {
        messageText:
          String(
            messageText || ""
          ).trim()
      }
    );

  return extractData(response);
}

export async function deletePrivateRoomMessage(
  roomId,
  messageId
) {
  const response =
    await api.delete(
      `${PRIVATE_ROOMS_BASE}/${roomId}/messages/${messageId}`
    );

  return extractData(response);
}

/*
|--------------------------------------------------------------------------
| Read state
|--------------------------------------------------------------------------
*/

export async function markPrivateRoomRead(
  roomId
) {
  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}/messages/read`
    );

  return extractData(response);
}

export async function getPrivateRoomUnreadCount(
  roomId
) {
  const response =
    await api.get(
      `${PRIVATE_ROOMS_BASE}/${roomId}/messages/unread-count`
    );

  return Number(
    response.data?.data
      ?.unreadCount ?? 0
  );
}

/*
|--------------------------------------------------------------------------
| Room management
|--------------------------------------------------------------------------
*/

export async function updatePrivateRoom(
  roomId,
  changes
) {
  const payload = {};

  if (
    changes.roomName !==
    undefined
  ) {
    payload.roomName =
      String(
        changes.roomName
      ).trim();
  }

  if (
    changes.roomDescription !==
    undefined
  ) {
    payload.roomDescription =
      String(
        changes.roomDescription ||
          ""
      ).trim();
  }

  if (
    changes.maxMembers !==
    undefined
  ) {
    payload.maxMembers =
      Number(
        changes.maxMembers
      );
  }

  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}`,
      payload
    );

  return (
    response.data?.data?.room ||
    response.data?.data?.privateRoom ||
    response.data?.data ||
    null
  );
}

export async function setPrivateRoomLock(
  roomId,
  isLocked
) {
  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}/lock`,
      {
        isLocked:
          Boolean(isLocked)
      }
    );

  return extractData(response);
}

export async function regeneratePrivateRoomInvite(
  roomId
) {
  const response =
    await api.post(
      `${PRIVATE_ROOMS_BASE}/${roomId}/regenerate-invite`
    );

  return extractData(response);
}

export async function transferPrivateRoomOwner(
  roomId,
  newOwnerUserId
) {
  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}/transfer-owner`,
      {
        newOwnerUserId
      }
    );

  return extractData(response);
}

export async function leavePrivateRoom(
  roomId
) {
  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}/leave`
    );

  return extractData(response);
}

export async function closePrivateRoom(
  roomId
) {
  const response =
    await api.patch(
      `${PRIVATE_ROOMS_BASE}/${roomId}/close`
    );

  return extractData(response);
}