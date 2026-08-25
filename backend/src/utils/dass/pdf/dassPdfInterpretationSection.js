import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  safeText,
  safeNumber,
  drawRoundedBox,
  getCategoryColor,
  getHighestSeverity,
  formatLevel
} from "./dassPdfHelpers.js";

import {
  getDassScoreData
} from "./dassPdfCharts.js";

import {
  drawDassPdfHeader
} from "./dassPdfHeader.js";

import {
  drawDassPdfFooter
} from "./dassPdfFooter.js";


/* =========================================================
   INTERNAL HELPERS
========================================================= */

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


function normalizeLevel(
  level
) {
  return safeText(
    level,
    "normal"
  )
    .replaceAll("_", " ")
    .toLowerCase()
    .trim();
}


/* =========================================================
   INTERPRETATION TEXT
========================================================= */

function getInterpretationText(
  category,
  level
) {
  const categoryKey =
    safeText(
      category,
      ""
    )
      .toLowerCase()
      .trim();


  const levelKey =
    normalizeLevel(
      level
    );


  const copy = {
    depression: {
      normal:
        "Your responses indicate a lower level of depression-related experiences during this self-assessment period.",

      mild:
        "Your responses indicate some depression-related experiences, such as lower mood, reduced motivation, or reduced enjoyment.",

      moderate:
        "Your responses indicate a moderate level of depression-related experiences, including possible difficulty with mood, motivation, or enjoyment.",

      severe:
        "Your responses indicate a high level of depression-related experiences. Additional attention may be appropriate if these experiences persist or affect daily functioning.",

      "extremely severe":
        "Your responses indicate a very high level of depression-related experiences. This is not a diagnosis, but professional assessment should be considered if these experiences are persistent or disruptive."
    },


    anxiety: {
      normal:
        "Your responses indicate a lower level of anxiety-related experiences during this self-assessment period.",

      mild:
        "Your responses indicate some anxiety-related experiences, such as worry, nervousness, fear, or physical tension.",

      moderate:
        "Your responses indicate a moderate level of anxiety-related experiences, including possible worry, fear, nervousness, or physical arousal.",

      severe:
        "Your responses indicate a high level of anxiety-related experiences. Additional attention may be appropriate if these experiences affect comfort, concentration, or daily activities.",

      "extremely severe":
        "Your responses indicate a very high level of anxiety-related experiences. This is not a diagnosis, but professional assessment should be considered if these experiences are persistent or disruptive."
    },


    stress: {
      normal:
        "Your responses indicate a lower level of stress-related experiences during this self-assessment period.",

      mild:
        "Your responses indicate some stress-related experiences, such as tension, irritability, pressure, or difficulty relaxing.",

      moderate:
        "Your responses indicate a moderate level of stress-related experiences, including possible tension, pressure, irritability, or difficulty relaxing.",

      severe:
        "Your responses indicate a high level of stress-related experiences. Additional attention may be appropriate if these experiences persist or affect daily functioning.",

      "extremely severe":
        "Your responses indicate a very high level of stress-related experiences. This is not a diagnosis, but professional assessment should be considered if these experiences are persistent or disruptive."
    }
  };


  return (
    copy[
      categoryKey
    ]?.[
      levelKey
    ] ??
    "This score reflects the responses you provided in this area and should be interpreted as self-reported symptom severity rather than as a diagnosis."
  );
}


/* =========================================================
   OVERALL TEXT
========================================================= */

function buildOverallInterpretation(
  result = {}
) {
  const highest =
    getHighestSeverity(
      result
    );


  const area =
    safeText(
      highest?.label,
      "your results"
    );


  const level =
    normalizeLevel(
      highest?.level
    );


  if (
    level === "normal"
  ) {
    return (
      "All three areas currently fall within the normal DASS-21 ranges. " +
      "These results can serve as a baseline for future self-reflection. " +
      "A normal-range result does not rule out distress or a mental health condition."
    );
  }


  if (
    level === "mild"
  ) {
    return (
      `${area} is the most elevated area in this self-assessment and falls within the mild range. ` +
      "Monitor whether these experiences persist, increase, or begin affecting everyday life."
    );
  }


  if (
    level === "moderate"
  ) {
    return (
      `${area} is the most elevated area and falls within the moderate range. ` +
      "If these experiences persist, worsen, or interfere with daily life, consider discussing them with a qualified mental health professional."
    );
  }


  if (
    level === "severe"
  ) {
    return (
      `${area} is the most elevated area and falls within the severe range. ` +
      "This indicates a high level of self-reported difficulty. Professional support may be appropriate, particularly if these experiences are persistent or disruptive."
    );
  }


  if (
    level ===
    "extremely severe"
  ) {
    return (
      `${area} is the most elevated area and falls within the extremely severe range. ` +
      "This represents a very high level of self-reported difficulty. The DASS-21 cannot establish a diagnosis, but professional assessment should be considered."
    );
  }


  return (
    "Your results provide a snapshot of the experiences you reported. " +
    "They should be interpreted in the context of your circumstances and not as a diagnosis."
  );
}


/* =========================================================
   COMPACT SCORE POSITION
========================================================= */

function drawCompactScorePosition(
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
    fonts
  } = DASS_PDF_THEME;


  const items =
    getDassScoreData(
      result
    );


  const labelWidth =
    78;


  const scoreWidth =
    40;


  const axisX =
    x +
    labelWidth;


  const axisWidth =
    width -
    labelWidth -
    scoreWidth;


  const rowHeight =
    34;


  items.forEach(
    (
      item,
      index
    ) => {
      const rowY =
        y +
        index *
          rowHeight;


      const score =
        Math.max(
          0,
          Math.min(
            safeNumber(
              item.score,
              0
            ),
            42
          )
        );


      const accent =
        getCategoryColor(
          item.key
        );


      /* LABEL */

      doc
        .fillColor(
          colors.heading
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(9.3)
        .text(
          item.label,
          x,
          rowY,
          {
            width:
              labelWidth - 8
          }
        );


      /* AXIS */

      doc
        .save()
        .strokeColor(
          colors.gray300
        )
        .lineWidth(1.5)
        .moveTo(
          axisX,
          rowY + 6
        )
        .lineTo(
          axisX +
            axisWidth,
          rowY + 6
        )
        .stroke()
        .restore();


      /* MARKER */

      const markerX =
        axisX +
        axisWidth *
          (
            score /
            42
          );


      doc
        .save()
        .circle(
          markerX,
          rowY + 6,
          3.5
        )
        .fillColor(
          colors.white
        )
        .strokeColor(
          accent
        )
        .lineWidth(1.5)
        .fillAndStroke()
        .restore();


      /* RANGE */

      doc
        .fillColor(
          colors.primaryStrong
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(7.7)
        .text(
          `${formatLevel(
            item.level
          )} range`,
          axisX,
          rowY + 14,
          {
            width:
              axisWidth
          }
        );


      /* SCORE */

      doc
        .fillColor(
          colors.heading
        )
        .font(
          fonts.bodyBold
        )
        .fontSize(9)
        .text(
          `${score}/42`,
          axisX +
            axisWidth +
            5,
          rowY,
          {
            width:
              scoreWidth - 5,

            align:
              "right"
          }
        );
    }
  );


  return (
    y +
    items.length *
      rowHeight
  );
}


/* =========================================================
   INTERPRETATION ROW
========================================================= */

function drawInterpretationRow(
  doc,
  {
    x,
    y,
    width,
    height,
    item
  }
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  const accent =
    getCategoryColor(
      item.key
    );


  const score =
    safeNumber(
      item.score,
      0
    );


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


  /* ACCENT */

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
      accent
    )
    .fill()
    .restore();


  /* LEFT COLUMN */

  const metaWidth =
    128;


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
      x + 15,
      y + 10,
      {
        width:
          metaWidth
      }
    );


  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(7.8)
    .text(
      `Score ${score}/42`,
      x + 15,
      y + 26,
      {
        width:
          metaWidth
      }
    );


  doc
    .fillColor(
      colors.primaryStrong
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(7.9)
    .text(
      `${formatLevel(
        item.level
      )} range`,
      x + 15,
      y + 41,
      {
        width:
          metaWidth
      }
    );


  /* DIVIDER */

  const dividerX =
    x + 145;


  doc
    .save()
    .strokeColor(
      colors.divider
    )
    .lineWidth(0.7)
    .moveTo(
      dividerX,
      y + 9
    )
    .lineTo(
      dividerX,
      y + height - 9
    )
    .stroke()
    .restore();


  /* DESCRIPTION */

  doc
    .fillColor(
      colors.text
    )
    .font(
      fonts.body
    )
    .fontSize(8.3)
    .text(
      getInterpretationText(
        item.key,
        item.level
      ),
      dividerX + 16,
      y + 10,
      {
        width:
          width -
          (
            dividerX -
            x
          ) -
          30,

        lineGap: 1.5
      }
    );
}


/* =========================================================
   PAGE 2
========================================================= */

export function drawDassPdfInterpretationSection(
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


  const width =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;


  const reportId =
    getReportId(
      report,
      assessment
    );


  doc.addPage();


  drawDassPdfHeader(
    doc,
    {
      pageLabel:
        "RESULT INTERPRETATION"
    }
  );


  let currentY =
    doc.y;


  /* =======================================================
     TITLE
  ======================================================= */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.heading
    )
    .fontSize(19)
    .text(
      "Understanding your results",
      left,
      currentY,
      {
        width
      }
    );


  currentY += 27;


  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(8.5)
    .text(
      "Your DASS-21 scores summarize the intensity of depression-, anxiety-, and stress-related experiences you reported. Higher scores indicate greater self-reported severity within that area.",
      left,
      currentY,
      {
        width,
        lineGap: 1.7
      }
    );


  currentY += 39;


  /* =======================================================
   HOW TO READ THIS REPORT
======================================================= */

doc
  .fillColor(
    colors.primaryStrong
  )
  .font(
    fonts.bodyBold
  )
  .fontSize(6.5)
  .text(
    "HOW TO READ THIS REPORT",
    left,
    currentY,
    {
      width,
      characterSpacing: 0.8
    }
  );


currentY += 18;


const infoGap = 10;

const infoWidth =
  (
    width -
    infoGap * 2
  ) / 3;

const infoHeight =
  92;


const infoCards = [
  {
    title:
      "Self-report",

    text:
      "These results are based only on the responses you provided during this self-assessment."
  },

  {
    title:
      "A current snapshot",

    text:
      "The scores reflect your reported experiences during the assessment period and may change over time."
  },

  {
    title:
      "Not a diagnosis",

    text:
      "DASS-21 scores do not confirm or exclude a mental health condition and should not be used as a diagnosis."
  }
];


infoCards.forEach(
  (
    card,
    index
  ) => {
    const cardX =
      left +
      index *
        (
          infoWidth +
          infoGap
        );


    drawRoundedBox(
      doc,
      {
        x:
          cardX,

        y:
          currentY,

        width:
          infoWidth,

        height:
          infoHeight,

        radius:
          radius.md,

        backgroundColor:
          colors.white,

        borderColor:
          colors.border,

        borderWidth:
          0.8
      }
    );


    doc
      .save()
      .roundedRect(
        cardX,
        currentY,
        4,
        infoHeight,
        2
      )
      .fillColor(
        colors.primaryStrong
      )
      .fill()
      .restore();


    doc
      .fillColor(
        colors.heading
      )
      .font(
        fonts.bodyBold
      )
      .fontSize(10.5)
      .text(
        card.title,
        cardX + 14,
        currentY + 13,
        {
          width:
            infoWidth - 28
        }
      );


    doc
      .fillColor(
        colors.textSoft
      )
      .font(
        fonts.body
      )
      .fontSize(8.8)
      .text(
        card.text,
        cardX + 14,
        currentY + 34,
        {
          width:
            infoWidth - 28,

          lineGap: 1.7
        }
      );
  }
);


currentY +=
  infoHeight +
  20;

  /* =======================================================
     CATEGORY INTERPRETATION
  ======================================================= */

  doc
    .fillColor(
      colors.primaryStrong
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(8)
    .text(
      "WHAT YOUR SCORES INDICATE",
      left,
      currentY,
      {
        width,
        characterSpacing: 0.8
      }
    );


  currentY += 17;


  const scoreData =
    getDassScoreData(
      result
    );


  const rowHeight =
    62;


  const rowGap =
    7;


  scoreData.forEach(
    (
      item,
      index
    ) => {
      drawInterpretationRow(
        doc,
        {
          x: left,

          y:
            currentY +
            index *
              (
                rowHeight +
                rowGap
              ),

          width,

          height:
            rowHeight,

          item
        }
      );
    }
  );


  currentY +=
    scoreData.length *
      (
        rowHeight +
        rowGap
      ) -
    rowGap +
    16;


  /* =======================================================
     OVERALL + LIMITATIONS
  ======================================================= */

  const bottomHeight =
    102;


  drawRoundedBox(
    doc,
    {
      x: left,
      y: currentY,

      width,

      height:
        bottomHeight,

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
    .roundedRect(
      left,
      currentY,
      5,
      bottomHeight,
      2
    )
    .fillColor(
      colors.primaryStrong
    )
    .fill()
    .restore();


  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(10.5)
    .text(
      "Overall interpretation",
      left + 17,
      currentY + 11,
      {
        width:
          width - 34
      }
    );


  doc
    .fillColor(
      colors.text
    )
    .font(
      fonts.body
    )
    .fontSize(8.2)
    .text(
      buildOverallInterpretation(
        result
      ),
      left + 17,
      currentY + 28,
      {
        width:
          width - 34,

        lineGap: 1.5
      }
    );


  /* DIVIDER */

  doc
    .save()
    .strokeColor(
      colors.borderStrong
    )
    .lineWidth(0.6)
    .moveTo(
      left + 17,
      currentY + 64
    )
    .lineTo(
      left +
        width -
        17,
      currentY + 64
    )
    .stroke()
    .restore();


  doc
    .fillColor(
      colors.muted
    )
    .font(
      fonts.body
    )
    .fontSize(8.5)
    .text(
      "Interpretation note: DASS-21 is a self-report screening measure. Scores describe the intensity of experiences reported through the questionnaire and do not establish or exclude a mental health diagnosis. Results should be considered together with personal circumstances and, where appropriate, professional assessment.",
      left + 17,
      currentY + 72,
      {
        width:
          width - 34,

        lineGap: 1.2
      }
    );


  /* =======================================================
     FOOTER
  ======================================================= */

  drawDassPdfFooter(
    doc,
    {
      pageNumber: 2,
      totalPages: 3,
      reportId
    }
  );


  return doc;
}


export const drawInterpretationSection =
  drawDassPdfInterpretationSection;


export default drawDassPdfInterpretationSection;