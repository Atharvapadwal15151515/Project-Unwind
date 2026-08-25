import {
  AlertCircle,
  BellOff,
  BellRing,
  LoaderCircle,
  Menu,
  MessageCircle,
  MoreVertical,
  Search,
  UserRound,
  UsersRound,
  X
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useConfirm
} from "../../context/ConfirmDialogContext";
import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../../context/AuthContext";

import {
  useDirectMessages
} from "../../hooks/useDirectMessages";

import MessageList
  from "../../components/messages/MessageList";

import MessageComposer
  from "../../components/messages/MessageComposer";

import MemberAvatar
  from "../../components/messages/MemberAvatar";

import {
  getDirectConversationId,
  getDirectConversationUnreadCount,
  getDirectLatestMessageText,
  getDirectMessageCreatedAt,
  getDirectMessageEditedAt,
  getDirectMessageId,
  getDirectMessageSenderImage,
  getDirectMessageSenderName,
  getDirectMessageText,
  getDirectMessageUserId,
  getDirectOtherImage,
  getDirectOtherName,
  getDirectOtherUserId,

  getDirectReplyMessageId,
  getDirectReplySenderName,
  getDirectReplyMessageText,
  isDirectReplyDeleted,
  isDirectMessageDeleted
} from "../../utils/directMessageUtils";

import ReportModal
  from "../../components/reports/ReportModal";

import "./Messages.css";

/*
|--------------------------------------------------------------------------
| Current user ID
|--------------------------------------------------------------------------
*/

function getCurrentUserId(
  user
) {
  return (
    user?.user_id ??
    user?.userId ??
    user?.id ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| Date formatting
|--------------------------------------------------------------------------
*/

function formatConversationTime(
  conversation
) {
  const value =
    conversation?.latest_message_created_at ??
    conversation?.latestMessageCreatedAt ??
    conversation?.last_activity_at ??
    conversation?.lastActivityAt ??
    null;

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const today =
    new Date();

  const sameDay =
    date.toDateString() ===
    today.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  return date.toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric"
    }
  );
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function MessagesPage() {
  const {
    user
  } = useAuth();
const confirm = useConfirm();
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const currentUserId =
    getCurrentUserId(
      user
    );

  /*
  |--------------------------------------------------------------------------
  | Direct-message hook
  |--------------------------------------------------------------------------
  */

  const [
  reportTarget,
  setReportTarget
] = useState(
  null
);

  const {
    conversations,
    activeConversation,
    activeConversationId,

    messages,
    unreadCounts,

    activeConversationMuted,

    conversationsLoading,
    conversationLoading,
    messagesLoading,
    loadingOlderMessages,

    startingConversation,
    sendingMessage,
    editingMessage:
      editingMessageSaving,
    deletingMessage,

    updatingConversation,

    hasOlderMessages,

    error,

    openConversation,
    clearActiveConversation,

    startConversation,

    loadOlderMessages,

    sendMessage,
    editMessage,
    deleteMessage,

    setMuted,
    leaveConversation,

    clearError
  } = useDirectMessages();

  /*
  |--------------------------------------------------------------------------
  | UI state
  |--------------------------------------------------------------------------
  */

  const [
    searchValue,
    setSearchValue
  ] = useState("");

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen
  ] = useState(false);

  const [
    detailsOpen,
    setDetailsOpen
  ] = useState(false);

  const [
    replyMessage,
    setReplyMessage
  ] = useState(null);

  const [
    editingMessage,
    setEditingMessage
  ] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Active participant
  |--------------------------------------------------------------------------
  */

  const otherUserName =
    getDirectOtherName(
      activeConversation
    );

  const otherUserImage =
    getDirectOtherImage(
      activeConversation
    );

  const otherUserId =
    getDirectOtherUserId(
      activeConversation
    );

  /*
  |--------------------------------------------------------------------------
  | Filtered conversations
  |--------------------------------------------------------------------------
  */

  const filteredConversations =
    useMemo(() => {
      const query =
        searchValue
          .trim()
          .toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) => {
          const name =
            getDirectOtherName(
              conversation
            )
              .toLowerCase();

          const preview =
            getDirectLatestMessageText(
              conversation
            )
              .toLowerCase();

          return (
            name.includes(
              query
            ) ||
            preview.includes(
              query
            )
          );
        }
      );
    }, [
      conversations,
      searchValue
    ]);

  /*
  |--------------------------------------------------------------------------
  | Start conversation from Community
  |--------------------------------------------------------------------------
  |
  | Later we will navigate here using:
  |
  | navigate("/dashboard/messages", {
  |   state: {
  |     recipientUserId: "..."
  |   }
  | });
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const recipientUserId =
      location.state
        ?.recipientUserId;

    if (
      !recipientUserId
    ) {
      return;
    }

    let cancelled =
      false;

    const openRecipient =
      async () => {
        try {
          const conversation =
            await startConversation(
              recipientUserId
            );

          if (
            cancelled ||
            !conversation
          ) {
            return;
          }

          /*
           * Remove routing state so
           * refreshing does not attempt
           * to create/open it again.
           */
          navigate(
            location.pathname,
            {
              replace: true,
              state: null
            }
          );
        } catch {
          // Hook owns the error.
        }
      };

    openRecipient();

    return () => {
      cancelled = true;
    };
  }, [
    location.pathname,
    location.state,
    navigate,
    startConversation
  ]);

  /*
  |--------------------------------------------------------------------------
  | Open conversation
  |--------------------------------------------------------------------------
  */

  const handleOpenConversation =
    async (
      conversation
    ) => {
      try {
        await openConversation(
          conversation
        );

        setReplyMessage(
          null
        );

        setEditingMessage(
          null
        );

        setDetailsOpen(
          false
        );

        setMobileSidebarOpen(
          false
        );
      } catch {
        // Hook owns the error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Send / edit / reply
  |--------------------------------------------------------------------------
  */

  const handleSend =
    async (
      text
    ) => {
      /*
       * Edit takes precedence.
       */
      if (
        editingMessage
      ) {
        const messageId =
          getDirectMessageId(
            editingMessage
          );

        if (!messageId) {
          return;
        }

        await editMessage(
          messageId,
          text
        );

        setEditingMessage(
          null
        );

        return;
      }

      const replyToMessageId =
        replyMessage
          ? getDirectMessageId(
              replyMessage
            )
          : null;

      await sendMessage(
        text,
        {
          replyToMessageId
        }
      );

      setReplyMessage(
        null
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDeleteMessage =
    async (
      messageId
    ) => {
      if (!messageId) {
        return;
      }

     const confirmed =
  await confirm({
    title: "Delete message?",
    message:
      "This message will be deleted from the conversation.",
    confirmText: "Delete message",
    tone: "danger"
  });

      if (!confirmed) {
        return;
      }

      try {
        await deleteMessage(
          messageId
        );
      } catch {
        // Hook owns error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Mute
  |--------------------------------------------------------------------------
  */

  const handleMuteToggle =
    async () => {
      try {
        await setMuted(
          !activeConversationMuted
        );
      } catch {
        // Hook owns error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Leave conversation
  |--------------------------------------------------------------------------
  */

  const handleLeave =
    async () => {
    const confirmed =
  await confirm({
    title: "Leave conversation?",
    message:
      "You will leave this private conversation.",
    confirmText: "Leave conversation",
    tone: "danger"
  });

      if (!confirmed) {
        return;
      }

      try {
        await leaveConversation();

        setDetailsOpen(
          false
        );

        setReplyMessage(
          null
        );

        setEditingMessage(
          null
        );
      } catch {
        // Hook owns error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Begin a new DM
  |--------------------------------------------------------------------------
  |
  | There is currently no backend member-search endpoint.
  | Send the user to Community instead of inventing one.
  |--------------------------------------------------------------------------
  */

  const handleNewConversation =
  () => {
    navigate(
      "/dashboard/community-chat"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="messages-page">
      {/* Mobile overlay */}

      <div
        className={
          mobileSidebarOpen
            ? "messages-mobile-overlay messages-mobile-overlay--open"
            : "messages-mobile-overlay"
        }
        onClick={() =>
          setMobileSidebarOpen(
            false
          )
        }
      />

      <div className="messages-layout">
        {/* ===============================================================
            SIDEBAR
        =============================================================== */}

        <div
          className={
            mobileSidebarOpen
              ? "messages-sidebar-shell messages-sidebar-shell--open"
              : "messages-sidebar-shell"
          }
        >
          <aside className="messages-conversation-panel">
            <header className="messages-conversation-panel__header">
              <div>
                <span>
                  Messages
                </span>

                <h2>
                  Direct Messages
                </h2>
              </div>

              <button
                type="button"
                title="Start new conversation"
                aria-label="Start new conversation"
                onClick={
                  handleNewConversation
                }
              >
                +
              </button>
            </header>

            {/* Search */}

            <div className="direct-messages-search">
              <Search
                size={15}
              />

              <input
                type="search"
                value={
                  searchValue
                }
                placeholder="Search conversations..."
                onChange={(
                  event
                ) =>
                  setSearchValue(
                    event.target
                      .value
                  )
                }
              />

              {searchValue && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() =>
                    setSearchValue(
                      ""
                    )
                  }
                >
                  <X
                    size={13}
                  />
                </button>
              )}
            </div>

            {/* Conversation list */}

            <div className="messages-conversation-list">
              {conversationsLoading ? (
                <div className="messages-conversation-empty">
                  <LoaderCircle
                    size={23}
                    className="messages-spin"
                  />

                  <strong>
                    Loading messages…
                  </strong>
                </div>
              ) : filteredConversations
                  .length === 0 ? (
                <div className="messages-conversation-empty">
                  <MessageCircle
                    size={25}
                  />

                  <strong>
                    {searchValue
                      ? "No conversations found"
                      : "No direct messages yet"}
                  </strong>

                  <p>
                    {searchValue
                      ? "Try another search."
                      : "Start a conversation from the Community."}
                  </p>

                  {!searchValue && (
                    <button
                      type="button"
                      className="direct-message-community-link"
                      onClick={
                        handleNewConversation
                      }
                    >
                      Browse community
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map(
                  (
                    conversation
                  ) => {
                    const conversationId =
                      getDirectConversationId(
                        conversation
                      );

                    const name =
                      getDirectOtherName(
                        conversation
                      );

                    const image =
                      getDirectOtherImage(
                        conversation
                      );

                    const preview =
                      getDirectLatestMessageText(
                        conversation
                      ) ||
                      "No messages yet";

                    const unread =
                      Number(
                        unreadCounts[
                          conversationId
                        ] ??
                        getDirectConversationUnreadCount(
                          conversation
                        )
                      ) || 0;

                    const active =
                      String(
                        activeConversationId
                      ) ===
                      String(
                        conversationId
                      );

                    return (
                      <button
                        key={
                          conversationId
                        }
                        type="button"
                        className={
                          active
                            ? "messages-conversation-item messages-conversation-item--active"
                            : "messages-conversation-item"
                        }
                        onClick={() =>
                          handleOpenConversation(
                            conversation
                          )
                        }
                      >
                        <MemberAvatar
                          name={
                            name
                          }
                          imageUrl={
                            image
                          }
                          size={42}
                        />

                        <div className="messages-conversation-item__content">
                          <div className="messages-conversation-item__title direct-message-item-title">
                            <strong>
                              {name}
                            </strong>

                            <time>
                              {formatConversationTime(
                                conversation
                              )}
                            </time>
                          </div>

                          <p className="direct-message-preview">
                            {preview}
                          </p>
                        </div>

                        {unread > 0 && (
                          <span className="messages-unread-badge">
                            {unread > 99
                              ? "99+"
                              : unread}
                          </span>
                        )}
                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>
        </div>

        {/* ===============================================================
            CHAT
        =============================================================== */}

        <main className="messages-chat-area">
          {!activeConversation ? (
            <section className="messages-empty-chat">
              <button
                type="button"
                className="messages-mobile-menu-button"
                onClick={() =>
                  setMobileSidebarOpen(
                    true
                  )
                }
              >
                <Menu
                  size={18}
                />
              </button>

              <span className="messages-empty-chat__icon">
                <MessageCircle
                  size={31}
                />
              </span>

              <span className="messages-empty-chat__eyebrow">
                Direct Messages
              </span>

              <h1>
                Conversations that
                stay between you.
              </h1>

              <p>
                Connect privately with
                another UNWIND community
                member and continue the
                conversation one-to-one.
              </p>

              <div className="messages-empty-chat__actions">
                <button
                  type="button"
                  className="messages-primary-button"
                  disabled={
                    startingConversation
                  }
                  onClick={
                    handleNewConversation
                  }
                >
                  <UsersRound
                    size={16}
                  />

                  Find someone in
                  Community
                </button>
              </div>
            </section>
          ) : (
            <>
              {/* Header */}

              <header className="messages-chat-header">
                <div className="messages-chat-header__left">
                  <button
                    type="button"
                    className="messages-chat-header__back"
                    onClick={() => {
                      /*
                       * Mobile:
                       * go back to conversations.
                       *
                       * Desktop remains unchanged.
                       */
                      if (
                        window.innerWidth <=
                        780
                      ) {
                        clearActiveConversation();
                      } else {
                        setMobileSidebarOpen(
                          true
                        );
                      }
                    }}
                  >
                    <span aria-hidden="true">
                      ←
                    </span>
                  </button>

                  <MemberAvatar
                    name={
                      otherUserName
                    }
                    imageUrl={
                      otherUserImage
                    }
                    size={38}
                  />

                  <div>
                    <div className="messages-chat-header__title">
                      <h2>
                        {otherUserName}
                      </h2>
                    </div>

                    <p>
                      <UserRound
                        size={13}
                      />

                      Private conversation
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="messages-chat-header__details"
                  aria-label="Conversation details"
                  onClick={() =>
                    setDetailsOpen(
                      true
                    )
                  }
                >
                  <MoreVertical
                    size={18}
                  />
                </button>
              </header>

              {/* Error */}

              {error && (
                <div
                  className="messages-alert"
                  role="alert"
                >
                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {error}
                  </span>

                  <button
                    type="button"
                    aria-label="Dismiss error"
                    onClick={
                      clearError
                    }
                  >
                    <X
                      size={15}
                    />
                  </button>
                </div>
              )}

              {/* Messages */}

              <div className="messages-chat-scroll">
                {conversationLoading ? (
                  <div className="message-list-state">
                    <LoaderCircle
                      size={24}
                      className="messages-spin"
                    />

                    <p>
                      Loading conversation…
                    </p>
                  </div>
                ) : (
                  <MessageList
                    messages={
                      messages
                    }

                    currentUserId={
                      currentUserId
                    }

                    loading={
                      messagesLoading
                    }

                    loadingOlder={
                      loadingOlderMessages
                    }

                    hasOlderMessages={
                      hasOlderMessages
                    }

                    getMessageId={
                      getDirectMessageId
                    }

                    getMessageUserId={
                      getDirectMessageUserId
                    }

                    getMessageSenderName={
                      getDirectMessageSenderName
                    }

                    getMessageSenderImage={
                      getDirectMessageSenderImage
                    }

                    getMessageText={
                      getDirectMessageText
                    }

                    getMessageCreatedAt={
                      getDirectMessageCreatedAt
                    }

                    getMessageEditedAt={
                      getDirectMessageEditedAt
                    }

                    /*
                     * These use the reply
                     * support we already
                     * added while fixing
                     * Private Rooms.
                     */
                    getReplyMessageId={
                      getDirectReplyMessageId
                    }

                    getReplySenderName={
                      getDirectReplySenderName
                    }

                    getReplyMessageText={
                      getDirectReplyMessageText
                    }

                    isReplyDeleted={
                      isDirectReplyDeleted
                    }

                    isMessageDeleted={
                      isDirectMessageDeleted
                    }

                    onLoadOlder={
                      loadOlderMessages
                    }

                    onReply={(
                      message
                    ) => {
                      setEditingMessage(
                        null
                      );

                      setReplyMessage(
                        message
                      );
                    }}

                    onEdit={(
                      message
                    ) => {
                      setReplyMessage(
                        null
                      );

                      setEditingMessage(
                        message
                      );
                    }}

                    onDelete={
                      handleDeleteMessage
                    }
                    onReport={(
  message
) =>
  setReportTarget({
    targetType:
      "direct_message",

    targetId:
      getDirectMessageId(
        message
      ),

    reportedUserId:
      getDirectMessageUserId(
        message
      ),

    targetLabel:
      "direct message",

    targetName:
      getDirectMessageSenderName(
        message
      )
  })
}
                  />
                )}
              </div>

              {/* Composer */}

              <footer className="messages-composer-footer">
                <MessageComposer
                  sending={
                    sendingMessage ||
                    editingMessageSaving
                  }

                  disabled={
                    conversationLoading ||
                    messagesLoading ||
                    deletingMessage
                  }

                  replyMessage={
                    replyMessage
                  }

                  editingMessage={
                    editingMessage
                  }

                  getMessageText={
                    getDirectMessageText
                  }

                  onSend={
                    handleSend
                  }

                  onCancelReply={() =>
                    setReplyMessage(
                      null
                    )
                  }

                  onCancelEdit={() =>
                    setEditingMessage(
                      null
                    )
                  }
                />
              </footer>
            </>
          )}
        </main>

        {/* ===============================================================
            DETAILS PANEL
        =============================================================== */}

        {activeConversation && (
          <aside
            className={
              detailsOpen
                ? "messages-details-panel messages-details-panel--open"
                : "messages-details-panel"
            }
          >
            <header className="messages-details-panel__header">
              <div>
                <span>
                  Conversation
                </span>

                <strong>
                  {otherUserName}
                </strong>
              </div>

              <button
                type="button"
                aria-label="Close conversation details"
                onClick={() =>
                  setDetailsOpen(
                    false
                  )
                }
              >
                <X
                  size={17}
                />
              </button>
            </header>

            <div className="messages-details-panel__body">
              {/* Profile summary */}

              <section className="messages-room-summary direct-message-summary">
                <MemberAvatar
                  name={
                    otherUserName
                  }
                  imageUrl={
                    otherUserImage
                  }
                  size={58}
                />

                <h3>
                  {otherUserName}
                </h3>

                <p>
                  Private UNWIND conversation
                </p>
              </section>

              {/* Settings */}

              <section className="messages-details-section">
                <div className="messages-details-section__heading">
                  <div>
                    <span>
                      Conversation
                    </span>

                    <strong>
                      Settings
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="direct-message-detail-action"
                  disabled={
                    updatingConversation
                  }
                  onClick={
                    handleMuteToggle
                  }
                >
                  {activeConversationMuted ? (
                    <BellRing
                      size={16}
                    />
                  ) : (
                    <BellOff
                      size={16}
                    />
                  )}

                  <span>
                    {activeConversationMuted
                      ? "Unmute conversation"
                      : "Mute conversation"}
                  </span>
                </button>
              </section>

              {/* Participant */}

              <section className="messages-details-section">
                <div className="messages-details-section__heading">
                  <div>
                    <span>
                      Person
                    </span>

                    <strong>
                      Participant
                    </strong>
                  </div>
                </div>

                <div className="direct-message-participant">
                  <MemberAvatar
                    name={
                      otherUserName
                    }
                    imageUrl={
                      otherUserImage
                    }
                    size={40}
                  />

                  <div>
                    <strong>
                      {otherUserName}
                    </strong>

                    <span>
                      Community member
                    </span>
                  </div>
                </div>
              </section>

              {/* Leave */}

              <section className="messages-details-section">
                <button
                  type="button"
                  className="direct-message-leave-button"
                  disabled={
                    updatingConversation
                  }
                  onClick={
                    handleLeave
                  }
                >
                  Leave conversation
                </button>
              </section>

              {/* Debug-safe hidden reference */}

              {otherUserId && (
                <span
                  hidden
                  data-direct-user-id={
                    otherUserId
                  }
                />
              )}
            </div>
          </aside>
        )}
      </div>
      <ReportModal
  open={
    Boolean(
      reportTarget
    )
  }

  {...reportTarget}

  onClose={() =>
    setReportTarget(
      null
    )
  }

  onReported={() => {}}
/>
    </div>
  );
}

export default MessagesPage;