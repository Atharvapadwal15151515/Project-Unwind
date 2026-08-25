import asyncHandler from "../../utils/asyncHandler.js";

import {
  searchJournalEntriesService
} from "../../services/journal/journalSearch.service.js";

/*
|--------------------------------------------------------------------------
| Search Journal entries
|--------------------------------------------------------------------------
| GET /api/journal/search
*/

export const searchJournalEntriesController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const result =
        await searchJournalEntriesService(
          userId,
          req.query
        );

      res.status(200).json({
        success: true,
        message:
          "Journal entries retrieved successfully",
        data: {
          entries:
            result.entries,

          pagination:
            result.pagination
        }
      });
    }
  );