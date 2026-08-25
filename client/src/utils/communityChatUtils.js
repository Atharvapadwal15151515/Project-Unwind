export function getCommunityChatMessageId(
  message
) {
  return (
    message?.chat_message_id ??
    null
  );
}

export function getCommunityChatSenderId(
  message
) {
  return (
    message?.sender_user_id ??
    null
  );
}

export function getCommunityChatSenderName(
  message
) {
  return (
    message?.sender_visible_name ||
    "Community member"
  );
}

export function getCommunityChatMessageText(
  message
) {
  return (
    message?.message_text ||
    ""
  );
}

export function getCommunityChatCreatedAt(
  message
) {
  return (
    message?.created_at ??
    null
  );
}

export function getCommunityChatEditedAt(
  message
) {
  if (!message?.is_edited) {
    return null;
  }

  return (
    message?.edited_at ??
    message?.updated_at ??
    null
  );
}

export function getCommunityChatIdentityMode(
  message
) {
  return (
    message?.sender_identity_mode ||
    "username"
  );
}

/*
|--------------------------------------------------------------------------
| Reply
|--------------------------------------------------------------------------
*/

export function getCommunityChatReplyId(
  message
) {
  return (
    message?.reply_message_id ??
    message?.reply_to_message_id ??
    null
  );
}

export function getCommunityChatReplySenderName(
  message
) {
  return (
    message?.reply_sender_visible_name ||
    "Community member"
  );
}

export function getCommunityChatReplyText(
  message
) {
  return (
    message?.reply_message_text ||
    ""
  );
}

export function isCommunityChatReplyDeleted(
  message
) {
  return Boolean(
    message?.reply_is_deleted
  );
}

export function isCommunityChatMessageDeleted(
  message
) {
  return Boolean(
    message?.is_deleted
  );
}