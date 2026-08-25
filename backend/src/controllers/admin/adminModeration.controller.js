import {
  warnUser,
  restrictUser,
  suspendUser,
  banUser,
  restoreUser
} from "../../services/admin/adminModeration.service.js";


function handleProtectedAdmin(
  error,
  res
) {
  if (
    error.message ===
    "ADMIN_TARGET_PROTECTED"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Admin accounts cannot be moderated through this endpoint"
    });
  }

  return null;
}


export async function warnUserController(
  req,
  res
) {
  try {
    const {
      reason,
      severity
    } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Warning reason is required"
      });
    }

    const result =
      await warnUser({
        adminId:
          req.user.user_id,

        userId:
          req.params.userId,

        reason,

        severity:
          severity || "low"
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Warning issued successfully",
      ...result
    });

  } catch (error) {
    console.error(
      "Warn user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to warn user"
    });
  }
}


export async function restrictUserController(
  req,
  res
) {
  try {
    const {
      restrictionType,
      reason,
      durationMinutes
    } = req.body;

    if (
      !restrictionType ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restriction type and reason are required"
      });
    }

    const allowedTypes = [
      "community_mute",
      "community_post_block",
      "community_chat_block",
      "shadow_ban",
      "temporary_account_restriction"
    ];

    if (
      !allowedTypes.includes(
        restrictionType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid restriction type"
      });
    }

    const parsedDuration =
      durationMinutes
        ? Number(durationMinutes)
        : null;

    if (
      parsedDuration !== null &&
      (
        !Number.isFinite(
          parsedDuration
        ) ||
        parsedDuration <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be greater than 0"
      });
    }

    const result =
      await restrictUser({
        adminId:
          req.user.user_id,

        userId:
          req.params.userId,

        restrictionType,
        reason,

        durationMinutes:
          parsedDuration
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Restriction applied successfully",
      ...result
    });

  } catch (error) {
    console.error(
      "Restrict user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to restrict user"
    });
  }
}


export async function suspendUserController(
  req,
  res
) {
  try {
    const {
      reason,
      durationMinutes
    } = req.body;

    if (
      !reason?.trim() ||
      durationMinutes === undefined ||
      durationMinutes === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reason and duration are required"
      });
    }

    const parsedDuration =
      Number(durationMinutes);

    if (
      !Number.isInteger(
        parsedDuration
      ) ||
      parsedDuration <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be a positive whole number of minutes"
      });
    }

    const result =
      await suspendUser({
        adminId:
          req.user.user_id,

        userId:
          req.params.userId,

        reason:
          reason.trim(),

        durationMinutes:
          parsedDuration
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Suspension > 7 Days
    |--------------------------------------------------------------------------
    |
    | No suspension happens yet.
    | A majority-vote proposal was created.
    |
    */

    if (
      result.requiresApproval ===
      true
    ) {
      return res.status(202).json({
        success: true,

        requiresApproval: true,

        message:
          "This suspension exceeds 7 days and has been submitted for administrator approval.",

        action:
          result.action,

        proposal:
          result.proposal,

        targetUser:
          result.targetUser,

        voting:
          result.voting
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Suspension <= 7 Days
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      requiresApproval: false,

      message:
        "User suspended successfully.",

      user: result
    });

  } catch (error) {
    const handled =
      handleProtectedAdmin(
        error,
        res
      );

    if (handled) {
      return handled;
    }

    if (
      error.message ===
      "MODERATION_REASON_REQUIRED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Suspension reason is required"
      });
    }

    if (
      error.message ===
      "INVALID_SUSPENSION_DURATION"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Suspension duration is invalid"
      });
    }

    if (
      error.message ===
      "PENDING_PROPOSAL_EXISTS"
    ) {
      return res.status(409).json({
        success: false,

        message:
          "A pending suspension proposal already exists for this user.",

        proposalId:
          error.proposalId
      });
    }

    if (
      error.message ===
      "INVALID_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Valid administrator access is required"
      });
    }

    console.error(
      "Suspend user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to suspend user"
    });
  }
}


export async function banUserController(
  req,
  res
) {
  try {
    const {
      reason
    } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Ban reason is required"
      });
    }

    const result =
      await banUser({
        adminId:
          req.user.user_id,

        userId:
          req.params.userId,

        reason:
          reason.trim()
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Permanent Ban Always Requires Majority Approval
    |--------------------------------------------------------------------------
    */

    return res.status(202).json({
      success: true,

      requiresApproval: true,

      message:
        "Permanent ban proposal created. Majority administrator approval is required before the account is banned.",

      action:
        result.action,

      proposal:
        result.proposal,

      targetUser:
        result.targetUser,

      voting:
        result.voting
    });

  } catch (error) {
    const handled =
      handleProtectedAdmin(
        error,
        res
      );

    if (handled) {
      return handled;
    }

    if (
      error.message ===
      "MODERATION_REASON_REQUIRED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Ban reason is required"
      });
    }

    if (
      error.message ===
      "PENDING_PROPOSAL_EXISTS"
    ) {
      return res.status(409).json({
        success: false,

        message:
          "A pending permanent ban proposal already exists for this user.",

        proposalId:
          error.proposalId
      });
    }

    if (
      error.message ===
      "INVALID_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Valid administrator access is required"
      });
    }

    console.error(
      "Ban user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create permanent ban proposal"
    });
  }
}


export async function restoreUserController(
  req,
  res
) {
  try {
    const {
      reason
    } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Restore reason is required"
      });
    }

    const result =
      await restoreUser({
        adminId:
          req.user.user_id,

        userId:
          req.params.userId,

        reason
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "User restored successfully",
      user: result
    });

  } catch (error) {
    console.error(
      "Restore user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to restore user"
    });
  }
}