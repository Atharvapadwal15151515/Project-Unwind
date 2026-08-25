import {
  hasActiveRestriction
} from "../../services/admin/userRestriction.service.js";


export function checkCommunityRestriction(
  restrictionTypes
) {
  return async function (
    req,
    res,
    next
  ) {
    try {
      if (!req.user?.user_id) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required"
        });
      }

      const restriction =
        await hasActiveRestriction(
          req.user.user_id,
          restrictionTypes
        );

      if (!restriction) {
        return next();
      }

      return res.status(403).json({
        success: false,

        message:
          "Your community access is currently restricted.",

        restriction: {
          type:
            restriction.restriction_type,

          expiresAt:
            restriction.expires_at
        }
      });

    } catch (error) {
      console.error(
        "Community restriction check error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to verify community access"
      });
    }
  };
}