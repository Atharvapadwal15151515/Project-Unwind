import { Router } from "express";

import energyTrackerRoutes from "./energyTracker.routes.js";
import habitLogRoutes from "./habitLog.routes.js";
import habitTrackerRoutes from "./habitTracker.routes.js";
import moodTrackerRoutes from "./moodTracker.routes.js";
import sleepTrackerRoutes from "./sleepTracker.routes.js";
import trackerMetadataRoutes from "./trackerMetadata.routes.js";
import trackerReminderRoutes from "./trackerReminder.routes.js";
import trackerSettingsRoutes from "./trackerSettings.routes.js";
import waterTrackerRoutes from "./waterTracker.routes.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Tracker Module
|--------------------------------------------------------------------------
|
| Base URL:
| /api/trackers
|
| Child Routes:
| /mood
| /sleep
| /habits
| /energy
| /water
| /settings
| /metadata
| /reminders
|
*/

router.use(
  "/metadata",
  trackerMetadataRoutes
);

router.use(
  "/settings",
  trackerSettingsRoutes
);

router.use(
  "/reminders",
  trackerReminderRoutes
);

router.use(
  "/mood",
  moodTrackerRoutes
);

router.use(
  "/sleep",
  sleepTrackerRoutes
);

router.use(
  "/habits",
  habitTrackerRoutes
);

router.use(
  "/habits/:habitId/logs",
  habitLogRoutes
);

router.use(
  "/energy",
  energyTrackerRoutes
);

router.use(
  "/water",
  waterTrackerRoutes
);

export default router;
