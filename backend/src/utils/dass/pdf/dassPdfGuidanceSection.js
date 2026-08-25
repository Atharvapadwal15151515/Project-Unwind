import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import {
  safeText,
  drawRoundedBox,
  getHighestSeverity,
  getCategoryColor
} from "./dassPdfHelpers.js";

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


/* =========================================================
   GUIDANCE CONTENT
========================================================= */

function getGuidanceForCategory(
  category
) {
  const normalized =
    safeText(
      category,
      ""
    )
      .toLowerCase()
      .trim();

  const guidance = {
    depression: {
      title:
        "Low mood & motivation",

      subtitle:
        "If depression-related experiences stood out",

      actions: [
        "Keep your routine small and achievable.",
        "Stay connected with someone you trust.",
        "Include one activity that brings comfort or meaning."
      ]
    },

    anxiety: {
      title:
        "Worry & anxiety",

      subtitle:
        "If anxiety-related experiences stood out",

      actions: [
        "Slow your breathing when tension rises.",
        "Reduce unnecessary overstimulation when possible.",
        "Write recurring worries down instead of carrying them mentally."
      ]
    },

    stress: {
      title:
        "Pressure & stress",

      subtitle:
        "If stress-related experiences stood out",

      actions: [
        "Break demanding tasks into smaller steps.",
        "Build short recovery periods into your day.",
        "Notice situations where clearer boundaries may help."
      ]
    }
  };

  return (
    guidance[normalized] ??
    guidance.stress
  );
}


/* =========================================================
   PROFESSIONAL SUPPORT COPY
========================================================= */

function getSupportRecommendation(
  result = {}
) {
  const highest =
    getHighestSeverity(
      result
    );

  const level =
    safeText(
      highest?.level,
      "normal"
    )
      .replaceAll("_", " ")
      .toLowerCase()
      .trim();

  if (
    level === "normal"
  ) {
    return (
      "Your current responses fall within the normal DASS-21 ranges. " +
      "You can use this result as a baseline and check in again if your circumstances or wellbeing change."
    );
  }

  if (
    level === "mild"
  ) {
    return (
      "Your responses suggest some mild difficulty. Supportive routines and self-reflection may help. " +
      "Consider professional support if these experiences persist or begin affecting daily life."
    );
  }

  if (
    level === "moderate"
  ) {
    return (
      "At least one area falls within the moderate self-assessment range. " +
      "Consider discussing what you are experiencing with a qualified mental health professional if it is persistent or disruptive."
    );
  }

  if (
    level === "severe"
  ) {
    return (
      "At least one area falls within the severe self-assessment range. " +
      "Professional support may be more appropriate than relying only on self-help strategies."
    );
  }

  if (
    level ===
    "extremely severe"
  ) {
    return (
      "At least one area falls within the extremely severe self-assessment range. " +
      "This is not a diagnosis, but speaking with a qualified mental health professional is strongly worth considering."
    );
  }

  return (
    "Use these results as one source of information about how you have been feeling. " +
    "Professional support can provide a more complete assessment when needed."
  );
}


/* =========================================================
   STEP CARD
========================================================= */

function drawStepCard(
  doc,
  {
    x,
    y,
    width,
    height,
    number,
    title,
    text
  }
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  /* CARD */

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


  /* NUMBER */

  doc
    .save()
    .circle(
      x + 22,
      y + 23,
      11
    )
    .fillColor(
      colors.primaryDark
    )
    .fill()
    .restore();


  doc
    .fillColor(
      colors.inverseText
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(8.5)
    .text(
      String(number),
      x + 16,
      y + 19,
      {
        width: 12,
        align: "center",
        lineBreak: false
      }
    );


  /* TITLE */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(9.5)
    .text(
      title,
      x + 42,
      y + 14,
      {
        width:
          width - 56,

        lineGap: 1
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
    .fontSize(9.2)
    .text(
      text,
      x + 42,
      y + 34,
      {
        width:
          width - 56,

        lineGap: 2.2
      }
    );
}


/* =========================================================
   FOCUS AREA ROW
========================================================= */

function drawFocusRow(
  doc,
  {
    x,
    y,
    width,
    height,
    category
  }
) {
  const {
    colors,
    fonts,
    radius
  } = DASS_PDF_THEME;


  const content =
    getGuidanceForCategory(
      category
    );


  const accent =
    getCategoryColor(
      category
    );


  /* MAIN CARD */

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


  /* LEFT ACCENT */

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


  /* TITLE */

  doc
    .fillColor(
      colors.heading
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(10)
    .text(
      content.title,
      x + 16,
      y + 12,
      {
        width: 130
      }
    );


  /* SUBTITLE */

  doc
    .fillColor(
      colors.muted
    )
    .font(
      fonts.body
    )
    .fontSize(7.2)
    .text(
      content.subtitle,
      x + 16,
      y + 29,
      {
        width: 135,
        lineGap: 1.5
      }
    );


  /* SEPARATOR */

  doc
    .save()
    .strokeColor(
      colors.divider
    )
    .lineWidth(0.7)
    .moveTo(
      x + 160,
      y + 12
    )
    .lineTo(
      x + 160,
      y + height - 12
    )
    .stroke()
    .restore();


  /* ACTIONS */

  const actionX =
    x + 178;

  const actionWidth =
    width - 194;


  content.actions.forEach(
    (
      action,
      index
    ) => {
      const rowY =
        y +
        12 +
        index * 17;


      doc
        .save()
        .circle(
          actionX + 3,
          rowY + 4,
          2
        )
        .fillColor(
          accent
        )
        .fill()
        .restore();


      doc
        .fillColor(
          colors.text
        )
        .font(
          fonts.body
        )
        .fontSize(9)
        .text(
          action,
          actionX + 12,
          rowY,
          {
            width:
              actionWidth - 12,

            lineGap: 1.5
          }
        );
    }
  );
}


/* =========================================================
   PAGE 3
========================================================= */

export function drawDassPdfGuidanceSection(
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
     NEW PAGE
  ======================================================= */

  doc.addPage();


  /* =======================================================
     HEADER
  ======================================================= */

  drawDassPdfHeader(
    doc,
    {
      pageLabel:
        "NEXT STEPS"
    }
  );


  let currentY =
    doc.y;


  /* =======================================================
     PAGE TITLE
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
      "What you can do next",
      left,
      currentY,
      {
        width:
          contentWidth
      }
    );


  currentY += 29;


  doc
    .fillColor(
      colors.textSoft
    )
    .font(
      fonts.body
    )
    .fontSize(10)
    .text(
      "Use your results as a point for reflection, not as a label. Start with small actions and pay attention to how your experiences change over time.",
      left,
      currentY,
      {
        width:
          contentWidth,

        lineGap: 2.3
      }
    );


  currentY += 47;


  /* =======================================================
     SECTION 1
  ======================================================= */

  doc
    .fillColor(
      colors.primaryStrong
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(8.5)
    .text(
      "RECOMMENDED NEXT STEPS",
      left,
      currentY,
      {
        width:
          contentWidth,

        characterSpacing: 0.9
      }
    );


  currentY += 18;


  /* =======================================================
     2 × 2 STEP GRID
  ======================================================= */

  const gridGap = 10;

  const stepWidth =
    (
      contentWidth -
      gridGap
    ) / 2;

  const stepHeight = 76;


  drawStepCard(
    doc,
    {
      x: left,
      y: currentY,

      width:
        stepWidth,

      height:
        stepHeight,

      number: 1,

      title:
        "Notice what stands out",

      text:
        "Look at the area with the highest score and consider where those experiences appear in everyday life."
    }
  );


  drawStepCard(
    doc,
    {
      x:
        left +
        stepWidth +
        gridGap,

      y: currentY,

      width:
        stepWidth,

      height:
        stepHeight,

      number: 2,

      title:
        "Choose one small action",

      text:
        "Pick one manageable response rather than trying to change everything at once."
    }
  );


  currentY +=
    stepHeight +
    gridGap;


  drawStepCard(
    doc,
    {
      x: left,
      y: currentY,

      width:
        stepWidth,

      height:
        stepHeight,

      number: 3,

      title:
        "Check in again later",

      text:
        "Notice patterns over the next several days and compare how your responses change over time."
    }
  );


  drawStepCard(
    doc,
    {
      x:
        left +
        stepWidth +
        gridGap,

      y: currentY,

      width:
        stepWidth,

      height:
        stepHeight,

      number: 4,

      title:
        "Reach out when needed",

      text:
        "Seek professional support if difficult experiences persist, worsen, or interfere with daily life."
    }
  );


  currentY +=
    stepHeight +
    24;


  /* =======================================================
     SECTION 2
  ======================================================= */

  doc
    .fillColor(
      colors.primaryStrong
    )
    .font(
      fonts.bodyBold
    )
    .fontSize(8.5)
    .text(
      "PRACTICAL FOCUS AREAS",
      left,
      currentY,
      {
        width:
          contentWidth,

        characterSpacing: 0.9
      }
    );


  currentY += 18;


  /* =======================================================
     THREE HORIZONTAL ROWS
  ======================================================= */

  const focusHeight = 67;

  const focusGap = 8;


  drawFocusRow(
    doc,
    {
      x: left,
      y: currentY,

      width:
        contentWidth,

      height:
        focusHeight,

      category:
        "depression"
    }
  );


  currentY +=
    focusHeight +
    focusGap;


  drawFocusRow(
    doc,
    {
      x: left,
      y: currentY,

      width:
        contentWidth,

      height:
        focusHeight,

      category:
        "anxiety"
    }
  );


  currentY +=
    focusHeight +
    focusGap;


  drawFocusRow(
    doc,
    {
      x: left,
      y: currentY,

      width:
        contentWidth,

      height:
        focusHeight,

      category:
        "stress"
    }
  );


  currentY +=
    focusHeight +
    18;


  /* =======================================================
     PROFESSIONAL SUPPORT
  ======================================================= */

  const supportHeight = 94;


  drawRoundedBox(
    doc,
    {
      x: left,
      y: currentY,

      width:
        contentWidth,

      height:
        supportHeight,

      radius:
        radius.md,

      backgroundColor:
        colors.surfaceSoft,

      borderColor:
        colors.borderStrong,

      borderWidth: 0.8
    }
  );


  /* GREEN ACCENT */

  doc
    .save()
    .roundedRect(
      left,
      currentY,
      5,
      supportHeight,
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
    .fontSize(12)
    .text(
      "When professional support may help",
      left + 18,
      currentY + 14,
      {
        width:
          contentWidth - 36
      }
    );


  doc
    .fillColor(
      colors.text
    )
    .font(
      fonts.body
    )
    .fontSize(9.4)
    .text(
      getSupportRecommendation(
        result
      ),
      left + 18,
      currentY + 35,
      {
        width:
          contentWidth - 36,

        lineGap: 2.2
      }
    );


  doc
    .fillColor(
      colors.muted
    )
    .font(
      fonts.body
    )
    .fontSize(8.8)
    .text(
      "DASS-21 is a self-report screening instrument. It does not provide a diagnosis or replace assessment by a qualified professional.",
      left + 18,
      currentY + 70,
      {
        width:
          contentWidth - 36,

        lineGap: 1.5
      }
    );


  /* =======================================================
     FOOTER
  ======================================================= */

  drawDassPdfFooter(
    doc,
    {
      pageNumber: 3,
      totalPages: 3,
      reportId
    }
  );


  return doc;
}


/* =========================================================
   LEGACY EXPORT
========================================================= */

export const drawGuidanceSection =
  drawDassPdfGuidanceSection;


export default drawDassPdfGuidanceSection;