import {
  ArrowLeft,
  Lock,
  MoreVertical,
  Users
} from "lucide-react";

function ChatHeader({
  title,
  description,
  memberCount = 0,
  locked = false,
  onBack,
  onDetails
}) {
  return (
    <header className="messages-chat-header">
      <div className="messages-chat-header__left">
        <button
          type="button"
          className="messages-chat-header__back"
          onClick={onBack}
        >
          <ArrowLeft
            size={18}
          />
        </button>

        <div>
          <div className="messages-chat-header__title">
            <h2>
              {title}
            </h2>

            {locked && (
              <Lock
                size={13}
              />
            )}
          </div>

          <p>
            <Users
              size={13}
            />

            {memberCount}{" "}
            {memberCount === 1
              ? "member"
              : "members"}

            {description && (
              <>
                <span>
                  •
                </span>
                {description}
              </>
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="messages-chat-header__details"
        onClick={
          onDetails
        }
        aria-label="Room details"
      >
        <MoreVertical
          size={18}
        />
      </button>
    </header>
  );
}

export default ChatHeader;