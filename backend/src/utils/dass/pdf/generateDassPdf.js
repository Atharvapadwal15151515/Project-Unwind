import PDFDocument
  from "pdfkit";

import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  drawDassPdfCover
} from "./dassPdfCover.js";

import {
  drawDassPdfInterpretationSection
} from "./dassPdfInterpretationSection.js";

import {
  drawDassPdfGuidanceSection
} from "./dassPdfGuidanceSection.js";


/* =========================================================
   BACKGROUND
========================================================= */

function drawPageBackground(
  doc
) {
  const {
    colors
  } = DASS_PDF_THEME;

  /*
   * Main page background:
   * soft white / warm neutral.
   *
   * This keeps the report printable and
   * professional instead of feeling like
   * a screenshot of the dark dashboard.
   */
  doc
    .save()
    .rect(
      0,
      0,
      doc.page.width,
      doc.page.height
    )
    .fillColor(
      colors.background
    )
    .fill()
    .restore();


  /*
   * Thin deep-green brand strip
   * across the very top.
   */
  doc
    .save()
    .rect(
      0,
      0,
      doc.page.width,
      9
    )
    .fillColor(
      colors.primaryDeep
    )
    .fill()
    .restore();


  /*
   * Subtle mint accent line
   * under the dark strip.
   */
  doc
    .save()
    .rect(
      0,
      9,
      doc.page.width,
      2
    )
    .fillColor(
      colors.primary
    )
    .fill()
    .restore();
}


/* =========================================================
   APPLY BACKGROUND TO EVERY PAGE
========================================================= */

function registerPageBackground(
  doc
) {
  /*
   * First page already exists when PDFDocument
   * is created, so draw it immediately.
   */
  drawPageBackground(
    doc
  );


  /*
   * Any page added later by the interpretation
   * or guidance sections automatically gets the
   * same Unwind background.
   */
  doc.on(
    "pageAdded",
    () => {
      drawPageBackground(
        doc
      );
    }
  );
}


/* =========================================================
   SAFE OBJECT NORMALIZATION
========================================================= */

function normalizePdfData(
  payload = {}
) {
  return {
    assessment:
      payload.assessment ??
      {},

    result:
      payload.result ??
      payload.results ??
      {},

    report:
      payload.report ??
      {},

    responses:
      payload.responses ??
      payload.answers ??
      [],

    user:
      payload.user ??
      {}
  };
}


/* =========================================================
   PDF METADATA
========================================================= */

function applyPdfMetadata(
  doc,
  data
) {
  const {
    assessment,
    report
  } = data;


  const reportId =
    report.report_id ??
    report.reportId ??
    assessment.assessment_id ??
    assessment.assessmentId ??
    "";


  doc.info.Title =
    "UNWIND DASS-21 Self-Assessment";

  doc.info.Author =
    "UNWIND";

  doc.info.Subject =
    "DASS-21 Self-Assessment Report";

  doc.info.Keywords =
    [
      "UNWIND",
      "DASS-21",
      "self-assessment",
      "mental wellness",
      "depression",
      "anxiety",
      "stress"
    ].join(", ");


  if (reportId) {
    doc.info.Identifier =
      String(
        reportId
      );
  }
}


/* =========================================================
   MAIN GENERATOR
========================================================= */

export function generateDassPdf(
  payload = {},
  options = {}
) {
  const data =
    normalizePdfData(
      payload
    );


  const {
    assessment,
    result,
    report
  } = data;


  const {
    page
  } = DASS_PDF_THEME;


  /* =======================================================
     DOCUMENT
  ======================================================= */

  const doc =
    new PDFDocument({
      size:
        page.size ??
        "A4",

      margins: {
        top:
          page.margin,

        right:
          page.margin,

        bottom:
          page.margin,

        left:
          page.margin
      },

      autoFirstPage:
        true,

      bufferPages:
        true,

      compress:
        true,

      info: {
        Title:
          "UNWIND DASS-21 Self-Assessment",

        Author:
          "UNWIND",

        Subject:
          "DASS-21 Self-Assessment Report"
      },

      ...options.pdfOptions
    });


  /* =======================================================
     DOCUMENT METADATA
  ======================================================= */

  applyPdfMetadata(
    doc,
    data
  );


  /* =======================================================
     PAGE BACKGROUNDS
  ======================================================= */

  registerPageBackground(
    doc
  );


  /* =======================================================
     PAGE 1
     SELF-ASSESSMENT SNAPSHOT
  ======================================================= */

  drawDassPdfCover(
    doc,
    {
      assessment,
      result,
      report
    }
  );


  /* =======================================================
     PAGE 2
     UNDERSTANDING YOUR RESULTS

     This function adds its own page.
  ======================================================= */

  drawDassPdfInterpretationSection(
    doc,
    {
      assessment,
      result,
      report
    }
  );


  /* =======================================================
     PAGE 3
     WHAT YOU CAN DO NEXT

     This function adds its own page.
  ======================================================= */

  drawDassPdfGuidanceSection(
    doc,
    {
      assessment,
      result,
      report
    }
  );


  /*
   * IMPORTANT:
   *
   * Do NOT call:
   *
   * drawDassPdfScoreSection()
   * drawDassPdfAnalysisSection()
   *
   * here.
   *
   * Their useful information has already
   * been integrated into Pages 1–3.
   *
   * Calling them here would recreate the
   * long multi-page PDF we are removing.
   */


  return doc;
}


/* =========================================================
   BUFFER VERSION
========================================================= */

/*
 * Useful when your controller needs the completed
 * PDF as a Buffer instead of piping PDFKit directly
 * into the Express response.
 */

export function generateDassPdfBuffer(
  payload = {},
  options = {}
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      try {
        const doc =
          generateDassPdf(
            payload,
            options
          );


        const chunks = [];


        doc.on(
          "data",
          (chunk) => {
            chunks.push(
              chunk
            );
          }
        );


        doc.on(
          "end",
          () => {
            resolve(
              Buffer.concat(
                chunks
              )
            );
          }
        );


        doc.on(
          "error",
          reject
        );


        doc.end();
      } catch (error) {
        reject(
          error
        );
      }
    }
  );
}


/* =========================================================
   EXPRESS RESPONSE VERSION
========================================================= */

/*
 * Optional helper if your controller currently
 * sends the PDF directly to the browser.
 */

export function pipeDassPdfToResponse(
  res,
  payload = {},
  options = {}
) {
  const {
    filename =
      "unwind-dass21-self-assessment.pdf"
  } = options;


  const doc =
    generateDassPdf(
      payload,
      options
    );


  res.setHeader(
    "Content-Type",
    "application/pdf"
  );


  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );


  doc.pipe(
    res
  );


  doc.end();


  return doc;
}


export default generateDassPdf;