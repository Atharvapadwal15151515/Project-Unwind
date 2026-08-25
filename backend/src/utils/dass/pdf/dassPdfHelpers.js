import DASS_PDF_THEME
  from "./dassPdfTheme.js";


/* =========================================================
   SAFE VALUE HELPERS
========================================================= */

export function safeText(
  value,
  fallback = "Not available"
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
}


export function safeNumber(
  value,
  fallback = 0
) {
  const number = Number(value);

  if (
    Number.isNaN(number) ||
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return number;
}


export function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    Math.max(
      safeNumber(
        value,
        minimum
      ),
      minimum
    ),
    maximum
  );
}


/* =========================================================
   SEVERITY FORMATTING
========================================================= */

export function normalizeLevel(
  value
) {
  return safeText(
    value,
    "normal"
  )
    .replaceAll("_", " ")
    .trim()
    .toLowerCase();
}


export function formatLevel(
  value
) {
  const normalized =
    normalizeLevel(value);

  if (
    normalized ===
    "extremely severe"
  ) {
    return "Extremely Severe";
  }

  return normalized.replace(
    /\b\w/g,
    (letter) =>
      letter.toUpperCase()
  );
}


export function getSeverityPriority(
  level
) {
  const priorities = {
    normal: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
    "extremely severe": 4
  };

  return (
    priorities[
      normalizeLevel(level)
    ] ?? 0
  );
}


/* =========================================================
   DATE HELPERS
========================================================= */

export function formatDate(
  value,
  fallback = "Not available"
) {
  if (!value) {
    return fallback;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return safeText(
      value,
      fallback
    );
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  ).format(date);
}


export function formatDateTime(
  value,
  fallback = "Not available"
) {
  if (!value) {
    return fallback;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return safeText(
      value,
      fallback
    );
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


/* =========================================================
   PAGE DIMENSIONS
========================================================= */

export function getContentWidth(
  doc
) {
  return (
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right
  );
}


export function getContentBottom(
  doc,
  footerSpace =
    DASS_PDF_THEME.page
      .footerHeight
) {
  return (
    doc.page.height -
    doc.page.margins.bottom -
    footerSpace
  );
}


/*
 * We will use this far less than
 * before because the new report
 * intentionally controls each page.
 *
 * It remains useful for defensive
 * layout handling.
 */
export function ensureSpace(
  doc,
  requiredHeight,
  options = {}
) {
  const {
    footerSpace =
      DASS_PDF_THEME.page
        .footerHeight,

    onNewPage
  } = options;

  const contentBottom =
    getContentBottom(
      doc,
      footerSpace
    );

  if (
    doc.y +
      requiredHeight >
    contentBottom
  ) {
    doc.addPage();

    if (
      typeof onNewPage ===
      "function"
    ) {
      onNewPage(doc);
    }

    return true;
  }

  return false;
}


/* =========================================================
   BASIC DRAWING HELPERS
========================================================= */

export function drawRoundedBox(
  doc,
  {
    x,
    y,
    width,
    height,

    radius =
      DASS_PDF_THEME.radius.md,

    backgroundColor =
      DASS_PDF_THEME.colors.card,

    borderColor =
      DASS_PDF_THEME.colors.border,

    borderWidth = 1
  }
) {
  doc
    .save()
    .roundedRect(
      x,
      y,
      width,
      height,
      radius
    )
    .fillColor(
      backgroundColor
    )
    .fill();

  if (
    borderWidth > 0
  ) {
    doc
      .strokeColor(
        borderColor
      )
      .lineWidth(
        borderWidth
      )
      .stroke();
  }

  doc.restore();
}


export function drawDivider(
  doc,
  {
    x =
      doc.page.margins.left,

    y = doc.y,

    width =
      getContentWidth(doc),

    color =
      DASS_PDF_THEME.colors
        .borderSoft,

    lineWidth = 0.8
  } = {}
) {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(lineWidth)
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
}


/* =========================================================
   SECTION LABEL
========================================================= */

export function drawEyebrow(
  doc,
  {
    text,
    x =
      doc.page.margins.left,

    y = doc.y,

    color =
      DASS_PDF_THEME.colors
        .primary,

    width =
      getContentWidth(doc)
  }
) {
  doc
    .fillColor(color)
    .font(
      DASS_PDF_THEME.fonts
        .bodyBold
    )
    .fontSize(7.5)
    .text(
      safeText(text, "")
        .toUpperCase(),

      x,
      y,
      {
        width,
        characterSpacing: 1.1
      }
    );
}


/* =========================================================
   SECTION HEADING
========================================================= */

export function drawSectionHeading(
  doc,
  {
    title,
    subtitle = "",

    eyebrow = "",

    x =
      doc.page.margins.left,

    y = doc.y,

    width =
      getContentWidth(doc),

    titleColor =
      DASS_PDF_THEME.colors
        .heading,

    subtitleColor =
      DASS_PDF_THEME.colors
        .textSoft,

    spacingAfter = 14
  }
) {
  let currentY = y;

  if (eyebrow) {
    drawEyebrow(
      doc,
      {
        text: eyebrow,
        x,
        y: currentY,
        width
      }
    );

    currentY += 16;
  }

  doc
    .fillColor(
      titleColor
    )
    .font(
      DASS_PDF_THEME.fonts
        .heading
    )
    .fontSize(
      DASS_PDF_THEME.fontSizes
        .pageTitle
    )
    .text(
      safeText(
        title,
        ""
      ),
      x,
      currentY,
      {
        width,
        lineGap: 1
      }
    );

  currentY =
    doc.y;

  if (subtitle) {
    currentY += 5;

    doc
      .fillColor(
        subtitleColor
      )
      .font(
        DASS_PDF_THEME.fonts.body
      )
      .fontSize(
        DASS_PDF_THEME.fontSizes
          .body
      )
      .text(
        safeText(
          subtitle,
          ""
        ),
        x,
        currentY,
        {
          width,
          lineGap: 3
        }
      );

    currentY =
      doc.y;
  }

  doc.y =
    currentY +
    spacingAfter;
}


/* =========================================================
   SEVERITY STYLING
========================================================= */

export function getSeverityStyle(
  level
) {
  const normalized =
    normalizeLevel(level);

  const severity =
    DASS_PDF_THEME.severity;

  switch (normalized) {
    case "normal":
      return severity.normal;

    case "mild":
      return severity.mild;

    case "moderate":
      return severity.moderate;

    case "severe":
      return severity.severe;

    case "extremely severe":
      return (
        severity.extremelySevere
      );

    default:
      return {
        label:
          formatLevel(
            normalized
          ),

        text:
          DASS_PDF_THEME.colors
            .textSoft,

        background:
          DASS_PDF_THEME.colors
            .surfaceSoft,

        border:
          DASS_PDF_THEME.colors
            .border
      };
  }
}


/* =========================================================
   SEVERITY BADGE
========================================================= */

export function drawSeverityBadge(
  doc,
  {
    level,
    x,
    y,

    width = 104,
    height = 22,

    showRangeWord = true
  }
) {
  const style =
    getSeverityStyle(level);

  drawRoundedBox(
    doc,
    {
      x,
      y,
      width,
      height,

      radius:
        height / 2,

      backgroundColor:
        style.background,

      borderColor:
        style.border,

      borderWidth: 0.7
    }
  );

  let label =
    formatLevel(level);

  if (
    showRangeWord &&
    !label
      .toLowerCase()
      .includes("range")
  ) {
    label =
      `${label} range`;
  }

  doc
    .fillColor(
      style.text
    )
    .font(
      DASS_PDF_THEME.fonts
        .bodyBold
    )
    .fontSize(7)
    .text(
      label,
      x + 7,
      y + 7,
      {
        width:
          width - 14,

        align: "center",
        ellipsis: true
      }
    );
}


/* =========================================================
   CATEGORY INFORMATION
========================================================= */

export function getCategoryColor(
  category
) {
  const normalized =
    safeText(
      category,
      "unknown"
    )
      .trim()
      .toLowerCase();

  const colors = {
    depression:
      DASS_PDF_THEME.colors
        .depression,

    anxiety:
      DASS_PDF_THEME.colors
        .anxiety,

    stress:
      DASS_PDF_THEME.colors
        .stress,

    unknown:
      DASS_PDF_THEME.colors
        .muted
  };

  return (
    colors[normalized] ??
    colors.unknown
  );
}


export function getCategorySoftColor(
  category
) {
  const normalized =
    safeText(
      category,
      "unknown"
    )
      .trim()
      .toLowerCase();

  const colors = {
    depression:
      DASS_PDF_THEME.colors
        .depressionSoft,

    anxiety:
      DASS_PDF_THEME.colors
        .anxietySoft,

    stress:
      DASS_PDF_THEME.colors
        .stressSoft,

    unknown:
      DASS_PDF_THEME.colors
        .paperSoft
  };

  return (
    colors[normalized] ??
    colors.unknown
  );
}


/* =========================================================
   HIGHEST SELF-ASSESSMENT AREA
========================================================= */

export function getHighestSeverity(
  result = {}
) {
  const categories = [
    {
      key: "depression",
      label: "Depression",

      level:
        result.depression_level ??
        result.depressionLevel,

      score:
        safeNumber(
          result.depression_score ??
          result.depressionScore
        )
    },

    {
      key: "anxiety",
      label: "Anxiety",

      level:
        result.anxiety_level ??
        result.anxietyLevel,

      score:
        safeNumber(
          result.anxiety_score ??
          result.anxietyScore
        )
    },

    {
      key: "stress",
      label: "Stress",

      level:
        result.stress_level ??
        result.stressLevel,

      score:
        safeNumber(
          result.stress_score ??
          result.stressScore
        )
    }
  ];

  return categories.reduce(
    (
      highest,
      current
    ) => {
      const currentPriority =
        getSeverityPriority(
          current.level
        );

      const highestPriority =
        getSeverityPriority(
          highest.level
        );

      if (
        currentPriority >
        highestPriority
      ) {
        return current;
      }

      if (
        currentPriority ===
          highestPriority &&
        current.score >
          highest.score
      ) {
        return current;
      }

      return highest;
    },
    categories[0]
  );
}


/* =========================================================
   COMPACT BULLET LIST
========================================================= */

export function drawBulletList(
  doc,
  items = [],
  options = {}
) {
  const {
    x =
      doc.page.margins.left,

    width =
      getContentWidth(doc),

    bulletColor =
      DASS_PDF_THEME.colors
        .primary,

    textColor =
      DASS_PDF_THEME.colors.text,

    fontSize =
      DASS_PDF_THEME.fontSizes
        .body,

    itemGap = 7,

    lineGap = 2,

    bulletRadius = 2.3
  } = options;

  items
    .filter(Boolean)
    .forEach(
      (item) => {
        const text =
          safeText(
            item,
            ""
          );

        const textWidth =
          width - 20;

        const itemHeight =
          doc.heightOfString(
            text,
            {
              width: textWidth,
              lineGap
            }
          );

        const itemY =
          doc.y;

        doc
          .save()
          .circle(
            x + 4,
            itemY + 5,
            bulletRadius
          )
          .fillColor(
            bulletColor
          )
          .fill()
          .restore();

        doc
          .fillColor(
            textColor
          )
          .font(
            DASS_PDF_THEME.fonts
              .body
          )
          .fontSize(
            fontSize
          )
          .text(
            text,
            x + 15,
            itemY,
            {
              width:
                textWidth,
              lineGap
            }
          );

        doc.y =
          itemY +
          itemHeight +
          itemGap;
      }
    );
}


/* =========================================================
   SMALL INFO CARD
========================================================= */

export function drawInfoCard(
  doc,
  {
    x,
    y,
    width,
    height,

    title,
    text,

    accentColor =
      DASS_PDF_THEME.colors
        .primary,

    backgroundColor =
      DASS_PDF_THEME.colors
        .surface,

    borderColor =
      DASS_PDF_THEME.colors
        .border,

    titleColor =
      DASS_PDF_THEME.colors
        .heading,

    textColor =
      DASS_PDF_THEME.colors
        .textSoft
  }
) {
  drawRoundedBox(
    doc,
    {
      x,
      y,
      width,
      height,

      radius:
        DASS_PDF_THEME.radius.md,

      backgroundColor,
      borderColor
    }
  );

  /*
   * Small brand accent
   */
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
      accentColor
    )
    .fill()
    .restore();

  doc
    .fillColor(
      titleColor
    )
    .font(
      DASS_PDF_THEME.fonts
        .bodyBold
    )
    .fontSize(9)
    .text(
      safeText(
        title,
        ""
      ),
      x + 15,
      y + 13,
      {
        width:
          width - 28
      }
    );

  doc
    .fillColor(
      textColor
    )
    .font(
      DASS_PDF_THEME.fonts.body
    )
    .fontSize(7.8)
    .text(
      safeText(
        text,
        ""
      ),
      x + 15,
      y + 31,
      {
        width:
          width - 28,

        lineGap: 2.5
      }
    );
}


/* =========================================================
   PROGRESS BAR
========================================================= */

export function drawProgressBar(
  doc,
  {
    x,
    y,
    width,
    height = 8,

    value = 0,
    maximum = 42,

    backgroundColor =
      DASS_PDF_THEME.colors
        .borderSoft,

    fillColor =
      DASS_PDF_THEME.colors
        .primary
  }
) {
  const max =
    Math.max(
      safeNumber(
        maximum,
        42
      ),
      1
    );

  const safeValue =
    clamp(
      value,
      0,
      max
    );

  const progress =
    safeValue / max;

  const radius =
    height / 2;

  doc
    .save()
    .roundedRect(
      x,
      y,
      width,
      height,
      radius
    )
    .fillColor(
      backgroundColor
    )
    .fill()
    .restore();

  if (
    progress <= 0
  ) {
    return;
  }

  const fillWidth =
    Math.max(
      height,
      width * progress
    );

  doc
    .save()
    .roundedRect(
      x,
      y,
      Math.min(
        fillWidth,
        width
      ),
      height,
      radius
    )
    .fillColor(
      fillColor
    )
    .fill()
    .restore();
}


/* =========================================================
   QUESTION CATEGORY MAPPING
========================================================= */

export function getQuestionCategory(
  questionNumber
) {
  const number =
    safeNumber(
      questionNumber
    );

  const depressionQuestions = [
    3,
    5,
    10,
    13,
    16,
    17,
    21
  ];

  const anxietyQuestions = [
    2,
    4,
    7,
    9,
    15,
    19,
    20
  ];

  const stressQuestions = [
    1,
    6,
    8,
    11,
    12,
    14,
    18
  ];

  if (
    depressionQuestions.includes(
      number
    )
  ) {
    return "depression";
  }

  if (
    anxietyQuestions.includes(
      number
    )
  ) {
    return "anxiety";
  }

  if (
    stressQuestions.includes(
      number
    )
  ) {
    return "stress";
  }

  return "unknown";
}


/* =========================================================
   RESPONSE HELPERS
========================================================= */

export function getResponseValue(
  response
) {
  return clamp(
    response?.answer_value ??
      response?.answerValue ??
      response?.response_value ??
      response?.responseValue ??
      0,

    0,
    3
  );
}


export function getQuestionNumber(
  response
) {
  return safeNumber(
    response?.question_number ??
      response?.questionNumber ??
      response?.question_id ??
      response?.questionId ??
      0
  );
}


/* =========================================================
   CHART ARC UTILITY
========================================================= */

export function createArcPath(
  centerX,
  centerY,
  radius,
  startAngle,
  endAngle,
  steps = 30
) {
  const points = [];

  const safeSteps =
    Math.max(
      3,
      steps
    );

  for (
    let index = 0;
    index <= safeSteps;
    index += 1
  ) {
    const progress =
      index /
      safeSteps;

    const angle =
      startAngle +
      (
        endAngle -
        startAngle
      ) *
        progress;

    points.push({
      x:
        centerX +
        Math.cos(
          angle
        ) *
          radius,

      y:
        centerY +
        Math.sin(
          angle
        ) *
          radius
    });
  }

  return points;
}