function MemberAvatar({
  name = "User",
  imageUrl = null,
  size = 38
}) {
  const initials =
    String(name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0)
      )
      .join("")
      .toUpperCase();

  return (
    <span
      className="message-member-avatar"
      style={{
        width: size,
        height: size
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
        />
      ) : (
        <span>
          {initials || "U"}
        </span>
      )}
    </span>
  );
}

export default MemberAvatar;