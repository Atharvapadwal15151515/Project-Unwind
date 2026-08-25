import {
  getJournalMetadata,
  getJournalEmotions,
  getJournalTags,
  createJournalTag,
  updateJournalTag,
  deleteJournalTag,
  getJournalActivities,
  createJournalActivity,
  updateJournalActivity,
  deleteJournalActivity
} from "../../services/journal/journalMetadata.service.js";

function getAuthenticatedUserId(req) {
  return (
    req.user?.user_id ||
    req.user?.userId ||
    req.user?.id
  );
}

// =========================================================
// COMBINED METADATA
// =========================================================

export async function getJournalMetadataController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const metadata =
      await getJournalMetadata(
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal metadata fetched successfully",
      data: metadata
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// EMOTIONS
// =========================================================

export async function getJournalEmotionsController(
  req,
  res,
  next
) {
  try {
    const emotions =
      await getJournalEmotions();

    return res.status(200).json({
      success: true,
      message:
        "Journal emotions fetched successfully",
      data: {
        emotions
      }
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// TAGS
// =========================================================

export async function getJournalTagsController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const tags =
      await getJournalTags(
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal tags fetched successfully",
      data: {
        tags
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createJournalTagController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const {
      tagName
    } = req.body;

    const tag =
      await createJournalTag({
        userId,
        tagName
      });

    return res.status(201).json({
      success: true,
      message:
        "Journal tag created successfully",
      data: {
        tag
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJournalTagController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const {
      tagId
    } = req.params;

    const {
      tagName
    } = req.body;

    const tag =
      await updateJournalTag({
        userId,
        tagId,
        tagName
      });

    return res.status(200).json({
      success: true,
      message:
        "Journal tag updated successfully",
      data: {
        tag
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteJournalTagController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const {
      tagId
    } = req.params;

    const tag =
      await deleteJournalTag({
        userId,
        tagId
      });

    return res.status(200).json({
      success: true,
      message:
        "Journal tag deleted successfully",
      data: {
        tag
      }
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// ACTIVITIES
// =========================================================

export async function getJournalActivitiesController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const activities =
      await getJournalActivities(
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal activities fetched successfully",
      data: {
        activities
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createJournalActivityController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const {
      activityName
    } = req.body;

    const activity =
      await createJournalActivity({
        userId,
        activityName
      });

    return res.status(201).json({
      success: true,
      message:
        "Journal activity created successfully",
      data: {
        activity
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJournalActivityController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const {
      activityId
    } = req.params;

    const {
      activityName
    } = req.body;

    const activity =
      await updateJournalActivity({
        userId,
        activityId,
        activityName
      });

    return res.status(200).json({
      success: true,
      message:
        "Journal activity updated successfully",
      data: {
        activity
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteJournalActivityController(
  req,
  res,
  next
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const {
      activityId
    } = req.params;

    const activity =
      await deleteJournalActivity({
        userId,
        activityId
      });

    return res.status(200).json({
      success: true,
      message:
        "Journal activity deleted successfully",
      data: {
        activity
      }
    });
  } catch (error) {
    next(error);
  }
}