import { Router } from "express";

import journalEntryRoutes from "./journalEntry.routes.js";
import journalMetadataRoutes from "./journalMetadata.routes.js";
import journalVoiceRoutes from "./journalVoice.routes.js";
const router = Router();

/*
|--------------------------------------------------------------------------
| Journal Module
|--------------------------------------------------------------------------
|
| Base URL:
| /api/journal
|
| Child Routes:
| /entries
|
*/
router.use(
  "/metadata",
  journalMetadataRoutes
);
router.use(
  "/entries",
  journalEntryRoutes
);

router.use(
  "/voice",
  journalVoiceRoutes
);

export default router;