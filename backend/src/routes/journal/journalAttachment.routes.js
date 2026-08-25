import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  uploadJournalAttachment,
  uploadJournalAttachments,
  handleJournalUploadError
} from "../../middleware/journal/journalUpload.js";
import requireJournalUnlock from "../../middleware/journal/requireJournalUnlock.js";
import {
  requireActiveJournalAttachmentOwnership,
  requireDeletedJournalAttachmentOwnership
} from "../../middleware/journal/journalAttachmentOwnership.js";

import {
  addAttachmentController,
  addAttachmentsController,
  getAttachmentController,
  getEntryAttachmentsController,
  getAttachmentsController,
  editAttachmentController,
  setAttachmentCoverController,
  removeAttachmentCoverController,
  reorderAttachmentsController,
  updateAttachmentProcessingController,
  deleteAttachmentController,
  restoreAttachmentController,
  permanentlyRemoveAttachmentController,
  getEntryAttachmentStorageController,
  getAttachmentStorageController
} from "../../controllers/journal/journalAttachment.controller.js";

import {
  addAttachmentRequestSchema,
  addAttachmentsRequestSchema,
  getAttachmentRequestSchema,
  getAttachmentsRequestSchema,
  getEntryAttachmentsRequestSchema,
  updateAttachmentRequestSchema,
  setAttachmentCoverRequestSchema,
  removeAttachmentCoverRequestSchema,
  reorderAttachmentsRequestSchema,
  updateAttachmentProcessingRequestSchema,
  deleteAttachmentRequestSchema,
  restoreAttachmentRequestSchema,
  permanentlyDeleteAttachmentRequestSchema,
  getEntryAttachmentStorageRequestSchema,
  getAttachmentStorageRequestSchema
} from "../../validators/journal/journalAttachment.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
*/

router.get(
  "/storage",
  authenticate,
  requireJournalUnlock,
  validate(
    getAttachmentStorageRequestSchema
  ),
  getAttachmentStorageController
);

router.get(
  "/entries/:entryId/storage",
  authenticate,
  requireJournalUnlock,
  validate(
    getEntryAttachmentStorageRequestSchema
  ),
  getEntryAttachmentStorageController
);

/*
|--------------------------------------------------------------------------
| Entry Attachments
|--------------------------------------------------------------------------
*/

router.get(
  "/entries/:entryId",
  authenticate,
  requireJournalUnlock,
  validate(
    getEntryAttachmentsRequestSchema
  ),
  getEntryAttachmentsController
);

router.post(
  "/entries/:entryId",
  authenticate,
  requireJournalUnlock,
  uploadJournalAttachment,
  handleJournalUploadError,
  validate(
    addAttachmentRequestSchema
  ),
  addAttachmentController
);

router.post(
  "/entries/:entryId/multiple",
  authenticate,
  requireJournalUnlock,
  uploadJournalAttachments,
  handleJournalUploadError,
  validate(
    addAttachmentsRequestSchema
  ),
  addAttachmentsController
);

router.patch(
  "/entries/:entryId/reorder",
  authenticate,
  requireJournalUnlock,
  validate(
    reorderAttachmentsRequestSchema
  ),
  reorderAttachmentsController
);

/*
|--------------------------------------------------------------------------
| All Attachments
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticate,
  requireJournalUnlock,
  validate(
    getAttachmentsRequestSchema
  ),
  getAttachmentsController
);

/*
|--------------------------------------------------------------------------
| Attachment CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/:attachmentId",
  authenticate,
  requireJournalUnlock,
  requireActiveJournalAttachmentOwnership,
  validate(
    getAttachmentRequestSchema
  ),
  getAttachmentController
);

router.patch(
  "/:attachmentId",
  authenticate,
  requireJournalUnlock,
  requireActiveJournalAttachmentOwnership,
  validate(
    updateAttachmentRequestSchema
  ),
  editAttachmentController
);

router.delete(
  "/:attachmentId",
  authenticate,
  requireJournalUnlock,
  requireActiveJournalAttachmentOwnership,
  validate(
    deleteAttachmentRequestSchema
  ),
  deleteAttachmentController
);

/*
|--------------------------------------------------------------------------
| Cover
|--------------------------------------------------------------------------
*/

router.patch(
  "/:attachmentId/cover",
  authenticate,
  requireJournalUnlock,
  requireActiveJournalAttachmentOwnership,
  validate(
    setAttachmentCoverRequestSchema
  ),
  setAttachmentCoverController
);

router.delete(
  "/:attachmentId/cover",
  authenticate,
  requireJournalUnlock,
  requireActiveJournalAttachmentOwnership,
  validate(
    removeAttachmentCoverRequestSchema
  ),
  removeAttachmentCoverController
);

/*
|--------------------------------------------------------------------------
| Processing
|--------------------------------------------------------------------------
*/

router.patch(
  "/:attachmentId/processing",
  authenticate,
  requireJournalUnlock,
  requireActiveJournalAttachmentOwnership,
  validate(
    updateAttachmentProcessingRequestSchema
  ),
  updateAttachmentProcessingController
);

/*
|--------------------------------------------------------------------------
| Restore
|--------------------------------------------------------------------------
*/

router.patch(
  "/:attachmentId/restore",
  authenticate,
  requireJournalUnlock,
  requireDeletedJournalAttachmentOwnership,
  validate(
    restoreAttachmentRequestSchema
  ),
  restoreAttachmentController
);

/*
|--------------------------------------------------------------------------
| Permanent Delete
|--------------------------------------------------------------------------
*/

router.delete(
  "/:attachmentId/permanent",
  authenticate,
  requireJournalUnlock,
  requireDeletedJournalAttachmentOwnership,
  validate(
    permanentlyDeleteAttachmentRequestSchema
  ),
  permanentlyRemoveAttachmentController
);

export default router;