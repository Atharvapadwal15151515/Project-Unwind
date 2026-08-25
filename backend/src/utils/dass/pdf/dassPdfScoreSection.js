import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  safeNumber,
  drawRoundedBox,
  drawSeverityBadge,
  getCategoryColor
} from "./dassPdfHelpers.js";

import {
  drawDassScoreChart,
  getDassScoreData
} from "./dassPdfCharts.js";


/* =========================================================
   COMPACT SCORE CARD
========================================================= */

function drawCompactScoreCard(
  doc,
  {
    x,
    y,
    width,
    height = 76,

    category,
    label,
    score,
    level
  }
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;

  const categoryColor =
    getCategoryColor(
      category
    );

  const safeScore =
    safeNumber(
      score,
      0
    );


  /* =======================================================
     CARD
  ======================================================= */

  drawRoundedBox(
    doc,
    {
      x,
      y,
      width,
      height,

      radius:
        radius.md,

      backgroundColor:
        colors.surface,

      borderColor:
        colors.border,

      borderWidth: 1
    }
  );


  /* =======================================================
     CATEGORY ACCENT
  ======================================================= */

  doc
    .save()
    .roundedRect(
      x,
      y,
      4,
      height,
      2
    )
    .fillColor(
      categoryColor
    )
    .fill()
    .restore();


  /* =======================================================
     CATEGORY LABEL
  ======================================================= */

  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(7)
    .text(
      String(
        label || category
      ).toUpperCase(),
      x + 14,
      y + 11,
      {
        width:
          width - 28,

        characterSpacing: 0.5
      }
    );


  /* =======================================================
     SCORE
  ======================================================= */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.heading
    )
    .fontSize(20)
    .text(
      safeScore,
      x + 14,
      y + 27,
      {
        width: 38
      }
    );


  doc
    .fillColor(
      colors.muted
    )
    .font(
      fonts.body
    )
    .fontSize(6.5)
    .text(
      "/ 42",
      x + 48,
      y + 35,
      {
        width: 28
      }
    );


  /* =======================================================
     RANGE BADGE
  ======================================================= */

  const badgeWidth =
    Math.min(
      92,
      width - 90
    );

  drawSeverityBadge(
    doc,
    {
      level,

      x:
        x +
        width -
        badgeWidth -
        12,

      y:
        y +
        29,

      width:
        badgeWidth,

      height: 19
    }
  );


  return (
    y +
    height
  );
}


/* =========================================================
   SCORE SUMMARY ROW
========================================================= */

export function drawDassScoreSummary(
  doc,
  result = {},
  options = {}
) {
  const {
    x =
      doc.page.margins.left,

    y = doc.y,

    width =
      doc.page.width -
      doc.page.margins.left -
      doc.page.margins.right,

    gap = 9,

    cardHeight = 76
  } = options;


  const scoreData =
    getDassScoreData(
      result
    );


  const cardWidth =
    (
      width -
      gap * 2
    ) / 3;


  scoreData.forEach(
    (
      item,
      index
    ) => {
      drawCompactScoreCard(
        doc,
        {
          x:
            x +
            index *
              (
                cardWidth +
                gap
              ),

          y,

          width:
            cardWidth,

          height:
            cardHeight,

          category:
            item.key,

          label:
            item.label,

          score:
            item.score,

          level:
            item.level
        }
      );
    }
  );


  doc.y =
    y +
    cardHeight +
    12;


  return doc.y;
}


/* =========================================================
   OPTIONAL SCORE SECTION
========================================================= */

/*
 * IMPORTANT:
 *
 * In the redesigned 3-page report this function DOES NOT
 * create a new PDF page.
 *
 * Page 1 already displays the primary score cards.
 *
 * This remains available as a reusable component in case
 * another PDF layout or export needs a compact score block.
 */

export function drawDassPdfScoreSection(
  doc,
  result = {},
  options = {}
) {
  const {
    colors,
    fonts
  } = DASS_PDF_THEME;


  const {
    x =
      doc.page.margins.left,

    y = doc.y,

    width =
      doc.page.width -
      doc.page.margins.left -
      doc.page.margins.right,

    showHeading = true,

    showChart = true
  } = options;


  let currentY =
    y;


  /* =======================================================
     OPTIONAL HEADING
  ======================================================= */

  if (showHeading) {
    doc
      .fillColor(
        colors.heading
      )
      .font(
        fonts.heading
      )
      .fontSize(15)
      .text(
        "Your self-assessment scores",
        x,
        currentY,
        {
          width
        }
      );


    currentY += 21;


    doc
      .fillColor(
        colors.textSoft
      )
      .font(
        fonts.body
      )
      .fontSize(7.5)
      .text(
        "These scores reflect the responses you provided to the DASS-21 questions.",
        x,
        currentY,
        {
          width,
          lineGap: 2
        }
      );


    currentY += 28;
  }


  /* =======================================================
     SCORE CARDS
  ======================================================= */

  drawDassScoreSummary(
    doc,
    result,
    {
      x,
      y: currentY,
      width
    }
  );


  currentY =
    doc.y;


  /* =======================================================
     OPTIONAL CHART
  ======================================================= */

  if (showChart) {
    drawDassScoreChart(
      doc,
      result,
      {
        x,
        y: currentY,

        width,

        height: 165
      }
    );


    currentY =
      doc.y;
  }


  doc.y =
    currentY;


  return currentY;
}


/* =========================================================
   LEGACY EXPORT
========================================================= */

/*
 * Some existing code may import drawScoreSection instead
 * of drawDassPdfScoreSection.
 *
 * Keeping this alias prevents unnecessary breakage while
 * we rebuild the PDF generator.
 */

export const drawScoreSection =
  drawDassPdfScoreSection;


export default drawDassPdfScoreSection;