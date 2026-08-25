import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createReportController,
  getMyReportController,
  listMyReportsController,
  getReportForModerationController,
  listReportsForModerationController,
  listReportsAgainstUserController,
  listReportsForTargetController,
  beginReportReviewController,
  resolveReportController,
  rejectReportController,
  updateReportNotesController,
  updateReportStatusController,
  getReportedUserStatisticsController,
  getTargetReportCountController,
  permanentlyDeleteReportController
} from "../controllers/community/report.controller.js";

import {
  createReportRequestSchema,
  getMyReportRequestSchema,
  listMyReportsRequestSchema,
  getReportForModerationRequestSchema,
  listReportsForModerationRequestSchema,
  listReportsAgainstUserRequestSchema,
  listReportsForTargetRequestSchema,
  beginReportReviewRequestSchema,
  resolveReportRequestSchema,
  rejectReportRequestSchema,
  updateReportNotesRequestSchema,
  updateReportStatusRequestSchema,
  getReportedUserStatisticsRequestSchema,
  getTargetReportCountRequestSchema,
  permanentlyDeleteReportRequestSchema
} from "../validators/report.validator.js";

const router = Router();

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Moderator/admin authorization
|--------------------------------------------------------------------------
*/

function authorizeModerator(req, res, next) {
  const allowedRoles = ["admin", "moderator"];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Moderator or administrator access required."
    });
  }

  next();
}

/*
|--------------------------------------------------------------------------
| User report routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validate(createReportRequestSchema),
  createReportController
);

router.get(
  "/my",
  validate(listMyReportsRequestSchema),
  listMyReportsController
);

router.get(
  "/my/:reportId",
  validate(getMyReportRequestSchema),
  getMyReportController
);

/*
|--------------------------------------------------------------------------
| Moderator report listing
|--------------------------------------------------------------------------
*/

router.get(
  "/moderation",
  authorizeModerator,
  validate(listReportsForModerationRequestSchema),
  listReportsForModerationController
);

router.get(
  "/moderation/users/:reportedUserId",
  authorizeModerator,
  validate(listReportsAgainstUserRequestSchema),
  listReportsAgainstUserController
);

router.get(
  "/moderation/users/:reportedUserId/statistics",
  authorizeModerator,
  validate(getReportedUserStatisticsRequestSchema),
  getReportedUserStatisticsController
);

router.get(
  "/moderation/targets/:targetType/:targetId",
  authorizeModerator,
  validate(listReportsForTargetRequestSchema),
  listReportsForTargetController
);

router.get(
  "/moderation/targets/:targetType/:targetId/count",
  authorizeModerator,
  validate(getTargetReportCountRequestSchema),
  getTargetReportCountController
);

/*
|--------------------------------------------------------------------------
| Moderator report actions
|--------------------------------------------------------------------------
*/

router.patch(
  "/moderation/:reportId/review",
  authorizeModerator,
  validate(beginReportReviewRequestSchema),
  beginReportReviewController
);

router.patch(
  "/moderation/:reportId/resolve",
  authorizeModerator,
  validate(resolveReportRequestSchema),
  resolveReportController
);

router.patch(
  "/moderation/:reportId/reject",
  authorizeModerator,
  validate(rejectReportRequestSchema),
  rejectReportController
);

router.patch(
  "/moderation/:reportId/notes",
  authorizeModerator,
  validate(updateReportNotesRequestSchema),
  updateReportNotesController
);

router.patch(
  "/moderation/:reportId/status",
  authorizeModerator,
  validate(updateReportStatusRequestSchema),
  updateReportStatusController
);

router.delete(
  "/moderation/:reportId",
  authorizeModerator,
  validate(permanentlyDeleteReportRequestSchema),
  permanentlyDeleteReportController
);

/*
|--------------------------------------------------------------------------
| Get one report for moderation
|--------------------------------------------------------------------------
| Keep the generic reportId route below specific action routes.
*/

router.get(
  "/moderation/:reportId",
  authorizeModerator,
  validate(getReportForModerationRequestSchema),
  getReportForModerationController
);

export default router;