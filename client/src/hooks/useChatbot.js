import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  getConversations,
  streamChatMessage
} from "../services/chatbotService";

function getConversationId(
  conversation
) {
  if (
    !conversation ||
    typeof conversation !==
      "object"
  ) {
    return null;
  }

  const id =
    conversation
      .conversation_id ??
    conversation
      .conversationId ??
    conversation.id ??
    null;

  if (
    id === null ||
    id === undefined ||
    id === ""
  ) {
    return null;
  }

  return String(id);
}

function getConversationTitle(
  conversation
) {
  return (
    conversation?.title ||
    conversation?.conversation_title ||
    conversation?.conversationTitle ||
    "New conversation"
  );
}

function getMessageId(
  message
) {
  return (
    message?.message_id ||
    message?.messageId ||
    message?.id ||
    crypto.randomUUID()
  );
}

function getMessageRole(
  message
) {
  const role =
    message?.message_role ||
    message?.messageRole ||
    message?.role ||
    message?.sender_role ||
    message?.senderRole ||
    message?.sender ||
    "assistant";

  if (
    role === "user" ||
    role === "human"
  ) {
    return "user";
  }

  return "assistant";
}

function getMessageContent(
  message
) {
  return (
    message?.message_content ??
    message?.messageContent ??
    message?.content ??
    message?.message ??
    message?.text ??
    ""
  );
}

function normalizeMessages(
  messages
) {
  if (
    !Array.isArray(
      messages
    )
  ) {
    return [];
  }

  return messages.map(
    (message) => ({
      ...message,

      id:
        getMessageId(
          message
        ),

      role:
        getMessageRole(
          message
        ),

      content:
        getMessageContent(
          message
        ),

      source:
        message?.response_source ??
        message?.responseSource ??
        message?.source ??
        null,

      provider:
        message?.provider_name ??
        message?.providerName ??
        message?.provider ??
        null,

      model:
        message?.model_name ??
        message?.modelName ??
        message?.model ??
        null,

      createdAt:
        message?.created_at ??
        message?.createdAt ??
        null
    })
  );
}

export function useChatbot() {
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
    conversationsLoading,
    setConversationsLoading
  ] = useState(true);

  const [
    messagesLoading,
    setMessagesLoading
  ] = useState(false);

  const [
    streaming,
    setStreaming
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const abortControllerRef =
    useRef(null);

  const activeConversationId =
    getConversationId(
      activeConversation
    );

  /*
  |--------------------------------------------------------------------------
  | Load conversation list
  |--------------------------------------------------------------------------
  */

  const loadConversations =
    useCallback(
      async () => {
        try {
          setConversationsLoading(
            true
          );

          setError("");

          const result =
  await getConversations();

          const conversationList =
            Array.isArray(result)
              ? result
              : [];

          setConversations(
            conversationList
          );

          return conversationList;
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load chatbot conversations:",
            requestError
          );

          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "Unable to load your conversations."
          );

          return [];
        } finally {
          setConversationsLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
          getConversationId(
            conversation
          );

          console.log(
  "SENDING MESSAGE TO CONVERSATION:",
  conversationId
);

        if (!conversationId) {
          return;
        }

        try {
          setMessagesLoading(true);
          setError("");

          setActiveConversation(
            conversation
          );

          const result =
            await getConversationMessages(
              conversationId
            );

          setMessages(
            normalizeMessages(
              result
            )
          );
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load conversation:",
            requestError
          );

          setMessages([]);

          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "Unable to load this conversation."
          );
        } finally {
          setMessagesLoading(false);
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | New conversation
  |--------------------------------------------------------------------------
  */

  const startNewConversation =
    useCallback(
      () => {
        abortControllerRef
          .current
          ?.abort();

        setStreaming(false);

        setActiveConversation(
          null
        );

        setMessages([]);

        setError("");
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Ensure a conversation exists
  |--------------------------------------------------------------------------
  */

  const ensureConversation =
    useCallback(
      async (
        firstMessage
      ) => {
        if (
          activeConversationId
        ) {
          return activeConversation;
        }

        const title =
          String(firstMessage)
            .trim()
            .slice(0, 55) ||
          "New conversation";

        const createdConversation =
          await createConversation({
            title
          });

          console.log(
  "CREATED CONVERSATION:",
  createdConversation
);

        if (
          !createdConversation
        ) {
          throw new Error(
            "The conversation could not be created."
          );
        }

        setActiveConversation(
          createdConversation
        );

        setConversations(
          (
            currentConversations
          ) => [
            createdConversation,
            ...currentConversations
          ]
        );

        return createdConversation;
      },
      [
        activeConversation,
        activeConversationId
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Send message
  |--------------------------------------------------------------------------
  */

  const sendMessage =
    useCallback(
      async (text) => {
        const messageText =
          String(text || "")
            .trim();

        if (
          !messageText ||
          streaming
        ) {
          return;
        }

        const temporaryUserId =
          `user-${Date.now()}`;

        const temporaryAssistantId =
          `assistant-${Date.now()}`;

        try {
          setError("");
          setStreaming(true);

          const conversation =
            await ensureConversation(
              messageText
            );

          const conversationId =
            getConversationId(
              conversation
            );

          if (!conversationId) {
            throw new Error(
              "Conversation ID is unavailable."
            );
          }

          setMessages(
            (currentMessages) => [
              ...currentMessages,

              {
                id:
                  temporaryUserId,

                role: "user",

                content:
                  messageText,

                createdAt:
                  new Date().toISOString()
              },

              {
                id:
                  temporaryAssistantId,

                role:
                  "assistant",

                content: "",

                streaming:
                  true,

                createdAt:
                  new Date().toISOString()
              }
            ]
          );

          const controller =
            new AbortController();

          abortControllerRef.current =
            controller;

          const result =
            await streamChatMessage({
              conversationId,

              message:
                messageText,

              signal:
                controller.signal,

              onChunk: (
                chunk,
                fullText
              ) => {
                setMessages(
                  (
                    currentMessages
                  ) =>
                    currentMessages.map(
                      (message) =>
                        message.id ===
                        temporaryAssistantId
                          ? {
                              ...message,

                              content:
                                fullText
                            }
                          : message
                    )
                );
              }
            });

          setMessages(
            (
              currentMessages
            ) =>
              currentMessages.map(
                (message) =>
                  message.id ===
                  temporaryAssistantId
                    ? {
                        ...message,

                        content:
                          result?.text ||
                          message.content,

                        streaming:
                          false,

                        source:
                          result?.source ||
                          null,

                        intent:
                          result?.intent ||
                          null,

                        provider:
                          result?.provider ||
                          null
                      }
                    : message
              )
          );

          /*
           * Reload stored messages once the
           * stream finishes so IDs and metadata
           * exactly match the database.
           */
          try {
            const storedMessages =
              await getConversationMessages(
                conversationId
              );

            if (
              Array.isArray(
                storedMessages
              ) &&
              storedMessages.length > 0
            ) {
              setMessages(
                normalizeMessages(
                  storedMessages
                )
              );
            }
          } catch {
            // Keep optimistic messages.
          }

          return result;
        } catch (
          requestError
        ) {
          if (
            requestError?.name ===
            "AbortError"
          ) {
            setMessages(
              (
                currentMessages
              ) =>
                currentMessages.map(
                  (message) =>
                    message.id ===
                    temporaryAssistantId
                      ? {
                          ...message,

                          streaming:
                            false
                        }
                      : message
                )
            );

            return;
          }

          console.error(
            "Unable to send chatbot message:",
            requestError
          );

          setMessages(
            (
              currentMessages
            ) =>
              currentMessages.filter(
                (message) =>
                  message.id !==
                  temporaryAssistantId
              )
          );

          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "UNWIND could not respond right now."
          );

          throw requestError;
        } finally {
          abortControllerRef.current =
            null;

          setStreaming(false);
        }
      },
      [
        ensureConversation,
        streaming
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Stop streaming
  |--------------------------------------------------------------------------
  */

  const stopStreaming =
    useCallback(
      () => {
        abortControllerRef
          .current
          ?.abort();

        abortControllerRef.current =
          null;

        setStreaming(false);
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Delete conversation
  |--------------------------------------------------------------------------
  */

  const removeConversation =
    useCallback(
      async (
        conversation
      ) => {
        const conversationId =
          getConversationId(
            conversation
          );

        if (!conversationId) {
          return;
        }

        await deleteConversation(
          conversationId
        );

        setConversations(
          (
            currentConversations
          ) =>
            currentConversations.filter(
              (
                currentConversation
              ) =>
                getConversationId(
                  currentConversation
                ) !==
                conversationId
            )
        );

        if (
          activeConversationId ===
          conversationId
        ) {
          startNewConversation();
        }
      },
      [
        activeConversationId,
        startNewConversation
      ]
    );

  return {
    conversations,

    activeConversation,
    activeConversationId,

    messages,

    conversationsLoading,
    messagesLoading,
    streaming,
    error,

    loadConversations,
    openConversation,
    startNewConversation,
    sendMessage,
    stopStreaming,
    removeConversation,

    getConversationId,
    getConversationTitle,

    clearError: () =>
      setError("")
  };
}