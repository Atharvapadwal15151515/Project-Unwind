import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  safeText
} from "./dassPdfHelpers.js";


/* =========================================================
   FOOTER
========================================================= */

export function drawDassPdfFooter(
  doc,
  options = {}
) {
  const {
    pageNumber = null,
    totalPages = 3,
    reportId = "",
    showDisclaimer = true
  } = options;


  const {
    colors,
    fonts
  } = DASS_PDF_THEME;


  const left =
    doc.page.margins.left;


  const right =
    doc.page.width -
    doc.page.margins.right;


  const width =
    right - left;


  /*
   * Keep the footer safely above
   * the bottom page margin.
   */
  const footerY =
    doc.page.height -
    doc.page.margins.bottom -
    30;


  /* =======================================================
     TOP DIVIDER
  ======================================================= */

  doc
    .save()
    .strokeColor(
      colors.divider
    )
    .lineWidth(0.7)
    .moveTo(
      left,
      footerY - 10
    )
    .lineTo(
      right,
      footerY - 10
    )
    .stroke()
    .restore();


  /* =======================================================
     SMALL BRAND ACCENT
  ======================================================= */

  doc
    .save()
    .strokeColor(
      colors.primary
    )
    .lineWidth(1.8)
    .moveTo(
      left,
      footerY - 10
    )
    .lineTo(
      left + 34,
      footerY - 10
    )
    .stroke()
    .restore();


  /* =======================================================
     LEFT — REPORT TYPE
  ======================================================= */

  doc
    .save()
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(8.5)
    .text(
      "UNWIND · DASS-21 SELF-ASSESSMENT",
      left,
      footerY,
      {
        width: 190,
        lineBreak: false
      }
    )
    .restore();


  /* =======================================================
     CENTER — REPORT ID
  ======================================================= */

  if (
    reportId
  ) {
    const shortReportId =
      safeText(
        reportId,
        ""
      ).slice(
        0,
        8
      );


    doc
      .save()
      .fillColor(
        colors.muted
      )
      .font(
        fonts.body
      )
      .fontSize(8.5)
      .text(
        `Report ${shortReportId}`,
        left + 190,
        footerY,
        {
          width:
            width - 190 - 60,

          align: "center",

          lineBreak: false
        }
      )
      .restore();
  }


  /* =======================================================
     RIGHT — PAGE NUMBER
  ======================================================= */

  if (
    pageNumber
  ) {
    doc
      .save()
      .fillColor(
        colors.heading
      )
      .font(
        fonts.bodyBold
      )
      .fontSize(8.5)
      .text(
        `${pageNumber} / ${totalPages}`,
        right - 50,
        footerY,
        {
          width: 50,
          align: "right",
          lineBreak: false
        }
      )
      .restore();
  }


  /* =======================================================
     DISCLAIMER LINE
  ======================================================= */

  if (
    showDisclaimer
  ) {
    doc
      .save()
      .fillColor(
        colors.muted
      )
      .font(
        fonts.body
      )
      .fontSize(8.5)
      .text(
        "For self-reflection only · Not a clinical diagnosis",
        left,
        footerY + 11,
        {
          width,
          lineBreak: false
        }
      )
      .restore();
  }
}


export default drawDassPdfFooter;