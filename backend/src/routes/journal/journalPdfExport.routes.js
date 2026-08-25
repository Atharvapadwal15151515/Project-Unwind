import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  validate
} from "../../middleware/validate.js";

import {
  journalEntryPdfParamSchema,
  journalMultipleEntriesPdfSchema,
  completeJournalPdfQuerySchema
} from "../../validators/journal/journalPdfExport.validator.js";

import {
  exportSingleJournalEntryPdfController,
  exportMultipleJournalEntriesPdfController,
  exportCompleteJournalPdfController
} from "../../controllers/journal/journalPdfExport.controller.js";

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Single Journal Entry PDF
|--------------------------------------------------------------------------
| GET /api/journal/export/entries/:entryId/pdf
*/

router.get(
  "/entries/:entryId/pdf",
  authenticate,
  validate(
    journalEntryPdfParamSchema
  ),
  exportSingleJournalEntryPdfController
);

/*
|--------------------------------------------------------------------------
| Multiple Journal Entries PDF
|--------------------------------------------------------------------------
| POST /api/journal/export/pdf
*/

router.post(
  "/pdf",
  authenticate,
  validate(
    journalMultipleEntriesPdfSchema
  ),
  exportMultipleJournalEntriesPdfController
);

/*
|--------------------------------------------------------------------------
| Complete Journal PDF
|--------------------------------------------------------------------------
| GET /api/journal/export/pdf
*/

router.get(
  "/pdf",
  authenticate,
  validate(
    completeJournalPdfQuerySchema
  ),
  exportCompleteJournalPdfController
);

export default router;