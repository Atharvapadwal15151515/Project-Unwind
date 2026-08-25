import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  validate
} from "../../middleware/validate.js";

import {
  requireVoiceTranscriptOwnership
} from "../../middleware/journal/journalVoiceOwnership.js";

import {
  createVoiceTranscript,
  createPendingVoiceTranscript,
  createAndTranscribeVoiceJournal,
  processVoiceTranscription,
  retryVoiceTranscription,
  getTranscriptionAvailability,
  getTranscriptionConfiguration,
  getVoiceTranscript,
  getVoiceTranscriptDetails,
  getVoiceTranscriptByAttachment,
  getEntryVoiceTranscripts,
  getUserVoiceTranscripts,
  searchVoiceTranscripts,
  getVoiceTranscriptSummary,
  updateVoiceTranscriptText,
  restoreOriginalVoiceTranscript,
  updateVoiceTranscriptMetadata,
  getVoiceTranscriptStatus,
  deleteVoiceTranscript,
  deleteVoiceJournalAudio,
  restoreVoiceTranscript,
  restoreVoiceJournalAudio,
  permanentlyDeleteVoiceTranscript,
  permanentlyDeleteVoiceJournalAudio,
  deleteVoiceTranscriptByAttachment,
  restoreVoiceTranscriptByAttachment
} from "../../controllers/journal/journalVoice.controller.js";

import {
  createJournalVoiceTranscriptRequestSchema,
  getJournalVoiceTranscriptRequestSchema,
  getJournalEntryVoiceTranscriptsRequestSchema,
  getJournalVoiceTranscriptsRequestSchema,
  searchJournalVoiceTranscriptsRequestSchema,
  updateJournalVoiceTranscriptRequestSchema,
  restoreOriginalJournalVoiceTranscriptRequestSchema,
  updateJournalVoiceTranscriptMetadataRequestSchema,
  transcribeJournalVoiceRequestSchema,
  retryJournalVoiceTranscriptionRequestSchema,
  getJournalVoiceTranscriptStatusRequestSchema,
  deleteJournalVoiceTranscriptRequestSchema,
  restoreJournalVoiceTranscriptRequestSchema,
  permanentlyDeleteJournalVoiceTranscriptRequestSchema,
  getJournalVoiceTranscriptByAttachmentRequestSchema,
  deleteJournalVoiceTranscriptByAttachmentRequestSchema,
  restoreJournalVoiceTranscriptByAttachmentRequestSchema
} from "../../validators/journal/journalVoice.validator.js";

const router =
  express.Router();

router.use(authenticate);

router.get(
  "/configuration",
  getTranscriptionConfiguration
);

router.get(
  "/availability",
  getTranscriptionAvailability
);

router.get(
  "/",
  validate(
    getJournalVoiceTranscriptsRequestSchema
  ),
  getUserVoiceTranscripts
);

router.get(
  "/search",
  validate(
    searchJournalVoiceTranscriptsRequestSchema
  ),
  searchVoiceTranscripts
);

router.post(
  "/entry/:entryId",
  validate(
    createJournalVoiceTranscriptRequestSchema
  ),
  createVoiceTranscript
);

router.post(
  "/entry/:entryId/pending",
  validate(
    createJournalVoiceTranscriptRequestSchema
  ),
  createPendingVoiceTranscript
);

router.post(
  "/entry/:entryId/transcribe",
  validate(
    createJournalVoiceTranscriptRequestSchema
  ),
  createAndTranscribeVoiceJournal
);

router.get(
  "/entry/:entryId",
  validate(
    getJournalEntryVoiceTranscriptsRequestSchema
  ),
  getEntryVoiceTranscripts
);

router.get(
  "/attachment/:attachmentId",
  validate(
    getJournalVoiceTranscriptByAttachmentRequestSchema
  ),
  getVoiceTranscriptByAttachment
);

router.delete(
  "/attachment/:attachmentId",
  validate(
    deleteJournalVoiceTranscriptByAttachmentRequestSchema
  ),
  deleteVoiceTranscriptByAttachment
);

router.patch(
  "/attachment/:attachmentId/restore",
  validate(
    restoreJournalVoiceTranscriptByAttachmentRequestSchema
  ),
  restoreVoiceTranscriptByAttachment
);

router.get(
  "/:voiceTranscriptId",
  validate(
    getJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  getVoiceTranscript
);

router.get(
  "/:voiceTranscriptId/details",
  validate(
    getJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  getVoiceTranscriptDetails
);

router.get(
  "/:voiceTranscriptId/summary",
  validate(
    getJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  getVoiceTranscriptSummary
);

router.get(
  "/:voiceTranscriptId/status",
  validate(
    getJournalVoiceTranscriptStatusRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  getVoiceTranscriptStatus
);

router.post(
  "/:voiceTranscriptId/process",
  validate(
    transcribeJournalVoiceRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  processVoiceTranscription
);

router.post(
  "/:voiceTranscriptId/retry",
  validate(
    retryJournalVoiceTranscriptionRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  retryVoiceTranscription
);

router.patch(
  "/:voiceTranscriptId/transcript",
  validate(
    updateJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  updateVoiceTranscriptText
);

router.patch(
  "/:voiceTranscriptId/restore-original",
  validate(
    restoreOriginalJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  restoreOriginalVoiceTranscript
);

router.patch(
  "/:voiceTranscriptId/metadata",
  validate(
    updateJournalVoiceTranscriptMetadataRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  updateVoiceTranscriptMetadata
);

router.delete(
  "/:voiceTranscriptId",
  validate(
    deleteJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  deleteVoiceTranscript
);

router.delete(
  "/:voiceTranscriptId/audio",
  validate(
    deleteJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  deleteVoiceJournalAudio
);

router.patch(
  "/:voiceTranscriptId/restore",
  validate(
    restoreJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  restoreVoiceTranscript
);

router.patch(
  "/:voiceTranscriptId/restore-audio",
  validate(
    restoreJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  restoreVoiceJournalAudio
);

router.delete(
  "/:voiceTranscriptId/permanent",
  validate(
    permanentlyDeleteJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  permanentlyDeleteVoiceTranscript
);

router.delete(
  "/:voiceTranscriptId/audio/permanent",
  validate(
    permanentlyDeleteJournalVoiceTranscriptRequestSchema
  ),
  requireVoiceTranscriptOwnership,
  permanentlyDeleteVoiceJournalAudio
);

export default router;