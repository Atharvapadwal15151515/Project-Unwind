import asyncHandler from "../../utils/asyncHandler.js";

import {
  createCustomPrompt,
  getPrompt,
  getSystemPrompts,
  getCustomPrompts,
  getPrompts,
  updateCustomPrompt,
  updateCustomPromptStatus,
  removeCustomPrompt,
  getRandomPrompt,
  getDailyPrompt,
  recordPromptShown,
  markPromptUsed,
  markLatestPromptUsed,
  getPromptHistory,
  removePromptHistory,
  getPromptStatistics,
  getPromptCategories
} from "../../services/journal/journalPrompt.service.js";

import {
  formatJournalPrompt,
  formatJournalPrompts,
  formatPromptHistory,
  formatPromptHistoryList,
  formatPromptStatistics,
  formatMostUsedPrompts
} from "../../utils/journal/journalPrompt.utils.js";

/*
  Return the authenticated user UUID.

  Different authentication middleware versions may
  use user_id, userId, or id.
*/
function getAuthenticatedUserId(req) {
  return (
    req.user?.user_id ||
    req.user?.userId ||
    req.user?.id
  );
}

/*
  POST /api/journal/prompts
*/
export const createCustomPromptController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const createdPrompt =
      await createCustomPrompt(
        userId,
        {
          promptText:
            req.body.promptText,

          promptCategory:
            req.body.promptCategory,

          isActive:
            req.body.isActive,

          displayOrder:
            req.body.displayOrder
        }
      );

    return res.status(201).json({
      success: true,
      message:
        "Custom journal prompt created successfully.",
      data: {
        prompt:
          formatJournalPrompt(
            createdPrompt
          )
      }
    });
  });

/*
  GET /api/journal/prompts/:promptId
*/
export const getPromptController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const prompt =
      await getPrompt(
        userId,
        req.params.promptId
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal prompt retrieved successfully.",
      data: {
        prompt:
          formatJournalPrompt(
            prompt
          )
      }
    });
  });

/*
  GET /api/journal/prompts/system
*/
export const getSystemPromptsController =
  asyncHandler(async (req, res) => {
    const {
      page,
      limit,
      category,
      search,
      isActive
    } = req.query;

    const result =
      await getSystemPrompts({
        page,
        limit,
        category,
        search,
        isActive
      });

    return res.status(200).json({
      success: true,
      message:
        "System journal prompts retrieved successfully.",
      data: {
        prompts:
          formatJournalPrompts(
            result.prompts
          ),

        pagination:
          result.pagination
      }
    });
  });

/*
  GET /api/journal/prompts/custom
*/
export const getCustomPromptsController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const {
      page,
      limit,
      category,
      search,
      isActive
    } = req.query;

    const result =
      await getCustomPrompts(
        userId,
        {
          page,
          limit,
          category,
          search,
          isActive
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Custom journal prompts retrieved successfully.",
      data: {
        prompts:
          formatJournalPrompts(
            result.prompts
          ),

        pagination:
          result.pagination
      }
    });
  });

/*
  GET /api/journal/prompts
*/
export const getPromptsController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const {
      page,
      limit,
      category,
      search,
      isActive
    } = req.query;

    const result =
      await getPrompts(
        userId,
        {
          page,
          limit,
          category,
          search,
          isActive
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal prompts retrieved successfully.",
      data: {
        prompts:
          formatJournalPrompts(
            result.prompts
          ),

        pagination:
          result.pagination
      }
    });
  });

/*
  PATCH /api/journal/prompts/:promptId
*/
export const updateCustomPromptController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const prompt =
      await updateCustomPrompt(
        userId,
        req.params.promptId,
        {
          promptText:
            req.body.promptText,

          promptCategory:
            req.body.promptCategory,

          isActive:
            req.body.isActive,

          displayOrder:
            req.body.displayOrder
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Custom journal prompt updated successfully.",
      data: {
        prompt:
          formatJournalPrompt(
            prompt
          )
      }
    });
  });

/*
  PATCH /api/journal/prompts/:promptId/status
*/
export const updateCustomPromptStatusController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const prompt =
      await updateCustomPromptStatus(
        userId,
        req.params.promptId,
        req.body.isActive
      );

    return res.status(200).json({
      success: true,
      message:
        req.body.isActive
          ? "Custom journal prompt activated successfully."
          : "Custom journal prompt deactivated successfully.",
      data: {
        prompt:
          formatJournalPrompt(
            prompt
          )
      }
    });
  });

/*
  DELETE /api/journal/prompts/:promptId
*/
export const removeCustomPromptController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const deletedPrompt =
      await removeCustomPrompt(
        userId,
        req.params.promptId
      );

    return res.status(200).json({
      success: true,
      message:
        "Custom journal prompt deleted successfully.",
      data: {
        prompt:
          formatJournalPrompt(
            deletedPrompt
          )
      }
    });
  });

/*
  GET /api/journal/prompts/random
*/
export const getRandomPromptController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const result =
      await getRandomPrompt(
        userId,
        {
          category:
            req.query.category,

          recentDays:
            req.query.recentDays
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Random journal prompt retrieved successfully.",
      data: {
        prompt:
          formatJournalPrompt(
            result.prompt
          ),

        promptHistory:
          formatPromptHistory(
            result.history
          )
      }
    });
  });

/*
  GET /api/journal/prompts/daily
*/
export const getDailyPromptController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const result =
      await getDailyPrompt(
        userId,
        {
          category:
            req.query.category,

          recentDays:
            req.query.recentDays
        }
      );

    return res.status(200).json({
      success: true,
      message:
        result.alreadyShownToday
          ? "Today's journal prompt retrieved successfully."
          : "Daily journal prompt retrieved successfully.",
      data: {
        prompt:
          formatJournalPrompt(
            result.prompt
          ),

        promptHistory:
          formatPromptHistory(
            result.history
          ),

        alreadyShownToday:
          result.alreadyShownToday
      }
    });
  });

/*
  POST /api/journal/prompts/:promptId/shown
*/
export const recordPromptShownController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const history =
      await recordPromptShown(
        userId,
        req.params.promptId
      );

    return res.status(201).json({
      success: true,
      message:
        "Journal prompt display recorded successfully.",
      data: {
        promptHistory:
          formatPromptHistory(
            history
          )
      }
    });
  });

/*
  PATCH /api/journal/prompts/history/:promptHistoryId/use
*/
export const markPromptUsedController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const history =
      await markPromptUsed(
        userId,
        req.params.promptHistoryId,
        {
          entryId:
            req.body.entryId,

          usedAt:
            req.body.usedAt
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal prompt marked as used successfully.",
      data: {
        promptHistory:
          formatPromptHistory(
            history
          )
      }
    });
  });

/*
  PATCH /api/journal/prompts/:promptId/use-latest
*/
export const markLatestPromptUsedController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const history =
      await markLatestPromptUsed(
        userId,
        req.params.promptId,
        {
          entryId:
            req.body.entryId,

          usedAt:
            req.body.usedAt
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Latest journal prompt history marked as used successfully.",
      data: {
        promptHistory:
          formatPromptHistory(
            history
          )
      }
    });
  });

/*
  GET /api/journal/prompts/history
*/
export const getPromptHistoryController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const {
      page,
      limit,
      promptId,
      entryId,
      wasUsed,
      fromDate,
      toDate
    } = req.query;

    const result =
      await getPromptHistory(
        userId,
        {
          page,
          limit,
          promptId,
          entryId,
          wasUsed,
          fromDate,
          toDate
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal prompt history retrieved successfully.",
      data: {
        promptHistory:
          formatPromptHistoryList(
            result.history
          ),

        pagination:
          result.pagination
      }
    });
  });

/*
  DELETE /api/journal/prompts/history/:promptHistoryId
*/
export const removePromptHistoryController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const deletedHistory =
      await removePromptHistory(
        userId,
        req.params.promptHistoryId
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal prompt history deleted successfully.",
      data: {
        promptHistory:
          formatPromptHistory(
            deletedHistory
          )
      }
    });
  });

/*
  GET /api/journal/prompts/statistics
*/
export const getPromptStatisticsController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const {
      fromDate,
      toDate,
      limit
    } = req.query;

    const result =
      await getPromptStatistics(
        userId,
        {
          fromDate,
          toDate,
          limit
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal prompt statistics retrieved successfully.",
      data: {
        statistics:
          formatPromptStatistics(
            result.statistics
          ),

        mostUsedPrompts:
          formatMostUsedPrompts(
            result.mostUsedPrompts
          )
      }
    });
  });

/*
  GET /api/journal/prompts/categories
*/
export const getPromptCategoriesController =
  asyncHandler(async (req, res) => {
    const userId =
      getAuthenticatedUserId(req);

    const categories =
      await getPromptCategories(
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Journal prompt categories retrieved successfully.",
      data: {
        categories
      }
    });
  });