import {
  Lock,
  MessageCircle,
  Plus,
  Users
} from "lucide-react";

import MemberAvatar from "./MemberAvatar";

function ConversationList({
  title = "Private Rooms",
  rooms = [],
  activeRoomId,
  unreadCounts = {},
  loading = false,

  getRoomId,
  getRoomName,
  getRoomDescription,
  getRoomMemberCount,
  isRoomLocked,

  onOpen,
  onCreate
}) {
  return (
    <aside className="messages-conversation-panel">
      <header className="messages-conversation-panel__header">
        <div>
          <span>
            Messages
          </span>

          <h2>
            {title}
          </h2>
        </div>

        <button
          type="button"
          onClick={
            onCreate
          }
        >
          <Plus
            size={17}
          />
        </button>
      </header>

      <div className="messages-conversation-list">
        {loading ? (
          <div className="messages-conversation-empty">
            Loading rooms…
          </div>
        ) : rooms.length ===
          0 ? (
          <div className="messages-conversation-empty">
            <MessageCircle
              size={24}
            />

            <strong>
              No private rooms yet
            </strong>

            <p>
              Create one or join
              an existing room.
            </p>
          </div>
        ) : (
          rooms.map(
            (room) => {
              const roomId =
                getRoomId(
                  room
                );

              const active =
                String(
                  activeRoomId
                ) ===
                String(
                  roomId
                );

              const unread =
                Number(
                  unreadCounts[
                    roomId
                  ]
                ) || 0;

              return (
                <button
                  key={
                    roomId
                  }
                  type="button"
                  className={
                    active
                      ? "messages-conversation-item messages-conversation-item--active"
                      : "messages-conversation-item"
                  }
                  onClick={() =>
                    onOpen(
                      room
                    )
                  }
                >
                  <MemberAvatar
                    name={
                      getRoomName(
                        room
                      )
                    }
                    size={42}
                  />

                  <div className="messages-conversation-item__content">
                    <div className="messages-conversation-item__title">
                      <strong>
                        {getRoomName(
                          room
                        )}
                      </strong>

                      {isRoomLocked(
                        room
                      ) && (
                        <Lock
                          size={12}
                        />
                      )}
                    </div>

                    <p>
                      <Users
                        size={12}
                      />

                      {getRoomMemberCount(
                        room
                      )}{" "}
                      members

                      {getRoomDescription(
                        room
                      ) && (
                        <>
                          <span>
                            •
                          </span>

                          {getRoomDescription(
                            room
                          )}
                        </>
                      )}
                    </p>
                  </div>

                  {unread > 0 && (
                    <span className="messages-unread-badge">
                      {unread >
                      99
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
  );
}

export default ConversationList;