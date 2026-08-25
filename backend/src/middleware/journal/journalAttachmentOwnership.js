import {
  getOwnedJournalAttachmentById,
  getActiveJournalAttachmentById,
  getDeletedJournalAttachmentById
} from "../../models/journal/journalAttachment.model.js";

function getAuthenticatedUserId(req) {
  return (
    req.user?.user_id ||
    req.user?.userId ||
    req.user?.id ||
    null
  );
}

function getAttachmentId(req) {
  return (
    req.params?.attachmentId ||
    req.body?.attachmentId ||
    null
  );
}

/*
  Confirms that the attachment belongs to the
  authenticated user.

  This includes both active and soft-deleted
  attachments.
*/
export async function requireJournalAttachmentOwnership(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const attachmentId =
      getAttachmentId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication is required."
      });
    }

    if (!attachmentId) {
      return res.status(400).json({
        success: false,
        message:
          "Journal attachment ID is required."
      });
    }

    const attachment =
      await getOwnedJournalAttachmentById(
        attachmentId,
        userId
      );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message:
          "Journal attachment not found."
      });
    }

    req.journalAttachment =
      attachment;

    next();
  } catch (error) {
    next(error);
  }
}

/*
  Confirms that an active attachment belongs to the
  authenticated user.

  Use for:
  - get attachment
  - update attachment
  - set cover
  - remove cover
  - soft delete
  - processing-status updates
*/
export async function requireActiveJournalAttachmentOwnership(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const attachmentId =
      getAttachmentId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication is required."
      });
    }

    if (!attachmentId) {
      return res.status(400).json({
        success: false,
        message:
          "Journal attachment ID is required."
      });
    }

    const attachment =
      await getActiveJournalAttachmentById(
        attachmentId,
        userId
      );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message:
          "Active journal attachment not found."
      });
    }

    req.journalAttachment =
      attachment;

    next();
  } catch (error) {
    next(error);
  }
}

/*
  Confirms that a soft-deleted attachment belongs
  to the authenticated user.

  Use for:
  - restore
  - permanent delete
*/
export async function requireDeletedJournalAttachmentOwnership(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const attachmentId =
      getAttachmentId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication is required."
      });
    }

    if (!attachmentId) {
      return res.status(400).json({
        success: false,
        message:
          "Journal attachment ID is required."
      });
    }

    const attachment =
      await getDeletedJournalAttachmentById(
        attachmentId,
        userId
      );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message:
          "Deleted journal attachment not found."
      });
    }

    req.journalAttachment =
      attachment;

    next();
  } catch (error) {
    next(error);
  }
}

/*
  Confirms that an attachment belongs to the journal
  entry supplied in the route.

  Example route:
  /entries/:entryId/attachments/:attachmentId
*/
export function requireAttachmentEntryMatch(
  req,
  res,
  next
) {
  const attachment =
    req.journalAttachment;

  const entryId =
    req.params?.entryId;

  if (!attachment) {
    return res.status(500).json({
      success: false,
      message:
        "Journal attachment ownership middleware must run first."
    });
  }

  if (
    entryId &&
    attachment.entry_id !== entryId
  ) {
    return res.status(404).json({
      success: false,
      message:
        "The attachment does not belong to this journal entry."
    });
  }

  next();
}