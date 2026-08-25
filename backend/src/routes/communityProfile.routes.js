import express from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  selectIdentity,
  getMyCommunityProfile
} from "../controllers/community/communityProfile.controller.js";

import { selectIdentitySchema } from "../validators/communityProfile.validator.js";

const router = express.Router();

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors
      });
    }

    req.body = result.data;
    next();
  };
}

router.get(
  "/me",
  authenticate,
  getMyCommunityProfile
);

router.post(
  "/identity",
  authenticate,
  validate(selectIdentitySchema),
  selectIdentity
);

export default router;