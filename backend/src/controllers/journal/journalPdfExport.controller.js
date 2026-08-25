import asyncHandler from "../../utils/asyncHandler.js";

import {
  exportSingleJournalEntryPdf,
  exportMultipleJournalEntriesPdf,
  exportCompleteJournalPdf
} from "../../services/journal/journalPdfExport.service.js";

import {
  generateJournalPdf,
  generateJournalPdfFilename
} from "../../utils/journal/generateJournalPdf.util.js";

/*
|--------------------------------------------------------------------------
| Export Single Journal Entry PDF
|--------------------------------------------------------------------------
| GET /api/journal/export/entries/:entryId/pdf
*/

export const exportSingleJournalEntryPdfController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const { entryId } =
        req.params;

      const {
        includeAttachments
      } = req.query;

      const exportData =
        await exportSingleJournalEntryPdf(
          userId,
          entryId,
          {
            includeAttachments:
              includeAttachments ===
              "true"
          }
        );

      const pdfBuffer =
        await generateJournalPdf(
          exportData
        );

      const filename =
        generateJournalPdfFilename(
          exportData.title
        );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      return res
        .status(200)
        .send(pdfBuffer);
    }
  );

/*
|--------------------------------------------------------------------------
| Export Multiple Journal Entries PDF
|--------------------------------------------------------------------------
| POST /api/journal/export/pdf
*/

export const exportMultipleJournalEntriesPdfController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const exportData =
        await exportMultipleJournalEntriesPdf(
          userId,
          req.body
        );

      const pdfBuffer =
        await generateJournalPdf(
          exportData
        );

      const filename =
        generateJournalPdfFilename(
          exportData.title
        );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      return res
        .status(200)
        .send(pdfBuffer);
    }
  );

/*
|--------------------------------------------------------------------------
| Export Complete Journal PDF
|--------------------------------------------------------------------------
| GET /api/journal/export/pdf
*/

export const exportCompleteJournalPdfController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const exportData =
        await exportCompleteJournalPdf(
          userId,
          req.query
        );

      const pdfBuffer =
        await generateJournalPdf(
          exportData
        );

      const filename =
        generateJournalPdfFilename(
          exportData.title
        );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      return res
        .status(200)
        .send(pdfBuffer);
    }
  );