/*
  Journal Entry Utilities

  These utilities handle:
  - Query parameter conversion
  - Pagination normalization
  - Boolean conversion
  - Text cleanup
  - Duplicate UUID removal
  - Journal filter construction
*/

/*
  Convert a query parameter into a boolean.

  Accepted true values:
  true
  "true"
  "1"

  Accepted false values:
  false
  "false"
  "0"

  Any other value returns undefined.
*/
export function parseBooleanQuery(
  value
) {
  if (
    value === true ||
    value === "true" ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === "0"
  ) {
    return false;
  }

  return undefined;
}

/*
  Convert a value into a positive integer.

  When conversion fails, the supplied fallback
  value is returned.
*/
export function parsePositiveInteger(
  value,
  fallback
) {
  const parsedValue =
    Number.parseInt(value, 10);

  if (
    Number.isNaN(parsedValue) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return parsedValue;
}

/*
  Remove duplicate IDs while preserving their
  original order.
*/
export function normalizeIdArray(
  ids = []
) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return [
    ...new Set(ids)
  ];
}

/*
  Trim optional text.

  Empty strings are converted to null so the
  database does not store meaningless whitespace.
*/
export function normalizeOptionalText(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue =
    String(value).trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

/*
  Normalize the content field without aggressively
  trimming internal formatting.

  Journal content may contain paragraphs and line
  breaks, so only fully blank content becomes null.
*/
export function normalizeJournalContent(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const stringValue =
    String(value);

  return stringValue.trim().length > 0
    ? stringValue
    : null;
}

/*
  Build the filters passed from the controller to
  journalEntry.service.js.

  This creates one predictable filter object for:
  - Main entry list
  - Draft list
  - Favourite list
  - Archived list
  - Deleted list
*/
export function buildJournalEntryFilters(
  query = {}
) {
  const page =
    parsePositiveInteger(
      query.page,
      1
    );

  const requestedLimit =
    parsePositiveInteger(
      query.limit,
      20
    );

  const limit = Math.min(
    requestedLimit,
    100
  );

  const filters = {
    page,
    limit
  };

  if (
    typeof query.search ===
      "string" &&
    query.search.trim()
  ) {
    filters.search =
      query.search.trim();
  }

  if (
    typeof query.entryType ===
      "string" &&
    query.entryType.trim()
  ) {
    filters.entryType =
      query.entryType.trim();
  }

  if (
    typeof query.status ===
      "string" &&
    query.status.trim()
  ) {
    filters.status =
      query.status.trim();
  }

  if (
    typeof query.mood ===
      "string" &&
    query.mood.trim()
  ) {
    filters.mood =
      query.mood.trim();
  }

  if (
    typeof query.tagId ===
      "string" &&
    query.tagId.trim()
  ) {
    filters.tagId =
      query.tagId.trim();
  }

  if (
    typeof query.activityId ===
      "string" &&
    query.activityId.trim()
  ) {
    filters.activityId =
      query.activityId.trim();
  }

  if (
    typeof query.emotionId ===
      "string" &&
    query.emotionId.trim()
  ) {
    filters.emotionId =
      query.emotionId.trim();
  }

  if (
    typeof query.dateFrom ===
      "string" &&
    query.dateFrom.trim()
  ) {
    filters.dateFrom =
      query.dateFrom.trim();
  }

  if (
    typeof query.dateTo ===
      "string" &&
    query.dateTo.trim()
  ) {
    filters.dateTo =
      query.dateTo.trim();
  }

  if (
    typeof query.sort ===
      "string" &&
    query.sort.trim()
  ) {
    filters.sort =
      query.sort.trim();
  }

  const isFavourite =
    parseBooleanQuery(
      query.isFavourite
    );

  if (
    isFavourite !== undefined
  ) {
    filters.isFavourite =
      isFavourite;
  }

  const isArchived =
    parseBooleanQuery(
      query.isArchived
    );

  if (
    isArchived !== undefined
  ) {
    filters.isArchived =
      isArchived;
  }

  const isDeleted =
    parseBooleanQuery(
      query.isDeleted
    );

  if (
    isDeleted !== undefined
  ) {
    filters.isDeleted =
      isDeleted;
  }

  return filters;
}

/*
  Normalize data received when creating or updating
  a journal entry.

  This does not perform validation. Validation will
  be handled by Zod before the controller runs.
*/
export function normalizeJournalEntryData(
  entryData = {}
) {
  const normalizedData = {
    ...entryData
  };

  if (
    entryData.title !== undefined
  ) {
    normalizedData.title =
      normalizeOptionalText(
        entryData.title
      );
  }

  if (
    entryData.content !== undefined
  ) {
    normalizedData.content =
      normalizeJournalContent(
        entryData.content
      );
  }

  /*
|--------------------------------------------------------------------------
| Mood
|--------------------------------------------------------------------------
|
| moodLabel uses canonical database values:
|
| very_low
| low
| neutral
| good
| very_good
|
*/

if (
  entryData.moodLabel !==
  undefined
) {
  normalizedData.moodLabel =
    normalizeOptionalText(
      entryData.moodLabel
    );
}

  if (
    entryData.promptTextSnapshot !==
    undefined
  ) {
    normalizedData
      .promptTextSnapshot =
      normalizeOptionalText(
        entryData
          .promptTextSnapshot
      );
  }

  if (
    entryData.emotionIds !==
    undefined
  ) {
    normalizedData.emotionIds =
      normalizeIdArray(
        entryData.emotionIds
      );
  }

  if (
    entryData.tagIds !==
    undefined
  ) {
    normalizedData.tagIds =
      normalizeIdArray(
        entryData.tagIds
      );
  }

  if (
    entryData.activityIds !==
    undefined
  ) {
    normalizedData.activityIds =
      normalizeIdArray(
        entryData.activityIds
      );
  }

  return normalizedData;
}

/*
  Check whether an object contains at least one
  property that can modify a journal entry.
*/
export function hasJournalEntryUpdates(
  entryData = {}
) {
  const editableProperties = [
    "title",
    "content",
    "entryType",
    "entryStatus",
    "moodLabel",
    "moodScore",
    "promptId",
    "promptTextSnapshot",
    "entryDate",
    "isFavourite",
    "isLocked",
    "hidePreview",
    "emotionIds",
    "tagIds",
    "activityIds"
  ];

  return editableProperties.some(
    (property) =>
      entryData[property] !==
      undefined
  );
}