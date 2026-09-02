import MemberAvatar from "./MemberAvatar";

function TypingIndicator({
  users = []
}) {
  if (
    !Array.isArray(users) ||
    users.length === 0
  ) {
    return null;
  }

  const visibleUsers =
    users.slice(0, 3);

  const names =
    visibleUsers
      .map(
        (user) =>
          user?.display_name ||
          user?.displayName ||
          user?.username ||
          user?.full_name ||
          user?.fullName ||
          "Someone"
      );
let label;

  if (names.length === 1) {
    label =
      `${names[0]} is typing`;
  } else if (names.length === 2) {
    label =
      `${names[0]} and ${names[1]} are typing`;
  } else {
    label =
      `${names[0]}, ${names[1]} and others are typing`;
  }

  return (
    <div className="messages-typing-indicator">
      <div className="messages-typing-indicator__avatars">
        {visibleUsers.map(
          (user, index) => {
            const name =
              user?.display_name ||
              user?.displayName ||
              user?.username ||
              user?.full_name ||
              user?.fullName ||
              "User";

            const image =
              user?.profile_image_url ||
              user?.profileImageUrl ||
              null;

            const userId =
              user?.user_id ||
              user?.userId ||
              user?.id ||
              index;

            return (
              <MemberAvatar
                key={userId}
                name={name}
                imageUrl={image}
                size={26}
              />
            );
          }
        )}
      </div>

      <div className="messages-typing-indicator__content">
        <span>
          {label}
        </span>

        <div className="messages-typing-dots">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;