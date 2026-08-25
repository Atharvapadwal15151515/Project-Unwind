/*
|--------------------------------------------------------------------------
| Safe Journal search sorting configuration
|--------------------------------------------------------------------------
| Never pass sortBy directly into SQL.
| Only values defined in this map may become SQL column names.
*/

export const JOURNAL_SEARCH_SORT_COLUMNS =
  Object.freeze({
    createdAt:
      "je.created_at",

    updatedAt:
      "je.updated_at",

    entryDate:
      "je.entry_date",

    title:
      "je.title",

    moodScore:
      "je.mood_score",

    lastAutoSavedAt:
      "je.last_auto_saved_at",

    completedAt:
      "je.completed_at"
  });

/*
|--------------------------------------------------------------------------
| Resolve safe sorting
|--------------------------------------------------------------------------
*/

export function resolveJournalSearchSorting({
  sortBy = "createdAt",
  sortOrder = "desc"
} = {}) {
  const sortColumn =
    JOURNAL_SEARCH_SORT_COLUMNS[
      sortBy
    ] ||
    JOURNAL_SEARCH_SORT_COLUMNS
      .createdAt;

  const normalizedSortOrder =
    String(sortOrder)
      .trim()
      .toLowerCase();

  const safeSortOrder =
    normalizedSortOrder === "asc"
      ? "ASC"
      : "DESC";

  return {
    sortColumn,
    sortOrder:
      safeSortOrder
  };
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export function buildJournalSearchPagination({
  page = 1,
  limit = 20
} = {}) {
  const safePage =
    Number.isInteger(page) &&
    page > 0
      ? page
      : 1;

  const safeLimit =
    Number.isInteger(limit) &&
    limit > 0
      ? Math.min(limit, 100)
      : 20;

  const offset =
    (safePage - 1) *
    safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset
  };
}

/*
|--------------------------------------------------------------------------
| Pagination response
|--------------------------------------------------------------------------
*/

export function formatJournalSearchPagination({
  page,
  limit,
  totalItems
}) {
  const normalizedTotalItems =
    Number(totalItems) || 0;

  const totalPages =
    normalizedTotalItems === 0
      ? 0
      : Math.ceil(
          normalizedTotalItems /
            limit
        );

  return {
    page,
    limit,
    totalItems:
      normalizedTotalItems,

    totalPages,

    hasNextPage:
      page < totalPages,

    hasPreviousPage:
      page > 1
  };
}

/*
|--------------------------------------------------------------------------
| Search text preparation
|--------------------------------------------------------------------------
| Escapes LIKE wildcard characters so user input is treated as text.
*/

export function escapeJournalSearchText(
  value
) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

/*
|--------------------------------------------------------------------------
| Date range normalization
|--------------------------------------------------------------------------
*/

export function getJournalSearchDateRange({
  fromDate,
  toDate
} = {}) {
  return {
    fromDate:
      fromDate
        ? `${fromDate}T00:00:00.000Z`
        : null,

    toDate:
      toDate
        ? `${toDate}T23:59:59.999Z`
        : null
  };
}