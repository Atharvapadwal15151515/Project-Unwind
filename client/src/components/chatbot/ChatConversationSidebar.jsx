import {
  LoaderCircle,
  MessageSquare,
  Plus,
  Trash2
} from "lucide-react";

function ChatConversationSidebar({
  conversations = [],
  activeConversationId,
  loading,
  getConversationId,
  getConversationTitle,
  onOpen,
  onNew,
  onDelete
}) {
  return (
    <aside className="ai-conversation-sidebar">
      <header>
        <div>
          <span>
            Conversations
          </span>

          <strong>
            Your private chats
          </strong>
        </div>

        <button
          type="button"
          onClick={onNew}
          aria-label="New conversation"
        >
          <Plus size={17} />
        </button>
      </header>

      <div className="ai-conversation-list">
        {loading ? (
          <div className="ai-conversation-loading">
            <LoaderCircle
              size={19}
              className="chat-icon-spin"
            />

            Loading…
          </div>
        ) : conversations.length ===
          0 ? (
          <div className="ai-conversation-empty">
            <MessageSquare
              size={21}
            />

            <p>
              No conversations yet.
            </p>
          </div>
        ) : (
          conversations.map(
            (
              conversation
            ) => {
              const id =
                getConversationId(
                  conversation
                );

              const active =
                id ===
                activeConversationId;

              return (
                <article
                  key={id}
                  className={
                    active
                      ? "ai-conversation-item ai-conversation-item--active"
                      : "ai-conversation-item"
                  }
                >
                  <button
                    type="button"
                    className="ai-conversation-item__open"
                    onClick={() =>
                      onOpen(
                        conversation
                      )
                    }
                  >
                    <MessageSquare
                      size={15}
                    />

                    <span>
                      {getConversationTitle(
                        conversation
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="ai-conversation-item__delete"
                    onClick={() =>
                      onDelete(
                        conversation
                      )
                    }
                    aria-label="Delete conversation"
                  >
                    <Trash2
                      size={14}
                    />
                  </button>
                </article>
              );
            }
          )
        )}
      </div>
    </aside>
  );
}

export default ChatConversationSidebar;