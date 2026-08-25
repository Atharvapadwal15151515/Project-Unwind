import pool from "../../config/database.js";

import {
  createDirectConversation,
  findDirectConversationById,
  findDirectConversationBetweenUsers,
  findDirectConversationsForUser,
  reactivateDirectConversation,
  deactivateDirectConversation,
  updateDirectConversationLastActivity,
} from "../../models/community/directConversation.model.js";

import {
  notifyDirectConversationStarted
} from "../notification/communityNotification.service.js";

import {
  addDirectConversationMember,
  findDirectConversationMember,
  findDirectConversationMemberIncludingLeft,
  findDirectConversationMembers,
  leaveDirectConversationMember,
  rejoinDirectConversationMember,
  updateDirectConversationLastRead,
  updateDirectConversationMemberIdentity,
  updateDirectConversationMemberMute,
} from "../../models/community/directConversationMember.model.js";

import {
  getCommunityProfile,
} from "./communityProfile.service.js";

/**
 * Create a consistent service error.
 */
function createServiceError(
  message,
  statusCode = 400,
  code = "DIRECT_CONVERSATION_ERROR"
) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;

  return error;
}

/**
 * Return a user's active community identity.
 */
async function getActiveCommunityIdentity(userId) {
  const community = await getCommunityProfile(userId);

  if (!community?.profile) {
    throw createServiceError(
      "Community profile not found.",
      404,
      "COMMUNITY_PROFILE_NOT_FOUND"
    );
  }

  if (!community.profile.is_active) {
    throw createServiceError(
      "Community access is currently disabled.",
      403,
      "COMMUNITY_ACCESS_DISABLED"
    );
  }

  return {
    profile: community.profile,
    visibleName: community.visibleName,
    identityMode: community.profile.identity_mode,
  };
}

/**
 * Require an active direct conversation.
 */
async function requireDirectConversation(conversationId) {
  const conversation =
    await findDirectConversationById(conversationId);

  if (!conversation) {
    throw createServiceError(
      "Direct conversation not found.",
      404,
      "DIRECT_CONVERSATION_NOT_FOUND"
    );
  }

  if (!conversation.is_active) {
    throw createServiceError(
      "This direct conversation is no longer active.",
      410,
      "DIRECT_CONVERSATION_INACTIVE"
    );
  }

  return conversation;
}

/**
 * Require the requesting user to be an active member.
 */
async function requireConversationMember(
  conversationId,
  userId
) {
  const member = await findDirectConversationMember(
    conversationId,
    userId
  );

  if (!member) {
    throw createServiceError(
      "You are not a member of this conversation.",
      403,
      "DIRECT_CONVERSATION_MEMBERSHIP_REQUIRED"
    );
  }

  return member;
}

/**
 * Start a direct conversation or return an existing one.
 */
export async function startDirectConversation({
  userId,
  recipientUserId,
}) {
  if (!recipientUserId) {
    throw createServiceError(
      "Recipient user ID is required.",
      400,
      "RECIPIENT_REQUIRED"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Normalize UUID values
  |--------------------------------------------------------------------------
  */

  const senderUserId =
    String(userId);

  const targetUserId =
    String(recipientUserId);

  if (
    senderUserId ===
    targetUserId
  ) {
    throw createServiceError(
      "You cannot start a direct conversation with yourself.",
      400,
      "SELF_CONVERSATION_NOT_ALLOWED"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Community identities
  |--------------------------------------------------------------------------
  |
  | The real authenticated user IDs are used internally.
  | visibleName / identityMode are only the public-facing identity.
  |--------------------------------------------------------------------------
  */

  const senderCommunity =
    await getActiveCommunityIdentity(
      senderUserId
    );

  const recipientCommunity =
    await getActiveCommunityIdentity(
      targetUserId
    );

  /*
  |--------------------------------------------------------------------------
  | Return existing conversation if one already exists
  |--------------------------------------------------------------------------
  */

  const existingConversation =
    await findDirectConversationBetweenUsers(
      senderUserId,
      targetUserId
    );

  if (existingConversation) {
    const conversationId =
      existingConversation
        .conversation_id;

    /*
     * Check sender membership,
     * including memberships that
     * previously left.
     */

    const senderActiveMembership =
      await findDirectConversationMember(
        conversationId,
        senderUserId
      );

    if (
      !senderActiveMembership
    ) {
      const previousSenderMembership =
        await findDirectConversationMemberIncludingLeft(
          conversationId,
          senderUserId
        );

      if (
        previousSenderMembership
      ) {
        await rejoinDirectConversationMember({
          conversationId,
          userId:
            senderUserId,

          visibleName:
            senderCommunity.visibleName,

          identityMode:
            senderCommunity.identityMode,
        });
      } else {
        await addDirectConversationMember({
  conversationId,

  userId:
    senderUserId,

  visibleName:
    senderCommunity.visibleName,

  identityMode:
    senderCommunity.identityMode,

  memberRole:
    "requester",

  requestStatus:
    "accepted",

  joinedAt:
    new Date(),
});
      }
    }

    /*
     * Check recipient membership.
     */

    const recipientActiveMembership =
      await findDirectConversationMember(
        conversationId,
        targetUserId
      );

    if (
      !recipientActiveMembership
    ) {
      const previousRecipientMembership =
        await findDirectConversationMemberIncludingLeft(
          conversationId,
          targetUserId
        );

      if (
        previousRecipientMembership
      ) {
        await rejoinDirectConversationMember({
          conversationId,

          userId:
            targetUserId,

          visibleName:
            recipientCommunity.visibleName,

          identityMode:
            recipientCommunity.identityMode,
        });
      } else {
        await addDirectConversationMember({
          conversationId,

          userId:
            targetUserId,

          visibleName:
            recipientCommunity.visibleName,

          identityMode:
            recipientCommunity.identityMode,

          memberRole:
            "recipient",

          requestStatus:
            "accepted",

          joinedAt:
            new Date(),
        });
      }
    }

    /*
     * Make sure an old conversation
     * is active again.
     */

    if (
      !existingConversation
        .is_active
    ) {
      await reactivateDirectConversation(
        conversationId
      );
    }

    const refreshedConversation =
      await findDirectConversationById(
        conversationId
      );

    return {
      conversation:
        refreshedConversation ||
        existingConversation,

      created: false,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Create a brand-new conversation
  |--------------------------------------------------------------------------
  */

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
     * IMPORTANT:
     *
     * Use the MODEL here.
     *
     * Your old service tried to insert:
     *
     * conversation_type
     * last_activity_at
     *
     * but those fields do not match
     * your current direct_conversations model/schema.
     */

    const conversation =
      await createDirectConversation({
        initiatedByUserId:
          senderUserId,

        conversationStatus:
          "accepted",

        client,
      });

    if (!conversation) {
      throw createServiceError(
        "Unable to create direct conversation.",
        500,
        "DIRECT_CONVERSATION_CREATION_FAILED"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Add sender
    |--------------------------------------------------------------------------
    */

    await addDirectConversationMember({
  conversationId:
    conversation
      .conversation_id,

  userId:
    senderUserId,

  visibleName:
    senderCommunity
      .visibleName,

  identityMode:
    senderCommunity
      .identityMode,

  memberRole:
    "requester",

  requestStatus:
    "accepted",

  joinedAt:
    new Date(),

  client,
});

    /*
    |--------------------------------------------------------------------------
    | Add recipient
    |--------------------------------------------------------------------------
    */

    await addDirectConversationMember({
  conversationId:
    conversation
      .conversation_id,

  userId:
    targetUserId,

  visibleName:
    recipientCommunity
      .visibleName,

  identityMode:
    recipientCommunity
      .identityMode,

  memberRole:
    "recipient",

  requestStatus:
    "accepted",

  joinedAt:
    new Date(),

  client,
});

    await client.query(
      "COMMIT"
    );

    await notifyDirectConversationStarted({
  conversationId:
    conversation
      .conversation_id,

  actorUserId:
    senderUserId,

  recipientUserId:
    targetUserId,

  actorVisibleName:
    senderCommunity
      .visibleName
});

    return {
      conversation,
      created: true,
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    /*
    |--------------------------------------------------------------------------
    | Handle duplicate/race condition
    |--------------------------------------------------------------------------
    |
    | Two clients could theoretically
    | create the same conversation
    | at almost the same time.
    |--------------------------------------------------------------------------
    */

    if (
      error?.code ===
      "23505"
    ) {
      const conversation =
        await findDirectConversationBetweenUsers(
          senderUserId,
          targetUserId
        );

      if (conversation) {
        return {
          conversation,
          created: false,
        };
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * Return one conversation with its members.
 */
export async function getDirectConversationDetails({
  conversationId,
  userId,
}) {
  const conversation =
    await requireDirectConversation(conversationId);

  const membership = await requireConversationMember(
    conversationId,
    userId
  );

  const members =
    await findDirectConversationMembers(conversationId);

  const otherMember = members.find(
    (member) => member.user_id !== userId
  );

  return {
    conversation,
    membership,
    members,
    other_member: otherMember || null,
  };
}

/**
 * List the authenticated user's direct conversations.
 */
export async function listMyDirectConversations({
  userId,
  limit = 30,
  offset = 0,
}) {
  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  const normalizedOffset = Math.max(
    Number(offset) || 0,
    0
  );

  return findDirectConversationsForUser({
    userId,
    limit: normalizedLimit,
    offset: normalizedOffset,
  });
}

/**
 * Verify access to a conversation.
 *
 * This helper can be reused by the direct-message service
 * and Socket.IO handlers.
 */
export async function verifyDirectConversationAccess({
  conversationId,
  userId,
}) {
  const conversation =
    await requireDirectConversation(
      conversationId
    );

  const membership =
    await requireConversationMember(
      conversationId,
      userId
    );

  /*
   * Current direct-conversation
   * membership schema uses left_at.
   *
   * It does NOT use the old
   * is_removed field.
   */

  if (
    membership.left_at
  ) {
    throw createServiceError(
      "You have left this conversation.",
      403,
      "DIRECT_CONVERSATION_MEMBER_LEFT"
    );
  }

  return {
    conversation,
    membership,
  };
}

/**
 * Mark a direct conversation as read.
 */
export async function markDirectConversationAsRead({
  conversationId,
  userId,
}) {
  await verifyDirectConversationAccess({
    conversationId,
    userId,
  });

  const readStatus =
    await updateDirectConversationLastRead(
      conversationId,
      userId
    );

  return {
    conversation_id: conversationId,
    user_id: userId,
    last_read_at: readStatus?.last_read_at || new Date(),
  };
}

/**
 * Refresh the stored display identity for a conversation member.
 *
 * This is useful if the user changes between anonymous
 * and registered identity mode.
 */
export async function refreshDirectConversationIdentity({
  conversationId,
  userId,
}) {
  await verifyDirectConversationAccess({
    conversationId,
    userId,
  });

  const community =
    await getActiveCommunityIdentity(
      userId
    );

  const membership =
    await updateDirectConversationMemberIdentity({
      conversationId,

      userId,

      visibleName:
        community.visibleName,

      identityMode:
        community.identityMode,
    });

  if (!membership) {
    throw createServiceError(
      "Direct conversation membership was not found.",
      404,
      "DIRECT_CONVERSATION_MEMBERSHIP_NOT_FOUND"
    );
  }

  return membership;
}

/**
 * Mute or unmute a direct conversation for the current user.
 *
 * This only controls notifications. It does not prevent messages.
 */
export async function setDirectConversationMute({
  conversationId,
  userId,
  isMuted,
}) {
  await verifyDirectConversationAccess({
    conversationId,
    userId,
  });

  const membership =
    await updateDirectConversationMemberMute({
      conversationId,

      userId,

      isMuted:
        Boolean(isMuted),
    });

  if (!membership) {
    throw createServiceError(
      "Direct conversation membership was not found.",
      404,
      "DIRECT_CONVERSATION_MEMBERSHIP_NOT_FOUND"
    );
  }

  return membership;
}

/**
 * Leave a direct conversation.
 */
export async function leaveDirectConversation({
  conversationId,
  userId,
}) {
  const {
    conversation
  } =
    await verifyDirectConversationAccess({
      conversationId,
      userId,
    });

  const membership =
    await leaveDirectConversationMember(
      conversationId,
      userId
    );

  /*
   * findDirectConversationMembers()
   * already returns only members where
   * left_at IS NULL.
   */

  const activeMembers =
    await findDirectConversationMembers(
      conversationId
    );

  if (
    activeMembers.length === 0
  ) {
    await deactivateDirectConversation(
      conversationId
    );

    return {
      conversation,
      membership,
      left: true,
      conversation_deactivated:
        true,
    };
  }

  return {
    conversation,
    membership,
    left: true,
    conversation_deactivated:
      false,
  };
}

/**
 * Rejoin an existing conversation.
 */
export async function rejoinDirectConversation({
  conversationId,
  userId,
}) {
  const conversation =
    await findDirectConversationById(
      conversationId
    );

  if (!conversation) {
    throw createServiceError(
      "Direct conversation not found.",
      404,
      "DIRECT_CONVERSATION_NOT_FOUND"
    );
  }

  const community =
    await getActiveCommunityIdentity(
      userId
    );

  /*
   * We need the previous membership
   * including a member who has left.
   */

  const previousMembership =
    await findDirectConversationMemberIncludingLeft(
      conversationId,
      userId
    );

  if (
    !previousMembership
  ) {
    throw createServiceError(
      "You were never a participant in this conversation.",
      403,
      "DIRECT_CONVERSATION_REJOIN_FORBIDDEN"
    );
  }

  const membership =
    await rejoinDirectConversationMember({
      conversationId,

      userId,

      visibleName:
        community.visibleName,

      identityMode:
        community.identityMode,
    });

  if (!membership) {
    throw createServiceError(
      "Unable to rejoin this conversation.",
      500,
      "DIRECT_CONVERSATION_REJOIN_FAILED"
    );
  }

  let updatedConversation =
    conversation;

  if (
    !conversation.is_active
  ) {
    updatedConversation =
      await reactivateDirectConversation(
        conversationId
      );
  }

  return {
    conversation:
      updatedConversation,

    membership,

    rejoined: true,
  };
}

/**
 * Update the conversation activity timestamp.
 *
 * The message service will call this after sending,
 * editing or deleting a direct message.
 */
export async function touchDirectConversation(
  conversationId
) {
  const conversation =
    await requireDirectConversation(conversationId);

  await updateDirectConversationLastActivity(
    conversationId
  );

  return conversation;
}