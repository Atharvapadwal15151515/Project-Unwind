import { Router } from "express";

import journalEntryRoutes from "./journalEntry.routes.js";
import journalAttachmentRoutes from "./journalAttachment.routes.js";
import journalPromptRoutes from "./journalPrompt.routes.js";
import journalVoiceRoutes from "./journalVoice.routes.js";
import journalSecurityRoutes from "./journalSecurity.routes.js";
import journalSearchRoutes from "./journalSearch.routes.js";
import journalPdfExportRoutes from "./journalPdfExport.routes.js";
import journalMetadataRoutes from "./journalMetadata.routes.js";



const router = Router();

router.use(
  "/metadata",
  journalMetadataRoutes
);

router.use(
  "/entries",
  journalEntryRoutes
);

router.use(
  "/attachments",
  journalAttachmentRoutes
);

router.use(
  "/prompts",
  journalPromptRoutes
);

router.use(
  "/voice",
  journalVoiceRoutes
);

router.use(
  "/security",
  journalSecurityRoutes
);

router.use(
  "/search",
  journalSearchRoutes
);

router.use(
  "/export",
  journalPdfExportRoutes
);

export default router;