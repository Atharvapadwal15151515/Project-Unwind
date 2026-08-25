import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createEnergyController,
  getEnergyEntriesController,
  getEnergyEntryByIdController,
  permanentlyDeleteEnergyController,
  restoreEnergyController,
  softDeleteEnergyController,
  updateEnergyController
} from "../../controllers/trackers/energyTracker.controller.js";

import {
  createEnergyEntrySchema,
  energyEntryIdParamSchema,
  getEnergyEntriesSchema,
  permanentlyDeleteEnergyEntrySchema,
  restoreEnergyEntrySchema,
  softDeleteEnergyEntrySchema,
  updateEnergyEntrySchema
} from "../../validators/trackers/energyTracker.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createEnergyEntrySchema),
  createEnergyController
);

router.get(
  "/",
  validate(getEnergyEntriesSchema),
  getEnergyEntriesController
);

router.get(
  "/:energyEntryId",
  validate(energyEntryIdParamSchema),
  getEnergyEntryByIdController
);

router.patch(
  "/:energyEntryId",
  validate(updateEnergyEntrySchema),
  updateEnergyController
);

router.delete(
  "/:energyEntryId",
  validate(softDeleteEnergyEntrySchema),
  softDeleteEnergyController
);

router.patch(
  "/:energyEntryId/restore",
  validate(restoreEnergyEntrySchema),
  restoreEnergyController
);

router.delete(
  "/:energyEntryId/permanent",
  validate(
    permanentlyDeleteEnergyEntrySchema
  ),
  permanentlyDeleteEnergyController
);

export default router;
