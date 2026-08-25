import pool from "../../config/database.js";

import AppError from "../../utils/AppError.js";

import {
  createJournalPrompt,
  getAccessibleJournalPromptById,
  getOwnedJournalPromptById,
  getSystemJournalPrompts,
  getUserJournalPrompts,
  getAvailableJournalPrompts,
  countAvailableJournalPrompts,
  getRandomJournalPrompt,
  getDailyJournalPrompt,
  updateJournalPrompt,
  setJournalPromptActiveStatus,
  deleteJournalPrompt,
  getJournalPromptCategories
} from "../../models/journal/journalPrompt.model.js";

import {
  createJournalPromptHistory,
  getOwnedJournalPromptHistoryById,
  getUserJournalPromptHistory,
  countUserJournalPromptHistory,
  markJournalPromptHistoryAsUsed,
  markLatestJournalPromptAsUsed,
  getRecentlyShownPromptIds,
  getJournalPromptUsageStatistics,
  getMostUsedJournalPrompts,
  deleteJournalPromptHistory
} from "../../models/journal/journalPromptHistory.model.js";

import {
  getJournalEntryByIdAndUserId
} from "../../models/journal/journalEntry.model.js";

/*
  Normalize pagination values before passing them
  to the model.
*/
function normalizePagination(
  filters = {}
) {
  const requestedLimit =
    Number(filters.limit) || 20;

  const limit = Math.min(
    Math.max(requestedLimit, 1),
    100
  );

  const requestedPage =
    Number(filters.page) || 1;

  const page = Math.max(
    requestedPage,
    1
  );

  const offset =
    (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
}

/*
  Build a consistent pagination response.
*/
function buildPagination({
  page,
  limit,
  total
}) {
  return {
    page,
    limit,
    total,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(
            total / limit
          )
  };
}

/*
  Ensure a prompt is accessible to the user.

  Accessible prompts include:
  - active system prompts
  - the user's own active prompts
*/
async function requireAccessiblePrompt(
  userId,
  promptId,
  client = null
) {
  const prompt =
    await getAccessibleJournalPromptById(
      promptId,
      userId,
      client
    );

  if (!prompt) {
    throw new AppError(
      "Journal prompt not found",
      404
    );
  }

  if (!prompt.is_active) {
    throw new AppError(
      "This journal prompt is inactive",
      400
    );
  }

  return prompt;
}

/*
  Ensure a custom prompt belongs to the user.

  System prompts cannot be edited or deleted
  through user endpoints.
*/
async function requireOwnedPrompt(
  userId,
  promptId,
  client = null
) {
  const prompt =
    await getOwnedJournalPromptById(
      promptId,
      userId,
      client
    );

  if (!prompt) {
    throw new AppError(
      "Custom journal prompt not found",
      404
    );
  }

  return prompt;
}

/*
  Ensure a journal entry belongs to the user.
*/
async function requireJournalEntry(
  userId,
  entryId,
  client = null
) {
  const entry =
    await getJournalEntryByIdAndUserId(
      entryId,
      userId,
      {
        includeDeleted: false
      },
      client
    );

  if (!entry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return entry;
}

/*
  Create a user-owned custom prompt.
*/
export async function createCustomPrompt(
  userId,
  promptData
) {
  const promptText =
    promptData.promptText?.trim();

  if (!promptText) {
    throw new AppError(
      "Prompt text is required",
      400
    );
  }

  return createJournalPrompt({
    userId,
    promptText,
    promptCategory:
      promptData.promptCategory ||
      "daily_reflection",
    isSystem: false,
    isActive:
      promptData.isActive !== false,
    displayOrder:
      Number(
        promptData.displayOrder
      ) || 0
  });
}

/*
  Return one prompt accessible to the user.
*/
export async function getPrompt(
  userId,
  promptId
) {
  return requireAccessiblePrompt(
    userId,
    promptId
  );
}

/*
  Return active system prompts.
*/
export async function getSystemPrompts(
  filters = {}
) {
  const {
    page,
    limit,
    offset
  } = normalizePagination(filters);

  const prompts =
    await getSystemJournalPrompts({
      category:
        filters.category || null,

      search:
        filters.search?.trim() ||
        null,

      isActive:
        filters.isActive !==
          undefined
          ? filters.isActive
          : true,

      limit,
      offset
    });

  return {
    prompts,
    pagination: {
      page,
      limit
    }
  };
}

/*
  Return custom prompts created by the user.
*/
export async function getCustomPrompts(
  userId,
  filters = {}
) {
  const {
    page,
    limit,
    offset
  } = normalizePagination(filters);

  const prompts =
    await getUserJournalPrompts(
      userId,
      {
        category:
          filters.category ||
          null,

        search:
          filters.search?.trim() ||
          null,

        isActive:
  filters.isActive !== undefined
    ? filters.isActive
    : null,

        limit,
        offset
      }
    );

  return {
    prompts,
    pagination: {
      page,
      limit
    }
  };
}

/*
  Return both system prompts and the user's custom
  prompts with pagination.
*/
export async function getPrompts(
  userId,
  filters = {}
) {
  const {
    page,
    limit,
    offset
  } = normalizePagination(filters);

  const modelFilters = {
    category:
      filters.category || null,

    search:
      filters.search?.trim() ||
      null,

    limit,
    offset
  };

  const [
    prompts,
    total
  ] = await Promise.all([
    getAvailableJournalPrompts(
      userId,
      modelFilters
    ),

    countAvailableJournalPrompts(
      userId,
      {
        category:
          modelFilters.category,

        search:
          modelFilters.search
      }
    )
  ]);

  return {
    prompts,
    pagination:
      buildPagination({
        page,
        limit,
        total
      })
  };
}

/*
  Select a random prompt.

  Prompts shown during the recent period are
  excluded where possible. If every available
  prompt was recently shown, the service retries
  without exclusions.
*/
export async function getRandomPrompt(
  userId,
  options = {}
) {
  const recentDays = Math.min(
    Math.max(
      Number(options.recentDays) ||
        14,
      1
    ),
    365
  );

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const excludedPromptIds =
      await getRecentlyShownPromptIds(
        userId,
        {
          days: recentDays,

          category:
            options.category ||
            null,

          limit: 500
        },
        client
      );

    let prompt =
      await getRandomJournalPrompt(
        userId,
        {
          category:
            options.category ||
            null,

          excludedPromptIds
        },
        client
      );

    /*
      When all prompts were recently shown, allow
      repetition instead of returning no result.
    */
    if (!prompt) {
      prompt =
        await getRandomJournalPrompt(
          userId,
          {
            category:
              options.category ||
              null,

            excludedPromptIds: []
          },
          client
        );
    }

    if (!prompt) {
      throw new AppError(
        "No journal prompts are currently available",
        404
      );
    }

    const history =
      await createJournalPromptHistory(
        {
          userId,
          promptId:
            prompt.prompt_id
        },
        client
      );

    await client.query("COMMIT");

    return {
      prompt,
      history
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Select a stable daily prompt.

  The model uses the prompt ID, user ID and current
  date to select the same prompt throughout one day.
*/
export async function getDailyPrompt(
  userId,
  options = {}
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    /*
      Exclude prompts shown recently, except today's
      already-selected daily prompt may need to be
      returned consistently.

      We first inspect today's prompt history.
    */
    const todayStart =
      new Date();

    todayStart.setHours(
      0,
      0,
      0,
      0
    );

    const tomorrowStart =
      new Date(todayStart);

    tomorrowStart.setDate(
      tomorrowStart.getDate() + 1
    );

    const todayHistory =
      await getUserJournalPromptHistory(
        userId,
        {
          fromDate: todayStart,
          toDate: tomorrowStart,
          limit: 1,
          offset: 0
        },
        client
      );

    if (
      todayHistory.length > 0
    ) {
      const existing =
        todayHistory[0];

      await client.query(
        "COMMIT"
      );

      return {
        prompt: {
          prompt_id:
            existing.prompt_id,

          prompt_text:
            existing.prompt_text,

          prompt_category:
            existing.prompt_category,

          is_system:
            existing.is_system,

          is_active:
            existing.is_active
        },

        history: existing,

        alreadyShownToday: true
      };
    }

    const recentDays = Math.min(
      Math.max(
        Number(
          options.recentDays
        ) || 14,
        1
      ),
      365
    );

    const excludedPromptIds =
      await getRecentlyShownPromptIds(
        userId,
        {
          days: recentDays,

          category:
            options.category ||
            null,

          limit: 500
        },
        client
      );

    let prompt =
      await getDailyJournalPrompt(
        userId,
        {
          category:
            options.category ||
            null,

          excludedPromptIds
        },
        client
      );

    if (!prompt) {
      prompt =
        await getDailyJournalPrompt(
          userId,
          {
            category:
              options.category ||
              null,

            excludedPromptIds: []
          },
          client
        );
    }

    if (!prompt) {
      throw new AppError(
        "No journal prompts are currently available",
        404
      );
    }

    const history =
      await createJournalPromptHistory(
        {
          userId,
          promptId:
            prompt.prompt_id
        },
        client
      );

    await client.query("COMMIT");

    return {
      prompt,
      history,
      alreadyShownToday: false
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Record that a specific prompt was shown.

  This is useful when the frontend chooses a prompt
  from the prompt list instead of using the random
  or daily endpoint.
*/
export async function recordPromptShown(
  userId,
  promptId
) {
  await requireAccessiblePrompt(
    userId,
    promptId
  );

  return createJournalPromptHistory({
    userId,
    promptId
  });
}

/*
  Mark one history record as used and optionally
  connect it to a journal entry.
*/
export async function markPromptUsed(
  userId,
  promptHistoryId,
  data = {}
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const history =
      await getOwnedJournalPromptHistoryById(
        promptHistoryId,
        userId,
        client
      );

    if (!history) {
      throw new AppError(
        "Journal prompt history not found",
        404
      );
    }

    if (data.entryId) {
      await requireJournalEntry(
        userId,
        data.entryId,
        client
      );
    }

    if (
      history.was_used === true
    ) {
      await client.query(
        "COMMIT"
      );

      return history;
    }

    const updatedHistory =
      await markJournalPromptHistoryAsUsed(
        promptHistoryId,
        userId,
        {
          entryId:
            data.entryId ||
            null,

          usedAt:
            data.usedAt ||
            null
        },
        client
      );

    if (!updatedHistory) {
      throw new AppError(
        "Journal prompt history could not be updated",
        400
      );
    }

    await client.query("COMMIT");

    return updatedHistory;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Mark the most recently shown unused history record
  for a prompt as used.
*/
export async function markLatestPromptUsed(
  userId,
  promptId,
  data = {}
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    await requireAccessiblePrompt(
      userId,
      promptId,
      client
    );

    if (data.entryId) {
      await requireJournalEntry(
        userId,
        data.entryId,
        client
      );
    }

    const history =
      await markLatestJournalPromptAsUsed(
        userId,
        promptId,
        {
          entryId:
            data.entryId ||
            null,

          usedAt:
            data.usedAt ||
            null
        },
        client
      );

    if (!history) {
      throw new AppError(
        "No unused prompt history record was found",
        404
      );
    }

    await client.query("COMMIT");

    return history;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
  Return paginated prompt history.
*/
export async function getPromptHistory(
  userId,
  filters = {}
) {
  const {
    page,
    limit,
    offset
  } = normalizePagination(filters);

  const historyFilters = {
    promptId:
      filters.promptId ||
      null,

    entryId:
      filters.entryId ||
      null,

    wasUsed:
      filters.wasUsed !==
        undefined
        ? filters.wasUsed
        : null,

    fromDate:
      filters.fromDate ||
      null,

    toDate:
      filters.toDate ||
      null,

    limit,
    offset
  };

  const [
    history,
    total
  ] = await Promise.all([
    getUserJournalPromptHistory(
      userId,
      historyFilters
    ),

    countUserJournalPromptHistory(
      userId,
      historyFilters
    )
  ]);

  return {
    history,
    pagination:
      buildPagination({
        page,
        limit,
        total
      })
  };
}

/*
  Return prompt usage analytics.
*/
export async function getPromptStatistics(
  userId,
  filters = {}
) {
  const [
    statistics,
    mostUsedPrompts
  ] = await Promise.all([
    getJournalPromptUsageStatistics(
      userId,
      {
        fromDate:
          filters.fromDate ||
          null,

        toDate:
          filters.toDate ||
          null
      }
    ),

    getMostUsedJournalPrompts(
      userId,
      {
        limit: Math.min(
          Math.max(
            Number(filters.limit) ||
              10,
            1
          ),
          50
        ),

        fromDate:
          filters.fromDate ||
          null,

        toDate:
          filters.toDate ||
          null
      }
    )
  ]);

  return {
    statistics,
    mostUsedPrompts
  };
}

/*
  Update a custom prompt.
*/
export async function updateCustomPrompt(
  userId,
  promptId,
  promptData
) {
  await requireOwnedPrompt(
    userId,
    promptId
  );

  const updatedPrompt =
    await updateJournalPrompt(
      promptId,
      userId,
      {
        promptText:
          promptData.promptText !==
            undefined
            ? promptData.promptText.trim()
            : undefined,

        promptCategory:
          promptData.promptCategory,

        isActive:
          promptData.isActive,

        displayOrder:
          promptData.displayOrder
      }
    );

  if (!updatedPrompt) {
    throw new AppError(
      "Custom journal prompt could not be updated",
      400
    );
  }

  return updatedPrompt;
}

/*
  Activate or deactivate a custom prompt.
*/
export async function updateCustomPromptStatus(
  userId,
  promptId,
  isActive
) {
  await requireOwnedPrompt(
    userId,
    promptId
  );

  const prompt =
    await setJournalPromptActiveStatus(
      promptId,
      userId,
      isActive
    );

  if (!prompt) {
    throw new AppError(
      "Custom journal prompt could not be updated",
      400
    );
  }

  return prompt;
}

/*
  Permanently delete a user-owned prompt.

  ON DELETE CASCADE removes its prompt-history
  records. Journal entry prompt_id references should
  use ON DELETE SET NULL, while the snapshot remains.
*/
export async function removeCustomPrompt(
  userId,
  promptId
) {
  await requireOwnedPrompt(
    userId,
    promptId
  );

  const deletedPrompt =
    await deleteJournalPrompt(
      promptId,
      userId
    );

  if (!deletedPrompt) {
    throw new AppError(
      "Custom journal prompt not found",
      404
    );
  }

  return deletedPrompt;
}

/*
  Delete one owned prompt-history record.
*/
export async function removePromptHistory(
  userId,
  promptHistoryId
) {
  const history =
    await getOwnedJournalPromptHistoryById(
      promptHistoryId,
      userId
    );

  if (!history) {
    throw new AppError(
      "Journal prompt history not found",
      404
    );
  }

  const deletedHistory =
    await deleteJournalPromptHistory(
      promptHistoryId,
      userId
    );

  if (!deletedHistory) {
    throw new AppError(
      "Journal prompt history could not be deleted",
      400
    );
  }

  return deletedHistory;
}

/*
  Return available categories with prompt counts.
*/
export async function getPromptCategories(
  userId
) {
  return getJournalPromptCategories(
    userId
  );
}