import crypto from "crypto";

import pool
  from "../../config/database.js";


const SEVEN_DAYS_MINUTES =
  7 * 24 * 60;


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeReason(reason) {
  const normalized =
    String(reason || "")
      .trim();

  if (!normalized) {
    throw new Error(
      "MODERATION_REASON_REQUIRED"
    );
  }

  return normalized;
}


function generateProposalHash({
  targetUserId,
  actionType,
  reason,
  durationMinutes,
  expiresAt,
  createdAt
}) {
  const payload = [
    targetUserId,
    actionType,
    reason,
    durationMinutes ?? "",
    expiresAt
      ? new Date(expiresAt).toISOString()
      : "",
    new Date(createdAt).toISOString()
  ].join("|");

  return crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");
}


async function getTargetUser(
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
          account_status
        FROM users
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );

  return result.rows[0] || null;
}


async function getActiveAdminCount(
  client
) {
  const result =
    await client.query(
      `
        SELECT
          COUNT(*)::INTEGER
            AS admin_count
        FROM users
        WHERE role = 'admin'
          AND account_status = 'active'
      `
    );

  return (
    result.rows[0]?.admin_count ||
    0
  );
}


function calculateRequiredApprovals(
  adminCount
) {
  return (
    Math.floor(
      adminCount / 2
    ) + 1
  );
}


async function findExistingPendingProposal(
  client,
  {
    userId,
    actionType
  }
) {
  const result =
    await client.query(
      `
        SELECT
          proposal_id
        FROM admin_moderation_proposals
        WHERE target_user_id = $1
          AND action_type = $2
          AND status = 'pending'
        LIMIT 1
      `,
      [
        userId,
        actionType
      ]
    );

  return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Create Proposal
|--------------------------------------------------------------------------
*/

async function createProposal({
  adminId,
  userId,
  actionType,
  reason,
  durationMinutes = null
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const cleanReason =
      normalizeReason(reason);


    /*
    |--------------------------------------------------------------------------
    | Validate Target
    |--------------------------------------------------------------------------
    */

    const targetUser =
      await getTargetUser(
        client,
        userId
      );

    if (!targetUser) {
      await client.query(
        "ROLLBACK"
      );

      return null;
    }


    if (
      targetUser.role === "admin"
    ) {
      throw new Error(
        "ADMIN_TARGET_PROTECTED"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Validate Requesting Admin
    |--------------------------------------------------------------------------
    */

    const requestingAdmin =
      await getTargetUser(
        client,
        adminId
      );

    if (
      !requestingAdmin ||
      requestingAdmin.role !==
        "admin" ||
      requestingAdmin.account_status !==
        "active"
    ) {
      throw new Error(
        "INVALID_ADMIN"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Validate Action
    |--------------------------------------------------------------------------
    */

    if (
      ![
        "long_suspension",
        "permanent_ban"
      ].includes(actionType)
    ) {
      throw new Error(
        "INVALID_PROPOSAL_ACTION"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Long Suspension Validation
    |--------------------------------------------------------------------------
    */

    let expiresAt = null;
    let normalizedDuration = null;


    if (
      actionType ===
      "long_suspension"
    ) {
      normalizedDuration =
        Number(durationMinutes);


      if (
        !Number.isInteger(
          normalizedDuration
        ) ||
        normalizedDuration <=
          SEVEN_DAYS_MINUTES
      ) {
        throw new Error(
          "LONG_SUSPENSION_REQUIRES_MORE_THAN_7_DAYS"
        );
      }


      expiresAt =
        new Date(
          Date.now() +
            normalizedDuration *
              60 *
              1000
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Pending Proposal
    |--------------------------------------------------------------------------
    */

    const existingProposal =
      await findExistingPendingProposal(
        client,
        {
          userId,
          actionType
        }
      );


    if (existingProposal) {
      const error =
        new Error(
          "PENDING_PROPOSAL_EXISTS"
        );

      error.proposalId =
        existingProposal.proposal_id;

      throw error;
    }


    /*
    |--------------------------------------------------------------------------
    | Calculate Majority
    |--------------------------------------------------------------------------
    */

    const adminCount =
      await getActiveAdminCount(
        client
      );


    if (adminCount < 1) {
      throw new Error(
        "NO_ACTIVE_ADMINS"
      );
    }


    const requiredApprovals =
      calculateRequiredApprovals(
        adminCount
      );


    /*
    |--------------------------------------------------------------------------
    | Create Timestamp + Hash
    |--------------------------------------------------------------------------
    */

    const createdAt =
      new Date();


    const proposalHash =
      generateProposalHash({
        targetUserId:
          userId,

        actionType,

        reason:
          cleanReason,

        durationMinutes:
          normalizedDuration,

        expiresAt,

        createdAt
      });


    /*
    |--------------------------------------------------------------------------
    | Insert Proposal
    |--------------------------------------------------------------------------
    */

    const proposalResult =
      await client.query(
        `
          INSERT INTO
            admin_moderation_proposals (
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
              created_at,
              updated_at
            )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            'pending',
            $10,
            $10
          )
          RETURNING *
        `,
        [
          adminId,
          userId,
          actionType,
          cleanReason,
          normalizedDuration,
          expiresAt,
          adminCount,
          requiredApprovals,
          proposalHash,
          createdAt
        ]
      );


    const proposal =
      proposalResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | Requesting Admin = First Approval
    |--------------------------------------------------------------------------
    */

    await client.query(
      `
        INSERT INTO
          admin_moderation_votes (
            proposal_id,
            admin_id,
            decision,
            proposal_hash
          )
        VALUES (
          $1,
          $2,
          'approve',
          $3
        )
      `,
      [
        proposal.proposal_id,
        adminId,
        proposalHash
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | Audit Log
    |--------------------------------------------------------------------------
    */

    await client.query(
      `
        INSERT INTO
          admin_audit_logs (
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
          'moderation_proposal_created',
          'user',
          $2,
          $3,
          NULL,
          $4,
          $5
        )
      `,
      [
        adminId,
        userId,
        cleanReason,

        {
          proposalId:
            proposal.proposal_id,

          actionType,

          durationMinutes:
            normalizedDuration,

          expiresAt,

          requiredApprovals,

          adminCountSnapshot:
            adminCount
        },

        {
          proposalId:
            proposal.proposal_id,

          proposalHash
        }
      ]
    );


    await client.query("COMMIT");


    return {
      proposal,

      targetUser,

      voting: {
        approvals: 1,

        rejections: 0,

        requiredApprovals,

        adminCountSnapshot:
          adminCount
      }
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
| Long Suspension Proposal
|--------------------------------------------------------------------------
*/

export async function
createLongSuspensionProposal({
  adminId,
  userId,
  reason,
  durationMinutes
}) {
  return createProposal({
    adminId,
    userId,

    actionType:
      "long_suspension",

    reason,
    durationMinutes
  });
}


/*
|--------------------------------------------------------------------------
| Permanent Ban Proposal
|--------------------------------------------------------------------------
*/

export async function
createPermanentBanProposal({
  adminId,
  userId,
  reason
}) {
  return createProposal({
    adminId,
    userId,

    actionType:
      "permanent_ban",

    reason
  });
}


/*
|--------------------------------------------------------------------------
| Get Proposal By ID
|--------------------------------------------------------------------------
*/

export async function
getModerationProposalById(
  proposalId
) {
  const result =
    await pool.query(
      `
        SELECT
          p.*,

          requester.username
            AS requester_username,

          target.username
            AS target_username,

          target.email
            AS target_email,

          target.account_status
            AS target_account_status,

          COUNT(v.vote_id)
            FILTER (
              WHERE
                v.decision =
                'approve'
            )::INTEGER
            AS approval_count,

          COUNT(v.vote_id)
            FILTER (
              WHERE
                v.decision =
                'reject'
            )::INTEGER
            AS rejection_count

        FROM
          admin_moderation_proposals p

        JOIN users requester
          ON requester.user_id =
             p.requested_by

        JOIN users target
          ON target.user_id =
             p.target_user_id

        LEFT JOIN
          admin_moderation_votes v
          ON v.proposal_id =
             p.proposal_id

        WHERE
          p.proposal_id = $1

        GROUP BY
          p.proposal_id,
          requester.username,
          target.username,
          target.email,
          target.account_status

        LIMIT 1
      `,
      [proposalId]
    );


  return (
    result.rows[0] ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| Get Proposal Votes
|--------------------------------------------------------------------------
*/

export async function
getModerationProposalVotes(
  proposalId
) {
  const result =
    await pool.query(
      `
        SELECT
          v.vote_id,
          v.proposal_id,
          v.admin_id,
          v.decision,
          v.proposal_hash,
          v.signed_at,

          u.username
            AS admin_username,

          u.email
            AS admin_email

        FROM
          admin_moderation_votes v

        JOIN users u
          ON u.user_id =
             v.admin_id

        WHERE
          v.proposal_id = $1

        ORDER BY
          v.signed_at ASC
      `,
      [proposalId]
    );


  return result.rows;
}


/*
|--------------------------------------------------------------------------
| List Proposals
|--------------------------------------------------------------------------
*/

export async function
getModerationProposals({
  status = null,
  actionType = null,
  limit = 50,
  offset = 0
} = {}) {
  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 50,
        1
      ),
      100
    );


  const safeOffset =
    Math.max(
      Number(offset) || 0,
      0
    );


  const result =
    await pool.query(
      `
        SELECT
          p.*,

          requester.username
            AS requester_username,

          target.username
            AS target_username,

          target.email
            AS target_email,

          target.account_status
            AS target_account_status,

          COUNT(v.vote_id)
            FILTER (
              WHERE
                v.decision =
                'approve'
            )::INTEGER
            AS approval_count,

          COUNT(v.vote_id)
            FILTER (
              WHERE
                v.decision =
                'reject'
            )::INTEGER
            AS rejection_count

        FROM
          admin_moderation_proposals p

        JOIN users requester
          ON requester.user_id =
             p.requested_by

        JOIN users target
          ON target.user_id =
             p.target_user_id

        LEFT JOIN
          admin_moderation_votes v
          ON v.proposal_id =
             p.proposal_id

        WHERE
          (
            $1::VARCHAR IS NULL
            OR p.status = $1
          )

          AND

          (
            $2::VARCHAR IS NULL
            OR p.action_type = $2
          )

        GROUP BY
          p.proposal_id,
          requester.username,
          target.username,
          target.email,
          target.account_status

        ORDER BY
          CASE
            WHEN p.status =
              'pending'
            THEN 0
            ELSE 1
          END,

          p.created_at DESC

        LIMIT $3
        OFFSET $4
      `,
      [
        status,
        actionType,
        safeLimit,
        safeOffset
      ]
    );


  return result.rows;
}