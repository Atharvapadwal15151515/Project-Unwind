import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createDirectConversation,
  deleteDirectMessage,
  editDirectMessage,
  getDirectConversation,
  getDirectConversations,
  getDirectMessages,
  getDirectUnreadCount,
  leaveDirectConversation,
  markDirectConversationRead,
  markDirectMessagesRead,
  rejoinDirectConversation,
  sendDirectMessage,
  setDirectConversationMuted
} from "../services/directMessageService";

import {
  getDirectConversationId,
  getDirectLatestMessageAt,
  getDirectMessageCreatedAt,
  getDirectMessageId,
  isDirectConversationMuted
} from "../utils/directMessageUtils";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MESSAGE_PAGE_SIZE = 30;

const ACTIVE_CONVERSATION_KEY =
  "unwind_active_direct_conversation";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

function normalizeArray(
  value
) {
  return Array.isArray(value)
    ? value
    : [];
}

function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.response?.data
      ?.message ||
    error?.message ||
    fallback
  );
}

/*
|--------------------------------------------------------------------------
| Normalize conversation API result
|--------------------------------------------------------------------------
|
| createDirectConversation() returns:
|
| {
|   conversation,
|   created
| }
|
| while getDirectConversation() returns
| the conversation directly.
|--------------------------------------------------------------------------
*/

function normalizeConversationResult(
  result
) {
  if (!result) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Conversation details response
  |--------------------------------------------------------------------------
  |
  | Backend GET /direct-conversations/:id returns:
  |
  | {
  |   conversation,
  |   membership,
  |   members,
  |   other_member
  | }
  |
  | Previously we returned only result.conversation.
  |
  | That removed other_member, which caused:
  |
  | "UNWIND Member"
  |
  | to appear in the chat header and details panel.
  |--------------------------------------------------------------------------
  */

  if (
    result?.conversation &&
    typeof result.conversation ===
      "object"
  ) {
    const otherMember =
      result.other_member ??
      result.otherMember ??
      null;

    const membership =
      result.membership ??
      null;

    return {
      ...result.conversation,

      membership,

      members:
        Array.isArray(
          result.members
        )
          ? result.members
          : [],

      other_member:
        otherMember,

      /*
       * Also flatten the fields because
       * the conversation-list endpoint
       * already uses this format.
       */
      other_user_id:
        otherMember?.user_id ??
        otherMember?.userId ??
        null,

      other_visible_name:
        otherMember?.visible_name ??
        otherMember?.visibleName ??
        null,

      other_identity_mode:
        otherMember?.identity_mode ??
        otherMember?.identityMode ??
        null,

      other_profile_image_url:
        otherMember
          ?.profile_image_url ??
        otherMember
          ?.profileImageUrl ??
        null,

      current_visible_name:
        membership?.visible_name ??
        membership?.visibleName ??
        null,

      current_identity_mode:
        membership?.identity_mode ??
        membership?.identityMode ??
        null,

      is_muted:
        membership?.is_muted ??
        membership?.isMuted ??
        false,

      is_archived:
        membership?.is_archived ??
        membership?.isArchived ??
        false
    };
  }

  if (
    result?.directConversation &&
    typeof result
      .directConversation ===
      "object"
  ) {
    return {
      ...result.directConversation
    };
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| Normalize message API result
|--------------------------------------------------------------------------
*/

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
    result?.directMessage &&
    typeof result
      .directMessage ===
      "object"
  ) {
    return result.directMessage;
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| Message sorting
|--------------------------------------------------------------------------
*/

function sortMessages(
  messageList
) {
  return [
    ...normalizeArray(
      messageList
    )
  ].sort(
    (
      firstMessage,
      secondMessage
    ) => {
      const firstTime =
        new Date(
          getDirectMessageCreatedAt(
            firstMessage
          ) || 0
        ).getTime();

      const secondTime =
        new Date(
          getDirectMessageCreatedAt(
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
| Conversation sorting
|--------------------------------------------------------------------------
*/

function sortConversations(
  conversationList
) {
  return [
    ...normalizeArray(
      conversationList
    )
  ].sort(
    (
      firstConversation,
      secondConversation
    ) => {
      const firstTime =
        new Date(
          getDirectLatestMessageAt(
            firstConversation
          ) || 0
        ).getTime();

      const secondTime =
        new Date(
          getDirectLatestMessageAt(
            secondConversation
          ) || 0
        ).getTime();

      return (
        secondTime -
        firstTime
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| Merge a message into the current list
|--------------------------------------------------------------------------
|
| Prevents duplicate messages later when Socket.IO and HTTP both deliver
| the same message.
|--------------------------------------------------------------------------
*/

function mergeMessageIntoList(
  currentMessages,
  incomingMessage
) {
  if (!incomingMessage) {
    return currentMessages;
  }

  const incomingId =
    getDirectMessageId(
      incomingMessage
    );

  if (!incomingId) {
    return sortMessages([
      ...currentMessages,
      incomingMessage
    ]);
  }

  const existingIndex =
    currentMessages.findIndex(
      (message) =>
        String(
          getDirectMessageId(
            message
          )
        ) ===
        String(
          incomingId
        )
    );

  /*
   * New message.
   */
  if (
    existingIndex === -1
  ) {
    return sortMessages([
      ...currentMessages,
      incomingMessage
    ]);
  }

  /*
   * Existing message being updated.
   */
  const nextMessages = [
    ...currentMessages
  ];

  nextMessages[
    existingIndex
  ] = {
    ...nextMessages[
      existingIndex
    ],
    ...incomingMessage
  };

  return sortMessages(
    nextMessages
  );
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function useDirectMessages() {
  /*
  |--------------------------------------------------------------------------
  | Core state
  |--------------------------------------------------------------------------
  */

  const [
    conversations,
    setConversations
  ] = useState([]);

  const [
    activeConversation,
    setActiveConversation
  ] = useState(null);

  const [
    messages,
    setMessages
  ] = useState([]);

  const [
    unreadCounts,
    setUnreadCounts
  ] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  const [
    conversationsLoading,
    setConversationsLoading
  ] = useState(true);

  const [
    conversationLoading,
    setConversationLoading
  ] = useState(false);

  const [
    messagesLoading,
    setMessagesLoading
  ] = useState(false);

  const [
    loadingOlderMessages,
    setLoadingOlderMessages
  ] = useState(false);

  const [
    startingConversation,
    setStartingConversation
  ] = useState(false);

  const [
    sendingMessage,
    setSendingMessage
  ] = useState(false);

  const [
    editingMessage,
    setEditingMessage
  ] = useState(false);

  const [
    deletingMessage,
    setDeletingMessage
  ] = useState(false);

  const [
    updatingConversation,
    setUpdatingConversation
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [
    hasOlderMessages,
    setHasOlderMessages
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Errors
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Active ID
  |--------------------------------------------------------------------------
  */

  const activeConversationId =
    useMemo(
      () =>
        getDirectConversationId(
          activeConversation
        ),
      [
        activeConversation
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Update one conversation locally
  |--------------------------------------------------------------------------
  */

  const updateConversationLocally =
    useCallback(
      (
        conversationId,
        updates
      ) => {
        if (!conversationId) {
          return;
        }

        setConversations(
          (
            currentConversations
          ) =>
            sortConversations(
              currentConversations.map(
                (conversation) => {
                  const currentId =
                    getDirectConversationId(
                      conversation
                    );

                  if (
                    String(
                      currentId
                    ) !==
                    String(
                      conversationId
                    )
                  ) {
                    return conversation;
                  }

                  return {
                    ...conversation,
                    ...updates
                  };
                }
              )
            )
        );

        setActiveConversation(
          (
            currentConversation
          ) => {
            if (
              String(
                getDirectConversationId(
                  currentConversation
                )
              ) !==
              String(
                conversationId
              )
            ) {
              return currentConversation;
            }

            return {
              ...currentConversation,
              ...updates
            };
          }
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Load conversation list
  |--------------------------------------------------------------------------
  */

  const loadConversations =
    useCallback(
      async ({
        showLoader = true
      } = {}) => {
        try {
          if (showLoader) {
            setConversationsLoading(
              true
            );
          }

          setError("");

          const result =
            await getDirectConversations({
              limit: 50,
              offset: 0
            });

          const normalized =
            sortConversations(
              result
            );

          setConversations(
            normalized
          );

          return normalized;
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load direct conversations:",
            requestError
          );

          setError(
            getErrorMessage(
              requestError,
              "Unable to load your direct messages."
            )
          );

          return [];
        } finally {
          if (showLoader) {
            setConversationsLoading(
              false
            );
          }
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Initial load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /*
  |--------------------------------------------------------------------------
  | Load unread counts
  |--------------------------------------------------------------------------
  */

  const loadUnreadCounts =
    useCallback(
      async (
        conversationList =
          conversations
      ) => {
        const validConversations =
          normalizeArray(
            conversationList
          );

        if (
          validConversations
            .length === 0
        ) {
          setUnreadCounts({});
          return {};
        }

        const results =
          await Promise.allSettled(
            validConversations.map(
              async (
                conversation
              ) => {
                const conversationId =
                  getDirectConversationId(
                    conversation
                  );

                if (
                  !conversationId
                ) {
                  return null;
                }

                const unreadCount =
                  await getDirectUnreadCount(
                    conversationId
                  );

                return {
                  conversationId,
                  unreadCount:
                    Number(
                      unreadCount
                    ) || 0
                };
              }
            )
          );

        const nextCounts = {};

        results.forEach(
          (result) => {
            if (
              result.status !==
                "fulfilled" ||
              !result.value
            ) {
              return;
            }

            nextCounts[
              result.value
                .conversationId
            ] =
              result.value
                .unreadCount;
          }
        );

        setUnreadCounts(
          nextCounts
        );

        return nextCounts;
      },
      [conversations]
    );

  useEffect(() => {
    if (
      conversations.length >
      0
    ) {
      loadUnreadCounts(
        conversations
      );
    }
  }, [
    conversations,
    loadUnreadCounts
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load one conversation
  |--------------------------------------------------------------------------
  */

  const loadConversationDetails =
    useCallback(
      async (
        conversationId
      ) => {
        if (
          !conversationId
        ) {
          return null;
        }

        try {
          setConversationLoading(
            true
          );

          setError("");

          const result =
            await getDirectConversation(
              conversationId
            );

          const conversation =
            normalizeConversationResult(
              result
            );

          if (
            conversation
          ) {
            setActiveConversation(
              conversation
            );

            setConversations(
              (
                currentConversations
              ) => {
                const exists =
                  currentConversations.some(
                    (
                      currentConversation
                    ) =>
                      String(
                        getDirectConversationId(
                          currentConversation
                        )
                      ) ===
                      String(
                        conversationId
                      )
                  );

                if (!exists) {
                  return sortConversations([
                    conversation,
                    ...currentConversations
                  ]);
                }

                return sortConversations(
                  currentConversations.map(
                    (
                      currentConversation
                    ) =>
                      String(
                        getDirectConversationId(
                          currentConversation
                        )
                      ) ===
                      String(
                        conversationId
                      )
                        ? {
                            ...currentConversation,
                            ...conversation
                          }
                        : currentConversation
                  )
                );
              }
            );
          }

          return conversation;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load this conversation."
            )
          );

          throw requestError;
        } finally {
          setConversationLoading(
            false
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Mark active conversation read
  |--------------------------------------------------------------------------
  */

  const markConversationRead =
    useCallback(
      async (
        conversationId
      ) => {
        if (
          !conversationId
        ) {
          return;
        }

        /*
         * Update UI immediately.
         */
        setUnreadCounts(
          (
            currentCounts
          ) => ({
            ...currentCounts,
            [conversationId]: 0
          })
        );

        try {
          /*
           * Your backend exposes both
           * conversation-level and
           * message-level read routes.
           *
           * Use both, but do not let a
           * read-state failure break the
           * actual chat.
           */
          await Promise.allSettled([
            markDirectConversationRead(
              conversationId
            ),

            markDirectMessagesRead(
              conversationId
            )
          ]);
        } catch (
          readError
        ) {
          console.warn(
            "Unable to mark direct conversation as read:",
            readError
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Load messages
  |--------------------------------------------------------------------------
  */

  const loadMessages =
    useCallback(
      async (
        conversationId,
        {
          markRead = true
        } = {}
      ) => {
        if (
          !conversationId
        ) {
          setMessages([]);
          return [];
        }

        try {
          setMessagesLoading(
            true
          );

          setError("");

          const result =
            await getDirectMessages({
              conversationId,

              limit:
                MESSAGE_PAGE_SIZE
            });

          const normalized =
            sortMessages(
              result
            );

          setMessages(
            normalized
          );

          setHasOlderMessages(
            normalized.length >=
              MESSAGE_PAGE_SIZE
          );

          if (markRead) {
            await markConversationRead(
              conversationId
            );
          }

          return normalized;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load messages."
            )
          );

          return [];
        } finally {
          setMessagesLoading(
            false
          );
        }
      },
      [
        markConversationRead
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Open conversation
  |--------------------------------------------------------------------------
  */

  const openConversation =
    useCallback(
      async (
        conversation
      ) => {
        const conversationId =
          typeof conversation ===
            "string"
            ? conversation
            : getDirectConversationId(
                conversation
              );

        if (
          !conversationId
        ) {
          return null;
        }

        setError("");

        /*
         * Show selected conversation
         * immediately while details load.
         */
        if (
          typeof conversation ===
            "object"
        ) {
          setActiveConversation(
            conversation
          );
        }

        /*
         * Persist only an ID.
         *
         * Never persist full messages or
         * conversation objects in storage.
         */
        try {
          localStorage.setItem(
            ACTIVE_CONVERSATION_KEY,
            String(
              conversationId
            )
          );
        } catch {
          // Storage unavailable.
        }

        const [
          conversationResult
        ] =
          await Promise.all([
            loadConversationDetails(
              conversationId
            ),

            loadMessages(
              conversationId
            )
          ]);

        return (
          conversationResult ||
          conversation
        );
      },
      [
        loadConversationDetails,
        loadMessages
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Restore opened conversation after refresh
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      conversationsLoading ||
      conversations.length ===
        0 ||
      activeConversation
    ) {
      return;
    }

    let storedId = null;

    try {
      storedId =
        localStorage.getItem(
          ACTIVE_CONVERSATION_KEY
        );
    } catch {
      storedId = null;
    }

    if (!storedId) {
      return;
    }

    const storedConversation =
      conversations.find(
        (conversation) =>
          String(
            getDirectConversationId(
              conversation
            )
          ) ===
          String(
            storedId
          )
      );

    if (
      storedConversation
    ) {
      openConversation(
        storedConversation
      ).catch(
        (restoreError) => {
          console.warn(
            "Unable to restore direct conversation:",
            restoreError
          );
        }
      );
    } else {
      try {
        localStorage.removeItem(
          ACTIVE_CONVERSATION_KEY
        );
      } catch {
        // Storage unavailable.
      }
    }
  }, [
    conversations,
    conversationsLoading,
    activeConversation,
    openConversation
  ]);

  /*
  |--------------------------------------------------------------------------
  | Close active conversation UI
  |--------------------------------------------------------------------------
  */

  const clearActiveConversation =
    useCallback(
      () => {
        setActiveConversation(
          null
        );

        setMessages([]);

        setHasOlderMessages(
          true
        );

        setError("");

        try {
          localStorage.removeItem(
            ACTIVE_CONVERSATION_KEY
          );
        } catch {
          // Storage unavailable.
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Start conversation
  |--------------------------------------------------------------------------
  */

  const startConversation =
  useCallback(
    async (
      recipientUserId
    ) => {
      if (
        !recipientUserId
      ) {
        return null;
      }

      try {
        setStartingConversation(
          true
        );

        setError("");

        /*
        |--------------------------------------------------------------------------
        | Create OR find existing conversation
        |--------------------------------------------------------------------------
        */

        const result =
          await createDirectConversation(
            recipientUserId
          );

        const conversation =
          normalizeConversationResult(
            result
          );

        if (!conversation) {
          throw new Error(
            "Conversation could not be opened."
          );
        }

        const conversationId =
          getDirectConversationId(
            conversation
          );

        if (!conversationId) {
          throw new Error(
            "Conversation ID was not returned."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Refresh sidebar
        |--------------------------------------------------------------------------
        |
        | The create endpoint may return only the base conversation object.
        | The sidebar endpoint returns the enriched conversation.
        |--------------------------------------------------------------------------
        */

        await loadConversations({
          showLoader: false
        });

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT FIX
        |--------------------------------------------------------------------------
        |
        | Previously we passed the partial object:
        |
        |   openConversation(conversation)
        |
        | A newly-created conversation may not yet contain:
        |
        | - other_member
        | - membership
        | - participant information
        |
        | Open using the conversation ID instead.
        |
        | openConversation(id) then calls:
        |
        | GET /direct-conversations/:id
        |
        | and loads the complete conversation + message history.
        |--------------------------------------------------------------------------
        */

        const openedConversation =
          await openConversation(
            conversationId
          );

        return (
          openedConversation ||
          conversation
        );
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to start this conversation."
          )
        );

        throw requestError;
      } finally {
        setStartingConversation(
          false
        );
      }
    },
    [
      loadConversations,
      openConversation
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
            null
        } = {}
      ) => {
        const cleanedText =
          String(
            messageText || ""
          ).trim();

        if (
          !activeConversationId ||
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
            await sendDirectMessage({
              conversationId:
                activeConversationId,

              messageText:
                cleanedText,

              replyToMessageId
            });

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
                mergeMessageIntoList(
                  currentMessages,
                  sentMessage
                )
            );

            /*
             * Move this conversation to
             * the top of the sidebar.
             */
            updateConversationLocally(
              activeConversationId,
              {
                latest_message_text:
                  cleanedText,

                latest_message_created_at:
                  getDirectMessageCreatedAt(
                    sentMessage
                  ),

                latest_message_is_deleted:
                  false
              }
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
        activeConversationId,
        updateConversationLocally
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
        const cleanedText =
          String(
            messageText || ""
          ).trim();

        if (
          !activeConversationId ||
          !messageId ||
          !cleanedText
        ) {
          return null;
        }

        try {
          setEditingMessage(
            true
          );

          setError("");

          const result =
            await editDirectMessage({
              conversationId:
                activeConversationId,

              messageId,

              messageText:
                cleanedText
            });

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
                mergeMessageIntoList(
                  currentMessages,
                  updatedMessage
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
        } finally {
          setEditingMessage(
            false
          );
        }
      },
      [
        activeConversationId
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Delete message
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Direct messages are SOFT-DELETED.
  |
  | Do not remove them from state completely.
  |
  | Keeping the deleted record means:
  |
  | Reply references remain valid
  | "This message was deleted" can render
  | conversation history stays structurally correct
  |--------------------------------------------------------------------------
  */

  const removeMessage =
    useCallback(
      async (
        messageId
      ) => {
        if (
          !activeConversationId ||
          !messageId
        ) {
          return null;
        }

        try {
          setDeletingMessage(
            true
          );

          setError("");

          const result =
            await deleteDirectMessage({
              conversationId:
                activeConversationId,

              messageId
            });

          const deletedMessage =
            normalizeMessageResult(
              result
            );

          /*
           * Backend should return the
           * soft-deleted message.
           */
          if (
            deletedMessage
          ) {
            setMessages(
              (
                currentMessages
              ) =>
                mergeMessageIntoList(
                  currentMessages,
                  deletedMessage
                )
            );
          } else {
            /*
             * Defensive fallback if the
             * API ever returns no message.
             */
            setMessages(
              (
                currentMessages
              ) =>
                currentMessages.map(
                  (message) =>
                    String(
                      getDirectMessageId(
                        message
                      )
                    ) ===
                    String(
                      messageId
                    )
                      ? {
                          ...message,

                          message_text:
                            null,

                          is_deleted:
                            true,

                          deleted_at:
                            new Date()
                              .toISOString()
                        }
                      : message
                )
            );
          }

          return deletedMessage;
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
        } finally {
          setDeletingMessage(
            false
          );
        }
      },
      [
        activeConversationId
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
          !activeConversationId ||
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
          getDirectMessageId(
            oldestMessage
          );

        if (
          !beforeMessageId
        ) {
          setHasOlderMessages(
            false
          );

          return [];
        }

        try {
          setLoadingOlderMessages(
            true
          );

          const result =
            await getDirectMessages({
              conversationId:
                activeConversationId,

              beforeMessageId,

              limit:
                MESSAGE_PAGE_SIZE
            });

          const olderMessages =
            sortMessages(
              result
            );

          if (
            olderMessages.length <
            MESSAGE_PAGE_SIZE
          ) {
            setHasOlderMessages(
              false
            );
          }

          if (
            olderMessages.length >
            0
          ) {
            setMessages(
              (
                currentMessages
              ) => {
                const existingIds =
                  new Set(
                    currentMessages
                      .map(
                        (
                          message
                        ) =>
                          getDirectMessageId(
                            message
                          )
                      )
                      .filter(
                        Boolean
                      )
                      .map(
                        String
                      )
                  );

                const uniqueOlder =
                  olderMessages.filter(
                    (message) => {
                      const messageId =
                        getDirectMessageId(
                          message
                        );

                      if (
                        !messageId
                      ) {
                        return true;
                      }

                      return !existingIds.has(
                        String(
                          messageId
                        )
                      );
                    }
                  );

                return sortMessages([
                  ...uniqueOlder,
                  ...currentMessages
                ]);
              }
            );
          }

          return olderMessages;
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
        activeConversationId,
        messages,
        loadingOlderMessages,
        hasOlderMessages
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Mute / unmute
  |--------------------------------------------------------------------------
  */

  const setMuted =
    useCallback(
      async (
        isMuted
      ) => {
        if (
          !activeConversationId
        ) {
          return null;
        }

        try {
          setUpdatingConversation(
            true
          );

          setError("");

          const result =
            await setDirectConversationMuted(
              activeConversationId,
              isMuted
            );

          updateConversationLocally(
            activeConversationId,
            {
              is_muted:
                Boolean(
                  isMuted
                )
            }
          );

          return result;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              isMuted
                ? "Unable to mute this conversation."
                : "Unable to unmute this conversation."
            )
          );

          throw requestError;
        } finally {
          setUpdatingConversation(
            false
          );
        }
      },
      [
        activeConversationId,
        updateConversationLocally
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Leave conversation
  |--------------------------------------------------------------------------
  */

  const leaveConversation =
    useCallback(
      async () => {
        if (
          !activeConversationId
        ) {
          return null;
        }

        try {
          setUpdatingConversation(
            true
          );

          setError("");

          const conversationId =
            activeConversationId;

          const result =
            await leaveDirectConversation(
              conversationId
            );

          /*
           * Reload rather than guessing
           * which fields the backend
           * modifies on leave.
           */
          await loadConversations({
            showLoader: false
          });

          clearActiveConversation();

          return result;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to leave this conversation."
            )
          );

          throw requestError;
        } finally {
          setUpdatingConversation(
            false
          );
        }
      },
      [
        activeConversationId,
        clearActiveConversation,
        loadConversations
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Rejoin conversation
  |--------------------------------------------------------------------------
  */

  const rejoinConversation =
    useCallback(
      async (
        conversationId =
          activeConversationId
      ) => {
        if (
          !conversationId
        ) {
          return null;
        }

        try {
          setUpdatingConversation(
            true
          );

          setError("");

          const result =
            await rejoinDirectConversation(
              conversationId
            );

          await loadConversations({
            showLoader: false
          });

          await openConversation(
            conversationId
          );

          return result;
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to rejoin this conversation."
            )
          );

          throw requestError;
        } finally {
          setUpdatingConversation(
            false
          );
        }
      },
      [
        activeConversationId,
        loadConversations,
        openConversation
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Derived state
  |--------------------------------------------------------------------------
  */

  const activeConversationMuted =
    useMemo(
      () =>
        isDirectConversationMuted(
          activeConversation
        ),
      [
        activeConversation
      ]
    );

  const totalUnreadCount =
    useMemo(
      () =>
        Object.values(
          unreadCounts
        ).reduce(
          (
            total,
            value
          ) =>
            total +
            (
              Number(
                value
              ) || 0
            ),
          0
        ),
      [
        unreadCounts
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Exposed state/actions
  |--------------------------------------------------------------------------
  */

  return {
    /*
     * Data
     */
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    unreadCounts,

    /*
     * Derived values
     */
    activeConversationMuted,
    totalUnreadCount,

    /*
     * Loading
     */
    conversationsLoading,
    conversationLoading,
    messagesLoading,
    loadingOlderMessages,
    startingConversation,
    sendingMessage,
    editingMessage,
    deletingMessage,
    updatingConversation,

    /*
     * Pagination
     */
    hasOlderMessages,

    /*
     * Error
     */
    error,

    /*
     * Conversations
     */
    loadConversations,
    loadConversationDetails,
    openConversation,
    clearActiveConversation,
    startConversation,

    /*
     * Messages
     */
    loadMessages,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage:
      removeMessage,

    /*
     * Read state
     */
    markConversationRead,
    loadUnreadCounts,

    /*
     * Conversation settings
     */
    setMuted,
    leaveConversation,
    rejoinConversation,

    /*
     * Utilities for Socket.IO later
     */
    setConversations,
    setActiveConversation,
    setMessages,
    setUnreadCounts,

    mergeIncomingMessage:
      (incomingMessage) => {
        setMessages(
          (
            currentMessages
          ) =>
            mergeMessageIntoList(
              currentMessages,
              incomingMessage
            )
        );
      },

    /*
     * Clear page error
     */
    clearError: () =>
      setError("")
  };
}

export default useDirectMessages;