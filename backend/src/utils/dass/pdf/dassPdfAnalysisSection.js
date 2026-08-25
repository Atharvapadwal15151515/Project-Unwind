import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  safeText,
  safeNumber,
  drawRoundedBox,
  getHighestSeverity,
  getCategoryColor
} from "./dassPdfHelpers.js";

import {
  getDassScoreData
} from "./dassPdfCharts.js";


/* =========================================================
   BUILD COMPACT ANALYSIS
========================================================= */

function buildAnalysis(
  result = {}
) {
  const scores =
    getDassScoreData(
      result
    );

  const highest =
    getHighestSeverity(
      result
    );

  const sorted =
    [...scores].sort(
      (a, b) =>
        safeNumber(
          b.score,
          0
        ) -
        safeNumber(
          a.score,
          0
        )
    );

  const highestArea =
    safeText(
      highest?.label,
      "your results"
    );

  const highestLevel =
    safeText(
      highest?.level,
      "normal"
    )
      .replaceAll("_", " ")
      .toLowerCase();

  const secondArea =
    sorted?.[1]?.label ??
    "";

  const lowestArea =
    sorted?.[2]?.label ??
    "";


  if (
    highestLevel === "normal"
  ) {
    return {
      title:
        "Your current pattern",

      text:
        "Your responses currently fall within the normal DASS-21 ranges. This result can act as a useful baseline for future self-check-ins.",

      primaryArea:
        highestArea,

      secondaryArea:
        secondArea,

      lowestArea
    };
  }


  return {
    title:
      "Your current pattern",

    text:
      `${highestArea} stands out most in this self-assessment. ${
        secondArea
          ? `${secondArea} is the next highest area. `
          : ""
      }Use this pattern as a reflection point rather than a diagnosis.`,

    primaryArea:
      highestArea,

    secondaryArea:
      secondArea,

    lowestArea
  };
}


/* =========================================================
   COMPACT ANALYSIS CARD
========================================================= */

export function drawDassAnalysisCard(
  doc,
  result = {},
  options = {}
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  const {
    x =
      doc.page.margins.left,

    y = doc.y,

    width =
      doc.page.width -
      doc.page.margins.left -
      doc.page.margins.right,

    height = 96
  } = options;


  const analysis =
    buildAnalysis(
      result
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
        radius.lg,

      backgroundColor:
        colors.surfaceSoft,

      borderColor:
        colors.border,

      borderWidth: 1
    }
  );


  /* =======================================================
     ACCENT
  ======================================================= */

  doc
    .save()
    .circle(
      x + 24,
      y + 24,
      7
    )
    .fillColor(
      colors.primary
    )
    .fill()
    .restore();


  /* =======================================================
     TITLE
  ======================================================= */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(9.5)
    .text(
      analysis.title,
      x + 41,
      y + 17,
      {
        width:
          width - 58
      }
    );


  /* =======================================================
     TEXT
  ======================================================= */

  doc
    .fillColor(
      colors.text
    )
    .font(
      fonts.body
    )
    .fontSize(7.4)
    .text(
      analysis.text,
      x + 18,
      y + 43,
      {
        width:
          width - 36,

        lineGap: 2.4
      }
    );


  /* =======================================================
     MINI AREA LABELS
  ======================================================= */

  const labelsY =
    y + height - 22;

  const items = [
    {
      label:
        analysis.primaryArea,
      category:
        String(
          analysis.primaryArea
        ).toLowerCase()
    },

    {
      label:
        analysis.secondaryArea,
      category:
        String(
          analysis.secondaryArea
        ).toLowerCase()
    },

    {
      label:
        analysis.lowestArea,
      category:
        String(
          analysis.lowestArea
        ).toLowerCase()
    }
  ].filter(
    (item) =>
      item.label
  );


  const gap = 8;

  const itemWidth =
    (
      width -
      36 -
      gap *
        (
          items.length - 1
        )
    ) /
    items.length;


  items.forEach(
    (
      item,
      index
    ) => {
      const itemX =
        x +
        18 +
        index *
          (
            itemWidth +
            gap
          );


      doc
        .save()
        .circle(
          itemX + 4,
          labelsY + 4,
          2.2
        )
        .fillColor(
          getCategoryColor(
            item.category
          )
        )
        .fill()
        .restore();


      doc
        .fillColor(
          colors.textSoft
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(6)
        .text(
          item.label,
          itemX + 11,
          labelsY,
          {
            width:
              itemWidth - 11,
            ellipsis: true
          }
        );
    }
  );


  doc.y =
    y +
    height +
    12;


  return doc.y;
}


/* =========================================================
   LEGACY SECTION FUNCTION
========================================================= */

/*
 * This function intentionally DOES NOT add a new page.
 *
 * It remains here so older imports do not break.
 * The redesigned PDF uses analysis only as a compact
 * insight component inside the existing 3 pages.
 */

export function drawDassPdfAnalysisSection(
  doc,
  result = {},
  options = {}
) {
  return drawDassAnalysisCard(
    doc,
    result,
    options
  );
}


export const drawAnalysisSection =
  drawDassPdfAnalysisSection;


export default drawDassPdfAnalysisSection;