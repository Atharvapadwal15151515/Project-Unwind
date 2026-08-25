import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createHabitController,
  getHabitByIdController,
  getHabitsController,
  getHabitsForDateController,
  pauseHabitController,
  permanentlyDeleteHabitController,
  restoreHabitController,
  resumeHabitController,
  softDeleteHabitController,
  updateHabitController
} from "../../controllers/trackers/habitTracker.controller.js";

import {
  createHabitSchema,
  getHabitsForDateSchema,
  getHabitsSchema,
  habitIdParamSchema,
  pauseHabitSchema,
  permanentlyDeleteHabitSchema,
  restoreHabitSchema,
  resumeHabitSchema,
  softDeleteHabitSchema,
  updateHabitSchema
} from "../../validators/trackers/habitTracker.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createHabitSchema),
  createHabitController
);

router.get(
  "/",
  validate(getHabitsSchema),
  getHabitsController
);

router.get(
  "/for-date",
  validate(getHabitsForDateSchema),
  getHabitsForDateController
);

router.get(
  "/:habitId",
  validate(habitIdParamSchema),
  getHabitByIdController
);

router.patch(
  "/:habitId",
  validate(updateHabitSchema),
  updateHabitController
);

router.patch(
  "/:habitId/pause",
  validate(pauseHabitSchema),
  pauseHabitController
);

router.patch(
  "/:habitId/resume",
  validate(resumeHabitSchema),
  resumeHabitController
);

router.delete(
  "/:habitId",
  validate(softDeleteHabitSchema),
  softDeleteHabitController
);

router.patch(
  "/:habitId/restore",
  validate(restoreHabitSchema),
  restoreHabitController
);

router.delete(
  "/:habitId/permanent",
  validate(
    permanentlyDeleteHabitSchema
  ),
  permanentlyDeleteHabitController
);

export default router;
