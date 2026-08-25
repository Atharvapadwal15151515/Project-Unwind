export function getPrivateRoomId(
  room
) {
  return (
    room?.room_id ??
    room?.roomId ??
    room?.id ??
    null
  );
}

export function getPrivateRoomName(
  room
) {
  return (
    room?.room_name ??
    room?.roomName ??
    room?.name ??
    "Private room"
  );
}

export function getPrivateRoomDescription(
  room
) {
  return (
    room?.room_description ??
    room?.roomDescription ??
    room?.description ??
    ""
  );
}

export function getPrivateRoomCode(
  room
) {
  return (
    room?.room_code ??
    room?.roomCode ??
    null
  );
}

export function getPrivateRoomInviteToken(
  room
) {
  return (
    room?.invite_token ??
    room?.inviteToken ??
    null
  );
}

export function getPrivateRoomOwnerId(
  room
) {
  return (
    room?.owner_user_id ??
    room?.ownerUserId ??
    room?.owner_id ??
    room?.ownerId ??
    null
  );
}

export function getPrivateRoomMemberCount(
  room
) {
  const value =
    room?.member_count ??
    room?.memberCount ??
    room?.members_count ??
    room?.membersCount ??
    room?.current_members ??
    room?.currentMembers ??
    0;

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

export function getPrivateRoomMaxMembers(
  room
) {
  const value =
    room?.maximum_members ??
    room?.maximumMembers ??
    room?.max_members ??
    room?.maxMembers ??
    0;

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export function isPrivateRoomLocked(
  room
) {
  const value =
    room?.is_locked ??
    room?.isLocked ??
    room?.locked ??
    room?.room_locked ??
    room?.roomLocked ??
    false;

  /*
   * Handles boolean, PostgreSQL/MySQL
   * numeric values and string values.
   */
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

export function isPrivateRoomClosed(
  room
) {
  return Boolean(
    room?.is_closed ??
      room?.isClosed ??
      room?.closed_at
  );
}

/*
|--------------------------------------------------------------------------
| Member helpers
|--------------------------------------------------------------------------
*/

export function getPrivateRoomMemberUserId(
  member
) {
  return (
    member?.user_id ??
    member?.userId ??
    member?.member_user_id ??
    member?.memberUserId ??
    member?.id ??
    null
  );
}

export function getPrivateRoomMemberName(
  member
) {
  return (
    member?.display_name ??
    member?.displayName ??
    member?.username ??
    member?.full_name ??
    member?.fullName ??
    "Member"
  );
}

export function getPrivateRoomMemberImage(
  member
) {
  return (
    member?.profile_image_url ??
    member?.profileImageUrl ??
    null
  );
}

export function getPrivateRoomMemberRole(
  member
) {
  return (
    member?.member_role ??
    member?.memberRole ??
    member?.role ??
    "member"
  );
}

export function isPrivateRoomMemberMuted(
  member
) {
  return Boolean(
    member?.is_muted ??
      member?.isMuted ??
      false
  );
}

/*
|--------------------------------------------------------------------------
| Message helpers
|--------------------------------------------------------------------------
*/

export function getPrivateRoomMessageId(
  message
) {
  return (
    message?.chat_message_id ??
    message?.chatMessageId ??
    message?.message_id ??
    message?.messageId ??
    message?.id ??
    null
  );
}

export function getPrivateRoomMessageUserId(
  message
) {
  return (
    message?.user_id ??
    message?.userId ??
    message?.sender_user_id ??
    message?.senderUserId ??
    null
  );
}

export function getPrivateRoomMessageText(
  message
) {
  return (
    message?.message_text ??
    message?.messageText ??
    message?.content ??
    message?.text ??
    ""
  );
}

export function getPrivateRoomMessageType(
  message
) {
  return (
    message?.message_type ??
    message?.messageType ??
    "text"
  );
}

export function getPrivateRoomMessageCreatedAt(
  message
) {
  return (
    message?.created_at ??
    message?.createdAt ??
    null
  );
}

export function getPrivateRoomMessageEditedAt(
  message
) {
  return (
    message?.edited_at ??
    message?.editedAt ??
    null
  );
}

export function getPrivateRoomMessageSenderName(
  message
) {
  return (
    message?.display_name ??
    message?.displayName ??
    message?.username ??
    message?.sender_name ??
    message?.senderName ??
    "Member"
  );
}

export function getPrivateRoomMessageSenderImage(
  message
) {
  return (
    message?.profile_image_url ??
    message?.profileImageUrl ??
    message?.sender_image_url ??
    message?.senderImageUrl ??
    null
  );
}

export function getPrivateRoomReplyMessageId(
  message
) {
  return (
    message?.reply_message_id ??
    message?.replyMessageId ??
    message?.reply_to_message_id ??
    message?.replyToMessageId ??
    null
  );
}

export function getPrivateRoomReplySenderName(
  message
) {
  return (
    message?.reply_sender_visible_name ??
    message?.replySenderVisibleName ??
    message?.reply_sender_name ??
    message?.replySenderName ??
    "Member"
  );
}

export function getPrivateRoomReplyMessageText(
  message
) {
  return (
    message?.reply_message_text ??
    message?.replyMessageText ??
    ""
  );
}

export function isPrivateRoomReplyDeleted(
  message
) {
  return Boolean(
    message?.reply_is_deleted ??
      message?.replyIsDeleted ??
      false
  );
}

export function isPrivateRoomMessageDeleted(
  message
) {
  return Boolean(
    message?.is_deleted ??
      message?.isDeleted ??
      false
  );
}