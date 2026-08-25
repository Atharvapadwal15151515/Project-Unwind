import {
  createLongSuspensionProposal,
  createPermanentBanProposal,
  getModerationProposalById,
  getModerationProposalVotes,
  getModerationProposals
} from "../../services/admin/adminModerationProposal.service.js";

import {
  approveModerationProposal,
  rejectModerationProposal
} from "../../services/admin/adminModerationVote.service.js";


/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

function sendModerationError(
  res,
  error
) {
  const code =
    error?.message;


  const errorMap = {
    MODERATION_REASON_REQUIRED: {
      status: 400,
      message:
        "A moderation reason is required."
    },

    ADMIN_TARGET_PROTECTED: {
      status: 403,
      message:
        "Administrator accounts cannot be targeted by this moderation action."
    },

    INVALID_ADMIN: {
      status: 403,
      message:
        "Valid administrator access is required."
    },

    INVALID_PROPOSAL_ACTION: {
      status: 400,
      message:
        "Invalid moderation proposal type."
    },

    LONG_SUSPENSION_REQUIRES_MORE_THAN_7_DAYS: {
      status: 400,
      message:
        "Long suspension proposals must exceed 7 days."
    },

    PENDING_PROPOSAL_EXISTS: {
      status: 409,
      message:
        "A pending proposal of this type already exists for this user."
    },

    NO_ACTIVE_ADMINS: {
      status: 409,
      message:
        "No active administrators are available for voting."
    },

    INVALID_VOTE_DECISION: {
      status: 400,
      message:
        "Vote must be approve or reject."
    },

    PROPOSAL_NOT_FOUND: {
      status: 404,
      message:
        "Moderation proposal was not found."
    },

    PROPOSAL_NOT_PENDING: {
      status: 409,
      message:
        "This moderation proposal is no longer open for voting."
    },

    PROPOSAL_HASH_MISMATCH: {
      status: 409,
      message:
        "Proposal integrity verification failed."
    },

    ADMIN_ALREADY_VOTED: {
      status: 409,
      message:
        "You have already signed this moderation proposal."
    },

    TARGET_USER_NOT_FOUND: {
      status: 404,
      message:
        "Target user was not found."
    },

    INVALID_LONG_SUSPENSION_DURATION: {
      status: 400,
      message:
        "Invalid long suspension duration."
    }
  };


  const mapped =
    errorMap[code];


  if (mapped) {
    return res
      .status(mapped.status)
      .json({
        success: false,
        message:
          mapped.message,

        code,

        proposalId:
          error?.proposalId ||
          undefined
      });
  }


  console.error(
    "Admin moderation decision error:",
    error
  );


  return res
    .status(500)
    .json({
      success: false,
      message:
        "Unable to complete the moderation decision.",
      code:
        "ADMIN_MODERATION_DECISION_ERROR"
    });
}


/*
|--------------------------------------------------------------------------
| Create Long Suspension Proposal
|--------------------------------------------------------------------------
|
| Used only when suspension > 7 days.
|
*/

export async function
createLongSuspensionProposalController(
  req,
  res
) {
  try {
    const adminId =
      req.user.user_id;

    const {
      userId
    } = req.params;

    const {
      reason,
      durationMinutes
    } = req.body;


    const result =
      await createLongSuspensionProposal({
        adminId,
        userId,
        reason,
        durationMinutes
      });


    if (!result) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "User not found."
        });
    }


    return res
      .status(201)
      .json({
        success: true,

        message:
          "Long suspension proposal created and your approval has been recorded.",

        ...result
      });

  } catch (error) {
    return sendModerationError(
      res,
      error
    );
  }
}


/*
|--------------------------------------------------------------------------
| Create Permanent Ban Proposal
|--------------------------------------------------------------------------
*/

export async function
createPermanentBanProposalController(
  req,
  res
) {
  try {
    const adminId =
      req.user.user_id;

    const {
      userId
    } = req.params;

    const {
      reason
    } = req.body;


    const result =
      await createPermanentBanProposal({
        adminId,
        userId,
        reason
      });


    if (!result) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "User not found."
        });
    }


    return res
      .status(201)
      .json({
        success: true,

        message:
          "Permanent ban proposal created and your approval has been recorded.",

        ...result
      });

  } catch (error) {
    return sendModerationError(
      res,
      error
    );
  }
}


/*
|--------------------------------------------------------------------------
| List Moderation Proposals
|--------------------------------------------------------------------------
*/

export async function
getModerationProposalsController(
  req,
  res
) {
  try {
    const {
      status,
      actionType,
      limit,
      offset
    } = req.query;


    const proposals =
      await getModerationProposals({
        status:
          status || null,

        actionType:
          actionType || null,

        limit:
          Number(limit) || 50,

        offset:
          Number(offset) || 0
      });


    return res
      .status(200)
      .json({
        success: true,

        count:
          proposals.length,

        proposals
      });

  } catch (error) {
    return sendModerationError(
      res,
      error
    );
  }
}


/*
|--------------------------------------------------------------------------
| Get Proposal Details
|--------------------------------------------------------------------------
*/

export async function
getModerationProposalController(
  req,
  res
) {
  try {
    const {
      proposalId
    } = req.params;


    const proposal =
      await getModerationProposalById(
        proposalId
      );


    if (!proposal) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Moderation proposal not found."
        });
    }


    const votes =
      await getModerationProposalVotes(
        proposalId
      );


    const currentAdminId =
      req.user.user_id;


    const currentAdminVote =
      votes.find(
        (vote) =>
          vote.admin_id ===
          currentAdminId
      ) || null;


    return res
      .status(200)
      .json({
        success: true,

        proposal,

        voting: {
          approvals:
            proposal.approval_count ||
            0,

          rejections:
            proposal.rejection_count ||
            0,

          requiredApprovals:
            proposal.required_approvals,

          adminCountSnapshot:
            proposal.admin_count_snapshot,

          currentAdminVote
        },

        votes
      });

  } catch (error) {
    return sendModerationError(
      res,
      error
    );
  }
}


/*
|--------------------------------------------------------------------------
| Approve + Digitally Sign
|--------------------------------------------------------------------------
*/

export async function
approveModerationProposalController(
  req,
  res
) {
  try {
    const adminId =
      req.user.user_id;

    const {
      proposalId
    } = req.params;


    /*
    |--------------------------------------------------------------------------
    | Admin Session Reference
    |--------------------------------------------------------------------------
    |
    | If requireAdminAccess attaches the session object to req, this captures
    | its ID. Otherwise NULL is safely stored.
    |
    */

    const adminSessionId =
      req.adminAccessSession
        ?.session_id ||
      req.adminAccessSession
        ?.admin_access_session_id ||
      null;


    const result =
      await approveModerationProposal({
        proposalId,
        adminId,

        adminSessionId,

        ipAddress:
          req.ip || null,

        userAgent:
          req.get(
            "user-agent"
          ) || null
      });


    return res
      .status(200)
      .json({
        success: true,

        message:
          result.executed
            ? "Majority approval reached. The moderation decision has been executed."
            : "Your approval and digital signature have been recorded.",

        ...result
      });

  } catch (error) {
    return sendModerationError(
      res,
      error
    );
  }
}


/*
|--------------------------------------------------------------------------
| Reject + Digitally Sign
|--------------------------------------------------------------------------
*/

export async function
rejectModerationProposalController(
  req,
  res
) {
  try {
    const adminId =
      req.user.user_id;

    const {
      proposalId
    } = req.params;


    const adminSessionId =
      req.adminAccessSession
        ?.session_id ||
      req.adminAccessSession
        ?.admin_access_session_id ||
      null;


    const result =
      await rejectModerationProposal({
        proposalId,
        adminId,

        adminSessionId,

        ipAddress:
          req.ip || null,

        userAgent:
          req.get(
            "user-agent"
          ) || null
      });


    return res
      .status(200)
      .json({
        success: true,

        message:
          result.status ===
          "rejected"
            ? "The proposal can no longer reach majority approval and has been rejected."
            : "Your rejection and digital signature have been recorded.",

        ...result
      });

  } catch (error) {
    return sendModerationError(
      res,
      error
    );
  }
}