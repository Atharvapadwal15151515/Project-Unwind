export const DASS_PDF_THEME = {
  app: {
    name: "UNWIND",
    tagline: "Mental wellness",

    reportTitle:
      "DASS-21 Self-Assessment",

    reportSubtitle:
      "Depression, Anxiety and Stress Scale",

    version: "3.0"
  },


  /* =======================================================
     PAGE
  ======================================================= */

  page: {
    size: "A4",

    margin: 38,

    headerHeight: 58,

    footerHeight: 32,

    contentTop: 78,

    contentBottomPadding: 48
  },


  /* =======================================================
     TYPOGRAPHY
  ======================================================= */

  fonts: {
    title:
      "Helvetica-Bold",

    heading:
      "Helvetica-Bold",

    subHeading:
      "Helvetica-Bold",

    body:
      "Helvetica",

    bodyBold:
      "Helvetica-Bold",

    italic:
      "Helvetica-Oblique"
  },


  fontSizes: {
    heroTitle: 23,

    pageTitle: 20,

    sectionTitle: 13,

    heading: 11,

    subHeading: 9,

    largeNumber: 27,

    score: 25,

    body: 8.5,

    small: 7,

    tiny: 6
  },


  /* =======================================================
     CORNERS
  ======================================================= */

  radius: {
    xs: 3,

    sm: 5,

    md: 8,

    lg: 10,

    xl: 12
  },


  /* =======================================================
     SPACING
  ======================================================= */

  spacing: {
    xs: 4,

    sm: 7,

    md: 11,

    lg: 16,

    xl: 22,

    xxl: 30
  },


  /* =======================================================
     UNWIND PROFESSIONAL REPORT PALETTE
  ======================================================= */

  colors: {

    /*
     * PRIMARY BRAND GREEN
     */

    primary:
      "#63B9A7",

    primaryStrong:
      "#378D7B",

    primaryDark:
      "#174C41",

    primaryDeep:
      "#0E332C",


    /*
     * PAGE BACKGROUND
     */

    background:
      "#F6F8F5",

    white:
      "#FFFFFF",

    paper:
      "#FFFFFF",

    paperSoft:
      "#F0F5F2",


    /*
     * GREEN SURFACES
     */

    surfaceDark:
      "#123D35",

    surface:
      "#17483F",

    surfaceSoft:
      "#E7F2EE",

    surfaceMuted:
      "#EDF4F1",


    /*
     * TYPOGRAPHY
     */

    heading:
      "#102A25",

    text:
      "#314943",

    textSoft:
      "#61766F",

    muted:
      "#86968F",

    inverseText:
      "#F8FBF9",


    /*
     * BORDERS
     */

    border:
      "#D6E1DC",

    borderStrong:
      "#BED1C9",

    borderDark:
      "#356158",

    divider:
      "#DEE7E3",


    /*
     * CHART COLORS
     *
     * All stay inside the same
     * Unwind green family.
     */

    depression:
      "#3F9E8A",

    anxiety:
      "#5DAC9B",

    stress:
      "#247767",


    /*
     * SOFT CHART BACKGROUNDS
     */

    depressionSoft:
      "#E7F3EF",

    anxietySoft:
      "#EDF5F2",

    stressSoft:
      "#DFEEE9",


    /*
     * STATUS COLORS
     *
     * Restrained and suitable for
     * clinical-style reporting.
     */

    success:
      "#3C8B68",

    warning:
      "#A77C32",

    danger:
      "#A85454",

    warningSoft:
      "#F6F0E3",

    dangerSoft:
      "#F6EAEA",


    /*
     * GREYS
     */

    gray050:
      "#F8FAF9",

    gray100:
      "#F1F4F2",

    gray200:
      "#E2E8E5",

    gray300:
      "#CAD5D0",

    gray500:
      "#778982",

    gray700:
      "#40534C"
  },


  /* =======================================================
     SEVERITY
  ======================================================= */

  severity: {
    normal: {
      label:
        "Normal",

      text:
        "#31705C",

      background:
        "#E8F3EE",

      border:
        "#BFDCCE",

      marker:
        "#428E72"
    },


    mild: {
      label:
        "Mild",

      text:
        "#687747",

      background:
        "#F2F3E7",

      border:
        "#D9DDBF",

      marker:
        "#82905E"
    },


    moderate: {
      label:
        "Moderate",

      text:
        "#8C6B35",

      background:
        "#F6F0E4",

      border:
        "#E0CCA8",

      marker:
        "#AD8749"
    },


    severe: {
      label:
        "Severe",

      text:
        "#9A6447",

      background:
        "#F5EDE8",

      border:
        "#DDC4B4",

      marker:
        "#B47B5B"
    },


    extremelySevere: {
      label:
        "Extremely severe",

      text:
        "#984E4E",

      background:
        "#F5E9E9",

      border:
        "#DFBFBF",

      marker:
        "#B76161"
    }
  },


  /* =======================================================
     CARDS
  ======================================================= */

  cards: {
    shadowOpacity: 0,

    default: {
      radius: 8,

      borderWidth: 0.8
    },


    score: {
      height: 96
    },


    summary: {
      radius: 10
    },


    chart: {
      radius: 10
    },


    insight: {
      radius: 10
    }
  },


  /* =======================================================
     CHARTS
  ======================================================= */

  charts: {
    scoreMax: 42,


    scoreBar: {
      height: 148,

      barHeight: 7,

      trackHeight: 7
    },


    severityScale: {
      height: 92,

      lineHeight: 5,

      markerRadius: 4
    },


    axis: {
      color:
        "#AABBB4",

      labelColor:
        "#71847C"
    }
  },


  /* =======================================================
     LOGO PLACEHOLDER
  ======================================================= */

  logo: {
    width: 100,

    height: 30,

    placeholderText:
      "UNWIND"
  },


  /* =======================================================
     COMMON COPY
  ======================================================= */

  copy: {
    selfAssessmentLabel:
      "DASS-21 Self-Assessment",


    disclaimer:
      "This self-assessment is intended to support reflection on your recent emotional experiences. It is not a diagnosis and does not replace professional mental health care.",


    scoreContext:
      "Scores reflect only the responses you provided during this self-assessment.",


    supportNote:
      "If these experiences are persistent, worsening, or affecting daily life, consider speaking with a qualified mental health professional."
  }
};


export default DASS_PDF_THEME;