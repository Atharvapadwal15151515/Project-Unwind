import {
  AlertCircle,
  EyeOff,
  LoaderCircle,
  LogIn,
  MessageCircleMore,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  UsersRound,
  X
} from "lucide-react";

import {
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../../context/AuthContext";

import useCommunityChat
  from "../../hooks/useCommunityChat";

import MessageList
  from "../../components/messages/MessageList";

import MessageComposer
  from "../../components/messages/MessageComposer";

import MemberAvatar
  from "../../components/messages/MemberAvatar";

import {
  getCommunityChatCreatedAt,
  getCommunityChatEditedAt,
  getCommunityChatMessageId,
  getCommunityChatMessageText,
  getCommunityChatReplyId,
  getCommunityChatReplySenderName,
  getCommunityChatReplyText,
  getCommunityChatSenderId,
  getCommunityChatSenderName,
  isCommunityChatMessageDeleted,
  isCommunityChatReplyDeleted
} from "../../utils/communityChatUtils";

import {
  selectCommunityIdentity
} from "../../services/communityService";

import ReportModal
  from "../../components/reports/ReportModal";

import "./Messages.css";
import "./CommunityChat.css";

/*
|--------------------------------------------------------------------------
| Current user
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
| Community Chat session identity
|--------------------------------------------------------------------------
|
| sessionStorage means:
|
| - page refresh = keep entry
| - dashboard navigation = keep entry
| - switching pages = keep entry
| - close website/tab = remove entry
| - open website again = ask identity again
|--------------------------------------------------------------------------
*/

function getCommunityChatSessionKey(
  userId
) {
  return userId
    ? `unwind_community_chat_entered_${userId}`
    : "unwind_community_chat_entered";
}

function hasEnteredCommunityChat(
  userId
) {
  try {
    return (
      sessionStorage.getItem(
        getCommunityChatSessionKey(
          userId
        )
      ) === "true"
    );
  } catch {
    return false;
  }
}

function saveCommunityChatEntry(
  userId
) {
  try {
    sessionStorage.setItem(
      getCommunityChatSessionKey(
        userId
      ),
      "true"
    );
  } catch {
    // Community Chat still works
    // even if storage is unavailable.
  }
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function CommunityChatPage() {
  const {
    user
  } = useAuth();

  const navigate =
    useNavigate();

  const currentUserId =
    getCurrentUserId(
      user
    );

    /*
|--------------------------------------------------------------------------
| Enter Community Chat
|--------------------------------------------------------------------------
*/

const [
  reportTarget,
  setReportTarget
] = useState(
  null
);

const handleEnterCommunityChat =
  async (
    selectedIdentityMode
  ) => {
    if (
      enteringChat
    ) {
      return;
    }

    try {
      setEnteringChat(
        true
      );

      setEntryError("");

      /*
       * Username:
       *
       * public identity becomes
       * the actual Unwind username.
       *
       * Anonymous:
       *
       * backend reuses the user's
       * anonymous alias or generates
       * one automatically.
       */
      await selectCommunityIdentity(
        selectedIdentityMode
      );

      /*
       * Remember ONLY for this
       * browser/tab session.
       */
      saveCommunityChatEntry(
        currentUserId
      );

      /*
       * This enables useCommunityChat,
       * which then connects Socket.IO,
       * joins the room and loads history.
       */
      setHasEnteredChat(
        true
      );
    } catch (
      requestError
    ) {
      setEntryError(
        requestError
          ?.response
          ?.data
          ?.message ||
        requestError
          ?.message ||
        "Unable to enter Community Chat."
      );
    } finally {
      setEnteringChat(
        false
      );
    }
  };

    /*
|--------------------------------------------------------------------------
| Entry gate
|--------------------------------------------------------------------------
*/

const [
  hasEnteredChat,
  setHasEnteredChat
] = useState(
  () =>
    hasEnteredCommunityChat(
      currentUserId
    )
);

const [
  enteringChat,
  setEnteringChat
] = useState(false);

const [
  entryError,
  setEntryError
] = useState("");

  const {
    room,

    messages,

    members,

    onlineUsers,

    typingUsers,

    visibleName,

    identityMode,

    loading,

    loadingOlder,

    sending,

    error,

    hasOlder,

    loadOlder,

    sendMessage,

    editMessage,

    deleteMessage,

    setTyping,

    switchIdentity,

    clearError
  } = useCommunityChat(
  hasEnteredChat
);

  /*
  |--------------------------------------------------------------------------
  | Local UI
  |--------------------------------------------------------------------------
  */

  const [
    replyMessage,
    setReplyMessage
  ] = useState(null);

  const [
    editingMessage,
    setEditingMessage
  ] = useState(null);

  const [
    switchingIdentity,
    setSwitchingIdentity
  ] = useState(false);

  const [
    mobileMembersOpen,
    setMobileMembersOpen
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Online users
  |--------------------------------------------------------------------------
  */

  const onlineIds =
    useMemo(
      () =>
        new Set(
          onlineUsers.map(
            (onlineUser) =>
              String(
                onlineUser
                  ?.user_id
              )
          )
        ),
      [
        onlineUsers
      ]
    );
    const onlineMembers =
  useMemo(
    () =>
      members.filter(
        (member) =>
          onlineIds.has(
            String(
              member?.user_id
            )
          )
      ),
    [
      members,
      onlineIds
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Typing text
  |--------------------------------------------------------------------------
  */

  const typingLabel =
    useMemo(
      () => {
        const names =
          typingUsers
            .filter(
              Boolean
            )
            .filter(
              (name) =>
                name !==
                visibleName
            );

        if (
          names.length ===
          0
        ) {
          return "";
        }

        if (
          names.length ===
          1
        ) {
          return `${names[0]} is typing…`;
        }

        if (
          names.length ===
          2
        ) {
          return `${names[0]} and ${names[1]} are typing…`;
        }

        return `${names.length} people are typing…`;
      },
      [
        typingUsers,
        visibleName
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Send / edit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      text
    ) => {
      if (
        editingMessage
      ) {
        await editMessage(
          getCommunityChatMessageId(
            editingMessage
          ),
          text
        );

        setEditingMessage(
          null
        );

        return;
      }

      await sendMessage(
        text,

        replyMessage
          ? getCommunityChatMessageId(
              replyMessage
            )
          : null
      );

      setReplyMessage(
        null
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Identity
  |--------------------------------------------------------------------------
  */

  const handleIdentitySwitch =
    async () => {
      try {
        setSwitchingIdentity(
          true
        );

        const nextMode =
          identityMode ===
          "anonymous"
            ? "username"
            : "anonymous";

        await switchIdentity(
          nextMode
        );
      } finally {
        setSwitchingIdentity(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Start Direct Message
  |--------------------------------------------------------------------------
  |
  | THIS is deliberately where new DMs start.
  |
  | We reuse your existing MessagesPage rather
  | than implementing another DM system.
  |--------------------------------------------------------------------------
  */

const startDm =
  (
    targetUserId
  ) => {
    if (
      !targetUserId ||
      String(
        targetUserId
      ) ===
        String(
          currentUserId
        )
    ) {
      return;
    }

    navigate(
      "/dashboard/messages",
      {
        state: {
          recipientUserId:
            String(
              targetUserId
            )
        }
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  /*
|--------------------------------------------------------------------------
| Community Chat entry gate
|--------------------------------------------------------------------------
*/

if (!hasEnteredChat) {
  return (
    <section className="community-chat-entry">
      <div className="community-chat-entry__card">
        <div className="community-chat-entry__icon">
          <MessageCircleMore
            size={28}
          />
        </div>

        <span className="community-chat-entry__eyebrow">
          UNWIND COMMUNITY
        </span>

        <h1>
          How would you like to
          enter?
        </h1>

        <p className="community-chat-entry__description">
          Choose how other community
          members will see you during
          this visit. You can change
          your identity again anytime
          inside the chat.
        </p>

        {entryError && (
          <div className="community-chat-entry__error">
            <AlertCircle
              size={16}
            />

            <span>
              {entryError}
            </span>
          </div>
        )}

        <div className="community-chat-entry__choices">
          {/* Username */}

          <button
            type="button"
            className="community-chat-entry-choice"
            disabled={
              enteringChat
            }
            onClick={() =>
              handleEnterCommunityChat(
                "username"
              )
            }
          >
            <span className="community-chat-entry-choice__icon">
              <UserRound
                size={22}
              />
            </span>

            <span className="community-chat-entry-choice__content">
              <strong>
                Enter with Username
              </strong>

              <small>
                Other members will see
                your Unwind username.
              </small>
            </span>

            <LogIn
              size={18}
            />
          </button>

          {/* Anonymous */}

          <button
            type="button"
            className="community-chat-entry-choice community-chat-entry-choice--anonymous"
            disabled={
              enteringChat
            }
            onClick={() =>
              handleEnterCommunityChat(
                "anonymous"
              )
            }
          >
            <span className="community-chat-entry-choice__icon">
              <EyeOff
                size={22}
              />
            </span>

            <span className="community-chat-entry-choice__content">
              <strong>
                Enter Anonymously
              </strong>

              <small>
                Community members will
                only see your anonymous
                alias.
              </small>
            </span>

            <LogIn
              size={18}
            />
          </button>
        </div>

        {enteringChat && (
          <div className="community-chat-entry__loading">
            <LoaderCircle
              size={16}
              className="messages-spin"
            />

            Entering community…
          </div>
        )}

        <div className="community-chat-entry__privacy">
          <ShieldCheck
            size={15}
          />

          <span>
            Anonymous mode hides your
            real public identity, but
            your Unwind account remains
            authenticated for safety
            and moderation.
          </span>
        </div>
      </div>
    </section>
  );
}

  if (loading) {
    return (
      <div className="community-chat-loading">
        <LoaderCircle
          size={26}
          className="messages-spin"
        />

        <p>
          Connecting to the community…
        </p>
      </div>
    );
  }

  return (
    <section className="community-chat-page">
      {/* ===============================================================
          ERROR
      =============================================================== */}

      {error && (
        <div className="community-chat-alert">
          <AlertCircle
            size={17}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
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

      {/* ===============================================================
          HEADER
      =============================================================== */}

      <header className="community-chat-hero">
        <div>
          <span className="community-chat-eyebrow">
            <MessageCircleMore
              size={15}
            />

            Community Chat Wall
          </span>

          <h1>
            {room?.room_name ||
              "Public Community Chat"}
          </h1>

          <p>
            {room?.room_description ||
              "A shared live space for the Unwind community."}
          </p>
        </div>

        <div className="community-chat-hero__actions">
          <div className="community-chat-live-pill">
            <span />

            {onlineUsers.length} online
          </div>

          <button
            type="button"
            className="community-chat-members-toggle"
            onClick={() =>
              setMobileMembersOpen(
                true
              )
            }
          >
            <UsersRound
              size={16}
            />

            Members
          </button>
        </div>
      </header>

      {/* ===============================================================
          MAIN LAYOUT
      =============================================================== */}

      <div className="community-chat-layout">
        {/* =============================================================
            CHAT
        ============================================================= */}

        <main className="community-chat-panel">
          {/* Identity toolbar */}

          <div className="community-chat-toolbar">
            <div className="community-chat-identity">
              <MemberAvatar
                name={
                  visibleName
                }
                size={38}
              />

              <div>
                <span>
                  Chatting as
                </span>

                <strong>
                  {visibleName}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="community-chat-identity-button"
              disabled={
                switchingIdentity
              }
              onClick={
                handleIdentitySwitch
              }
            >
              {switchingIdentity ? (
                <LoaderCircle
                  size={15}
                  className="messages-spin"
                />
              ) : identityMode ===
                "anonymous" ? (
                <UserRound
                  size={15}
                />
              ) : (
                <EyeOff
                  size={15}
                />
              )}

              {identityMode ===
              "anonymous"
                ? "Use username"
                : "Go anonymous"}
            </button>
          </div>

          {/* Privacy message */}

          <div className="community-chat-privacy-note">
            <ShieldCheck
              size={15}
            />

            <span>
              Your Unwind account stays
              authenticated. Anonymous
              mode only changes what
              other community members
              see.
            </span>
          </div>

          {/* Messages */}

          <div className="community-chat-messages">
            <MessageList
              messages={
                messages
              }
              currentUserId={
                currentUserId
              }
              loading={
                false
              }
              loadingOlder={
                loadingOlder
              }
              hasOlderMessages={
                hasOlder
              }
              getMessageId={
                getCommunityChatMessageId
              }
              getMessageUserId={
                getCommunityChatSenderId
              }
              getMessageSenderName={
                getCommunityChatSenderName
              }
              getMessageSenderImage={() =>
                null
              }
              getMessageText={
                getCommunityChatMessageText
              }
              getMessageCreatedAt={
                getCommunityChatCreatedAt
              }
              getMessageEditedAt={
                getCommunityChatEditedAt
              }
              getReplyMessageId={
                getCommunityChatReplyId
              }
              getReplySenderName={
                getCommunityChatReplySenderName
              }
              getReplyMessageText={
                getCommunityChatReplyText
              }
              isReplyDeleted={
                isCommunityChatReplyDeleted
              }
              isMessageDeleted={
                isCommunityChatMessageDeleted
              }
              onLoadOlder={
                loadOlder
              }
              onReply={
                setReplyMessage
              }
              onEdit={
                setEditingMessage
              }
              onDelete={
                deleteMessage
              }
              onReport={(
  message
) =>
  setReportTarget({
    targetType:
      "chat_message",

    targetId:
      getCommunityChatMessageId(
        message
      ),

    reportedUserId:
      getCommunityChatSenderId(
        message
      ),

    targetLabel:
      "chat message",

    targetName:
      getCommunityChatSenderName(
        message
      )
  })
}
            />
          </div>

          {/* Typing */}

          <div className="community-chat-typing">
            {typingLabel ||
              "\u00a0"}
          </div>

          {/* Composer */}

          <div
            onInput={() =>
              setTyping(
                true
              )
            }
            onBlur={() =>
              setTyping(
                false
              )
            }
          >
            <MessageComposer
              sending={
                sending
              }
              disabled={
                false
              }
              replyMessage={
                replyMessage
              }
              editingMessage={
                editingMessage
              }
              getMessageText={
                getCommunityChatMessageText
              }
              onSend={
                handleSubmit
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
          </div>
        </main>

        {/* =============================================================
            MEMBERS
        ============================================================= */}

        <aside
          className={
            mobileMembersOpen
              ? "community-chat-members community-chat-members--open"
              : "community-chat-members"
          }
        >
          <div className="community-chat-members__header">
            <div>
              <UsersRound
                size={17}
              />

              <strong>
                Community members
              </strong>
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileMembersOpen(
                  false
                )
              }
            >
              <X
                size={16}
              />
            </button>
          </div>

          <p className="community-chat-members__hint">
            Start private conversations
            from here. Direct messaging
            is intentionally available
            through Community Chat only.
          </p>

          <div className="community-chat-member-list">
  {onlineMembers.map(
              (
                member
              ) => {
                const isOwn =
                  String(
                    member
                      ?.user_id
                  ) ===
                  String(
                    currentUserId
                  );

                const isOnline =
                  onlineIds.has(
                    String(
                      member
                        ?.user_id
                    )
                  );

                return (
                  <button
                    type="button"
                    key={
                      member
                        ?.room_member_id ||
                      member
                        ?.user_id
                    }
                    className="community-chat-member"
                    disabled={
                      isOwn
                    }
                    onClick={() =>
                      startDm(
                        member
                          ?.user_id
                      )
                    }
                  >
                    <span className="community-chat-member__avatar-wrap">
                      <MemberAvatar
                        name={
                          member
                            ?.visible_name ||
                          "Member"
                        }
                        size={36}
                      />

                      {isOnline && (
                        <i />
                      )}
                    </span>

                    <span className="community-chat-member__text">
                      <strong>
                        {member
                          ?.visible_name ||
                          "Community member"}
                      </strong>

                      <small>
                        {isOwn
                          ? "You"
                          : isOnline
                            ? "Online · Tap to DM"
                            : "Tap to DM"}
                      </small>
                    </span>

                    {!isOwn && (
                      <MessageSquareText
                        size={16}
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </aside>
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
    </section>
  );
}

export default CommunityChatPage;