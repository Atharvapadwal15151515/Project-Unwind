import crypto from "crypto";

import pool
  from "../../config/database.js";

import {
  sendAdminUserNotification
} from "./adminNotification.service.js";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

async function getAdmin(
  client,
  adminId
) {
  const result =
    await client.query(
      `
        SELECT
          user_id,
          username,
          email,
          role,
          account_status
        FROM users
        WHERE user_id = $1
        LIMIT 1
      `,
      [adminId]
    );

  return result.rows[0] || null;
}


async function getProposalForUpdate(
  client,
  proposalId
) {
  const result =
    await client.query(
      `
        SELECT
          proposal_id,
          requested_by,
          target_user_id,
          action_type,
          reason,
          requested_duration_minutes,
          requested_expires_at,
          admin_count_snapshot,
          required_approvals,
          proposal_hash,
          status,
          approved_at,
          rejected_at,
          executed_at,
          cancelled_at,
          created_at,
          updated_at
        FROM admin_moderation_proposals
        WHERE proposal_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [proposalId]
    );

  return result.rows[0] || null;
}


async function getTargetUserForUpdate(
  client,
  userId
) {
  const result =
    await client.query(
      `
        SELECT
          user_id,
          username,
          email,
          role,
          account_status,
          suspended_at,
          suspension_expires_at,
          suspension_reason,
          banned_at,
          ban_reason
        FROM users
        WHERE user_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

  return result.rows[0] || null;
}


async function getExistingVote(
  client,
  proposalId,
  adminId
) {
  const result =
    await client.query(
      `
        SELECT
          vote_id,
          decision,
          signed_at
        FROM admin_moderation_votes
        WHERE proposal_id = $1
          AND admin_id = $2
        LIMIT 1
      `,
      [
        proposalId,
        adminId
      ]
    );

  return result.rows[0] || null;
}


async function getVoteCounts(
  client,
  proposalId
) {
  const result =
    await client.query(
      `
        SELECT

          COUNT(*)
            FILTER (
              WHERE decision = 'approve'
            )::INTEGER
            AS approvals,

          COUNT(*)
            FILTER (
              WHERE decision = 'reject'
            )::INTEGER
            AS rejections

        FROM admin_moderation_votes
        WHERE proposal_id = $1
      `,
      [proposalId]
    );

  return {
    approvals:
      result.rows[0]?.approvals || 0,

    rejections:
      result.rows[0]?.rejections || 0
  };
}


async function createAuditLog(
  client,
  {
    adminId,
    action,
    targetUserId,
    reason,
    oldValue = null,
    newValue = null,
    metadata = {}
  }
) {
  await client.query(
    `
      INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_type,
        target_id,
        reason,
        old_value,
        new_value,
        metadata
      )
      VALUES (
        $1,
        $2,
        'user',
        $3,
        $4,
        $5,
        $6,
        $7
      )
    `,
    [
      adminId,
      action,
      targetUserId,
      reason,
      oldValue,
      newValue,
      metadata
    ]
  );
}


async function createModerationAction(
  client,
  {
    adminId,
    targetUserId,
    actionType,
    reason,
    durationMinutes = null,
    expiresAt = null,
    metadata = {}
  }
) {
  await client.query(
    `
      INSERT INTO moderation_actions (
        admin_id,
        target_user_id,
        action_type,
        target_type,
        target_id,
        reason,
        duration_minutes,
        expires_at,
        metadata
      )
      VALUES (
        $1,
        $2,
        $3,
        'user',
        $4,
        $5,
        $6,
        $7,
        $8
      )
    `,
    [
      adminId,
      targetUserId,
      actionType,
      targetUserId,
      reason,
      durationMinutes,
      expiresAt,
      metadata
    ]
  );
}


/*
|--------------------------------------------------------------------------
| Validate Proposal Hash
|--------------------------------------------------------------------------
|
| The stored proposal hash represents the exact moderation proposal that
| admins are signing.
|
*/

function verifyProposalHash(
  proposal
) {
  const payload = [
    proposal.target_user_id,
    proposal.action_type,
    proposal.reason,
    proposal.requested_duration_minutes ??
      "",
    proposal.requested_expires_at
      ? new Date(
          proposal.requested_expires_at
        ).toISOString()
      : "",
    new Date(
      proposal.created_at
    ).toISOString()
  ].join("|");


  const calculatedHash =
    crypto
      .createHash("sha256")
      .update(payload)
      .digest("hex");


  if (
    calculatedHash !==
    proposal.proposal_hash
  ) {
    throw new Error(
      "PROPOSAL_HASH_MISMATCH"
    );
  }
}


/*
|--------------------------------------------------------------------------
| Execute Long Suspension
|--------------------------------------------------------------------------
*/

async function executeLongSuspension(
  client,
  {
    proposal,
    executionAdminId
  }
) {
  const user =
    await getTargetUserForUpdate(
      client,
      proposal.target_user_id
    );


  if (!user) {
    throw new Error(
      "TARGET_USER_NOT_FOUND"
    );
  }


  if (user.role === "admin") {
    throw new Error(
      "ADMIN_TARGET_PROTECTED"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | The duration begins when the proposal is APPROVED, not when it was
  | originally created.
  |
  */

  const durationMinutes =
    Number(
      proposal
        .requested_duration_minutes
    );


  if (
    !Number.isInteger(
      durationMinutes
    ) ||
    durationMinutes <=
      7 * 24 * 60
  ) {
    throw new Error(
      "INVALID_LONG_SUSPENSION_DURATION"
    );
  }


  const suspendedAt =
    new Date();


  const expiresAt =
    new Date(
      suspendedAt.getTime() +
        durationMinutes *
          60 *
          1000
    );


  await client.query(
    `
      UPDATE users
      SET
        account_status =
          'suspended',

        suspended_at =
          $2,

        suspension_expires_at =
          $3,

        suspension_reason =
          $4,

        suspension_proposal_id =
          $5,

        banned_at =
          NULL,

        ban_reason =
          NULL,

        ban_proposal_id =
          NULL,

        updated_at =
          NOW()

      WHERE user_id = $1
    `,
    [
      proposal.target_user_id,
      suspendedAt,
      expiresAt,
      proposal.reason,
      proposal.proposal_id
    ]
  );


  await createModerationAction(
    client,
    {
      adminId:
        executionAdminId,

      targetUserId:
        proposal.target_user_id,

      actionType:
        "temporary_suspension",

      reason:
        proposal.reason,

      durationMinutes,

      expiresAt,

      metadata: {
        proposalId:
          proposal.proposal_id,

        approvedByMajority:
          true
      }
    }
  );


  await createAuditLog(
    client,
    {
      adminId:
        executionAdminId,

      action:
        "user_suspended_by_admin_vote",

      targetUserId:
        proposal.target_user_id,

      reason:
        proposal.reason,

      oldValue: {
        account_status:
          user.account_status
      },

      newValue: {
        account_status:
          "suspended",

        suspendedAt,

        expiresAt
      },

      metadata: {
        proposalId:
          proposal.proposal_id,

        durationMinutes,

        approvedByMajority:
          true
      }
    }
  );


  return {
    user,
    suspendedAt,
    expiresAt
  };
}


/*
|--------------------------------------------------------------------------
| Execute Permanent Ban
|--------------------------------------------------------------------------
*/

async function executePermanentBan(
  client,
  {
    proposal,
    executionAdminId
  }
) {
  const user =
    await getTargetUserForUpdate(
      client,
      proposal.target_user_id
    );


  if (!user) {
    throw new Error(
      "TARGET_USER_NOT_FOUND"
    );
  }


  if (user.role === "admin") {
    throw new Error(
      "ADMIN_TARGET_PROTECTED"
    );
  }


  const bannedAt =
    new Date();


  await client.query(
    `
      UPDATE users
      SET
        account_status =
          'banned',

        banned_at =
          $2,

        ban_reason =
          $3,

        ban_proposal_id =
          $4,

        suspended_at =
          NULL,

        suspension_expires_at =
          NULL,

        suspension_reason =
          NULL,

        suspension_proposal_id =
          NULL,

        updated_at =
          NOW()

      WHERE user_id = $1
    `,
    [
      proposal.target_user_id,
      bannedAt,
      proposal.reason,
      proposal.proposal_id
    ]
  );


  await createModerationAction(
    client,
    {
      adminId:
        executionAdminId,

      targetUserId:
        proposal.target_user_id,

      actionType:
        "permanent_ban",

      reason:
        proposal.reason,

      metadata: {
        proposalId:
          proposal.proposal_id,

        approvedByMajority:
          true
      }
    }
  );


  await createAuditLog(
    client,
    {
      adminId:
        executionAdminId,

      action:
        "user_banned_by_admin_vote",

      targetUserId:
        proposal.target_user_id,

      reason:
        proposal.reason,

      oldValue: {
        account_status:
          user.account_status
      },

      newValue: {
        account_status:
          "banned",

        bannedAt
      },

      metadata: {
        proposalId:
          proposal.proposal_id,

        approvedByMajority:
          true
      }
    }
  );


  return {
    user,
    bannedAt
  };
}


/*
|--------------------------------------------------------------------------
| Execute Approved Proposal
|--------------------------------------------------------------------------
*/

async function executeProposal(
  client,
  {
    proposal,
    executionAdminId
  }
) {
  let executionResult;


  switch (
    proposal.action_type
  ) {
    case "long_suspension":

      executionResult =
        await executeLongSuspension(
          client,
          {
            proposal,
            executionAdminId
          }
        );

      break;


    case "permanent_ban":

      executionResult =
        await executePermanentBan(
          client,
          {
            proposal,
            executionAdminId
          }
        );

      break;


    default:
      throw new Error(
        "INVALID_PROPOSAL_ACTION"
      );
  }


  await client.query(
    `
      UPDATE
        admin_moderation_proposals

      SET
        status =
          'executed',

        approved_at =
          COALESCE(
            approved_at,
            NOW()
          ),

        executed_at =
          NOW(),

        updated_at =
          NOW()

      WHERE proposal_id = $1
    `,
    [proposal.proposal_id]
  );


  return executionResult;
}


/*
|--------------------------------------------------------------------------
| Vote On Proposal
|--------------------------------------------------------------------------
*/

export async function
voteOnModerationProposal({
  proposalId,
  adminId,
  decision,
  adminSessionId = null,
  ipAddress = null,
  userAgent = null
}) {
  const normalizedDecision =
    String(decision || "")
      .trim()
      .toLowerCase();


  if (
    ![
      "approve",
      "reject"
    ].includes(
      normalizedDecision
    )
  ) {
    throw new Error(
      "INVALID_VOTE_DECISION"
    );
  }


  const client =
    await pool.connect();


  let notification = null;


  try {
    await client.query("BEGIN");


    /*
    |--------------------------------------------------------------------------
    | Validate Admin
    |--------------------------------------------------------------------------
    */

    const admin =
      await getAdmin(
        client,
        adminId
      );


    if (
      !admin ||
      admin.role !== "admin" ||
      admin.account_status !==
        "active"
    ) {
      throw new Error(
        "INVALID_ADMIN"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Lock Proposal
    |--------------------------------------------------------------------------
    */

    const proposal =
      await getProposalForUpdate(
        client,
        proposalId
      );


    if (!proposal) {
      throw new Error(
        "PROPOSAL_NOT_FOUND"
      );
    }


    if (
      proposal.status !==
      "pending"
    ) {
      throw new Error(
        "PROPOSAL_NOT_PENDING"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Proposal Integrity
    |--------------------------------------------------------------------------
    */

    verifyProposalHash(
      proposal
    );


    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Vote
    |--------------------------------------------------------------------------
    */

    const existingVote =
      await getExistingVote(
        client,
        proposalId,
        adminId
      );


    if (existingVote) {
      throw new Error(
        "ADMIN_ALREADY_VOTED"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Record Digital Sign-Off
    |--------------------------------------------------------------------------
    */

    const voteResult =
      await client.query(
        `
          INSERT INTO
            admin_moderation_votes (
              proposal_id,
              admin_id,
              decision,
              proposal_hash,
              admin_session_id,
              ip_address,
              user_agent
            )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )

          RETURNING *
        `,
        [
          proposalId,
          adminId,
          normalizedDecision,
          proposal.proposal_hash,
          adminSessionId,
          ipAddress,
          userAgent
        ]
      );


    /*
    |--------------------------------------------------------------------------
    | Audit Vote
    |--------------------------------------------------------------------------
    */

    await createAuditLog(
      client,
      {
        adminId,

        action:
          normalizedDecision ===
          "approve"
            ? "moderation_proposal_approved"
            : "moderation_proposal_rejected",

        targetUserId:
          proposal.target_user_id,

        reason:
          proposal.reason,

        oldValue: null,

        newValue: {
          decision:
            normalizedDecision
        },

        metadata: {
          proposalId:
            proposal.proposal_id,

          actionType:
            proposal.action_type,

          proposalHash:
            proposal.proposal_hash
        }
      }
    );


    /*
    |--------------------------------------------------------------------------
    | Count Votes
    |--------------------------------------------------------------------------
    */

    const voteCounts =
      await getVoteCounts(
        client,
        proposalId
      );


    const requiredApprovals =
      Number(
        proposal.required_approvals
      );


    const adminCount =
      Number(
        proposal.admin_count_snapshot
      );


    /*
    |--------------------------------------------------------------------------
    | Calculate Rejection Threshold
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | 10 admins
    | 6 approvals required
    |
    | Once 5 reject, reaching 6 approvals is impossible.
    |
    */

    const rejectionThreshold =
      adminCount -
      requiredApprovals +
      1;


    let finalStatus =
      "pending";

    let executionResult =
      null;


    /*
    |--------------------------------------------------------------------------
    | Majority Approved
    |--------------------------------------------------------------------------
    */

    if (
      voteCounts.approvals >=
      requiredApprovals
    ) {
      executionResult =
        await executeProposal(
          client,
          {
            proposal,

            executionAdminId:
              adminId
          }
        );


      finalStatus =
        "executed";


      notification = {
        type:
          proposal.action_type,

        userId:
          proposal.target_user_id,

        adminId,

        reason:
          proposal.reason,

        durationMinutes:
          proposal
            .requested_duration_minutes,

        expiresAt:
          executionResult
            ?.expiresAt ||
          null,

        proposalId:
          proposal.proposal_id
      };
    }


    /*
    |--------------------------------------------------------------------------
    | Majority Can No Longer Be Reached
    |--------------------------------------------------------------------------
    */

    else if (
      voteCounts.rejections >=
      rejectionThreshold
    ) {
      await client.query(
        `
          UPDATE
            admin_moderation_proposals

          SET
            status =
              'rejected',

            rejected_at =
              NOW(),

            updated_at =
              NOW()

          WHERE proposal_id = $1
        `,
        [proposalId]
      );


      finalStatus =
        "rejected";


      await createAuditLog(
        client,
        {
          adminId,

          action:
            "moderation_proposal_vote_failed",

          targetUserId:
            proposal.target_user_id,

          reason:
            proposal.reason,

          oldValue: {
            status:
              "pending"
          },

          newValue: {
            status:
              "rejected"
          },

          metadata: {
            proposalId,

            approvals:
              voteCounts.approvals,

            rejections:
              voteCounts.rejections,

            requiredApprovals
          }
        }
      );
    }


    await client.query(
      "COMMIT"
    );


    /*
    |--------------------------------------------------------------------------
    | Notifications After Commit
    |--------------------------------------------------------------------------
    */

    if (notification) {
      try {

        if (
          notification.type ===
          "long_suspension"
        ) {
          await sendAdminUserNotification({
            adminId:
              notification.adminId,

            userId:
              notification.userId,

            title:
              "Account Temporarily Suspended",

            message:
              "Your Unwind account has been temporarily suspended following an administrator review and approval process.",

            priority:
              "high",

            iconName:
              "shield-alert",

            actionUrl:
              "/notifications",

            referenceType:
              "account_suspension",

            referenceId:
              notification.proposalId,

            metadata: {
              proposalId:
                notification.proposalId,

              expiresAt:
                notification.expiresAt,

              durationMinutes:
                notification.durationMinutes
            }
          });
        }


        if (
          notification.type ===
          "permanent_ban"
        ) {
          await sendAdminUserNotification({
            adminId:
              notification.adminId,

            userId:
              notification.userId,

            title:
              "Account Moderation Action",

            message:
              "Your Unwind account has been permanently banned following an administrator review and approval process.",

            priority:
              "high",

            iconName:
              "ban",

            actionUrl:
              "/notifications",

            referenceType:
              "account_ban",

            referenceId:
              notification.proposalId,

            metadata: {
              proposalId:
                notification.proposalId
            }
          });
        }

      } catch (
        notificationError
      ) {
        console.error(
          "Failed to send moderation decision notification:",
          notificationError
        );
      }
    }


    return {
      success: true,

      vote:
        voteResult.rows[0],

      voting: {
        approvals:
          voteCounts.approvals,

        rejections:
          voteCounts.rejections,

        requiredApprovals,

        adminCountSnapshot:
          adminCount,

        rejectionThreshold
      },

      status:
        finalStatus,

      executed:
        finalStatus ===
        "executed",

      executionResult
    };

  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;

  } finally {
    client.release();
  }
}


/*
|--------------------------------------------------------------------------
| Approve Proposal
|--------------------------------------------------------------------------
*/

export async function
approveModerationProposal({
  proposalId,
  adminId,
  adminSessionId = null,
  ipAddress = null,
  userAgent = null
}) {
  return voteOnModerationProposal({
    proposalId,
    adminId,

    decision:
      "approve",

    adminSessionId,
    ipAddress,
    userAgent
  });
}


/*
|--------------------------------------------------------------------------
| Reject Proposal
|--------------------------------------------------------------------------
*/

export async function
rejectModerationProposal({
  proposalId,
  adminId,
  adminSessionId = null,
  ipAddress = null,
  userAgent = null
}) {
  return voteOnModerationProposal({
    proposalId,
    adminId,

    decision:
      "reject",

    adminSessionId,
    ipAddress,
    userAgent
  });
}