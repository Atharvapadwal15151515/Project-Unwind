import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  closePrivateRoom,
  createPrivateRoom,
  deletePrivateRoomMessage,
  editPrivateRoomMessage,
  getPrivateRoom,
  getPrivateRoomMembers,
  getPrivateRoomMessages,
  getPrivateRooms,
  getPrivateRoomUnreadCount,
  joinPrivateRoomByCode,
  joinPrivateRoomByInvite,
  leavePrivateRoom,
  markPrivateRoomRead,
  regeneratePrivateRoomInvite,
  removePrivateRoomMember,
  sendPrivateRoomMessage,
  setPrivateRoomLock,
  setPrivateRoomMemberMute,
  transferPrivateRoomOwner,
  updatePrivateRoom
} from "../services/privateRoomService";

import {
  getPrivateRoomId,
  getPrivateRoomMessageCreatedAt,
  getPrivateRoomMessageId
} from "../utils/privateRoomUtils";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeRoomResult(
  result
) {
  if (!result) {
    return null;
  }

  if (
    result?.room &&
    typeof result.room ===
      "object"
  ) {
    return result.room;
  }

  if (
    result?.privateRoom &&
    typeof result.privateRoom ===
      "object"
  ) {
    return result.privateRoom;
  }

  return result;
}

function normalizeMessageResult(
  result
) {
  if (!result) {
    return null;
  }

  if (
    result?.message &&
    typeof result.message ===
      "object"
  ) {
    return result.message;
  }

  if (
    result?.roomMessage &&
    typeof result.roomMessage ===
      "object"
  ) {
    return result.roomMessage;
  }

  return result;
}

function sortMessages(
  messages
) {
  return [
    ...normalizeArray(
      messages
    )
  ].sort(
    (
      firstMessage,
      secondMessage
    ) => {
      const firstTime =
        new Date(
          getPrivateRoomMessageCreatedAt(
            firstMessage
          ) || 0
        ).getTime();

      const secondTime =
        new Date(
          getPrivateRoomMessageCreatedAt(
            secondMessage
          ) || 0
        ).getTime();

      return (
        firstTime -
        secondTime
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function usePrivateRooms() {
  const [
    rooms,
    setRooms
  ] = useState([]);

  const [
    activeRoom,
    setActiveRoom
  ] = useState(null);

  const [
    members,
    setMembers
  ] = useState([]);

  const [
    messages,
    setMessages
  ] = useState([]);

  const [
    unreadCounts,
    setUnreadCounts
  ] = useState({});

  const [
    roomsLoading,
    setRoomsLoading
  ] = useState(true);

  const [
    roomLoading,
    setRoomLoading
  ] = useState(false);

  const [
    messagesLoading,
    setMessagesLoading
  ] = useState(false);

  const [
    membersLoading,
    setMembersLoading
  ] = useState(false);

  const [
    creatingRoom,
    setCreatingRoom
  ] = useState(false);

  const [
    joiningRoom,
    setJoiningRoom
  ] = useState(false);

  const [
    sendingMessage,
    setSendingMessage
  ] = useState(false);

  const [
    loadingOlderMessages,
    setLoadingOlderMessages
  ] = useState(false);

  const [
    hasOlderMessages,
    setHasOlderMessages
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const activeRoomId =
    useMemo(
      () =>
        getPrivateRoomId(
          activeRoom
        ),
      [activeRoom]
    );

  /*
  |--------------------------------------------------------------------------
  | Error helper
  |--------------------------------------------------------------------------
  */

  const getErrorMessage =
    useCallback(
      (
        requestError,
        fallbackMessage
      ) => {
        return (
          requestError?.response
            ?.data?.message ||
          requestError?.message ||
          fallbackMessage
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Load rooms
  |--------------------------------------------------------------------------
  */

  const loadRooms =
    useCallback(
      async ({
        showLoader = true
      } = {}) => {
        try {
          if (showLoader) {
            setRoomsLoading(true);
          }

          setError("");

         const roomList =
  await getPrivateRooms();

          const normalizedRooms =
            normalizeArray(
              roomList
            );

          setRooms(
            normalizedRooms
          );

          return normalizedRooms;
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load private rooms:",
            requestError
          );

          setError(
            getErrorMessage(
              requestError,
              "Unable to load your private rooms."
            )
          );

          return [];
        } finally {
          if (showLoader) {
            setRoomsLoading(false);
          }
        }
      },
      [getErrorMessage]
    );

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  /*
  |--------------------------------------------------------------------------
  | Load unread counts
  |--------------------------------------------------------------------------
  */

  const loadUnreadCounts =
    useCallback(
      async (
        roomList = rooms
      ) => {
        const validRooms =
          normalizeArray(
            roomList
          );

        if (
          validRooms.length ===
          0
        ) {
          setUnreadCounts({});
          return {};
        }

        const results =
          await Promise.allSettled(
            validRooms.map(
              async (room) => {
                const roomId =
                  getPrivateRoomId(
                    room
                  );

                if (!roomId) {
                  return null;
                }

                const unreadCount =
                  await getPrivateRoomUnreadCount(
                    roomId
                  );

                return {
                  roomId,
                  unreadCount:
                    Number(
                      unreadCount
                    ) || 0
                };
              }
            )
          );

        const nextCounts = {};

        for (
          const result of
          results
        ) {
          if (
            result.status !==
              "fulfilled" ||
            !result.value
          ) {
            continue;
          }

          nextCounts[
            result.value.roomId
          ] =
            result.value
              .unreadCount;
        }

        setUnreadCounts(
          nextCounts
        );

        return nextCounts;
      },
      [rooms]
    );

  useEffect(() => {
    if (
      rooms.length > 0
    ) {
      loadUnreadCounts(
        rooms
      );
    }
  }, [
    rooms,
    loadUnreadCounts
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load one room
  |--------------------------------------------------------------------------
  */

  const loadRoomDetails =
    useCallback(
      async (roomId) => {
        if (!roomId) {
          return null;
        }

        try {
          setRoomLoading(true);
          setError("");

          const result =
            await getPrivateRoom(
              roomId
            );

          const room =
            normalizeRoomResult(
              result
            );

          if (room) {
            setActiveRoom(
              room
            );

            setRooms(
              (
                currentRooms
              ) =>
                currentRooms.map(
                  (
                    currentRoom
                  ) =>
                    String(
                      getPrivateRoomId(
                        currentRoom
                      )
                    ) ===
                    String(
                      roomId
                    )
                      ? {
                          ...currentRoom,
                          ...room
                        }
                      : currentRoom
                )
            );
          }

          return room;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load this private room."
            )
          );

          throw requestError;
        } finally {
          setRoomLoading(false);
        }
      },
      [getErrorMessage]
    );

  /*
  |--------------------------------------------------------------------------
  | Load members
  |--------------------------------------------------------------------------
  */

  const loadMembers =
    useCallback(
      async (roomId) => {
        if (!roomId) {
          setMembers([]);
          return [];
        }

        try {
          setMembersLoading(
            true
          );

          const memberList =
            await getPrivateRoomMembers(
              roomId
            );

          const normalizedMembers =
            normalizeArray(
              memberList
            );

          setMembers(
            normalizedMembers
          );

          return normalizedMembers;
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load private room members:",
            requestError
          );

          setError(
            getErrorMessage(
              requestError,
              "Unable to load room members."
            )
          );

          return [];
        } finally {
          setMembersLoading(
            false
          );
        }
      },
      [getErrorMessage]
    );

  /*
  |--------------------------------------------------------------------------
  | Load messages
  |--------------------------------------------------------------------------
  */

  const loadMessages =
    useCallback(
      async (
        roomId,
        {
          markRead = true
        } = {}
      ) => {
        if (!roomId) {
          setMessages([]);
          return [];
        }

        try {
          setMessagesLoading(
            true
          );

          setError("");

          const messageList =
            await getPrivateRoomMessages(
              roomId,
              {
                limit: 50
              }
            );

          const normalizedMessages =
            sortMessages(
              messageList
            );

          setMessages(
            normalizedMessages
          );

          setHasOlderMessages(
            normalizedMessages.length >=
              50
          );

          if (markRead) {
            try {
              await markPrivateRoomRead(
                roomId
              );

              setUnreadCounts(
                (
                  currentCounts
                ) => ({
                  ...currentCounts,
                  [roomId]: 0
                })
              );
            } catch (
              readError
            ) {
              console.warn(
                "Unable to mark room as read:",
                readError
              );
            }
          }

          return normalizedMessages;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load room messages."
            )
          );

          return [];
        } finally {
          setMessagesLoading(
            false
          );
        }
      },
      [getErrorMessage]
    );

  /*
  |--------------------------------------------------------------------------
  | Open room
  |--------------------------------------------------------------------------
  */

  const openRoom =
    useCallback(
      async (room) => {
        const roomId =
          typeof room ===
          "string"
            ? room
            : getPrivateRoomId(
                room
              );

        if (!roomId) {
          return;
        }

        setError("");

        if (
          typeof room ===
          "object"
        ) {
          setActiveRoom(
            room
          );
        }

        await Promise.all([
          loadRoomDetails(
            roomId
          ),

          loadMembers(
            roomId
          ),

          loadMessages(
            roomId
          )
        ]);
      },
      [
        loadMembers,
        loadMessages,
        loadRoomDetails
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Close currently opened room UI
  |--------------------------------------------------------------------------
  */

  const clearActiveRoom =
    useCallback(
      () => {
        setActiveRoom(null);
        setMembers([]);
        setMessages([]);
        setHasOlderMessages(
          true
        );
        setError("");
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Create room
  |--------------------------------------------------------------------------
  */

  const createRoom =
    useCallback(
      async ({
        roomName,
        roomDescription = "",
        maxMembers = 20,
        isLocked = false
      }) => {
        try {
          setCreatingRoom(
            true
          );

          setError("");

          const result =
            await createPrivateRoom({
              roomName:
                String(
                  roomName || ""
                ).trim(),

              roomDescription:
                String(
                  roomDescription ||
                    ""
                ).trim(),

              maxMembers:
                Number(
                  maxMembers
                ),

              isLocked
            });

          const createdRoom =
            normalizeRoomResult(
              result
            );

          if (
            createdRoom
          ) {
            setRooms(
              (
                currentRooms
              ) => [
                createdRoom,
                ...currentRooms
              ]
            );

            await openRoom(
              createdRoom
            );
          }

          return createdRoom;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to create the private room."
            )
          );

          throw requestError;
        } finally {
          setCreatingRoom(
            false
          );
        }
      },
      [
        getErrorMessage,
        openRoom
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Join by room code
  |--------------------------------------------------------------------------
  */

  const joinByCode =
    useCallback(
      async (roomCode) => {
        try {
          setJoiningRoom(
            true
          );

          setError("");

          const result =
            await joinPrivateRoomByCode(
              roomCode
            );

          const joinedRoom =
            normalizeRoomResult(
              result
            );

          await loadRooms({
            showLoader:
              false
          });

          if (
            joinedRoom
          ) {
            await openRoom(
              joinedRoom
            );
          }

          return joinedRoom;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to join this room."
            )
          );

          throw requestError;
        } finally {
          setJoiningRoom(
            false
          );
        }
      },
      [
        getErrorMessage,
        loadRooms,
        openRoom
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Join by invite token
  |--------------------------------------------------------------------------
  */

  const joinByInvite =
    useCallback(
      async (
        inviteToken
      ) => {
        try {
          setJoiningRoom(
            true
          );

          setError("");

          const result =
            await joinPrivateRoomByInvite(
              inviteToken
            );

          const joinedRoom =
            normalizeRoomResult(
              result
            );

          await loadRooms({
            showLoader:
              false
          });

          if (
            joinedRoom
          ) {
            await openRoom(
              joinedRoom
            );
          }

          return joinedRoom;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to join using this invite."
            )
          );

          throw requestError;
        } finally {
          setJoiningRoom(
            false
          );
        }
      },
      [
        getErrorMessage,
        loadRooms,
        openRoom
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Send message
  |--------------------------------------------------------------------------
  */

  const sendMessage =
    useCallback(
      async (
        messageText,
        {
          replyToMessageId =
            null,
          messageType =
            "text"
        } = {}
      ) => {
        const cleanedText =
          String(
            messageText || ""
          ).trim();

        if (
          !activeRoomId ||
          !cleanedText
        ) {
          return null;
        }

        try {
          setSendingMessage(
            true
          );

          setError("");

          const result =
            await sendPrivateRoomMessage(
              activeRoomId,
              {
                messageText:
                  cleanedText,

                messageType,

                replyToMessageId
              }
            );

          const sentMessage =
            normalizeMessageResult(
              result
            );

          if (
            sentMessage
          ) {
            setMessages(
              (
                currentMessages
              ) =>
                sortMessages([
                  ...currentMessages,
                  sentMessage
                ])
            );
          }

          return sentMessage;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to send your message."
            )
          );

          throw requestError;
        } finally {
          setSendingMessage(
            false
          );
        }
      },
      [
        activeRoomId,
        getErrorMessage
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Edit message
  |--------------------------------------------------------------------------
  */

  const editMessage =
    useCallback(
      async (
        messageId,
        messageText
      ) => {
        if (
          !activeRoomId ||
          !messageId
        ) {
          return null;
        }

        try {
          setError("");

          const result =
            await editPrivateRoomMessage(
              activeRoomId,
              messageId,
              messageText
            );

          const updatedMessage =
            normalizeMessageResult(
              result
            );

          if (
            updatedMessage
          ) {
            setMessages(
              (
                currentMessages
              ) =>
                currentMessages.map(
                  (message) =>
                    String(
                      getPrivateRoomMessageId(
                        message
                      )
                    ) ===
                    String(
                      messageId
                    )
                      ? {
                          ...message,
                          ...updatedMessage
                        }
                      : message
                )
            );
          }

          return updatedMessage;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to edit this message."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        getErrorMessage
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Delete message
  |--------------------------------------------------------------------------
  */

  const deleteMessage =
    useCallback(
      async (
        messageId
      ) => {
        if (
          !activeRoomId ||
          !messageId
        ) {
          return;
        }

        try {
          setError("");

          await deletePrivateRoomMessage(
            activeRoomId,
            messageId
          );

          setMessages(
            (
              currentMessages
            ) =>
              currentMessages.filter(
                (message) =>
                  String(
                    getPrivateRoomMessageId(
                      message
                    )
                  ) !==
                  String(
                    messageId
                  )
              )
          );
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to delete this message."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        getErrorMessage
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Load older messages
  |--------------------------------------------------------------------------
  */

  const loadOlderMessages =
    useCallback(
      async () => {
        if (
          !activeRoomId ||
          messages.length ===
            0 ||
          loadingOlderMessages ||
          !hasOlderMessages
        ) {
          return [];
        }

        const oldestMessage =
          messages[0];

        const beforeMessageId =
          getPrivateRoomMessageId(
            oldestMessage
          );

        if (
          !beforeMessageId
        ) {
          return [];
        }

        try {
          setLoadingOlderMessages(
            true
          );

          const olderMessages =
            await getPrivateRoomMessages(
              activeRoomId,
              {
                limit: 50,
                beforeMessageId
              }
            );

          const normalizedOlder =
            normalizeArray(
              olderMessages
            );

          setHasOlderMessages(
            normalizedOlder.length >=
              50
          );

          if (
            normalizedOlder.length >
            0
          ) {
            setMessages(
              (
                currentMessages
              ) =>
                sortMessages([
                  ...normalizedOlder,
                  ...currentMessages
                ])
            );
          }

          return normalizedOlder;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load older messages."
            )
          );

          return [];
        } finally {
          setLoadingOlderMessages(
            false
          );
        }
      },
      [
        activeRoomId,
        messages,
        loadingOlderMessages,
        hasOlderMessages,
        getErrorMessage
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Update room
  |--------------------------------------------------------------------------
  */

  const updateRoom =
  useCallback(
    async (changes) => {
      if (!activeRoomId) {
        return null;
      }

      try {
        setError("");

        const refreshedRoom =
          await updatePrivateRoom(
            activeRoomId,
            changes
          );

        if (
          !refreshedRoom
        ) {
          throw new Error(
            "The updated room could not be loaded."
          );
        }

        /*
         * Replace active room with the
         * actual refreshed database row.
         */
        setActiveRoom(
          refreshedRoom
        );

        /*
         * Also replace it in sidebar.
         */
        setRooms(
          (
            currentRooms
          ) =>
            currentRooms.map(
              (room) =>
                String(
                  getPrivateRoomId(
                    room
                  )
                ) ===
                String(
                  activeRoomId
                )
                  ? {
                      ...room,
                      ...refreshedRoom
                    }
                  : room
            )
        );

        return refreshedRoom;
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to update this room."
          )
        );

        throw requestError;
      }
    },
    [
      activeRoomId,
      getErrorMessage
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Lock / unlock
  |--------------------------------------------------------------------------
  */

  const setRoomLocked =
    useCallback(
      async (
        isLocked
      ) => {
        if (!activeRoomId) {
          return null;
        }

        try {
          const result =
            await setPrivateRoomLock(
              activeRoomId,
              isLocked
            );

          const updatedRoom =
            normalizeRoomResult(
              result
            );

          await loadRoomDetails(
            activeRoomId
          );

          return updatedRoom;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to change the room lock."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        getErrorMessage,
        loadRoomDetails
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Regenerate invite
  |--------------------------------------------------------------------------
  */

  const regenerateInvite =
    useCallback(
      async () => {
        if (!activeRoomId) {
          return null;
        }

        try {
          const result =
            await regeneratePrivateRoomInvite(
              activeRoomId
            );

          await loadRoomDetails(
            activeRoomId
          );

          return result;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to regenerate the invite."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        getErrorMessage,
        loadRoomDetails
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Remove member
  |--------------------------------------------------------------------------
  */

  const removeMember =
    useCallback(
      async (
        memberUserId
      ) => {
        if (
          !activeRoomId ||
          !memberUserId
        ) {
          return;
        }

        try {
          await removePrivateRoomMember(
            activeRoomId,
            memberUserId
          );

          await loadMembers(
            activeRoomId
          );
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to remove this member."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        getErrorMessage,
        loadMembers
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Mute member
  |--------------------------------------------------------------------------
  */

  const setMemberMuted =
    useCallback(
      async (
        memberUserId,
        isMuted
      ) => {
        if (
          !activeRoomId ||
          !memberUserId
        ) {
          return;
        }

        try {
          await setPrivateRoomMemberMute(
            activeRoomId,
            memberUserId,
            isMuted
          );

          await loadMembers(
            activeRoomId
          );
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to change this member's mute status."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        getErrorMessage,
        loadMembers
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Transfer ownership
  |--------------------------------------------------------------------------
  */

  const transferOwnership =
    useCallback(
      async (
        newOwnerUserId
      ) => {
        if (
          !activeRoomId ||
          !newOwnerUserId
        ) {
          return null;
        }

        try {
          const result =
            await transferPrivateRoomOwner(
              activeRoomId,
              newOwnerUserId
            );

          await Promise.all([
            loadRoomDetails(
              activeRoomId
            ),

            loadMembers(
              activeRoomId
            )
          ]);

          return result;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to transfer room ownership."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        getErrorMessage,
        loadMembers,
        loadRoomDetails
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Leave room
  |--------------------------------------------------------------------------
  */

  const leaveRoom =
    useCallback(
      async () => {
        if (!activeRoomId) {
          return;
        }

        try {
          setError("");

          await leavePrivateRoom(
            activeRoomId
          );

          setRooms(
            (
              currentRooms
            ) =>
              currentRooms.filter(
                (room) =>
                  String(
                    getPrivateRoomId(
                      room
                    )
                  ) !==
                  String(
                    activeRoomId
                  )
              )
          );

          clearActiveRoom();
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to leave this room."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        clearActiveRoom,
        getErrorMessage
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Close room
  |--------------------------------------------------------------------------
  */

  const closeRoom =
    useCallback(
      async () => {
        if (!activeRoomId) {
          return;
        }

        try {
          setError("");

          await closePrivateRoom(
            activeRoomId
          );

          setRooms(
            (
              currentRooms
            ) =>
              currentRooms.filter(
                (room) =>
                  String(
                    getPrivateRoomId(
                      room
                    )
                  ) !==
                  String(
                    activeRoomId
                  )
              )
          );

          clearActiveRoom();
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to close this room."
            )
          );

          throw requestError;
        }
      },
      [
        activeRoomId,
        clearActiveRoom,
        getErrorMessage
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Refresh active room
  |--------------------------------------------------------------------------
  */

  const refreshActiveRoom =
    useCallback(
      async () => {
        if (!activeRoomId) {
          return;
        }

        await Promise.all([
          loadRoomDetails(
            activeRoomId
          ),

          loadMembers(
            activeRoomId
          ),

          loadMessages(
            activeRoomId,
            {
              markRead:
                false
            }
          )
        ]);
      },
      [
        activeRoomId,
        loadMembers,
        loadMessages,
        loadRoomDetails
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Return
  |--------------------------------------------------------------------------
  */

  return {
    rooms,
    activeRoom,
    activeRoomId,

    members,
    messages,
    unreadCounts,

    roomsLoading,
    roomLoading,
    messagesLoading,
    membersLoading,

    creatingRoom,
    joiningRoom,
    sendingMessage,

    loadingOlderMessages,
    hasOlderMessages,

    error,

    loadRooms,
    loadUnreadCounts,

    openRoom,
    clearActiveRoom,

    createRoom,
    joinByCode,
    joinByInvite,

    sendMessage,
    editMessage,
    deleteMessage,
    loadOlderMessages,

    updateRoom,
    setRoomLocked,
    regenerateInvite,

    removeMember,
    setMemberMuted,
    transferOwnership,

    leaveRoom,
    closeRoom,

    refreshActiveRoom,

    clearError: () =>
      setError("")
  };
}

export default usePrivateRooms;