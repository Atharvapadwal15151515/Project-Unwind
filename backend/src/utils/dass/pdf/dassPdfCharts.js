import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  clamp,
  safeNumber,
  safeText,
  formatLevel,
  getCategoryColor,
  drawRoundedBox
} from "./dassPdfHelpers.js";


/* =========================================================
   SCORE DATA NORMALIZATION
========================================================= */

export function getDassScoreData(
  result = {}
) {
  return [
    {
      key: "depression",
      label: "Depression",

      score: safeNumber(
        result.depression_score ??
        result.depressionScore
      ),

      level:
        result.depression_level ??
        result.depressionLevel ??
        "normal"
    },

    {
      key: "anxiety",
      label: "Anxiety",

      score: safeNumber(
        result.anxiety_score ??
        result.anxietyScore
      ),

      level:
        result.anxiety_level ??
        result.anxietyLevel ??
        "normal"
    },

    {
      key: "stress",
      label: "Stress",

      score: safeNumber(
        result.stress_score ??
        result.stressScore
      ),

      level:
        result.stress_level ??
        result.stressLevel ??
        "normal"
    }
  ];
}


/* =========================================================
   STANDARD DASS-21 CUT-OFFS
========================================================= */

export const DASS_SEVERITY_RANGES = {
  depression: [
    {
      label: "Normal",
      min: 0,
      max: 9
    },
    {
      label: "Mild",
      min: 10,
      max: 13
    },
    {
      label: "Moderate",
      min: 14,
      max: 20
    },
    {
      label: "Severe",
      min: 21,
      max: 27
    },
    {
      label: "Extremely Severe",
      min: 28,
      max: 42
    }
  ],

  anxiety: [
    {
      label: "Normal",
      min: 0,
      max: 7
    },
    {
      label: "Mild",
      min: 8,
      max: 9
    },
    {
      label: "Moderate",
      min: 10,
      max: 14
    },
    {
      label: "Severe",
      min: 15,
      max: 19
    },
    {
      label: "Extremely Severe",
      min: 20,
      max: 42
    }
  ],

  stress: [
    {
      label: "Normal",
      min: 0,
      max: 14
    },
    {
      label: "Mild",
      min: 15,
      max: 18
    },
    {
      label: "Moderate",
      min: 19,
      max: 25
    },
    {
      label: "Severe",
      min: 26,
      max: 33
    },
    {
      label: "Extremely Severe",
      min: 34,
      max: 42
    }
  ]
};


/* =========================================================
   PAGE 1
   PROFESSIONAL SCORE OVERVIEW
========================================================= */

export function drawDassScoreChart(
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

    height = 150,

    showTitle = true
  } = options;


  const scoreData =
    getDassScoreData(
      result
    );


  /* =======================================================
     WHITE REPORT CARD
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
        colors.white,

      borderColor:
        colors.border,

      borderWidth: 0.8
    }
  );


  let currentY =
    y + 15;


  if (showTitle) {
    doc
      .fillColor(
        colors.heading
      )
      .font(
        fonts.bodyBold
      )
      .fontSize(12)
      .text(
        "Score overview",
        x + 16,
        currentY,
        {
          width:
            width - 32
        }
      );


    currentY += 17;


    doc
      .fillColor(
        colors.textSoft
      )
      .font(
        fonts.body
      )
      .fontSize(8)
      .text(
        "Your three DASS-21 self-assessment scores on a common 0–42 scale.",
        x + 16,
        currentY,
        {
          width:
            width - 32
        }
      );


    currentY += 24;
  }


  /* =======================================================
     COLUMN SIZES
  ======================================================= */

  const labelWidth = 82;

  const scoreWidth = 38;

  const lineX =
    x +
    16 +
    labelWidth;

  const lineWidth =
    width -
    32 -
    labelWidth -
    scoreWidth;


  const rowGap = 31;


  /* =======================================================
     ROWS
  ======================================================= */

  scoreData.forEach(
    (
      item,
      index
    ) => {
      const rowY =
        currentY +
        index *
          rowGap;


      const safeScore =
        clamp(
          item.score,
          0,
          42
        );


      const accent =
        getCategoryColor(
          item.key
        );


      /* CATEGORY */

      doc
        .fillColor(
          colors.heading
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(10.5)
        .text(
          item.label,
          x + 16,
          rowY - 2,
          {
            width:
              labelWidth - 8
          }
        );


      /* THIN BASELINE */

      doc
        .save()
        .strokeColor(
          colors.gray300
        )
        .lineWidth(2)
        .moveTo(
          lineX,
          rowY + 5
        )
        .lineTo(
          lineX +
          lineWidth,
          rowY + 5
        )
        .stroke()
        .restore();


      /* FILLED SCORE LINE */

      const scoreX =
        lineX +
        lineWidth *
          (
            safeScore /
            42
          );


      doc
        .save()
        .strokeColor(
          accent
        )
        .lineWidth(3)
        .moveTo(
          lineX,
          rowY + 5
        )
        .lineTo(
          scoreX,
          rowY + 5
        )
        .stroke()
        .restore();


      /* END MARKER */

      doc
        .save()
        .circle(
          scoreX,
          rowY + 5,
          3.6
        )
        .fillColor(
          colors.white
        )
        .strokeColor(
          accent
        )
        .lineWidth(1.6)
        .fillAndStroke()
        .restore();


      /* SCORE */

      doc
        .fillColor(
          colors.heading
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(9.5)
        .text(
          `${safeScore}/42`,
          lineX +
            lineWidth +
            6,
          rowY - 2,
          {
            width:
              scoreWidth - 6,

            align:
              "right"
          }
        );


      /* RANGE */

      doc
        .fillColor(
          colors.textSoft
        )
        .font(
          fonts.body
        )
        .fontSize(8)
        .text(
          `${formatLevel(
            item.level
          )} range`,
          lineX,
          rowY + 12,
          {
            width:
              lineWidth
          }
        );
    }
  );


  /* =======================================================
     SCALE LABELS
  ======================================================= */

  const axisY =
    currentY +
    scoreData.length *
      rowGap -
    3;


  doc
    .fillColor(
      colors.muted
    )
    .font(
      fonts.body
    )
    .fontSize(7.5)
    .text(
      "0",
      lineX,
      axisY,
      {
        width: 16
      }
    );


  doc
    .text(
      "42",
      lineX +
        lineWidth -
        16,
      axisY,
      {
        width: 16,
        align: "right"
      }
    );


  doc.y =
    y +
    height +
    10;


  return doc.y;
}


/* =========================================================
   SINGLE PROFESSIONAL SEVERITY SCALE
========================================================= */

export function drawSeverityRangeScale(
  doc,
  options = {}
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  const {
    x,
    y,
    width,

    category,
    label,
    score = 0,
    level = "normal",

    height = 70
  } = options;


  const normalizedCategory =
    safeText(
      category,
      ""
    )
      .toLowerCase()
      .trim();


  const ranges =
    DASS_SEVERITY_RANGES[
      normalizedCategory
    ] ??
    [];


  const safeScore =
    clamp(
      score,
      0,
      42
    );


  const accent =
    getCategoryColor(
      normalizedCategory
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
        colors.white,

      borderColor:
        colors.border,

      borderWidth: 0.8
    }
  );


  /* =======================================================
     HEADER
  ======================================================= */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(10)
    .text(
      safeText(
        label,
        category
      ),
      x + 14,
      y + 11,
      {
        width:
          width * 0.4
      }
    );


  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(10)
    .text(
      `${safeScore}/42`,
      x +
        width -
        58,
      y + 11,
      {
        width: 44,
        align: "right"
      }
    );


  /* =======================================================
     MAIN AXIS
  ======================================================= */

  const axisX =
    x + 14;

  const axisY =
    y + 34;

  const axisWidth =
    width - 28;


  doc
    .save()
    .strokeColor(
      colors.gray300
    )
    .lineWidth(2)
    .moveTo(
      axisX,
      axisY
    )
    .lineTo(
      axisX +
      axisWidth,
      axisY
    )
    .stroke()
    .restore();


  /* =======================================================
     THRESHOLD TICKS
  ======================================================= */

  ranges
    .slice(
      0,
      -1
    )
    .forEach(
      (range) => {
        const threshold =
          range.max + 1;


        const thresholdX =
          axisX +
          axisWidth *
            (
              threshold /
              42
            );


        doc
          .save()
          .strokeColor(
            colors.gray500
          )
          .lineWidth(0.7)
          .moveTo(
            thresholdX,
            axisY - 4
          )
          .lineTo(
            thresholdX,
            axisY + 4
          )
          .stroke()
          .restore();
      }
    );


  /* =======================================================
     SCORE MARKER
  ======================================================= */

  const markerX =
    axisX +
    axisWidth *
      (
        safeScore /
        42
      );


  doc
    .save()
    .circle(
      markerX,
      axisY,
      4.3
    )
    .fillColor(
      colors.white
    )
    .strokeColor(
      accent
    )
    .lineWidth(1.8)
    .fillAndStroke()
    .restore();


  /* =======================================================
     LABEL BELOW
  ======================================================= */

  doc
    .fillColor(
      colors.primaryStrong
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(8.3)
    .text(
      `${formatLevel(
        level
      )} range`,
      axisX,
      axisY + 12,
      {
        width:
          axisWidth * 0.6
      }
    );


  doc
    .fillColor(
      colors.muted
    )
    .font(
      fonts.body
    )
    .fontSize(7.3)
    .text(
      "0",
      axisX,
      axisY + 26,
      {
        width: 12
      }
    );


  doc
    .text(
      "42",
      axisX +
        axisWidth -
        18,
      axisY + 26,
      {
        width: 18,
        align: "right"
      }
    );


  return (
    y +
    height
  );
}


/* =========================================================
   PAGE 2 — THREE SCALES
========================================================= */

export function drawDassSeverityChart(
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

    title =
      "Where your scores sit",

    subtitle =
      "The marker shows your score within each DASS-21 self-assessment range."
  } = options;


  const scoreData =
    getDassScoreData(
      result
    );


  let currentY =
    y;


  /* TITLE */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(12)
    .text(
      title,
      x,
      currentY,
      {
        width
      }
    );


  currentY += 16;


  /* SUBTITLE */

  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(8.8)
    .text(
      subtitle,
      x,
      currentY,
      {
        width,
        lineGap: 1.8
      }
    );


  currentY += 25;


  /* SCALES */

  const scaleHeight = 68;

  const scaleGap = 7;


  scoreData.forEach(
    (
      item,
      index
    ) => {
      drawSeverityRangeScale(
        doc,
        {
          x,

          y:
            currentY +
            index *
              (
                scaleHeight +
                scaleGap
              ),

          width,

          category:
            item.key,

          label:
            item.label,

          score:
            item.score,

          level:
            item.level,

          height:
            scaleHeight
        }
      );
    }
  );


  doc.y =
    currentY +
    scoreData.length *
      (
        scaleHeight +
        scaleGap
      ) -
    scaleGap;


  return doc.y;
}


/* =========================================================
   MINI SCORE LINE
========================================================= */

export function drawMiniScoreBar(
  doc,
  options = {}
) {
  const {
    colors,
    fonts
  } = DASS_PDF_THEME;


  const {
    x,
    y,
    width,

    category,
    score = 0,

    maximum = 42
  } = options;


  const safeScore =
    clamp(
      score,
      0,
      maximum
    );


  const accent =
    getCategoryColor(
      category
    );


  const endX =
    x +
    width *
      (
        safeScore /
        maximum
      );


  doc
    .save()
    .strokeColor(
      colors.gray300
    )
    .lineWidth(2)
    .moveTo(
      x,
      y
    )
    .lineTo(
      x + width,
      y
    )
    .stroke()
    .restore();


  doc
    .save()
    .strokeColor(
      accent
    )
    .lineWidth(2.5)
    .moveTo(
      x,
      y
    )
    .lineTo(
      endX,
      y
    )
    .stroke()
    .restore();


  doc
    .save()
    .circle(
      endX,
      y,
      3
    )
    .fillColor(
      colors.white
    )
    .strokeColor(
      accent
    )
    .lineWidth(1.3)
    .fillAndStroke()
    .restore();


  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(7.8)
    .text(
      `${safeScore}/${maximum}`,
      x,
      y + 8,
      {
        width,
        align: "right"
      }
    );
}


export default {
  getDassScoreData,
  drawDassScoreChart,
  drawSeverityRangeScale,
  drawDassSeverityChart,
  drawMiniScoreBar,
  DASS_SEVERITY_RANGES
};