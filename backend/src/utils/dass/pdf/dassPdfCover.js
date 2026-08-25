import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  safeText,
  safeNumber,
  formatDate,
  drawRoundedBox,
  getHighestSeverity,
  formatLevel
} from "./dassPdfHelpers.js";

import {
  drawDassPdfHeader
} from "./dassPdfHeader.js";

import {
  drawDassPdfFooter
} from "./dassPdfFooter.js";


/* =========================================================
   INTERNAL DATA HELPERS
========================================================= */

function getResultValue(
  result,
  snakeCaseKey,
  camelCaseKey,
  fallback = null
) {
  return (
    result?.[snakeCaseKey] ??
    result?.[camelCaseKey] ??
    fallback
  );
}


function getAssessmentDate(
  assessment = {},
  result = {},
  report = {}
) {
  return (
    assessment.completed_at ??
    assessment.completedAt ??
    result.completed_at ??
    result.completedAt ??
    report.generated_at ??
    report.generatedAt ??
    new Date()
  );
}


function getReportId(
  report = {},
  assessment = {}
) {
  return safeText(
    report.report_id ??
      report.reportId ??
      assessment.assessment_id ??
      assessment.assessmentId ??
      "",
    ""
  );
}


/* =========================================================
   SEVERITY / INTENSITY VISUAL STYLE
========================================================= */

function normalizeLevel(
  level
) {
  return safeText(
    level,
    "normal"
  )
    .replaceAll("_", " ")
    .trim()
    .toLowerCase();
}


function getIntensityStyle(
  level
) {
  const normalized =
    normalizeLevel(level);


  /*
   * These colours intentionally differ
   * from the normal Unwind green palette.
   *
   * They communicate intensity visually:
   *
   * Green  = low
   * Yellow = mild
   * Orange = moderate
   * Red    = high
   */

  switch (normalized) {
    case "normal":
      return {
        color: "#328A61",
        soft: "#E5F3EB",
        intensity: "LOW",
        rings: 1
      };


    case "mild":
      return {
        color: "#C5A52D",
        soft: "#F7F1D9",
        intensity: "LOW",
        rings: 2
      };


    case "moderate":
      return {
        color: "#E78A25",
        soft: "#FBEBD8",
        intensity: "MODERATE",
        rings: 3
      };


    case "severe":
      return {
        color: "#D74646",
        soft: "#F9E3E3",
        intensity: "HIGH",
        rings: 4
      };


    case "extremely severe":
      return {
        color: "#A92E37",
        soft: "#F5DCDD",
        intensity: "VERY HIGH",
        rings: 5
      };


    default:
      return {
        color: "#6A8179",
        soft: "#EDF2F0",
        intensity: "UNAVAILABLE",
        rings: 1
      };
  }
}


/* =========================================================
   CATEGORY DESCRIPTION
========================================================= */

function getCategoryDescription(
  category,
  level
) {
  const normalizedLevel =
    normalizeLevel(level);


  if (
    normalizedLevel === "normal"
  ) {
    return (
      `Your responses fall within the normal range for ${category.toLowerCase()}.`
    );
  }


  if (
    normalizedLevel === "mild"
  ) {
    return (
      `Your responses indicate a mild level of ${category.toLowerCase()}-related experiences.`
    );
  }


  if (
    normalizedLevel === "moderate"
  ) {
    return (
      `Your responses indicate a moderate level of ${category.toLowerCase()}-related experiences.`
    );
  }


  if (
    normalizedLevel === "severe"
  ) {
    return (
      `Your responses indicate a high level of ${category.toLowerCase()}-related experiences.`
    );
  }


  if (
    normalizedLevel ===
    "extremely severe"
  ) {
    return (
      `Your responses indicate a very high level of ${category.toLowerCase()}-related experiences.`
    );
  }


  return (
    "This result reflects your self-reported responses."
  );
}


/* =========================================================
   CONCENTRIC INTENSITY VISUAL
========================================================= */

function drawIntensityVisual(
  doc,
  {
    centerX,
    centerY,
    level
  }
) {
  const style =
    getIntensityStyle(
      level
    );


  /*
   * Five concentric rings.
   *
   * More coloured rings =
   * greater reported intensity.
   *
   * Normal            = 1 ring
   * Mild              = 2 rings
   * Moderate          = 3 rings
   * Severe            = 4 rings
   * Extremely Severe  = 5 rings
   */

  const radii = [
    40,
    33,
    26,
    19,
    12
  ];


  radii.forEach(
    (
      radius,
      index
    ) => {
      const ringNumber =
        radii.length -
        index;


      const active =
        ringNumber <=
        style.rings;


      doc
        .save()
        .circle(
          centerX,
          centerY,
          radius
        )
        .lineWidth(
          active
            ? 3.5
            : 1.3
        )
        .strokeColor(
          active
            ? style.color
            : "#E8ECEA"
        )
        .stroke()
        .restore();
    }
  );
}

/* =========================================================
   INTENSITY CARD
========================================================= */

function drawIntensityCard(
  doc,
  {
    x,
    y,
    width,
    height,
    title,
    level
  }
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  const style =
    getIntensityStyle(
      level
    );


  /* CARD */

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
        colors.white,

      borderColor:
        colors.border,

      borderWidth: 0.9
    }
  );


  /* TITLE */

  doc
    .fillColor(
      style.color
    )
    .font(
      fonts.heading
    )
    .fontSize(12.5)
    .text(
      title.toUpperCase(),
      x + 12,
      y + 14,
      {
        width:
          width - 24,

        align:
          "center",

        characterSpacing:
          0.4
      }
    );


  /* CONCENTRIC CIRCLES */

  drawIntensityVisual(
    doc,
    {
      centerX:
        x +
        width / 2,

      centerY:
        y + 80,

      level
    }
  );


  /* RANGE LABEL BACKGROUND */

  drawRoundedBox(
    doc,
    {
      x: x + 15,

      y:
        y +
        height -
        59,

      width:
        width - 30,

      height: 22,

      radius: 11,

      backgroundColor:
        style.soft,

      borderColor:
        style.soft,

      borderWidth: 0
    }
  );


  /* RANGE LABEL */

  doc
    .fillColor(
      style.color
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(10)
    .text(
      `${formatLevel(
        level
      )} range`,
      x + 20,
      y + height - 52,
      {
        width:
          width - 40,

        align: "center",
        lineBreak: false
      }
    );


  /* DESCRIPTION */

  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(9.5)
    .text(
      getCategoryDescription(
        title,
        level
      ),
      x + 14,
      y + height - 29,
      {
        width:
          width - 28,

        align: "center",

        lineGap: 1.2
      }
    );
}


/* =========================================================
   ASSESSMENT INFORMATION CARD
========================================================= */

function drawAssessmentMeta(
  doc,
  {
    x,
    y,
    width,
    assessment,
    report,
    result
  }
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  drawRoundedBox(
    doc,
    {
      x,
      y,
      width,

      height: 80,

      radius:
        radius.md,

      backgroundColor:
        colors.paperSoft,

      borderColor:
        colors.border,

      borderWidth: 0.7
    }
  );


  const assessmentId =
    getReportId(
      report,
      assessment
    );


  const shortId =
    assessmentId
      ? assessmentId.slice(
          0,
          13
        )
      : "Unavailable";


  const rows = [
    {
      label:
        "Assessment",

      value:
        "DASS-21"
    },

    {
      label:
        "Report ID",

      value:
        shortId
    },

    {
      label:
        "Completed",

      value:
        formatDate(
          getAssessmentDate(
            assessment,
            result,
            report
          )
        )
    },

    {
      label:
        "Questions",

      value:
        "21"
    }
  ];


  rows.forEach(
    (
      item,
      index
    ) => {
      const rowY =
        y +
        11 +
        index * 16;


      doc
        .fillColor(
          colors.textSoft
        )
        .font(
          fonts.body
        )
        .fontSize(8.5)
        .text(
          item.label,
          x + 12,
          rowY,
          {
            width: 70
          }
        );


      doc
        .fillColor(
          colors.heading
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(8.5)
        .text(
          item.value,
          x + 82,
          rowY,
          {
            width:
              width - 94,

            align:
              "right"
          }
        );
    }
  );
}


/* =========================================================
   SCORE COMPARISON TABLE
========================================================= */

function drawScoreComparisonTable(
  doc,
  {
    x,
    y,
    width,
    result
  }
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  const rows = [
    {
      label:
        "Depression",

      score:
        safeNumber(
          getResultValue(
            result,
            "depression_score",
            "depressionScore",
            0
          )
        ),

      level:
        getResultValue(
          result,
          "depression_level",
          "depressionLevel",
          "normal"
        ),

      ranges:
        "0–9   |   10–13   |   14–20   |   21–27   |   28+"
    },

    {
      label:
        "Anxiety",

      score:
        safeNumber(
          getResultValue(
            result,
            "anxiety_score",
            "anxietyScore",
            0
          )
        ),

      level:
        getResultValue(
          result,
          "anxiety_level",
          "anxietyLevel",
          "normal"
        ),

      ranges:
        "0–7   |   8–9   |   10–14   |   15–19   |   20+"
    },

    {
      label:
        "Stress",

      score:
        safeNumber(
          getResultValue(
            result,
            "stress_score",
            "stressScore",
            0
          )
        ),

      level:
        getResultValue(
          result,
          "stress_level",
          "stressLevel",
          "normal"
        ),

      ranges:
        "0–14   |   15–18   |   19–25   |   26–33   |   34+"
    }
  ];


  const headerHeight =
    34;

  const rowHeight =
    36;

  const tableHeight =
    headerHeight +
    rowHeight *
      rows.length;


  /* OUTER CARD */

  drawRoundedBox(
    doc,
    {
      x,
      y,
      width,

      height:
        tableHeight,

      radius:
        radius.md,

      backgroundColor:
        colors.white,

      borderColor:
        colors.borderStrong,

      borderWidth: 0.8
    }
  );


  /* HEADER */

  doc
    .save()
    .roundedRect(
      x,
      y,
      width,
      headerHeight,
      radius.md
    )
    .fillColor(
      colors.primaryDark
    )
    .fill()
    .restore();


  const domainWidth =
    94;

  const scoreWidth =
    66;

  const severityWidth =
    92;

  const rangeWidth =
    width -
    domainWidth -
    scoreWidth -
    severityWidth;


  doc
    .fillColor(
      colors.inverseText
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(8.5)
    .text(
      "DOMAIN",
      x + 10,
      y + 13,
      {
        width:
          domainWidth - 20
      }
    );


  doc
    .text(
      "SCORE",
      x +
        domainWidth,

      y + 13,
      {
        width:
          scoreWidth,

        align:
          "center"
      }
    );


  doc
    .text(
      "SEVERITY",
      x +
        domainWidth +
        scoreWidth,

      y + 13,
      {
        width:
          severityWidth,

        align:
          "center"
      }
    );


  doc
    .text(
      "STANDARD DASS-21 RANGES",
      x +
        domainWidth +
        scoreWidth +
        severityWidth,

      y + 13,
      {
        width:
          rangeWidth,

        align:
          "center"
      }
    );


  /* ROWS */

  rows.forEach(
    (
      row,
      index
    ) => {
      const rowY =
        y +
        headerHeight +
        index *
          rowHeight;


      const style =
        getIntensityStyle(
          row.level
        );


      if (
        index % 2 === 1
      ) {
        doc
          .save()
          .rect(
            x,
            rowY,
            width,
            rowHeight
          )
          .fillColor(
            "#FAFCFB"
          )
          .fill()
          .restore();
      }


      /* horizontal divider */

      doc
        .save()
        .strokeColor(
          colors.divider
        )
        .lineWidth(0.6)
        .moveTo(
          x,
          rowY
        )
        .lineTo(
          x + width,
          rowY
        )
        .stroke()
        .restore();


      /* DOMAIN */

      doc
        .fillColor(
          colors.heading
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(10)
        .text(
          row.label,
          x + 10,
          rowY + 13,
          {
            width:
              domainWidth - 20
          }
        );


      /* SCORE */

      doc
        .fillColor(
          style.color
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(9.5)
        .text(
          `${row.score} / 42`,
          x +
            domainWidth,

          rowY + 13,
          {
            width:
              scoreWidth,

            align:
              "center"
          }
        );


      /* SEVERITY */

      doc
        .fillColor(
          style.color
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(8.9)
        .text(
          formatLevel(
            row.level
          ),
          x +
            domainWidth +
            scoreWidth,

          rowY + 13,
          {
            width:
              severityWidth,

            align:
              "center"
          }
        );


      /* RANGES */

      doc
        .fillColor(
          colors.textSoft
        )
        .font(
          fonts.body
        )
        .fontSize(7.9)
        .text(
          row.ranges,
          x +
            domainWidth +
            scoreWidth +
            severityWidth +
            5,

          rowY + 13,
          {
            width:
              rangeWidth -
              10,

            align:
              "center"
          }
        );
    }
  );


  return (
    y +
    tableHeight
  );
}


/* =========================================================
   PAGE 1
========================================================= */

export function drawDassPdfCover(
  doc,
  {
    assessment = {},
    result = {},
    report = {}
  } = {}
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  const left =
    doc.page.margins.left;


  const contentWidth =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;


  const reportId =
    getReportId(
      report,
      assessment
    );


  /* =======================================================
     HEADER
  ======================================================= */

  drawDassPdfHeader(
    doc,
    {
      pageLabel:
        "ASSESSMENT REPORT"
    }
  );


  let currentY =
    doc.y;


  /* =======================================================
     TITLE + META
  ======================================================= */

  const titleWidth =
    contentWidth *
    0.56;


  const metaWidth =
    contentWidth -
    titleWidth -
    20;


  doc
    .fillColor(
      colors.primaryDark
    )
    .font(
      fonts.heading
    )
    .fontSize(23)
    .text(
      "DASS-21",
      left,
      currentY,
      {
        width:
          titleWidth
      }
    );


  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.heading
    )
    .fontSize(19)
    .text(
      "Self-Assessment Report",
      left,
      currentY + 28,
      {
        width:
          titleWidth
      }
    );


  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(9.8)
    .text(
      "Depression, Anxiety and Stress Scale — 21",
      left,
      currentY + 56,
      {
        width:
          titleWidth
      }
    );


  drawAssessmentMeta(
    doc,
    {
      x:
        left +
        titleWidth +
        20,

      y:
        currentY,

      width:
        metaWidth,

      assessment,
      result,
      report
    }
  );


  currentY += 98;


  /* =======================================================
     SECTION TITLE
  ======================================================= */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(14)
    .text(
      "Your overall results",
      left,
      currentY,
      {
        width:
          contentWidth
      }
    );


  currentY += 19;


  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(10.5)
    .text(
      "The summary below shows the intensity of the depression-, anxiety-, and stress-related experiences you reported.",
      left,
      currentY,
      {
        width:
          contentWidth
      }
    );


  currentY += 27;


  /* =======================================================
     THREE INTENSITY CARDS
  ======================================================= */

  const cardGap =
    10;


  const cardWidth =
    (
      contentWidth -
      cardGap * 2
    ) / 3;


  const cardHeight =
    178;


  const depressionLevel =
    getResultValue(
      result,
      "depression_level",
      "depressionLevel",
      "normal"
    );


  const anxietyLevel =
    getResultValue(
      result,
      "anxiety_level",
      "anxietyLevel",
      "normal"
    );


  const stressLevel =
    getResultValue(
      result,
      "stress_level",
      "stressLevel",
      "normal"
    );


  drawIntensityCard(
    doc,
    {
      x: left,
      y: currentY,

      width:
        cardWidth,

      height:
        cardHeight,

      title:
        "Depression",

      level:
        depressionLevel
    }
  );


  drawIntensityCard(
    doc,
    {
      x:
        left +
        cardWidth +
        cardGap,

      y: currentY,

      width:
        cardWidth,

      height:
        cardHeight,

      title:
        "Anxiety",

      level:
        anxietyLevel
    }
  );


  drawIntensityCard(
    doc,
    {
      x:
        left +
        (
          cardWidth +
          cardGap
        ) *
          2,

      y: currentY,

      width:
        cardWidth,

      height:
        cardHeight,

      title:
        "Stress",

      level:
        stressLevel
    }
  );


  currentY +=
    cardHeight +
    21;


  /* =======================================================
     DETAILED COMPARISON
  ======================================================= */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(13)
    .text(
      "Detailed score comparison",
      left,
      currentY,
      {
        width:
          contentWidth
      }
    );


  currentY += 18;


  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(9)
    .text(
      "Your numerical scores and the standard DASS-21 severity ranges.",
      left,
      currentY,
      {
        width:
          contentWidth
      }
    );


  currentY += 20;


  currentY =
    drawScoreComparisonTable(
      doc,
      {
        x: left,
        y: currentY,

        width:
          contentWidth,

        result
      }
    );


  currentY += 15;


  /* =======================================================
     IMPORTANT NOTE
  ======================================================= */

  const noteHeight =
    68;


  drawRoundedBox(
    doc,
    {
      x: left,
      y: currentY,

      width:
        contentWidth,

      height:
        noteHeight,

      radius:
        radius.md,

      backgroundColor:
        colors.surfaceSoft,

      borderColor:
        colors.borderStrong,

      borderWidth: 0.8
    }
  );


  doc
    .save()
    .circle(
      left + 25,
      currentY + 25,
      9
    )
    .fillColor(
      colors.primary
    )
    .fill()
    .restore();


  doc
    .fillColor(
      colors.primaryDark
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(12)
    .text(
      "Important note",
      left + 44,
      currentY + 13,
      {
        width:
          contentWidth - 60
      }
    );


  doc
    .fillColor(
      colors.text
    )
    .font(
      fonts.body
    )
    .fontSize(9.5)
    .text(
      "This report is based on a self-assessment and is not a clinical diagnosis. If these experiences are persistent, worsening, or significantly affecting daily life, consider seeking support from a qualified mental health professional.",
      left + 44,
      currentY + 31,
      {
        width:
          contentWidth - 60,

        lineGap: 1.5
      }
    );


  /* =======================================================
     FOOTER
  ======================================================= */

  drawDassPdfFooter(
    doc,
    {
      pageNumber: 1,
      totalPages: 3,
      reportId
    }
  );


  return doc;
}


export default drawDassPdfCover;