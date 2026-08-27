import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  getMyCommunityProfile,
  selectCommunityIdentity
} from "../services/communityService";

import {
  getPublicChatHistory,
  getPublicChatMembers,
  markPublicChatRead
} from "../services/communityChatService";

import {
  connectSocket,
  emitSocketEvent,
  getSocket,
  onSocketEvent
} from "../services/socketService";

import {
  getCommunityChatCreatedAt,
  getCommunityChatMessageId
} from "../utils/communityChatUtils";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const INITIAL_MESSAGE_LIMIT = 5;
const OLDER_MESSAGE_LIMIT = 20;

const COMMUNITY_CHAT_CACHE_KEY =
  "unwind_public_chat_recent_messages";

function getCachedMessages() {
  try {
    const value =
      sessionStorage.getItem(
        COMMUNITY_CHAT_CACHE_KEY
      );

    if (!value) {
      return [];
    }

    const parsed =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function cacheMessages(
  messages
) {
  try {
    sessionStorage.setItem(
      COMMUNITY_CHAT_CACHE_KEY,
      JSON.stringify(
        messages.slice(
          -INITIAL_MESSAGE_LIMIT
        )
      )
    );
  } catch {
    // Ignore storage failure.
  }
}

const EVENTS = {
  JOIN:
    "public-chat:join",

  SEND:
    "public-chat:message:send",

  NEW:
    "public-chat:message:new",

  EDIT:
    "public-chat:message:edit",

  EDITED:
    "public-chat:message:edited",

  DELETE:
    "public-chat:message:delete",

  DELETED:
    "public-chat:message:deleted",

  TYPING_START:
    "public-chat:typing:start",

  TYPING_STOP:
    "public-chat:typing:stop",

  TYPING_UPDATE:
    "public-chat:typing:update",

  ONLINE:
    "public-chat:online-users",

  JOINED_USER:
    "public-chat:user:joined",

  LEFT_USER:
    "public-chat:user:left",

  MARK_READ:
    "public-chat:read"
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getMessageTime(
  message
) {
  return new Date(
    getCommunityChatCreatedAt(
      message
    ) || 0
  ).getTime();
}

function sortMessages(
  messages
) {
  return [
    ...messages
  ].sort(
    (
      firstMessage,
      secondMessage
    ) =>
      getMessageTime(
        firstMessage
      ) -
      getMessageTime(
        secondMessage
      )
  );
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/
function createOptimisticMessage({
  messageText,
  userId,
  visibleName,
  identityMode,
  replyMessage = null
}) {
  const temporaryId =
    `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

  return {
    chat_message_id:
      temporaryId,

    sender_user_id:
      userId,

    sender_visible_name:
      visibleName ||
      "Community member",

    sender_identity_mode:
      identityMode ||
      "username",

    message_text:
      messageText,

    created_at:
      new Date().toISOString(),

    is_deleted:
      false,

    is_edited:
      false,

    reply_to_message_id:
      replyMessage
        ?.chat_message_id ??
      null,

    reply_message_id:
      replyMessage
        ?.chat_message_id ??
      null,

    reply_sender_visible_name:
      replyMessage
        ?.sender_visible_name ??
      null,

    reply_message_text:
      replyMessage
        ?.message_text ??
      null,

    reply_is_deleted:
      Boolean(
        replyMessage
          ?.is_deleted
      ),

    optimistic: true
  };
}

function useCommunityChat(
  enabled = true,
  currentUserId = null
) {
  const [
    profileData,
    setProfileData
  ] = useState(null);

  const [
    room,
    setRoom
  ] = useState(null);

  const [
  messages,
  setMessages
] = useState(
  () =>
    sortMessages(
      getCachedMessages()
    )
);

  const [
    members,
    setMembers
  ] = useState([]);

  const [
    onlineUsers,
    setOnlineUsers
  ] = useState([]);

  const [
    typingUsers,
    setTypingUsers
  ] = useState([]);

  const [
    pagination,
    setPagination
  ] = useState({
    has_more: false,
    next_cursor: null
  });

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    loadingOlder,
    setLoadingOlder
  ] = useState(false);

  const [
    sending,
    setSending
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

 const typingTimerRef =
  useRef(null);

/*
|--------------------------------------------------------------------------
| Public identity
|--------------------------------------------------------------------------
*/

const visibleName =
  useMemo(
    () =>
      profileData
        ?.visibleName ||
      profileData
        ?.visible_name ||
      "Community member",
    [
      profileData
    ]
  );

const identityMode =
  profileData
    ?.profile
    ?.identity_mode ||
  "username";
    

  /*
  |--------------------------------------------------------------------------
  | Insert / update message
  |--------------------------------------------------------------------------
  */

  const upsertMessage =
    useCallback(
      (
        incomingMessage
      ) => {
        if (
          !incomingMessage
        ) {
          return;
        }

        setMessages(
          (
            currentMessages
          ) => {
            const incomingId =
              getCommunityChatMessageId(
                incomingMessage
              );

            const exists =
              currentMessages.some(
                (message) =>
                  String(
                    getCommunityChatMessageId(
                      message
                    )
                  ) ===
                  String(
                    incomingId
                  )
              );

            let nextMessages;

            if (exists) {
              nextMessages =
                currentMessages.map(
                  (
                    message
                  ) =>
                    String(
                      getCommunityChatMessageId(
                        message
                      )
                    ) ===
                    String(
                      incomingId
                    )
                      ? incomingMessage
                      : message
                );
            } else {
              nextMessages = [
                ...currentMessages,
                incomingMessage
              ];
            }

            const sortedMessages =
  sortMessages(
    nextMessages
  );

cacheMessages(
  sortedMessages
);

return sortedMessages;
          }
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Members
  |--------------------------------------------------------------------------
  */

  const loadMembers =
    useCallback(
      async () => {
        const result =
          await getPublicChatMembers();

        setMembers(
          Array.isArray(
            result?.members
          )
            ? result.members
            : []
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Initial connection
  |--------------------------------------------------------------------------
  */

 useEffect(() => {
  /*
  |--------------------------------------------------------------------------
  | Do NOT enter Community Chat until identity has been selected
  |--------------------------------------------------------------------------
  */

  if (!enabled) {
    setLoading(false);

    return undefined;
  }

  let cancelled =
    false;

  const cleanups = [];

  async function initializeChat() {
      try {
        setLoading(true);
        setError("");

        /*
         * Community identity must
         * already exist.
         */
        const profile =
          await getMyCommunityProfile();

        if (cancelled) {
          return;
        }

        setProfileData(
          profile
        );

        /*
         * Connect Socket.IO.
         */
        connectSocket();

        /*
         * Real-time messages.
         */
        cleanups.push(
          onSocketEvent(
            EVENTS.NEW,
            (
              message
            ) => {
              upsertMessage(
                message
              );

              /*
               * The user is actively
               * viewing the room.
               */
              emitSocketEvent(
                EVENTS.MARK_READ,
                {}
              ).catch(
                () => {}
              );
            }
          )
        );

        cleanups.push(
          onSocketEvent(
            EVENTS.EDITED,
            upsertMessage
          )
        );

        cleanups.push(
          onSocketEvent(
            EVENTS.DELETED,
            upsertMessage
          )
        );

        /*
         * Online users.
         */
        cleanups.push(
          onSocketEvent(
            EVENTS.ONLINE,
            (
              users
            ) => {
              setOnlineUsers(
                Array.isArray(
                  users
                )
                  ? users
                  : []
              );
            }
          )
        );

        /*
         * Typing indicator.
         */
        cleanups.push(
          onSocketEvent(
            EVENTS.TYPING_UPDATE,
            (
              users
            ) => {
              setTypingUsers(
                Array.isArray(
                  users
                )
                  ? users
                  : []
              );
            }
          )
        );

        /*
         * Member list updates.
         */
        cleanups.push(
          onSocketEvent(
            EVENTS.JOINED_USER,
            () => {
              loadMembers().catch(
                () => {}
              );
            }
          )
        );

        cleanups.push(
          onSocketEvent(
            EVENTS.LEFT_USER,
            () => {
              loadMembers().catch(
                () => {}
              );
            }
          )
        );

        /*
         * Join public community room.
         */
        const joined =
          await emitSocketEvent(
            EVENTS.JOIN,
            {}
          );

        if (cancelled) {
          return;
        }

        const joinedRoom =
          joined?.room ??
          null;

        setRoom(
          joinedRoom
        );

        /*
         * Load history and members.
         */
       /*
 * Load history first.
 * This is the only blocking work
 * required before showing chat.
 */
const history =
  await getPublicChatHistory({
    limit:
      INITIAL_MESSAGE_LIMIT
  });

if (cancelled) {
  return;
}

const freshMessages =
  sortMessages(
    Array.isArray(
      history?.messages
    )
      ? history.messages
      : []
  );

setMessages(
  freshMessages
);

cacheMessages(
  freshMessages
);
setPagination(
  history?.pagination ?? {
    has_more: false,
    next_cursor: null
  }
);

/*
 * Chat is usable now.
 * Stop the main loader immediately.
 */
setLoading(
  false
);

/*
 * Non-critical work in background.
 */
loadMembers().catch(
  () => {}
);

if (
  joinedRoom?.room_id
) {
  markPublicChatRead(
    joinedRoom.room_id
  ).catch(
    () => {}
  );
}
      } catch (
        requestError
      ) {
        if (
          cancelled
        ) {
          return;
        }

        setError(
          requestError
            ?.response
            ?.data
            ?.message ||
          requestError
            ?.message ||
          "Unable to open Community Chat."
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    initializeChat();

    return () => {
      cancelled =
        true;

      cleanups.forEach(
        (cleanup) =>
          cleanup?.()
      );

      if (
        typingTimerRef
          .current
      ) {
        window.clearTimeout(
          typingTimerRef
            .current
        );
      }
    };
  }, [
  enabled,
  loadMembers,
  upsertMessage
]);

  /*
  |--------------------------------------------------------------------------
  | Older messages
  |--------------------------------------------------------------------------
  */

  const loadOlder =
    useCallback(
      async () => {
        const cursor =
          pagination
            ?.next_cursor;

        if (
          !pagination
            ?.has_more ||
          !cursor ||
          loadingOlder
        ) {
          return;
        }

        try {
          setLoadingOlder(
            true
          );

          const result =
  await getPublicChatHistory({
    limit:
      OLDER_MESSAGE_LIMIT,

    beforeCreatedAt:
      cursor
        .before_created_at,

    beforeMessageId:
      cursor
        .before_message_id
  });

          setMessages(
            (
              currentMessages
            ) =>
              sortMessages([
                ...(
                  result
                    ?.messages ||
                  []
                ),

                ...currentMessages
              ])
          );

          setPagination(
            result
              ?.pagination ?? {
              has_more:
                false,

              next_cursor:
                null
            }
          );
        } catch (
          requestError
        ) {
          setError(
            requestError
              ?.response
              ?.data
              ?.message ||
            requestError
              ?.message ||
            "Unable to load older messages."
          );
        } finally {
          setLoadingOlder(
            false
          );
        }
      },
      [
        loadingOlder,
        pagination
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
      replyToMessageId =
        null,
      replyMessage =
        null
    ) => {
      const optimisticMessage =
        createOptimisticMessage({
          messageText,

          userId:
            currentUserId,

          visibleName,

          identityMode,

          replyMessage
        });

      /*
       * Render immediately.
       */
      setMessages(
  (
    currentMessages
  ) => {
    const nextMessages =
      sortMessages([
        ...currentMessages,
        optimisticMessage
      ]);

    cacheMessages(
      nextMessages
    );

    return nextMessages;
  }
);

      setError("");

      try {
        const result =
          await emitSocketEvent(
            EVENTS.SEND,
            {
              message_text:
                messageText,

              reply_to_message_id:
                replyToMessageId
            }
          );

        const savedMessage =
          result?.message;

        if (!savedMessage) {
          throw new Error(
            "Message was not saved."
          );
        }

        /*
         * Replace temporary bubble
         * with the real DB message.
         */
        setMessages(
          (
            currentMessages
          ) => {
            const withoutTemporary =
              currentMessages.filter(
                (
                  message
                ) =>
                  String(
                    getCommunityChatMessageId(
                      message
                    )
                  ) !==
                  String(
                    optimisticMessage
                      .chat_message_id
                  )
              );

            const realMessageId =
              getCommunityChatMessageId(
                savedMessage
              );

            const alreadyExists =
              withoutTemporary.some(
                (
                  message
                ) =>
                  String(
                    getCommunityChatMessageId(
                      message
                    )
                  ) ===
                  String(
                    realMessageId
                  )
              );

            if (
              alreadyExists
            ) {
  const nextMessages =
    sortMessages(
      withoutTemporary.map(
        (
          message
        ) =>
          String(
            getCommunityChatMessageId(
              message
            )
          ) ===
          String(
            realMessageId
          )
            ? savedMessage
            : message
      )
    );

  cacheMessages(
    nextMessages
  );

  return nextMessages;
}

const nextMessages =
  sortMessages([
    ...withoutTemporary,
    savedMessage
  ]);

cacheMessages(
  nextMessages
);

return nextMessages;
          }
        );

        return savedMessage;
      } catch (
        requestError
      ) {
        /*
         * Remove failed optimistic
         * message.
         */
        setMessages(
          (
            currentMessages
          ) =>
            currentMessages.filter(
              (
                message
              ) =>
                String(
                  getCommunityChatMessageId(
                    message
                  )
                ) !==
                String(
                  optimisticMessage
                    .chat_message_id
                )
            )
        );

        setError(
          requestError
            ?.message ||
          "Unable to send message."
        );

        throw requestError;
      }
    },
    [
      currentUserId,
      identityMode,
      visibleName
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Edit
  |--------------------------------------------------------------------------
  */

  const editMessage =
    useCallback(
      async (
        messageId,
        messageText
      ) => {
        const result =
          await emitSocketEvent(
            EVENTS.EDIT,
            {
              message_id:
                messageId,

              message_text:
                messageText
            }
          );

        upsertMessage(
          result?.message
        );

        return (
          result?.message
        );
      },
      [
        upsertMessage
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const deleteMessage =
    useCallback(
      async (
        messageId
      ) => {
        await emitSocketEvent(
          EVENTS.DELETE,
          {
            message_id:
              messageId
          }
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Typing
  |--------------------------------------------------------------------------
  */

  const setTyping =
    useCallback(
      (
        isTyping
      ) => {
        const socket =
          getSocket() ||
          connectSocket();

        if (!socket) {
          return;
        }

        socket.emit(
          isTyping
            ? EVENTS
                .TYPING_START
            : EVENTS
                .TYPING_STOP
        );

        if (
          typingTimerRef
            .current
        ) {
          window.clearTimeout(
            typingTimerRef
              .current
          );
        }

        if (
          isTyping
        ) {
          typingTimerRef.current =
            window.setTimeout(
              () => {
                socket.emit(
                  EVENTS
                    .TYPING_STOP
                );
              },
              1600
            );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Switch username / anonymous
  |--------------------------------------------------------------------------
  */

  const switchIdentity =
    useCallback(
      async (
        identityMode
      ) => {
        const existingAlias =
          profileData
            ?.profile
            ?.anonymous_alias ??
          null;

        const updatedProfile =
          await selectCommunityIdentity(
            identityMode,
            existingAlias
          );

        setProfileData(
          updatedProfile
        );

        /*
         * Re-join so Socket.IO's
         * online-user map and room
         * membership receive the new
         * visible name immediately.
         */
        const joined =
          await emitSocketEvent(
            EVENTS.JOIN,
            {}
          );

        if (
          joined?.room
        ) {
          setRoom(
            joined.room
          );
        }

        await loadMembers();

        return updatedProfile;
      },
      [
        loadMembers,
        profileData
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Public identity
  |--------------------------------------------------------------------------
  */

  

  return {
    room,

    messages,

    members,

    onlineUsers,

    typingUsers,

    profileData,

    visibleName,

    identityMode,

    loading,

    loadingOlder,

    sending,

    error,

    hasOlder:
      Boolean(
        pagination
          ?.has_more
      ),

    loadOlder,

    sendMessage,

    editMessage,

    deleteMessage,

    setTyping,

    switchIdentity,

    clearError:
      () =>
        setError("")
  };
}

export default useCommunityChat;