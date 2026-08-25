import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createWaterContainerController,
  createWaterController,
  getWaterContainerByIdController,
  getWaterContainersController,
  getWaterLogByIdController,
  getWaterLogsController,
  getWaterTotalController,
  permanentlyDeleteWaterController,
  restoreWaterController,
  softDeleteWaterContainerController,
  softDeleteWaterController,
  updateWaterContainerController,
  updateWaterController
} from "../../controllers/trackers/waterTracker.controller.js";

import {
  createWaterContainerSchema,
  createWaterLogSchema,
  getWaterContainersSchema,
  getWaterLogsSchema,
  getWaterTotalSchema,
  permanentlyDeleteWaterLogSchema,
  restoreWaterLogSchema,
  softDeleteWaterContainerSchema,
  softDeleteWaterLogSchema,
  updateWaterContainerSchema,
  updateWaterLogSchema,
  waterContainerIdParamSchema,
  waterLogIdParamSchema
} from "../../validators/trackers/waterTracker.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/logs",
  validate(createWaterLogSchema),
  createWaterController
);

router.get(
  "/logs",
  validate(getWaterLogsSchema),
  getWaterLogsController
);

router.get(
  "/logs/total",
  validate(getWaterTotalSchema),
  getWaterTotalController
);

router.get(
  "/logs/:waterLogId",
  validate(waterLogIdParamSchema),
  getWaterLogByIdController
);

router.patch(
  "/logs/:waterLogId",
  validate(updateWaterLogSchema),
  updateWaterController
);

router.delete(
  "/logs/:waterLogId",
  validate(softDeleteWaterLogSchema),
  softDeleteWaterController
);

router.patch(
  "/logs/:waterLogId/restore",
  validate(restoreWaterLogSchema),
  restoreWaterController
);

router.delete(
  "/logs/:waterLogId/permanent",
  validate(
    permanentlyDeleteWaterLogSchema
  ),
  permanentlyDeleteWaterController
);

router.post(
  "/containers",
  validate(createWaterContainerSchema),
  createWaterContainerController
);

router.get(
  "/containers",
  validate(getWaterContainersSchema),
  getWaterContainersController
);

router.get(
  "/containers/:waterContainerId",
  validate(waterContainerIdParamSchema),
  getWaterContainerByIdController
);

router.patch(
  "/containers/:waterContainerId",
  validate(updateWaterContainerSchema),
  updateWaterContainerController
);

router.delete(
  "/containers/:waterContainerId",
  validate(
    softDeleteWaterContainerSchema
  ),
  softDeleteWaterContainerController
);

export default router;
