import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  completeHabitController,
  createHabitLogController,
  getHabitLogByIdController,
  getHabitLogsController,
  permanentlyDeleteHabitLogController,
  restoreHabitLogController,
  skipHabitController,
  softDeleteHabitLogController,
  updateHabitLogController
} from "../../controllers/trackers/habitLog.controller.js";

import {
  completeHabitSchema,
  createHabitLogSchema,
  getHabitLogsSchema,
  habitLogIdParamSchema,
  permanentlyDeleteHabitLogSchema,
  restoreHabitLogSchema,
  skipHabitSchema,
  softDeleteHabitLogSchema,
  updateHabitLogSchema
} from "../../validators/trackers/habitLog.validator.js";

const router = Router({
  mergeParams: true
});

router.use(authenticate);

router.post(
  "/",
  validate(createHabitLogSchema),
  createHabitLogController
);

router.get(
  "/",
  validate(getHabitLogsSchema),
  getHabitLogsController
);

router.patch(
  "/complete",
  validate(completeHabitSchema),
  completeHabitController
);

router.patch(
  "/skip",
  validate(skipHabitSchema),
  skipHabitController
);

router.get(
  "/:habitLogId",
  validate(habitLogIdParamSchema),
  getHabitLogByIdController
);

router.patch(
  "/:habitLogId",
  validate(updateHabitLogSchema),
  updateHabitLogController
);

router.delete(
  "/:habitLogId",
  validate(softDeleteHabitLogSchema),
  softDeleteHabitLogController
);

router.patch(
  "/:habitLogId/restore",
  validate(restoreHabitLogSchema),
  restoreHabitLogController
);

router.delete(
  "/:habitLogId/permanent",
  validate(
    permanentlyDeleteHabitLogSchema
  ),
  permanentlyDeleteHabitLogController
);

export default router;
