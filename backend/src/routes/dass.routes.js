import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";

import {
  getDassConsentStatus,
  giveDassConsent,
  revokeDassConsent,
} from "../controllers/dass/dassConsent.controller.js";

import {
  getDassQuestions,
  startDassAssessment,
  saveDassResponse,
  submitDassAssessment,
  abandonDassAssessment,
} from "../controllers/dass/dassAssessment.controller.js";

import {
  getDassHistory,
  getDassHistoryById,
} from "../controllers/dass/dassHistory.controller.js";

import {
  getDassReportDetails,
  downloadDassPdf,
} from "../controllers/dass/dassReport.controller.js";

import {
  giveDassConsentSchema,
} from "../validators/dass/dassConsent.validator.js";

import {
  assessmentIdParamSchema,
  saveDassResponseSchema,
} from "../validators/dass/dassAssessment.validator.js";

import {
  dassReportParamSchema,
} from "../validators/dass/dassReport.validator.js";

const router = express.Router();

/* -------------------- Consent -------------------- */

router.get(
  "/consent",
  authenticate,
  getDassConsentStatus
);

router.post(
  "/consent",
  authenticate,
  validate(giveDassConsentSchema),
  giveDassConsent
);

router.delete(
  "/consent",
  authenticate,
  revokeDassConsent
);

/* -------------------- Questions -------------------- */

router.get(
  "/questions",
  authenticate,
  getDassQuestions
);

/* -------------------- Assessment -------------------- */

router.post(
  "/assessments",
  authenticate,
  startDassAssessment
);

router.put(
  "/assessments/:assessmentId/responses",
  authenticate,
  validate(saveDassResponseSchema),
  saveDassResponse
);

router.post(
  "/assessments/:assessmentId/submit",
  authenticate,
  validate(assessmentIdParamSchema),
  submitDassAssessment
);

router.patch(
  "/assessments/:assessmentId/abandon",
  authenticate,
  validate(assessmentIdParamSchema),
  abandonDassAssessment
);

/* -------------------- History -------------------- */

router.get(
  "/history",
  authenticate,
  getDassHistory
);

router.get(
  "/history/:assessmentId",
  authenticate,
  validate(assessmentIdParamSchema),
  getDassHistoryById
);

/* -------------------- Reports -------------------- */

router.get(
  "/reports/:assessmentId",
  authenticate,
  validate(dassReportParamSchema),
  getDassReportDetails
);

router.get(
  "/reports/:assessmentId/pdf",
  authenticate,
  validate(dassReportParamSchema),
  downloadDassPdf
);

export default router;