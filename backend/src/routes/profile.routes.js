import express from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  uploadProfileImage
} from "../middleware/upload.js";

import {
  uploadProfilePicture,
  removeProfilePicture,
  updateProfileController
} from "../controllers/profile.controller.js";

import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/profile.validator.js";


const router = express.Router();


router.patch(
  "/",
  authenticate,
  validate(updateProfileSchema),
  updateProfileController
);


router.patch(
  "/picture",
  authenticate,
  uploadProfileImage,
  uploadProfilePicture
);

router.delete(
  "/picture",
  authenticate,
  removeProfilePicture
);

export default router;