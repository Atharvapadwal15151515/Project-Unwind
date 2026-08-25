import api from "./api";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function resolvePromptId(promptOrId) {
  if (
    typeof promptOrId === "string"
  ) {
    return promptOrId;
  }

  return (
    promptOrId?.promptId ||
    promptOrId?.prompt_id
  );
}

function promptPath(
  promptOrId,
  suffix = ""
) {
  const promptId =
    resolvePromptId(promptOrId);

  if (!promptId) {
    throw new Error(
      "Journal prompt ID is missing."
    );
  }

  return `/journal/prompts/${promptId}${suffix}`;
}

/*
|--------------------------------------------------------------------------
| Prompt Collections
|--------------------------------------------------------------------------
*/

export async function getJournalPrompts(
  filters = {}
) {
  const response = await api.get(
    "/journal/prompts",
    {
      params: filters
    }
  );

  return (
    response.data?.data || {
      prompts: [],
      pagination: null
    }
  );
}

export async function getSystemJournalPrompts(
  filters = {}
) {
  const response = await api.get(
    "/journal/prompts/system",
    {
      params: filters
    }
  );

  return (
    response.data?.data || {
      prompts: [],
      pagination: null
    }
  );
}

export async function getCustomJournalPrompts(
  filters = {}
) {
  const response = await api.get(
    "/journal/prompts/custom",
    {
      params: filters
    }
  );

  return (
    response.data?.data || {
      prompts: [],
      pagination: null
    }
  );
}

/*
|--------------------------------------------------------------------------
| Individual Prompt
|--------------------------------------------------------------------------
*/

export async function getJournalPrompt(
  promptOrId
) {
  const response = await api.get(
    promptPath(promptOrId)
  );

  return (
    response.data?.data?.prompt ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Custom Prompt CRUD
|--------------------------------------------------------------------------
*/

export async function createCustomJournalPrompt(
  payload
) {
  const response = await api.post(
    "/journal/prompts",
    payload
  );

  return (
    response.data?.data?.prompt ||
    null
  );
}

export async function updateCustomJournalPrompt(
  promptOrId,
  payload
) {
  const response = await api.patch(
    promptPath(promptOrId),
    payload
  );

  return (
    response.data?.data?.prompt ||
    null
  );
}

export async function updateCustomJournalPromptStatus(
  promptOrId,
  isActive
) {
  const response = await api.patch(
    promptPath(
      promptOrId,
      "/status"
    ),
    {
      isActive
    }
  );

  return (
    response.data?.data?.prompt ||
    null
  );
}

export async function deleteCustomJournalPrompt(
  promptOrId
) {
  const response = await api.delete(
    promptPath(promptOrId)
  );

  return (
    response.data?.data?.prompt ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Daily / Random
|--------------------------------------------------------------------------
*/

export async function getRandomJournalPrompt(
  filters = {}
) {
  const response = await api.get(
    "/journal/prompts/random",
    {
      params: filters
    }
  );

  return (
    response.data?.data || {
      prompt: null,
      promptHistory: null
    }
  );
}

/*
|--------------------------------------------------------------------------
| Prompt History
|--------------------------------------------------------------------------
*/

export async function recordJournalPromptShown(
  promptOrId
) {
  const response = await api.post(
    promptPath(
      promptOrId,
      "/shown"
    ),
    {}
  );

  return (
    response.data?.data
      ?.promptHistory ||
    null
  );
}

export async function markLatestJournalPromptUsed(
  promptOrId,
  entryId
) {
  const response = await api.patch(
    promptPath(
      promptOrId,
      "/use-latest"
    ),
    {
      entryId
    }
  );

  return (
    response.data?.data
      ?.promptHistory ||
    null
  );
}

export async function getJournalPromptHistory(
  filters = {}
) {
  const response = await api.get(
    "/journal/prompts/history",
    {
      params: filters
    }
  );

  return (
    response.data?.data || {
      promptHistory: [],
      pagination: null
    }
  );
}

export async function deleteJournalPromptHistory(
  promptHistoryId
) {
  const response = await api.delete(
    `/journal/prompts/history/${promptHistoryId}`
  );

  return (
    response.data?.data
      ?.promptHistory ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

export async function getJournalPromptCategories() {
  const response = await api.get(
    "/journal/prompts/categories"
  );

  return (
    response.data?.data
      ?.categories ||
    []
  );
}

/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

export async function getJournalPromptStatistics(
  filters = {}
) {
  const response = await api.get(
    "/journal/prompts/statistics",
    {
      params: filters
    }
  );

  return (
    response.data?.data || {
      statistics: null,
      mostUsedPrompts: []
    }
  );
}