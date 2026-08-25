import PDFDocument from "pdfkit";

/*
|--------------------------------------------------------------------------
| Unwind Journal PDF Theme
|--------------------------------------------------------------------------
*/

const PDF_THEME = Object.freeze({
  colors: {
    primary: "#28483A",
    primarySoft: "#E9F1ED",
    secondary: "#8FA99B",

    background: "#F7F9F8",
    surface: "#FFFFFF",

    text: "#26332D",
    textMuted: "#68766F",
    textLight: "#8A9690",

    border: "#DCE5E0",
    divider: "#E7ECE9",

    accent: "#C6D8CE",
    warning: "#C0834D",

    moodVeryLow: "#986C70",
    moodLow: "#B78478",
    moodNeutral: "#999C91",
    moodGood: "#6F9680",
    moodVeryGood: "#3F755B"
  },

  fonts: {
    regular: "Helvetica",
    medium: "Helvetica",
    bold: "Helvetica-Bold",
    italic: "Helvetica-Oblique"
  },

  sizes: {
    coverTitle: 30,
    coverSubtitle: 13,

    pageTitle: 21,
    sectionTitle: 13,
    entryTitle: 18,

    body: 10.5,
    metadata: 9,
    small: 8,
    footer: 8
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 22,
    xl: 32
  },

  radius: {
    small: 5,
    medium: 10,
    large: 18
  }
});

/*
|--------------------------------------------------------------------------
| Document Dimensions
|--------------------------------------------------------------------------
*/

const PAGE_SIZE = "A4";

const PAGE_MARGIN = Object.freeze({
  top: 54,
  right: 52,
  bottom: 60,
  left: 52
});

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const CONTENT_WIDTH =
  PAGE_WIDTH -
  PAGE_MARGIN.left -
  PAGE_MARGIN.right;

const CONTENT_BOTTOM =
  PAGE_HEIGHT -
  PAGE_MARGIN.bottom;

/*
|--------------------------------------------------------------------------
| Safe Text Helpers
|--------------------------------------------------------------------------
*/

function safeText(
  value,
  fallback = "Not available"
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const text =
    String(value).trim();

  return text || fallback;
}

function formatLabel(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(value) {
  if (!value) {
    return "Date not available";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date not available";
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

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
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

function createSafeFilenameTitle(
  title
) {
  return safeText(
    title,
    "Journal Export"
  )
    .replace(
      /[<>:"/\\|?*\u0000-\u001F]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

/*
|--------------------------------------------------------------------------
| PDF Drawing Helpers
|--------------------------------------------------------------------------
*/

function setFont(
  doc,
  font,
  size,
  color = PDF_THEME.colors.text
) {
  doc
    .font(font)
    .fontSize(size)
    .fillColor(color);

  return doc;
}

function drawPageBackground(doc) {
  doc
    .save()
    .rect(
      0,
      0,
      PAGE_WIDTH,
      PAGE_HEIGHT
    )
    .fill(
      PDF_THEME.colors.background
    )
    .restore();
}

function drawTopAccent(doc) {
  doc
    .save()
    .rect(
      0,
      0,
      PAGE_WIDTH,
      8
    )
    .fill(
      PDF_THEME.colors.primary
    )
    .restore();
}

function drawDecorativeCircle(
  doc,
  x,
  y,
  radius,
  color,
  opacity = 1
) {
  doc
    .save()
    .fillOpacity(opacity)
    .circle(
      x,
      y,
      radius
    )
    .fill(color)
    .restore();
}

function drawRoundedCard({
  doc,
  x,
  y,
  width,
  height,
  fillColor =
    PDF_THEME.colors.surface,
  borderColor =
    PDF_THEME.colors.border,
  radius =
    PDF_THEME.radius.medium,
  borderWidth = 0.8
}) {
  doc
    .save()
    .lineWidth(borderWidth)
    .fillColor(fillColor)
    .strokeColor(borderColor)
    .roundedRect(
      x,
      y,
      width,
      height,
      radius
    )
    .fillAndStroke()
    .restore();
}

function drawDivider(
  doc,
  y,
  {
    x =
      PAGE_MARGIN.left,
    width =
      CONTENT_WIDTH,
    color =
      PDF_THEME.colors.divider
  } = {}
) {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(0.8)
    .moveTo(x, y)
    .lineTo(
      x + width,
      y
    )
    .stroke()
    .restore();
}

function drawPill({
  doc,
  text,
  x,
  y,
  backgroundColor =
    PDF_THEME.colors.primarySoft,
  textColor =
    PDF_THEME.colors.primary,
  fontSize =
    PDF_THEME.sizes.small,
  horizontalPadding = 8,
  height = 20
}) {
  const label =
    safeText(text, "");

  setFont(
    doc,
    PDF_THEME.fonts.medium,
    fontSize,
    textColor
  );

  const textWidth =
    doc.widthOfString(label);

  const width =
    textWidth +
    horizontalPadding * 2;

  doc
    .save()
    .fillColor(
      backgroundColor
    )
    .roundedRect(
      x,
      y,
      width,
      height,
      height / 2
    )
    .fill()
    .restore();

  setFont(
    doc,
    PDF_THEME.fonts.medium,
    fontSize,
    textColor
  );

  doc.text(
    label,
    x + horizontalPadding,
    y + 6,
    {
      width: textWidth,
      lineBreak: false
    }
  );

  return width;
}

/*
|--------------------------------------------------------------------------
| Page Management
|--------------------------------------------------------------------------
*/

function addStyledPage(
  doc,
  {
    showAccent = true
  } = {}
) {
  doc.addPage({
    size: PAGE_SIZE,
    margins: PAGE_MARGIN
  });

  drawPageBackground(doc);

  if (showAccent) {
    drawTopAccent(doc);
  }

  doc.x =
    PAGE_MARGIN.left;

  doc.y =
    PAGE_MARGIN.top;

  return doc;
}

function ensureSpace(
  doc,
  requiredHeight,
  {
    onNewPage
  } = {}
) {
  if (
    doc.y +
      requiredHeight <=
    CONTENT_BOTTOM
  ) {
    return false;
  }

  addStyledPage(doc);

  if (
    typeof onNewPage ===
    "function"
  ) {
    onNewPage(doc);
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| Header And Footer Helpers
|--------------------------------------------------------------------------
*/

function drawPageHeader(
  doc,
  {
    title = "Unwind Journal",
    subtitle = "Personal Journal Export"
  } = {}
) {
  const headerY = 25;

  drawDecorativeCircle(
    doc,
    PAGE_MARGIN.left + 8,
    headerY + 9,
    8,
    PDF_THEME.colors.primary
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    10,
    PDF_THEME.colors.primary
  );

  doc.text(
    "U",
    PAGE_MARGIN.left + 4.8,
    headerY + 4.1,
    {
      width: 7,
      align: "center",
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    9.5,
    PDF_THEME.colors.primary
  );

  doc.text(
    title,
    PAGE_MARGIN.left + 22,
    headerY + 2,
    {
      width:
        CONTENT_WIDTH - 22,
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    7.5,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    subtitle,
    PAGE_MARGIN.left + 22,
    headerY + 14,
    {
      width:
        CONTENT_WIDTH - 22,
      lineBreak: false
    }
  );

  drawDivider(
    doc,
    PAGE_MARGIN.top - 9
  );
}

function drawPageFooter(
  doc,
  pageNumber,
  totalPages
) {
  const footerY =
    PAGE_HEIGHT - 38;

  drawDivider(
    doc,
    footerY - 8
  );

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    PDF_THEME.sizes.footer,
    PDF_THEME.colors.textLight
  );

  doc.text(
    "Private and personal - generated by Unwind",
    PAGE_MARGIN.left,
    footerY,
    {
      width:
        CONTENT_WIDTH / 2,
      lineBreak: false
    }
  );

  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    PAGE_MARGIN.left +
      CONTENT_WIDTH / 2,
    footerY,
    {
      width:
        CONTENT_WIDTH / 2,
      align: "right",
      lineBreak: false
    }
  );
}

/*
|--------------------------------------------------------------------------
| Cover Page
|--------------------------------------------------------------------------
*/

function drawCoverPage(
  doc,
  {
    title,
    entryCount,
    exportedAt
  }
) {
  drawPageBackground(doc);
  drawTopAccent(doc);

  drawDecorativeCircle(
    doc,
    PAGE_WIDTH - 58,
    90,
    72,
    PDF_THEME.colors.primarySoft
  );

  drawDecorativeCircle(
    doc,
    PAGE_WIDTH - 30,
    62,
    35,
    PDF_THEME.colors.accent,
    0.65
  );

  drawDecorativeCircle(
    doc,
    60,
    PAGE_HEIGHT - 70,
    95,
    PDF_THEME.colors.primarySoft,
    0.75
  );

  drawDecorativeCircle(
    doc,
    35,
    PAGE_HEIGHT - 42,
    38,
    PDF_THEME.colors.accent,
    0.65
  );

  const brandY = 120;

  drawDecorativeCircle(
    doc,
    PAGE_MARGIN.left + 22,
    brandY + 22,
    22,
    PDF_THEME.colors.primary
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    22,
    PDF_THEME.colors.surface
  );

  doc.text(
    "U",
    PAGE_MARGIN.left + 12,
    brandY + 10,
    {
      width: 20,
      align: "center",
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    17,
    PDF_THEME.colors.primary
  );

  doc.text(
    "UNWIND",
    PAGE_MARGIN.left + 58,
    brandY + 10,
    {
      width: 170,
      characterSpacing: 1.8,
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    9,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    "A quiet place for your thoughts",
    PAGE_MARGIN.left + 58,
    brandY + 32,
    {
      width: 220,
      lineBreak: false
    }
  );

  const titleY = 255;

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    PDF_THEME.sizes.coverTitle,
    PDF_THEME.colors.primary
  );

  doc.text(
    safeText(
      title,
      "Journal Export"
    ),
    PAGE_MARGIN.left,
    titleY,
    {
      width:
        CONTENT_WIDTH - 25,
      lineGap: 5
    }
  );

  const titleBottom =
    doc.y;

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    PDF_THEME.sizes.coverSubtitle,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    "A private collection of reflections, emotions, memories, and moments.",
    PAGE_MARGIN.left,
    titleBottom + 15,
    {
      width:
        CONTENT_WIDTH - 40,
      lineGap: 4
    }
  );

  const cardY =
    Math.max(
      doc.y + 48,
      420
    );

  drawRoundedCard({
    doc,
    x:
      PAGE_MARGIN.left,
    y: cardY,
    width:
      CONTENT_WIDTH,
    height: 112,
    fillColor:
      PDF_THEME.colors.surface,
    borderColor:
      PDF_THEME.colors.border,
    radius:
      PDF_THEME.radius.large
  });

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    10,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    "JOURNAL SUMMARY",
    PAGE_MARGIN.left + 22,
    cardY + 19,
    {
      width:
        CONTENT_WIDTH - 44,
      characterSpacing: 1.1,
      lineBreak: false
    }
  );

  drawDivider(
    doc,
    cardY + 42,
    {
      x:
        PAGE_MARGIN.left + 22,
      width:
        CONTENT_WIDTH - 44
    }
  );

  const columnWidth =
    (CONTENT_WIDTH - 44) / 2;

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    20,
    PDF_THEME.colors.primary
  );

  doc.text(
    String(entryCount),
    PAGE_MARGIN.left + 22,
    cardY + 58,
    {
      width:
        columnWidth,
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    8.5,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    entryCount === 1
      ? "Journal entry"
      : "Journal entries",
    PAGE_MARGIN.left + 22,
    cardY + 84,
    {
      width:
        columnWidth,
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    11,
    PDF_THEME.colors.primary
  );

  doc.text(
    formatDate(exportedAt),
    PAGE_MARGIN.left +
      22 +
      columnWidth,
    cardY + 62,
    {
      width:
        columnWidth,
      align: "right",
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    8.5,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    "Export date",
    PAGE_MARGIN.left +
      22 +
      columnWidth,
    cardY + 84,
    {
      width:
        columnWidth,
      align: "right",
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.italic,
    9,
    PDF_THEME.colors.textLight
  );

  doc.text(
    "This document may contain sensitive personal information. Store and share it carefully.",
    PAGE_MARGIN.left + 20,
    PAGE_HEIGHT - 105,
    {
      width:
        CONTENT_WIDTH - 40,
      align: "center",
      lineGap: 3
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    8,
    PDF_THEME.colors.primary
  );

  doc.text(
    "UNWIND JOURNAL",
    PAGE_MARGIN.left,
    PAGE_HEIGHT - 58,
    {
      width:
        CONTENT_WIDTH,
      align: "center",
      characterSpacing: 1.5,
      lineBreak: false
    }
  );
}

/*
|--------------------------------------------------------------------------
| PDF Document Creation
|--------------------------------------------------------------------------
*/

function createJournalPdfDocument() {
  const doc =
    new PDFDocument({
      size: PAGE_SIZE,
      margins: PAGE_MARGIN,

      bufferPages: true,

      info: {
        Title:
          "Unwind Journal Export",

        Author:
          "Unwind",

        Subject:
          "Personal Journal Export",

        Keywords:
          "Unwind, Journal, Personal Reflection",

        Creator:
          "Unwind"
      }
    });

  return doc;
}
/*
|--------------------------------------------------------------------------
| Journal Entry Formatting Helpers
|--------------------------------------------------------------------------
*/

function getEntryDate(entry) {
  return (
    entry.entry_date ||
    entry.created_at ||
    entry.updated_at
  );
}

function getEntryContent(entry) {
  return safeText(
    entry.content ||
      entry.entry_content ||
      entry.body ||
      entry.text,
    "No written content was added to this entry."
  );
}

function getMoodColor(
  moodLabel,
  moodScore
) {
  const normalizedMood =
    String(
      moodLabel || ""
    ).toLowerCase();

  const moodColorMap = {
    very_low:
      PDF_THEME.colors.moodVeryLow,

    low:
      PDF_THEME.colors.moodLow,

    neutral:
      PDF_THEME.colors.moodNeutral,

    good:
      PDF_THEME.colors.moodGood,

    very_good:
      PDF_THEME.colors.moodVeryGood,

    anxious:
      "#A47C6C",

    angry:
      "#A85E5E",

    calm:
      "#5F8B7A",

    tired:
      "#857E8B",

    overwhelmed:
      "#936F83"
  };

  if (
    moodColorMap[
      normalizedMood
    ]
  ) {
    return moodColorMap[
      normalizedMood
    ];
  }

  const score =
    Number(moodScore);

  if (score <= 1) {
    return PDF_THEME.colors
      .moodVeryLow;
  }

  if (score === 2) {
    return PDF_THEME.colors
      .moodLow;
  }

  if (score === 3) {
    return PDF_THEME.colors
      .moodNeutral;
  }

  if (score === 4) {
    return PDF_THEME.colors
      .moodGood;
  }

  if (score >= 5) {
    return PDF_THEME.colors
      .moodVeryGood;
  }

  return PDF_THEME.colors
    .secondary;
}

function getMoodBackgroundColor(
  moodLabel,
  moodScore
) {
  const moodColor =
    getMoodColor(
      moodLabel,
      moodScore
    );

  const backgroundMap = {
    "#986C70": "#F3E9EA",
    "#B78478": "#F5ECE8",
    "#999C91": "#F0F1ED",
    "#6F9680": "#EAF2ED",
    "#3F755B": "#E3EFE8",
    "#A47C6C": "#F3ECE8",
    "#A85E5E": "#F5E8E8",
    "#5F8B7A": "#E6F0EC",
    "#857E8B": "#EFEDF1",
    "#936F83": "#F1E9EE"
  };

  return (
    backgroundMap[
      moodColor
    ] ||
    PDF_THEME.colors
      .primarySoft
  );
}

function getEntryStatusLabel(
  entry
) {
  return formatLabel(
    entry.entry_status ||
      entry.status ||
      "draft"
  );
}

function getEntryTypeLabel(
  entry
) {
  return formatLabel(
    entry.entry_type ||
      entry.type ||
      "standard"
  );
}

function normalizeStringArray(
  value
) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item.trim();
        }

        if (
          item &&
          typeof item ===
          "object"
        ) {
          return safeText(
            item.name ||
              item.label ||
              item.tag_name ||
              item.activity_name ||
              item.emotion_name,
            ""
          );
        }

        return "";
      })
      .filter(Boolean);
  }

  if (
    typeof value ===
    "string"
  ) {
    return value
      .split(",")
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| Section Heading
|--------------------------------------------------------------------------
*/

function drawSectionHeading(
  doc,
  title,
  {
    subtitle,
    topSpacing = 0
  } = {}
) {
  ensureSpace(
    doc,
    subtitle ? 48 : 34
  );

  if (topSpacing > 0) {
    doc.y += topSpacing;
  }

  const headingY =
    doc.y;

  doc
    .save()
    .fillColor(
      PDF_THEME.colors.primary
    )
    .roundedRect(
      PAGE_MARGIN.left,
      headingY + 1,
      4,
      19,
      2
    )
    .fill()
    .restore();

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    PDF_THEME.sizes.sectionTitle,
    PDF_THEME.colors.primary
  );

  doc.text(
    safeText(title),
    PAGE_MARGIN.left + 13,
    headingY,
    {
      width:
        CONTENT_WIDTH - 13,
      lineGap: 2
    }
  );

  if (subtitle) {
    setFont(
      doc,
      PDF_THEME.fonts.regular,
      PDF_THEME.sizes.small,
      PDF_THEME.colors.textMuted
    );

    doc.text(
      safeText(
        subtitle,
        ""
      ),
      PAGE_MARGIN.left + 13,
      doc.y + 3,
      {
        width:
          CONTENT_WIDTH - 13,
        lineGap: 2
      }
    );
  }

  doc.y +=
    PDF_THEME.spacing.sm;
}

/*
|--------------------------------------------------------------------------
| Entry Number Badge
|--------------------------------------------------------------------------
*/

function drawEntryNumberBadge(
  doc,
  entryNumber,
  y
) {
  const badgeSize = 35;

  doc
    .save()
    .fillColor(
      PDF_THEME.colors.primary
    )
    .circle(
      PAGE_MARGIN.left +
        badgeSize / 2,
      y + badgeSize / 2,
      badgeSize / 2
    )
    .fill()
    .restore();

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    11,
    PDF_THEME.colors.surface
  );

  doc.text(
    String(entryNumber),
    PAGE_MARGIN.left,
    y + 11,
    {
      width: badgeSize,
      align: "center",
      lineBreak: false
    }
  );

  return badgeSize;
}

/*
|--------------------------------------------------------------------------
| Entry Header
|--------------------------------------------------------------------------
*/

function drawEntryHeader(
  doc,
  entry,
  entryNumber
) {
  ensureSpace(
    doc,
    130,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  const startY =
    doc.y;

  const badgeSize =
    drawEntryNumberBadge(
      doc,
      entryNumber,
      startY
    );

  const titleX =
    PAGE_MARGIN.left +
    badgeSize +
    14;

  const titleWidth =
    CONTENT_WIDTH -
    badgeSize -
    14;

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    PDF_THEME.sizes.entryTitle,
    PDF_THEME.colors.primary
  );

  doc.text(
    safeText(
      entry.title,
      `Journal Entry ${entryNumber}`
    ),
    titleX,
    startY,
    {
      width: titleWidth,
      lineGap: 3
    }
  );

  const titleBottom =
    doc.y;

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    PDF_THEME.sizes.metadata,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    formatDate(
      getEntryDate(entry)
    ),
    titleX,
    titleBottom + 5,
    {
      width: titleWidth,
      lineBreak: false
    }
  );

  doc.y =
    Math.max(
      startY +
        badgeSize +
        10,
      doc.y + 18
    );

  const pillY =
    doc.y;

  let pillX =
    PAGE_MARGIN.left;

  const availableRight =
    PAGE_MARGIN.left +
    CONTENT_WIDTH;

  const pills = [
    {
      text:
        getEntryStatusLabel(
          entry
        ),

      backgroundColor:
        PDF_THEME.colors
          .primarySoft,

      textColor:
        PDF_THEME.colors
          .primary
    },

    {
      text:
        getEntryTypeLabel(
          entry
        ),

      backgroundColor:
        "#EEF0F3",

      textColor:
        PDF_THEME.colors
          .textMuted
    }
  ];

  if (
    entry.is_favourite ||
    entry.isFavourite
  ) {
    pills.push({
      text: "Favourite",
      backgroundColor:
        "#F4EEDC",
      textColor:
        "#8A7134"
    });
  }

  if (
    entry.is_locked ||
    entry.isLocked
  ) {
    pills.push({
      text: "Locked",
      backgroundColor:
        "#F2E9E9",
      textColor:
        "#8A5E5E"
    });
  }

  for (
    const pill of pills
  ) {
    setFont(
      doc,
      PDF_THEME.fonts.medium,
      PDF_THEME.sizes.small,
      pill.textColor
    );

    const estimatedWidth =
      doc.widthOfString(
        pill.text
      ) + 16;

    if (
      pillX +
        estimatedWidth >
      availableRight
    ) {
      pillX =
        PAGE_MARGIN.left;

      doc.y += 27;
    }

    const usedWidth =
      drawPill({
        doc,
        text: pill.text,
        x: pillX,
        y: doc.y,
        backgroundColor:
          pill.backgroundColor,
        textColor:
          pill.textColor
      });

    pillX +=
      usedWidth + 7;
  }

  doc.y += 31;

  drawDivider(
    doc,
    doc.y
  );

  doc.y +=
    PDF_THEME.spacing.md;
}

/*
|--------------------------------------------------------------------------
| Metadata Item
|--------------------------------------------------------------------------
*/

function drawMetadataItem({
  doc,
  label,
  value,
  x,
  y,
  width,
  valueColor =
    PDF_THEME.colors.text
}) {
  setFont(
    doc,
    PDF_THEME.fonts.bold,
    PDF_THEME.sizes.small,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    safeText(
      label,
      ""
    ).toUpperCase(),
    x,
    y,
    {
      width,
      characterSpacing: 0.7,
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.medium,
    PDF_THEME.sizes.metadata,
    valueColor
  );

  doc.text(
    safeText(value),
    x,
    y + 16,
    {
      width,
      lineGap: 2
    }
  );
}

/*
|--------------------------------------------------------------------------
| Mood Card
|--------------------------------------------------------------------------
*/

function drawMoodCard(
  doc,
  entry
) {
  const moodLabel =
    entry.mood_label ||
    entry.moodLabel;

  const moodScore =
    entry.mood_score ||
    entry.moodScore;

  if (
    !moodLabel &&
    !moodScore
  ) {
    return;
  }

  ensureSpace(
    doc,
    92,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  const cardY =
    doc.y;

  const moodColor =
    getMoodColor(
      moodLabel,
      moodScore
    );

  const moodBackground =
    getMoodBackgroundColor(
      moodLabel,
      moodScore
    );

  drawRoundedCard({
    doc,
    x:
      PAGE_MARGIN.left,
    y: cardY,
    width:
      CONTENT_WIDTH,
    height: 76,
    fillColor:
      moodBackground,
    borderColor:
      moodBackground,
    radius:
      PDF_THEME.radius.medium
  });

  doc
    .save()
    .fillColor(
      moodColor
    )
    .circle(
      PAGE_MARGIN.left + 29,
      cardY + 38,
      15
    )
    .fill()
    .restore();

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    17,
    PDF_THEME.colors.surface
  );

  doc.text(
    moodScore
      ? String(moodScore)
      : "M",
    PAGE_MARGIN.left + 18,
    cardY + 28,
    {
      width: 22,
      align: "center",
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    8,
    moodColor
  );

  doc.text(
    "MOOD",
    PAGE_MARGIN.left + 58,
    cardY + 17,
    {
      width: 150,
      characterSpacing: 0.9,
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    14,
    moodColor
  );

  doc.text(
    formatLabel(
      moodLabel ||
        `Score ${moodScore}`
    ),
    PAGE_MARGIN.left + 58,
    cardY + 34,
    {
      width:
        CONTENT_WIDTH - 150,
      lineBreak: false
    }
  );

  if (moodScore) {
    setFont(
      doc,
      PDF_THEME.fonts.regular,
      PDF_THEME.sizes.small,
      moodColor
    );

    doc.text(
      `${moodScore} out of 5`,
      PAGE_MARGIN.left +
        CONTENT_WIDTH -
        100,
      cardY + 34,
      {
        width: 74,
        align: "right",
        lineBreak: false
      }
    );
  }

  doc.y =
    cardY + 76 +
    PDF_THEME.spacing.md;
}

/*
|--------------------------------------------------------------------------
| Entry Metadata Card
|--------------------------------------------------------------------------
*/

function drawEntryMetadataCard(
  doc,
  entry
) {
  const metadataItems = [
    {
      label: "Created",
      value:
        formatDateTime(
          entry.created_at
        )
    },

    {
      label: "Updated",
      value:
        formatDateTime(
          entry.updated_at
        )
    },

    {
      label: "Entry type",
      value:
        getEntryTypeLabel(
          entry
        )
    },

    {
      label: "Status",
      value:
        getEntryStatusLabel(
          entry
        )
    }
  ];

  if (
    entry.completed_at
  ) {
    metadataItems.push({
      label: "Completed",
      value:
        formatDateTime(
          entry.completed_at
        )
    });
  }

  if (
    entry.last_auto_saved_at
  ) {
    metadataItems.push({
      label: "Last saved",
      value:
        formatDateTime(
          entry.last_auto_saved_at
        )
    });
  }

  const columns = 2;

  const rowHeight = 51;

  const rows =
    Math.ceil(
      metadataItems.length /
        columns
    );

  const cardHeight =
    20 +
    rows * rowHeight;

  ensureSpace(
    doc,
    cardHeight + 16,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  const cardY =
    doc.y;

  drawRoundedCard({
    doc,
    x:
      PAGE_MARGIN.left,
    y: cardY,
    width:
      CONTENT_WIDTH,
    height:
      cardHeight,
    fillColor:
      PDF_THEME.colors.surface,
    borderColor:
      PDF_THEME.colors.border
  });

  const horizontalPadding =
    18;

  const usableWidth =
    CONTENT_WIDTH -
    horizontalPadding * 2;

  const columnGap =
    18;

  const columnWidth =
    (usableWidth -
      columnGap) /
    2;

  metadataItems.forEach(
    (
      metadataItem,
      index
    ) => {
      const column =
        index % columns;

      const row =
        Math.floor(
          index / columns
        );

      const x =
        PAGE_MARGIN.left +
        horizontalPadding +
        column *
          (
            columnWidth +
            columnGap
          );

      const y =
        cardY +
        16 +
        row * rowHeight;

      drawMetadataItem({
        doc,
        label:
          metadataItem.label,
        value:
          metadataItem.value,
        x,
        y,
        width:
          columnWidth
      });
    }
  );

  doc.y =
    cardY +
    cardHeight +
    PDF_THEME.spacing.md;
}

/*
|--------------------------------------------------------------------------
| Flexible Chip Rendering
|--------------------------------------------------------------------------
*/

function measureChipWidth(
  doc,
  text
) {
  setFont(
    doc,
    PDF_THEME.fonts.medium,
    PDF_THEME.sizes.small,
    PDF_THEME.colors.primary
  );

  return (
    doc.widthOfString(
      safeText(text, "")
    ) + 18
  );
}

function calculateChipSectionHeight(
  doc,
  items,
  maxWidth
) {
  if (
    !items ||
    items.length === 0
  ) {
    return 0;
  }

  let currentWidth = 0;
  let rows = 1;

  for (
    const item of items
  ) {
    const chipWidth =
      measureChipWidth(
        doc,
        item
      );

    if (
      currentWidth > 0 &&
      currentWidth +
        chipWidth >
        maxWidth
    ) {
      rows++;
      currentWidth =
        chipWidth + 7;
    } else {
      currentWidth +=
        chipWidth + 7;
    }
  }

  return rows * 27;
}

function drawChipCollection({
  doc,
  title,
  items,
  backgroundColor =
    PDF_THEME.colors.primarySoft,
  textColor =
    PDF_THEME.colors.primary
}) {
  const normalizedItems =
    normalizeStringArray(
      items
    );

  if (
    normalizedItems.length ===
    0
  ) {
    return;
  }

  const chipsWidth =
    CONTENT_WIDTH;

  const chipsHeight =
    calculateChipSectionHeight(
      doc,
      normalizedItems,
      chipsWidth
    );

  ensureSpace(
    doc,
    chipsHeight + 55,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  drawSectionHeading(
    doc,
    title
  );

  let currentX =
    PAGE_MARGIN.left;

  let currentY =
    doc.y;

  for (
    const item of
      normalizedItems
  ) {
    const chipWidth =
      measureChipWidth(
        doc,
        item
      );

    if (
      currentX +
        chipWidth >
      PAGE_MARGIN.left +
        CONTENT_WIDTH
    ) {
      currentX =
        PAGE_MARGIN.left;

      currentY += 27;
    }

    drawPill({
      doc,
      text: item,
      x: currentX,
      y: currentY,
      backgroundColor,
      textColor,
      height: 21
    });

    currentX +=
      chipWidth + 7;
  }

  doc.y =
    currentY +
    21 +
    PDF_THEME.spacing.md;
}

/*
|--------------------------------------------------------------------------
| Prompt Card
|--------------------------------------------------------------------------
*/

function getPromptText(
  entry
) {
  return (
    entry.prompt_text ||
    entry.promptText ||
    entry.prompt ||
    entry.journal_prompt ||
    null
  );
}

function drawPromptCard(
  doc,
  entry
) {
  const promptText =
    getPromptText(entry);

  if (!promptText) {
    return;
  }

  setFont(
    doc,
    PDF_THEME.fonts.italic,
    PDF_THEME.sizes.body,
    PDF_THEME.colors.primary
  );

  const textHeight =
    doc.heightOfString(
      safeText(promptText),
      {
        width:
          CONTENT_WIDTH - 48,
        lineGap: 4
      }
    );

  const cardHeight =
    Math.max(
      72,
      textHeight + 43
    );

  ensureSpace(
    doc,
    cardHeight + 16,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  const cardY =
    doc.y;

  drawRoundedCard({
    doc,
    x:
      PAGE_MARGIN.left,
    y: cardY,
    width:
      CONTENT_WIDTH,
    height:
      cardHeight,
    fillColor:
      PDF_THEME.colors
        .primarySoft,
    borderColor:
      PDF_THEME.colors
        .accent,
    radius:
      PDF_THEME.radius.medium
  });

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    PDF_THEME.sizes.small,
    PDF_THEME.colors.primary
  );

  doc.text(
    "JOURNAL PROMPT",
    PAGE_MARGIN.left + 20,
    cardY + 16,
    {
      width:
        CONTENT_WIDTH - 40,
      characterSpacing: 0.8,
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.italic,
    PDF_THEME.sizes.body,
    PDF_THEME.colors.primary
  );

  doc.text(
    safeText(promptText),
    PAGE_MARGIN.left + 20,
    cardY + 36,
    {
      width:
        CONTENT_WIDTH - 40,
      lineGap: 4
    }
  );

  doc.y =
    cardY +
    cardHeight +
    PDF_THEME.spacing.md;
}

/*
|--------------------------------------------------------------------------
| Journal Content
|--------------------------------------------------------------------------
*/

function splitContentIntoParagraphs(
  content
) {
  return safeText(
    content,
    ""
  )
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .replace(/\n/g, " ")
        .trim()
    )
    .filter(Boolean);
}

function drawContentParagraph(
  doc,
  paragraph
) {
  const bodyWidth =
    CONTENT_WIDTH - 34;

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    PDF_THEME.sizes.body,
    PDF_THEME.colors.text
  );

  const paragraphHeight =
    doc.heightOfString(
      paragraph,
      {
        width:
          bodyWidth,
        lineGap: 5
      }
    );

  if (
    paragraphHeight <=
    CONTENT_BOTTOM -
      PAGE_MARGIN.top -
      60
  ) {
    ensureSpace(
      doc,
      paragraphHeight + 20,
      {
        onNewPage:
          (newPageDoc) => {
            drawPageHeader(
              newPageDoc
            );

            drawSectionHeading(
              newPageDoc,
              "Reflection continued"
            );
          }
      }
    );
  }

  const paragraphY =
    doc.y;

  doc
    .save()
    .fillColor(
      PDF_THEME.colors.accent
    )
    .roundedRect(
      PAGE_MARGIN.left,
      paragraphY + 3,
      3,
      Math.max(
        17,
        Math.min(
          paragraphHeight,
          46
        )
      ),
      1.5
    )
    .fill()
    .restore();

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    PDF_THEME.sizes.body,
    PDF_THEME.colors.text
  );

  doc.text(
    paragraph,
    PAGE_MARGIN.left + 16,
    paragraphY,
    {
      width:
        bodyWidth,
      lineGap: 5,
      align: "left"
    }
  );

  doc.y +=
    PDF_THEME.spacing.md;
}

function drawJournalContent(
  doc,
  entry
) {
  const content =
    getEntryContent(entry);

  const paragraphs =
    splitContentIntoParagraphs(
      content
    );

  ensureSpace(
    doc,
    55,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  drawSectionHeading(
    doc,
    "Reflection",
    {
      subtitle:
        "The thoughts recorded in this journal entry"
    }
  );

  if (
    paragraphs.length === 0
  ) {
    setFont(
      doc,
      PDF_THEME.fonts.italic,
      PDF_THEME.sizes.body,
      PDF_THEME.colors.textMuted
    );

    doc.text(
      "No written content was added to this entry.",
      PAGE_MARGIN.left,
      doc.y,
      {
        width:
          CONTENT_WIDTH,
        lineGap: 4
      }
    );

    doc.y +=
      PDF_THEME.spacing.lg;

    return;
  }

  for (
    const paragraph of
      paragraphs
  ) {
    drawContentParagraph(
      doc,
      paragraph
    );
  }
}

/*
|--------------------------------------------------------------------------
| Entry Flags
|--------------------------------------------------------------------------
*/

function getEntryFlags(
  entry
) {
  const flags = [];

  if (
    entry.is_favourite ||
    entry.isFavourite
  ) {
    flags.push(
      "Marked as favourite"
    );
  }

  if (
    entry.hide_preview ||
    entry.hidePreview
  ) {
    flags.push(
      "Preview hidden"
    );
  }

  if (
    entry.is_locked ||
    entry.isLocked
  ) {
    flags.push(
      "Entry protected"
    );
  }

  if (
    entry.is_edited ||
    entry.isEdited
  ) {
    flags.push(
      "Edited after creation"
    );
  }

  return flags;
}

function drawEntryFlags(
  doc,
  entry
) {
  const flags =
    getEntryFlags(entry);

  if (
    flags.length === 0
  ) {
    return;
  }

  drawChipCollection({
    doc,
    title:
      "Entry details",
    items: flags,
    backgroundColor:
      "#EEF0F3",
    textColor:
      PDF_THEME.colors
        .textMuted
  });
}

/*
|--------------------------------------------------------------------------
| Entry Closing Note
|--------------------------------------------------------------------------
*/

function drawEntryClosing(
  doc,
  entryNumber
) {
  ensureSpace(
    doc,
    56,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  const closingY =
    doc.y + 6;

  drawDivider(
    doc,
    closingY
  );

  setFont(
    doc,
    PDF_THEME.fonts.italic,
    PDF_THEME.sizes.small,
    PDF_THEME.colors.textLight
  );

  doc.text(
    `End of journal entry ${entryNumber}`,
    PAGE_MARGIN.left,
    closingY + 13,
    {
      width:
        CONTENT_WIDTH,
      align: "center",
      lineBreak: false
    }
  );

  doc.y =
    closingY + 44;
}

/*
|--------------------------------------------------------------------------
| Complete Journal Entry Renderer
|--------------------------------------------------------------------------
*/

function drawJournalEntry(
  doc,
  entry,
  entryNumber
) {
  drawEntryHeader(
    doc,
    entry,
    entryNumber
  );

  drawMoodCard(
    doc,
    entry
  );

  drawPromptCard(
    doc,
    entry
  );

  drawEntryMetadataCard(
    doc,
    entry
  );

  drawChipCollection({
    doc,
    title: "Tags",
    items:
      entry.tags,
    backgroundColor:
      PDF_THEME.colors
        .primarySoft,
    textColor:
      PDF_THEME.colors
        .primary
  });

  drawChipCollection({
    doc,
    title: "Activities",
    items:
      entry.activities,
    backgroundColor:
      "#ECEFF4",
    textColor:
      "#576579"
  });

  drawChipCollection({
    doc,
    title: "Emotions",
    items:
      entry.emotions,
    backgroundColor:
      "#F2EAF0",
    textColor:
      "#795F72"
  });

  drawEntryFlags(
    doc,
    entry
  );

  drawJournalContent(
    doc,
    entry
  );

  drawEntryClosing(
    doc,
    entryNumber
  );
}
/*
|--------------------------------------------------------------------------
| Attachment Helpers
|--------------------------------------------------------------------------
*/

function getAttachmentType(
  attachment
) {
  return formatLabel(
    attachment.attachment_type ||
      attachment.type ||
      "file"
  );
}

function getAttachmentName(
  attachment,
  index
) {
  return safeText(
    attachment.original_filename ||
      attachment.file_name ||
      attachment.filename ||
      attachment.caption,
    `Attachment ${index + 1}`
  );
}

function getAttachmentUrl(
  attachment
) {
  return (
    attachment.secure_url ||
    attachment.url ||
    attachment.file_url ||
    null
  );
}

function getAttachmentCaption(
  attachment
) {
  return (
    attachment.caption ||
    attachment.alt_text ||
    attachment.altText ||
    null
  );
}

function formatFileSize(
  sizeBytes
) {
  const size =
    Number(sizeBytes);

  if (
    !Number.isFinite(size) ||
    size <= 0
  ) {
    return "Size unavailable";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  if (
    size <
    1024 * 1024 * 1024
  ) {
    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    size /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

function getAttachmentIconLabel(
  attachment
) {
  const type =
    String(
      attachment.attachment_type ||
        attachment.type ||
        ""
    ).toLowerCase();

  const mimeType =
    String(
      attachment.mime_type ||
        attachment.mime ||
        ""
    ).toLowerCase();

  if (
    type === "image" ||
    mimeType.startsWith(
      "image/"
    )
  ) {
    return "IMG";
  }

  if (
    type === "video" ||
    mimeType.startsWith(
      "video/"
    )
  ) {
    return "VID";
  }

  if (
    type === "audio" ||
    mimeType.startsWith(
      "audio/"
    )
  ) {
    return "AUD";
  }

  if (
    type === "document" ||
    mimeType.includes(
      "pdf"
    )
  ) {
    return "DOC";
  }

  return "FILE";
}

function getAttachmentAccentColor(
  attachment
) {
  const type =
    String(
      attachment.attachment_type ||
        attachment.type ||
        ""
    ).toLowerCase();

  const colorMap = {
    image: "#567F70",
    video: "#675E80",
    audio: "#8A6A57",
    document: "#5C7085"
  };

  return (
    colorMap[type] ||
    PDF_THEME.colors.primary
  );
}

/*
|--------------------------------------------------------------------------
| Attachment Card
|--------------------------------------------------------------------------
*/

function drawAttachmentCard({
  doc,
  attachment,
  index
}) {
  const cardHeight = 84;

  ensureSpace(
    doc,
    cardHeight + 12,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );

          drawSectionHeading(
            newPageDoc,
            "Attachments continued"
          );
        }
    }
  );

  const cardY =
    doc.y;

  const accentColor =
    getAttachmentAccentColor(
      attachment
    );

  drawRoundedCard({
    doc,
    x:
      PAGE_MARGIN.left,
    y: cardY,
    width:
      CONTENT_WIDTH,
    height:
      cardHeight,
    fillColor:
      PDF_THEME.colors.surface,
    borderColor:
      PDF_THEME.colors.border
  });

  doc
    .save()
    .fillColor(
      accentColor
    )
    .roundedRect(
      PAGE_MARGIN.left,
      cardY,
      6,
      cardHeight,
      3
    )
    .fill()
    .restore();

  doc
    .save()
    .fillColor(
      PDF_THEME.colors
        .primarySoft
    )
    .circle(
      PAGE_MARGIN.left + 38,
      cardY + 42,
      20
    )
    .fill()
    .restore();

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    8,
    accentColor
  );

  doc.text(
    getAttachmentIconLabel(
      attachment
    ),
    PAGE_MARGIN.left + 18,
    cardY + 38,
    {
      width: 40,
      align: "center",
      lineBreak: false
    }
  );

  const textX =
    PAGE_MARGIN.left + 70;

  const textWidth =
    CONTENT_WIDTH - 150;

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    10.5,
    PDF_THEME.colors.text
  );

  doc.text(
    getAttachmentName(
      attachment,
      index
    ),
    textX,
    cardY + 15,
    {
      width:
        textWidth,
      lineGap: 2,
      ellipsis: true,
      height: 18
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    PDF_THEME.sizes.small,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    `${getAttachmentType(
      attachment
    )} • ${formatFileSize(
      attachment.size_bytes ||
        attachment.file_size
    )}`,
    textX,
    cardY + 38,
    {
      width:
        textWidth,
      lineBreak: false
    }
  );

  const caption =
    getAttachmentCaption(
      attachment
    );

  if (caption) {
    setFont(
      doc,
      PDF_THEME.fonts.italic,
      7.8,
      PDF_THEME.colors.textLight
    );

    doc.text(
      safeText(
        caption,
        ""
      ),
      textX,
      cardY + 56,
      {
        width:
          textWidth,
        height: 15,
        ellipsis: true
      }
    );
  }

  const url =
    getAttachmentUrl(
      attachment
    );

  if (url) {
    setFont(
      doc,
      PDF_THEME.fonts.bold,
      8,
      accentColor
    );

    doc.text(
      "Open attachment",
      PAGE_MARGIN.left +
        CONTENT_WIDTH -
        110,
      cardY + 34,
      {
        width: 90,
        align: "right",
        link: url,
        underline: true,
        lineBreak: false
      }
    );
  }

  doc.y =
    cardY +
    cardHeight +
    10;
}

/*
|--------------------------------------------------------------------------
| Attachment Section
|--------------------------------------------------------------------------
*/

function drawAttachments(
  doc,
  entry
) {
  const attachments =
    Array.isArray(
      entry.attachments
    )
      ? entry.attachments
      : [];

  if (
    attachments.length === 0
  ) {
    return;
  }

  ensureSpace(
    doc,
    54,
    {
      onNewPage:
        (newPageDoc) => {
          drawPageHeader(
            newPageDoc
          );
        }
    }
  );

  drawSectionHeading(
    doc,
    "Attachments",
    {
      subtitle:
        `${attachments.length} ${
          attachments.length ===
          1
            ? "file"
            : "files"
        } included with this entry`
    }
  );

  attachments.forEach(
    (
      attachment,
      index
    ) => {
      drawAttachmentCard({
        doc,
        attachment,
        index
      });
    }
  );

  doc.y +=
    PDF_THEME.spacing.sm;
}

/*
|--------------------------------------------------------------------------
| Empty Journal Page
|--------------------------------------------------------------------------
*/

function drawEmptyJournalPage(
  doc
) {
  addStyledPage(doc);

  drawPageHeader(
    doc,
    {
      title:
        "Unwind Journal",
      subtitle:
        "Personal Journal Export"
    }
  );

  const centerY = 285;

  drawDecorativeCircle(
    doc,
    PAGE_WIDTH / 2,
    centerY,
    62,
    PDF_THEME.colors
      .primarySoft
  );

  drawDecorativeCircle(
    doc,
    PAGE_WIDTH / 2,
    centerY,
    29,
    PDF_THEME.colors
      .primary
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    20,
    PDF_THEME.colors.surface
  );

  doc.text(
    "U",
    PAGE_WIDTH / 2 - 13,
    centerY - 12,
    {
      width: 26,
      align: "center",
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.bold,
    21,
    PDF_THEME.colors.primary
  );

  doc.text(
    "No journal entries found",
    PAGE_MARGIN.left,
    centerY + 90,
    {
      width:
        CONTENT_WIDTH,
      align: "center",
      lineBreak: false
    }
  );

  setFont(
    doc,
    PDF_THEME.fonts.regular,
    10.5,
    PDF_THEME.colors.textMuted
  );

  doc.text(
    "There were no journal entries matching the selected export criteria.",
    PAGE_MARGIN.left + 40,
    centerY + 126,
    {
      width:
        CONTENT_WIDTH - 80,
      align: "center",
      lineGap: 4
    }
  );
}

/*
|--------------------------------------------------------------------------
| Entry Separator Page
|--------------------------------------------------------------------------
*/

function startJournalEntryPage(
  doc,
  entryNumber,
  totalEntries
) {
  addStyledPage(doc);

  drawPageHeader(
    doc,
    {
      title:
        "Unwind Journal",
      subtitle:
        `Entry ${entryNumber} of ${totalEntries}`
    }
  );

  doc.y =
    PAGE_MARGIN.top + 20;
}

/*
|--------------------------------------------------------------------------
| Render Complete Entry
|--------------------------------------------------------------------------
*/

function renderJournalEntry(
  doc,
  entry,
  entryNumber
) {
  drawEntryHeader(
    doc,
    entry,
    entryNumber
  );

  drawMoodCard(
    doc,
    entry
  );

  drawPromptCard(
    doc,
    entry
  );

  drawEntryMetadataCard(
    doc,
    entry
  );

  drawChipCollection({
    doc,
    title: "Tags",
    items:
      entry.tags,
    backgroundColor:
      PDF_THEME.colors
        .primarySoft,
    textColor:
      PDF_THEME.colors
        .primary
  });

  drawChipCollection({
    doc,
    title: "Activities",
    items:
      entry.activities,
    backgroundColor:
      "#ECEFF4",
    textColor:
      "#576579"
  });

  drawChipCollection({
    doc,
    title: "Emotions",
    items:
      entry.emotions,
    backgroundColor:
      "#F2EAF0",
    textColor:
      "#795F72"
  });

  drawEntryFlags(
    doc,
    entry
  );

  drawJournalContent(
    doc,
    entry
  );

  drawAttachments(
    doc,
    entry
  );

  drawEntryClosing(
    doc,
    entryNumber
  );
}

/*
|--------------------------------------------------------------------------
| Apply Headers And Footers
|--------------------------------------------------------------------------
*/

function applyPageNumbersAndFooters(
  doc
) {
  const range =
    doc.bufferedPageRange();

  const totalPages =
    range.count;

  for (
    let pageIndex =
      range.start;
    pageIndex <
    range.start +
      range.count;
    pageIndex++
  ) {
    doc.switchToPage(
      pageIndex
    );

    /*
     * Cover page intentionally does
     * not receive the normal footer.
     */
    if (pageIndex === 0) {
      continue;
    }

    drawPageFooter(
      doc,
      pageIndex + 1,
      totalPages
    );
  }
}

/*
|--------------------------------------------------------------------------
| PDF Generation
|--------------------------------------------------------------------------
*/

export function generateJournalPdf({
  title =
    "Journal Export",
  entries = []
}) {
  return new Promise(
    (resolve, reject) => {
      try {
        const doc =
          createJournalPdfDocument();

        const chunks = [];

        doc.on(
          "data",
          (chunk) => {
            chunks.push(chunk);
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

        const normalizedEntries =
          Array.isArray(entries)
            ? entries
            : [];

        const exportedAt =
          new Date();

        /*
        |--------------------------------------------------------------------------
        | Cover Page
        |--------------------------------------------------------------------------
        */

        drawCoverPage(
          doc,
          {
            title:
              safeText(
                title,
                "Journal Export"
              ),

            entryCount:
              normalizedEntries.length,

            exportedAt
          }
        );

        /*
        |--------------------------------------------------------------------------
        | Journal Entries
        |--------------------------------------------------------------------------
        */

        if (
          normalizedEntries.length ===
          0
        ) {
          drawEmptyJournalPage(
            doc
          );
        } else {
          normalizedEntries.forEach(
            (
              entry,
              index
            ) => {
              startJournalEntryPage(
                doc,
                index + 1,
                normalizedEntries.length
              );

              renderJournalEntry(
                doc,
                entry,
                index + 1
              );
            }
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Footer And Page Numbers
        |--------------------------------------------------------------------------
        */

        applyPageNumbersAndFooters(
          doc
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| Export Filename Helper
|--------------------------------------------------------------------------
*/

export function generateJournalPdfFilename(
  title
) {
  const safeTitle =
    createSafeFilenameTitle(
      title
    );

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  return `${safeTitle}-${date}.pdf`;
}