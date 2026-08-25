import express
  from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  requireAdmin
} from "../../middleware/admin/requireAdmin.js";

import {
  requireAdminAccess
} from "../../middleware/admin/requireAdminAccess.js";

import {
  adminReadLimiter,
  adminActionLimiter
} from "../../middleware/rateLimiter.js";

import {
  createLongSuspensionProposalController,
  createPermanentBanProposalController,
  getModerationProposalsController,
  getModerationProposalController,
  approveModerationProposalController,
  rejectModerationProposalController
} from "../../controllers/admin/adminModerationDecision.controller.js";


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| Protection
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

router.use(
  requireAdmin
);

router.use(
  requireAdminAccess
);


/*
|--------------------------------------------------------------------------
| Moderation Decision Center
|--------------------------------------------------------------------------
*/


/*
|----------------------------------------------------------------------
| List proposals
|----------------------------------------------------------------------
|
| GET /api/admin/moderation-decisions
|
| Optional query:
| ?status=pending
| ?actionType=long_suspension
| ?limit=50
| ?offset=0
|
*/

router.get(
  "/",
  adminReadLimiter,
  getModerationProposalsController
);


/*
|----------------------------------------------------------------------
| Get one proposal
|----------------------------------------------------------------------
|
| GET /api/admin/moderation-decisions/:proposalId
|
*/

router.get(
  "/:proposalId",
  adminReadLimiter,
  getModerationProposalController
);


/*
|----------------------------------------------------------------------
| Create long suspension proposal
|----------------------------------------------------------------------
|
| POST /api/admin/moderation-decisions/users/:userId/suspension
|
| Body:
| {
|   "reason": "...",
|   "durationMinutes": 20160
| }
|
| Must exceed 7 days.
|
*/

router.post(
  "/users/:userId/suspension",
  adminActionLimiter,
  createLongSuspensionProposalController
);


/*
|----------------------------------------------------------------------
| Create permanent ban proposal
|----------------------------------------------------------------------
|
| POST /api/admin/moderation-decisions/users/:userId/ban
|
| Body:
| {
|   "reason": "..."
| }
|
*/

router.post(
  "/users/:userId/ban",
  adminActionLimiter,
  createPermanentBanProposalController
);


/*
|----------------------------------------------------------------------
| Approve + digitally sign
|----------------------------------------------------------------------
|
| POST /api/admin/moderation-decisions/:proposalId/approve
|
*/

router.post(
  "/:proposalId/approve",
  adminActionLimiter,
  approveModerationProposalController
);


/*
|----------------------------------------------------------------------
| Reject + digitally sign
|----------------------------------------------------------------------
|
| POST /api/admin/moderation-decisions/:proposalId/reject
|
*/

router.post(
  "/:proposalId/reject",
  adminActionLimiter,
  rejectModerationProposalController
);


export default router;