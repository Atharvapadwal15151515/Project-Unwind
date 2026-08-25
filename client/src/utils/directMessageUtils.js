/*
|--------------------------------------------------------------------------
| Direct conversation helpers
|--------------------------------------------------------------------------
|
| These helpers deliberately support both snake_case and camelCase.
|
| The backend currently returns snake_case values, but supporting both
| prevents UI breakage if an object is normalized elsewhere.
|--------------------------------------------------------------------------
*/

export function getDirectConversationId(
  conversation
) {
  return (
    conversation?.conversation_id ??
    conversation?.conversationId ??
    conversation?.id ??
    null
  );
}

export function getDirectConversationStatus(
  conversation
) {
  return (
    conversation?.conversation_status ??
    conversation?.conversationStatus ??
    "accepted"
  );
}

export function isDirectConversationActive(
  conversation
) {
  const value =
    conversation?.is_active ??
    conversation?.isActive;

  return value !== false;
}

/*
|--------------------------------------------------------------------------
| Other participant
|--------------------------------------------------------------------------
*/

export function getDirectOtherUserId(
  conversation
) {
  return (
    conversation?.other_user_id ??
    conversation?.otherUserId ??
    conversation?.other_member?.user_id ??
    conversation?.otherMember?.userId ??
    null
  );
}

export function getDirectOtherName(
  conversation
) {
  return (
    conversation
      ?.other_visible_name ??
    conversation
      ?.otherVisibleName ??
    conversation
      ?.other_member
      ?.visible_name ??
    conversation
      ?.other_member
      ?.visibleName ??
    conversation
      ?.otherMember
      ?.visible_name ??
    conversation
      ?.otherMember
      ?.visibleName ??
    ""
  );
}

export function getDirectOtherIdentityMode(
  conversation
) {
  return (
    conversation?.other_identity_mode ??
    conversation?.otherIdentityMode ??
    conversation?.other_member
      ?.identity_mode ??
    conversation?.otherMember
      ?.identityMode ??
    null
  );
}

export function getDirectOtherImage(
  conversation
) {
  return (
    conversation?.other_profile_image_url ??
    conversation?.otherProfileImageUrl ??
    conversation?.other_member
      ?.profile_image_url ??
    conversation?.otherMember
      ?.profileImageUrl ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| Current member
|--------------------------------------------------------------------------
*/

export function getDirectCurrentVisibleName(
  conversation
) {
  return (
    conversation?.current_visible_name ??
    conversation?.currentVisibleName ??
    conversation?.membership
      ?.visible_name ??
    conversation?.membership
      ?.visibleName ??
    null
  );
}

export function isDirectConversationMuted(
  conversation
) {
  return Boolean(
    conversation?.is_muted ??
      conversation?.isMuted ??
      conversation?.membership
        ?.is_muted ??
      conversation?.membership
        ?.isMuted ??
      false
  );
}

export function isDirectConversationArchived(
  conversation
) {
  return Boolean(
    conversation?.is_archived ??
      conversation?.isArchived ??
      false
  );
}

export function getDirectConversationUnreadCount(
  conversation
) {
  const value =
    conversation?.unread_count ??
    conversation?.unreadCount ??
    0;

  const count =
    Number(value);

  return Number.isFinite(count)
    ? count
    : 0;
}

/*
|--------------------------------------------------------------------------
| Latest message
|--------------------------------------------------------------------------
*/

export function getDirectLatestMessageText(
  conversation
) {
  const deleted =
    Boolean(
      conversation
        ?.latest_message_is_deleted ??
      conversation
        ?.latestMessageIsDeleted
    );

  if (deleted) {
    return "Message deleted";
  }

  return (
    conversation?.latest_message_text ??
    conversation?.latestMessageText ??
    ""
  );
}

export function getDirectLatestMessageAt(
  conversation
) {
  return (
    conversation
      ?.latest_message_created_at ??
    conversation
      ?.latestMessageCreatedAt ??
    conversation?.last_message_at ??
    conversation?.lastMessageAt ??
    conversation?.last_activity_at ??
    conversation?.lastActivityAt ??
    conversation?.created_at ??
    conversation?.createdAt ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| Direct message helpers
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Direct messages use direct_message_id.
|
| This explicitly avoids the same bug we hit in Private Rooms where the
| frontend looked for message_id while the backend returned another ID field.
|--------------------------------------------------------------------------
*/

export function getDirectMessageId(
  message
) {
  return (
    message?.direct_message_id ??
    message?.directMessageId ??
    message?.message_id ??
    message?.messageId ??
    message?.id ??
    null
  );
}

export function getDirectMessageConversationId(
  message
) {
  return (
    message?.conversation_id ??
    message?.conversationId ??
    null
  );
}

export function getDirectMessageUserId(
  message
) {
  return (
    message?.sender_user_id ??
    message?.senderUserId ??
    null
  );
}

export function getDirectMessageSenderName(
  message
) {
  return (
    message
      ?.sender_visible_name ??
    message
      ?.senderVisibleName ??
    ""
  );
}

export function getDirectMessageSenderImage(
  message
) {
  return (
    message?.sender_profile_image_url ??
    message?.senderProfileImageUrl ??
    null
  );
}

export function getDirectMessageText(
  message
) {
  return (
    message?.message_text ??
    message?.messageText ??
    ""
  );
}

export function getDirectMessageType(
  message
) {
  return (
    message?.message_type ??
    message?.messageType ??
    "text"
  );
}

export function getDirectMessageCreatedAt(
  message
) {
  return (
    message?.created_at ??
    message?.createdAt ??
    null
  );
}

export function getDirectMessageEditedAt(
  message
) {
  return (
    message?.edited_at ??
    message?.editedAt ??
    null
  );
}

export function isDirectMessageEdited(
  message
) {
  return Boolean(
    message?.is_edited ??
      message?.isEdited ??
      false
  );
}

export function isDirectMessageDeleted(
  message
) {
  return Boolean(
    message?.is_deleted ??
      message?.isDeleted ??
      false
  );
}

/*
|--------------------------------------------------------------------------
| Reply helpers
|--------------------------------------------------------------------------
*/

export function getDirectReplyMessageId(
  message
) {
  return (
    message?.reply_to_message_id ??
    message?.replyToMessageId ??
    null
  );
}

export function getDirectReplySenderName(
  message
) {
  return (
    message
      ?.reply_sender_visible_name ??
    message
      ?.replySenderVisibleName ??
    ""
  );
}

export function getDirectReplyMessageText(
  message
) {
  return (
    message?.reply_message_text ??
    message?.replyMessageText ??
    ""
  );
}

export function isDirectReplyDeleted(
  message
) {
  return Boolean(
    message?.reply_message_is_deleted ??
      message?.replyMessageIsDeleted ??
      message?.reply_is_deleted ??
      message?.replyIsDeleted ??
      false
  );
}

/*
|--------------------------------------------------------------------------
| Member helpers
|--------------------------------------------------------------------------
*/

export function getDirectMemberUserId(
  member
) {
  return (
    member?.user_id ??
    member?.userId ??
    null
  );
}

export function getDirectMemberName(
  member
) {
  return (
    member?.visible_name ??
    member?.visibleName ??
    ""
  );
}

export function getDirectMemberIdentityMode(
  member
) {
  return (
    member?.identity_mode ??
    member?.identityMode ??
    null
  );
}