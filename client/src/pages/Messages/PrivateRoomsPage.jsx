import {
  AlertCircle,
  Copy,
  DoorOpen,
  Flag,
  Info,
  Link2,
  LoaderCircle,
  Lock,
  Menu,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Unlock,
  UserMinus,
  Users,
  X
} from "lucide-react";

import ReportModal
  from "../../components/reports/ReportModal";
import {
  useConfirm
} from "../../context/ConfirmDialogContext";
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useAuth } from "../../context/AuthContext";

import usePrivateRooms from "../../hooks/usePrivateRooms";

import ChatHeader from "../../components/messages/ChatHeader";
import ConversationList from "../../components/messages/ConversationList";
import MemberAvatar from "../../components/messages/MemberAvatar";
import MessageComposer from "../../components/messages/MessageComposer";
import MessageList from "../../components/messages/MessageList";
import TypingIndicator from "../../components/messages/TypingIndicator";

import {
  getPrivateRoomDescription,
  getPrivateRoomId,
  getPrivateRoomInviteToken,
  getPrivateRoomMaxMembers,
  getPrivateRoomMemberCount,
  getPrivateRoomMemberImage,
  getPrivateRoomMemberName,
  getPrivateRoomMemberRole,
  getPrivateRoomMemberUserId,
  getPrivateRoomMessageCreatedAt,
  getPrivateRoomMessageEditedAt,
  getPrivateRoomMessageId,
  getPrivateRoomMessageSenderImage,
  getPrivateRoomMessageSenderName,
  getPrivateRoomMessageText,
  getPrivateRoomMessageUserId,
  getPrivateRoomReplyMessageId,
getPrivateRoomReplySenderName,
getPrivateRoomReplyMessageText,
isPrivateRoomReplyDeleted,
isPrivateRoomMessageDeleted,
  getPrivateRoomName,
  getPrivateRoomOwnerId,
  isPrivateRoomLocked,
  isPrivateRoomMemberMuted
} from "../../utils/privateRoomUtils";

import "./Messages.css";

function getCurrentUserId(
  user
) {
  return (
    user?.user_id ||
    user?.userId ||
    user?.id ||
    null
  );
}

function PrivateRoomsPage() {
  const {
    user
  } = useAuth();
const confirm = useConfirm();
  const restoredRoomRef =
  useRef(false);

  const [
  reportTarget,
  setReportTarget
] = useState(
  null
);

  const currentUserId =
    getCurrentUserId(
      user
    );

  const {
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
    clearError
  } = usePrivateRooms();

  const [
    createModalOpen,
    setCreateModalOpen
  ] = useState(false);

  const [
    joinModalOpen,
    setJoinModalOpen
  ] = useState(false);

  const [
    detailsOpen,
    setDetailsOpen
  ] = useState(false);

  const [
    mobileRoomsOpen,
    setMobileRoomsOpen
  ] = useState(false);

  const [
    replyMessage,
    setReplyMessage
  ] = useState(null);

  const [
    editingMessage,
    setEditingMessage
  ] = useState(null);

  const [
    createForm,
    setCreateForm
  ] = useState({
    roomName: "",
    roomDescription: "",
    maxMembers: 20,
    isLocked: false
  });

  const [
    joinValue,
    setJoinValue
  ] = useState("");

  const [
    roomEditMode,
    setRoomEditMode
  ] = useState(false);

  const [
    roomEditForm,
    setRoomEditForm
  ] = useState({
    roomName: "",
    roomDescription: "",
    maxMembers: 20
  });

  

  /*
  |--------------------------------------------------------------------------
  | Permissions
  |--------------------------------------------------------------------------
  */

  const ownerUserId =
    getPrivateRoomOwnerId(
      activeRoom
    );

  const isOwner =
    Boolean(
      currentUserId &&
      ownerUserId &&
      String(
        currentUserId
      ) ===
        String(
          ownerUserId
        )
    );

  /*
  |--------------------------------------------------------------------------
  | Active room helpers
  |--------------------------------------------------------------------------
  */

  const activeRoomName =
    getPrivateRoomName(
      activeRoom
    );

  const activeRoomDescription =
    getPrivateRoomDescription(
      activeRoom
    );

  const activeRoomMemberCount =
    getPrivateRoomMemberCount(
      activeRoom
    ) || members.length;

  const activeRoomLocked =
    isPrivateRoomLocked(
      activeRoom
    );

  const activeRoomMaxMembers =
    getPrivateRoomMaxMembers(
      activeRoom
    );

  const inviteToken =
    getPrivateRoomInviteToken(
      activeRoom
    );

    const inviteLink =
  inviteToken
    ? `${window.location.origin}/dashboard/private-rooms?invite=${encodeURIComponent(
        inviteToken
      )}`
    : "";

  /*
  |--------------------------------------------------------------------------
  | Fake typing users for now
  |--------------------------------------------------------------------------
  |
  | We will replace this with Socket.IO state
  | once the backend room socket events are fixed.
  |
  */

  const typingUsers =
    useMemo(
      () => [],
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Create room
  |--------------------------------------------------------------------------
  */

  const handleCreateRoom =
    async (
      event
    ) => {
      event.preventDefault();

      const roomName =
        createForm.roomName.trim();

      if (!roomName) {
        return;
      }

      try {
        await createRoom({
          roomName,

          roomDescription:
            createForm
              .roomDescription,

          maxMembers:
            Number(
              createForm.maxMembers
            ),

          isLocked:
            createForm.isLocked
        });

        setCreateModalOpen(
          false
        );

        setCreateForm({
          roomName: "",
          roomDescription: "",
          maxMembers: 20,
          isLocked: false
        });

        setMobileRoomsOpen(
          false
        );
      } catch {
        // Hook handles the error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Join room
  |--------------------------------------------------------------------------
  */

  const handleJoinRoom =
  async (
    event
  ) => {
    event.preventDefault();

    const value =
      joinValue.trim();

    if (
      !/^\d{8}$/.test(
        value
      )
    ) {
      return;
    }

    try {
      await joinByCode(
        value
      );

      setJoinValue("");

      setJoinModalOpen(
        false
      );

      setMobileRoomsOpen(
        false
      );
    } catch {
        // Hook handles the error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Open room
  |--------------------------------------------------------------------------
  */

 const handleOpenRoom =
  async (room) => {
    const roomId =
      getPrivateRoomId(
        room
      );

    if (!roomId) {
      return;
    }

    localStorage.setItem(
      "unwind.activePrivateRoomId",
      String(roomId)
    );

    await openRoom(
      room
    );

    setReplyMessage(null);
    setEditingMessage(null);
    setDetailsOpen(false);
    setMobileRoomsOpen(false);
  };

 useEffect(() => {
  if (
    roomsLoading ||
    restoredRoomRef.current
  ) {
    return;
  }

  restoredRoomRef.current =
    true;

  const savedRoomId =
    localStorage.getItem(
      "unwind.activePrivateRoomId"
    );

  /*
   * No previous room selected.
   *
   * On desktop, automatically open
   * the first available room.
   */
  if (!savedRoomId) {
    if (
      window.innerWidth > 780 &&
      rooms.length > 0
    ) {
      const firstRoom =
        rooms[0];

      const firstRoomId =
        getPrivateRoomId(
          firstRoom
        );

      if (firstRoomId) {
        localStorage.setItem(
          "unwind.activePrivateRoomId",
          String(firstRoomId)
        );

        openRoom(
          firstRoom
        ).catch(
          console.error
        );
      }
    }

    return;
  }

  const savedRoom =
    rooms.find(
      (room) =>
        String(
          getPrivateRoomId(
            room
          )
        ) ===
        String(
          savedRoomId
        )
    );

  if (!savedRoom) {
    localStorage.removeItem(
      "unwind.activePrivateRoomId"
    );

    /*
     * Saved room no longer exists,
     * but another room does.
     */
    if (
      window.innerWidth > 780 &&
      rooms.length > 0
    ) {
      const firstRoom =
        rooms[0];

      const firstRoomId =
        getPrivateRoomId(
          firstRoom
        );

      if (firstRoomId) {
        localStorage.setItem(
          "unwind.activePrivateRoomId",
          String(firstRoomId)
        );

        openRoom(
          firstRoom
        ).catch(
          console.error
        );
      }
    }

    return;
  }

  openRoom(
    savedRoom
  ).catch(
    (requestError) => {
      console.error(
        "Unable to restore private room:",
        requestError
      );

      localStorage.removeItem(
        "unwind.activePrivateRoomId"
      );
    }
  );
}, [
  rooms,
  roomsLoading,
  openRoom
]);

  /*
  |--------------------------------------------------------------------------
  | Send / edit
  |--------------------------------------------------------------------------
  */

  const handleSend =
    async (text) => {
      if (
        editingMessage
      ) {
        const messageId =
          getPrivateRoomMessageId(
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
          ? getPrivateRoomMessageId(
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
  | Delete message
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
      "This message will be deleted from the private room.",
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
        // Hook handles error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Room editing
  |--------------------------------------------------------------------------
  */

  const beginRoomEdit =
    () => {
      setRoomEditForm({
        roomName:
          activeRoomName,

        roomDescription:
          activeRoomDescription,

        maxMembers:
          activeRoomMaxMembers ||
          20
      });

      setRoomEditMode(true);
    };

  const handleRoomUpdate =
    async (
      event
    ) => {
      event.preventDefault();

      try {
        await updateRoom({
          roomName:
            roomEditForm
              .roomName
              .trim(),

          roomDescription:
            roomEditForm
              .roomDescription
              .trim(),

          maxMembers:
            Number(
              roomEditForm
                .maxMembers
            )
        });

        setRoomEditMode(
          false
        );
      } catch {
        // Hook handles error.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Copy invite token
  |--------------------------------------------------------------------------
  */

  const copyInviteLink =
  async () => {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        inviteLink
      );
    } catch (error) {
      console.error(
        "Unable to copy invite link:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Leave / close room
  |--------------------------------------------------------------------------
  */

  const handleLeaveRoom =
    async () => {
      const confirmed =
  await confirm({
    title: "Leave private room?",
    message:
      "You will leave this room and lose access to its conversations.",
    confirmText: "Leave room",
    tone: "danger"
  });

      if (!confirmed) {
        return;
      }

      try {
        await leaveRoom();

        localStorage.removeItem(
  "unwind.activePrivateRoomId"
);

        setDetailsOpen(
          false
        );
      } catch {
        // Hook handles error.
      }
    };

  const handleCloseRoom =
    async () => {
      const confirmed =
  await confirm({
    title: "Close private room?",
    message:
      "This room will be closed permanently. This action cannot be undone.",
    confirmText: "Close room",
    tone: "danger"
  });
      if (!confirmed) {
        return;
      }

      try {
        await closeRoom();

        localStorage.removeItem(
  "unwind.activePrivateRoomId"
);

        setDetailsOpen(
          false
        );
      } catch {
        // Hook handles error.
      }
    };

  return (
    <div className="messages-page">
      <div
        className={
          mobileRoomsOpen
            ? "messages-mobile-overlay messages-mobile-overlay--open"
            : "messages-mobile-overlay"
        }
        onClick={() =>
          setMobileRoomsOpen(
            false
          )
        }
      />

      <div className="messages-layout">
        <div
          className={
            mobileRoomsOpen
              ? "messages-sidebar-shell messages-sidebar-shell--open"
              : "messages-sidebar-shell"
          }
        >
          <ConversationList
            title="Private Rooms"

            rooms={
              rooms
            }

            activeRoomId={
              activeRoomId
            }

            unreadCounts={
              unreadCounts
            }

            loading={
              roomsLoading
            }

            getRoomId={
              getPrivateRoomId
            }

            getRoomName={
              getPrivateRoomName
            }

            getRoomDescription={
              getPrivateRoomDescription
            }

            getRoomMemberCount={
              getPrivateRoomMemberCount
            }

            isRoomLocked={
              isPrivateRoomLocked
            }

            onOpen={
              handleOpenRoom
            }

            onCreate={() =>
              setCreateModalOpen(
                true
              )
            }
          />

          <div className="messages-sidebar-actions">
            <button
              type="button"
              onClick={() =>
                setJoinModalOpen(
                  true
                )
              }
            >
              <DoorOpen
                size={15}
              />

              Join room
            </button>
          </div>
        </div>

        <main className="messages-chat-area">
          {!activeRoom ? (
            <section className="messages-empty-chat">
              <button
                type="button"
                className="messages-mobile-menu-button"
                onClick={() =>
                  setMobileRoomsOpen(
                    true
                  )
                }
              >
                <Menu
                  size={18}
                />
              </button>

              <span className="messages-empty-chat__icon">
                <Users
                  size={31}
                />
              </span>

              <span className="messages-empty-chat__eyebrow">
                Private Rooms
              </span>

              <h1>
                Your private spaces
              </h1>

              <p>
                Create a room for a
                trusted group or join
                one using a room code
                or invite token.
              </p>

              <div className="messages-empty-chat__actions">
                <button
                  type="button"
                  className="messages-primary-button"
                  onClick={() =>
                    setCreateModalOpen(
                      true
                    )
                  }
                >
                  <Plus
                    size={16}
                  />

                  Create room
                </button>

                <button
                  type="button"
                  className="messages-secondary-button"
                  onClick={() =>
                    setJoinModalOpen(
                      true
                    )
                  }
                >
                  <DoorOpen
                    size={16}
                  />

                  Join room
                </button>
              </div>
            </section>
          ) : (
            <>
              <ChatHeader
                title={
                  activeRoomName
                }

                description={
                  activeRoomDescription
                }

                memberCount={
                  activeRoomMemberCount
                }

                locked={
                  activeRoomLocked
                }

                onBack={() =>
                  setMobileRoomsOpen(
                    true
                  )
                }

                onDetails={() =>
                  setDetailsOpen(
                    true
                  )
                }
              />

              {error && (
                <div className="messages-alert">
                  <AlertCircle
                    size={16}
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

              <div className="messages-chat-scroll">
                {roomLoading ? (
                  <div className="message-list-state">
                    <LoaderCircle
                      size={24}
                      className="messages-spin"
                    />

                    <p>
                      Loading room…
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
                      getPrivateRoomMessageId
                    }

                    getMessageUserId={
                      getPrivateRoomMessageUserId
                    }

                    getMessageSenderName={
                      getPrivateRoomMessageSenderName
                    }

                    getMessageSenderImage={
                      getPrivateRoomMessageSenderImage
                    }

                    getMessageText={
                      getPrivateRoomMessageText
                    }

                    getMessageCreatedAt={
                      getPrivateRoomMessageCreatedAt
                    }

                    getMessageEditedAt={
                      getPrivateRoomMessageEditedAt
                    }

                    onLoadOlder={
                      loadOlderMessages
                    }

                    onReply={
                      setReplyMessage
                    }

                    onEdit={
                      setEditingMessage
                    }

                    onDelete={
                      handleDeleteMessage
                    }

                    onReport={(
  message
) =>
  setReportTarget({
    targetType:
      "chat_message",

    targetId:
      getPrivateRoomMessageId(
        message
      ),

    reportedUserId:
      getPrivateRoomMessageUserId(
        message
      ),

    targetLabel:
      "private room message",

    targetName:
      getPrivateRoomMessageSenderName(
        message
      )
  })
}

                    getReplyMessageId={
  getPrivateRoomReplyMessageId
}

getReplySenderName={
  getPrivateRoomReplySenderName
}

getReplyMessageText={
  getPrivateRoomReplyMessageText
}

isReplyDeleted={
  isPrivateRoomReplyDeleted
}

isMessageDeleted={
  isPrivateRoomMessageDeleted
}
                  />
                )}
              </div>

              <TypingIndicator
                users={
                  typingUsers
                }
              />

              <footer className="messages-composer-footer">
                <MessageComposer
                  sending={
                    sendingMessage
                  }

                  disabled={
                    roomLoading ||
                    messagesLoading
                  }

                  replyMessage={
                    replyMessage
                  }

                  editingMessage={
                    editingMessage
                  }

                  getMessageText={
                    getPrivateRoomMessageText
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

        {activeRoom && (
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
                  Room details
                </span>

                <strong>
                  {
                    activeRoomName
                  }
                </strong>
              </div>

              <button
                type="button"
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
              <section className="messages-room-summary">
                <span className="messages-room-summary__icon">
                  {activeRoomLocked ? (
                    <Lock
                      size={22}
                    />
                  ) : (
                    <Users
                      size={22}
                    />
                  )}
                </span>

                <h3>
                  {activeRoomName}
                </h3>

                {activeRoomDescription && (
                  <p>
                    {
                      activeRoomDescription
                    }
                  </p>
                )}

                <div className="messages-room-summary__stats">
                  <span>
                    <Users
                      size={13}
                    />

                    {
                      activeRoomMemberCount
                    }
                    /
                    {
                      activeRoomMaxMembers ||
                      "—"
                    }
                  </span>

                  <span>
                    {activeRoomLocked ? (
                      <>
                        <Lock
                          size={13}
                        />
                        Locked
                      </>
                    ) : (
                      <>
                        <Unlock
                          size={13}
                        />
                        Open
                      </>
                    )}
                  </span>
                </div>
              </section>

              {isOwner && (
                <section className="messages-details-section">
                  <div className="messages-details-section__heading">
                    <div>
                      <span>
                        Owner controls
                      </span>

                      <strong>
                        Room settings
                      </strong>
                    </div>

                    <ShieldCheck
                      size={17}
                    />
                  </div>

                  {roomEditMode ? (
                    <form
                      className="messages-room-edit-form"
                      onSubmit={
                        handleRoomUpdate
                      }
                    >
                      <label>
                        <span>
                          Room name
                        </span>

                        <input
                          value={
                            roomEditForm
                              .roomName
                          }

                          onChange={(
                            event
                          ) =>
                            setRoomEditForm(
                              (
                                current
                              ) => ({
                                ...current,

                                roomName:
                                  event
                                    .target
                                    .value
                              })
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Description
                        </span>

                        <textarea
                          rows={3}

                          value={
                            roomEditForm
                              .roomDescription
                          }

                          onChange={(
                            event
                          ) =>
                            setRoomEditForm(
                              (
                                current
                              ) => ({
                                ...current,

                                roomDescription:
                                  event
                                    .target
                                    .value
                              })
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Max members
                        </span>

                        <input
                          type="number"
                          min="2"
                          max="100"

                          value={
                            roomEditForm
                              .maxMembers
                          }

                          onChange={(
                            event
                          ) =>
                            setRoomEditForm(
                              (
                                current
                              ) => ({
                                ...current,

                                maxMembers:
                                  event
                                    .target
                                    .value
                              })
                            )
                          }
                        />
                      </label>

                      <div className="messages-inline-actions">
                        <button
                          type="submit"
                          className="messages-primary-button"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          className="messages-secondary-button"
                          onClick={() =>
                            setRoomEditMode(
                              false
                            )
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="messages-settings-actions">
                      <button
                        type="button"
                        onClick={
                          beginRoomEdit
                        }
                      >
                        <Info
                          size={15}
                        />

                        Edit room
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRoomLocked(
                            !activeRoomLocked
                          )
                        }
                      >
                        {activeRoomLocked ? (
                          <Unlock
                            size={15}
                          />
                        ) : (
                          <Lock
                            size={15}
                          />
                        )}

                        {activeRoomLocked
                          ? "Unlock room"
                          : "Lock room"}
                      </button>

                      <button
                        type="button"
                        onClick={
                          regenerateInvite
                        }
                      >
                        <RefreshCcw
                          size={15}
                        />

                        Regenerate invite
                      </button>
                    </div>
                  )}
                </section>
              )}

             {inviteLink && (
  <section className="messages-details-section">
    <div className="messages-details-section__heading">
      <div>
        <span>
          Invitation
        </span>

        <strong>
          Invite link
        </strong>
      </div>

      <Link2
        size={17}
      />
    </div>

    <p className="messages-invite-description">
      Share this link with someone
      you want to invite to this
      private room.
    </p>

    <div className="messages-invite-token">
      <code>
        Private invite link
      </code>

      <button
        type="button"
        title="Copy invite link"
        onClick={
          copyInviteLink
        }
      >
        <Copy
          size={14}
        />
      </button>
    </div>
  </section>
)}

              <section className="messages-details-section">
                <div className="messages-details-section__heading">
                  <div>
                    <span>
                      People
                    </span>

                    <strong>
                      Members
                    </strong>
                  </div>

                  <Users
                    size={17}
                  />
                </div>

                {membersLoading ? (
                  <div className="messages-details-loading">
                    <LoaderCircle
                      size={18}
                      className="messages-spin"
                    />

                    Loading…
                  </div>
                ) : (
                  <div className="messages-member-list">
                    {members.map(
                      (
                        member
                      ) => {
                        const memberUserId =
                          getPrivateRoomMemberUserId(
                            member
                          );

                        const memberName =
                          getPrivateRoomMemberName(
                            member
                          );

                        const memberRole =
                          getPrivateRoomMemberRole(
                            member
                          );

                        const memberMuted =
                          isPrivateRoomMemberMuted(
                            member
                          );

                        const isCurrentMember =
                          String(
                            memberUserId
                          ) ===
                          String(
                            currentUserId
                          );

                        return (
                          <article
                            key={
                              memberUserId
                            }
                            className="messages-member-item"
                          >
                            <MemberAvatar
                              name={
                                memberName
                              }

                              imageUrl={
                                getPrivateRoomMemberImage(
                                  member
                                )
                              }

                              size={36}
                            />

                            <div className="messages-member-item__info">
                              <strong>
                                {
                                  memberName
                                }
                              </strong>

                              <span>
                                {
                                  memberRole
                                }

                                {memberMuted &&
                                  " • Muted"}
                              </span>
                            </div>

                            {isOwner &&
                              !isCurrentMember && (
                                <div className="messages-member-item__actions">
                                  <button
                                    type="button"
                                    title={
                                      memberMuted
                                        ? "Unmute member"
                                        : "Mute member"
                                    }
                                    onClick={() =>
                                      setMemberMuted(
                                        memberUserId,
                                        !memberMuted
                                      )
                                    }
                                  >
                                    {memberMuted
                                      ? "Unmute"
                                      : "Mute"}
                                  </button>

                                  <button
                                    type="button"
                                    title="Transfer ownership"
                                    onClick={() =>
                                      transferOwnership(
                                        memberUserId
                                      )
                                    }
                                  >
                                    Owner
                                  </button>

                                  <button
                                    type="button"
                                    className="messages-member-item__remove"
                                    title="Remove member"
                                    onClick={() =>
                                      removeMember(
                                        memberUserId
                                      )
                                    }
                                  >
                                    <UserMinus
                                      size={14}
                                    />
                                  </button>
                                </div>
                              )}
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              <section className="messages-danger-zone">
                {!isOwner && (
  <button
    type="button"

    onClick={() =>
      setReportTarget({
        targetType:
          "private_room",

        targetId:
          getPrivateRoomId(
            activeRoom
          ),

        reportedUserId:
          ownerUserId,

        targetLabel:
          "private room",

        targetName:
          activeRoomName
      })
    }
  >
    <Flag
      size={15}
    />

    Report room
  </button>
)}
                {!isOwner && (
                  <button
                    type="button"
                    onClick={
                      handleLeaveRoom
                    }
                  >
                    <DoorOpen
                      size={15}
                    />

                    Leave room
                  </button>
                )}

                {isOwner && (
                  <button
                    type="button"
                    onClick={
                      handleCloseRoom
                    }
                  >
                    <X
                      size={15}
                    />

                    Close room
                  </button>
                )}
              </section>
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

      {createModalOpen && (
        <div className="messages-modal-backdrop">
          <section className="messages-modal">
            <header>
              <div>
                <span>
                  Private room
                </span>

                <h2>
                  Create room
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCreateModalOpen(
                    false
                  )
                }
              >
                <X
                  size={18}
                />
              </button>
            </header>

            <form
              onSubmit={
                handleCreateRoom
              }
            >
              <label>
                <span>
                  Room name
                </span>

                <input
                  required
                  maxLength={80}
                  placeholder="Close friends"

                  value={
                    createForm
                      .roomName
                  }

                  onChange={(
                    event
                  ) =>
                    setCreateForm(
                      (
                        current
                      ) => ({
                        ...current,

                        roomName:
                          event
                            .target
                            .value
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Description
                </span>

                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="A private space for our group."

                  value={
                    createForm
                      .roomDescription
                  }

                  onChange={(
                    event
                  ) =>
                    setCreateForm(
                      (
                        current
                      ) => ({
                        ...current,

                        roomDescription:
                          event
                            .target
                            .value
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Maximum members
                </span>

                <input
                  type="number"
                  min="2"
                  max="100"

                  value={
                    createForm
                      .maxMembers
                  }

                  onChange={(
                    event
                  ) =>
                    setCreateForm(
                      (
                        current
                      ) => ({
                        ...current,

                        maxMembers:
                          event
                            .target
                            .value
                      })
                    )
                  }
                />
              </label>

              <label className="messages-checkbox">
                <input
                  type="checkbox"

                  checked={
                    createForm
                      .isLocked
                  }

                  onChange={(
                    event
                  ) =>
                    setCreateForm(
                      (
                        current
                      ) => ({
                        ...current,

                        isLocked:
                          event
                            .target
                            .checked
                      })
                    )
                  }
                />

                <span>
                  Start as a locked
                  room
                </span>
              </label>

              <button
                type="submit"
                className="messages-primary-button messages-modal-submit"
                disabled={
                  creatingRoom
                }
              >
                {creatingRoom ? (
                  <LoaderCircle
                    size={16}
                    className="messages-spin"
                  />
                ) : (
                  <Plus
                    size={16}
                  />
                )}

                {creatingRoom
                  ? "Creating…"
                  : "Create room"}
              </button>
            </form>
          </section>
        </div>
      )}

      {joinModalOpen && (
        <div className="messages-modal-backdrop">
          <section className="messages-modal">
            <header>
              <div>
                <span>
                  Private room
                </span>

                <h2>
                  Join room
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setJoinModalOpen(
                    false
                  )
                }
              >
                <X
                  size={18}
                />
              </button>
            </header>

            

            <form
              onSubmit={
                handleJoinRoom
              }
            >
              <label>
  <span>
    Room code
  </span>

  <input
  required
  type="text"
  inputMode="numeric"
  autoComplete="off"
  placeholder="Enter 8-digit room code"
  value={joinValue}
  maxLength={8}
  pattern="[0-9]{8}"
  onChange={(event) => {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 8);

    setJoinValue(value);
  }}
/>
</label>

              <button
                type="submit"
                className="messages-primary-button messages-modal-submit"
                disabled={
                  joiningRoom
                }
              >
                {joiningRoom ? (
                  <LoaderCircle
                    size={16}
                    className="messages-spin"
                  />
                ) : (
                  <DoorOpen
                    size={16}
                  />
                )}

                {joiningRoom
                  ? "Joining…"
                  : "Join room"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default PrivateRoomsPage;