import {
  searchJournalEntries
} from "../../models/journal/journalSearch.model.js";

import {
  resolveJournalSearchSorting,
  buildJournalSearchPagination,
  formatJournalSearchPagination,
  escapeJournalSearchText,
  getJournalSearchDateRange
} from "../../utils/journal/journalSearch.util.js";

/*
|--------------------------------------------------------------------------
| Search Journal Entries
|--------------------------------------------------------------------------
*/

export async function searchJournalEntriesService(
  userId,
  query
) {
  const {
    page,
    limit,

    sortBy,
    sortOrder,

    q,

    fromDate,
    toDate,

    ...filters
  } = query;

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const pagination =
    buildJournalSearchPagination({
      page,
      limit
    });

  /*
  |--------------------------------------------------------------------------
  | Sorting
  |--------------------------------------------------------------------------
  */

  const sorting =
    resolveJournalSearchSorting({
      sortBy,
      sortOrder
    });

  /*
  |--------------------------------------------------------------------------
  | Search Text
  |--------------------------------------------------------------------------
  */

  const searchText = q
    ? escapeJournalSearchText(
        q.trim()
      )
    : null;

  /*
  |--------------------------------------------------------------------------
  | Date Range
  |--------------------------------------------------------------------------
  */

  const dateRange =
    getJournalSearchDateRange({
      fromDate,
      toDate
    });

  /*
  |--------------------------------------------------------------------------
  | Database Search
  |--------------------------------------------------------------------------
  */

  const result =
    await searchJournalEntries({
      userId,

      filters: {
        ...filters,
        ...dateRange
      },

      pagination,

      sorting,

      searchText
    });

  /*
  |--------------------------------------------------------------------------
  | Response
  |--------------------------------------------------------------------------
  */

  return {
    entries:
      result.entries,

    pagination:
      formatJournalSearchPagination({
        page:
          pagination.page,

        limit:
          pagination.limit,

        totalItems:
          result.totalItems
      })
  };
}