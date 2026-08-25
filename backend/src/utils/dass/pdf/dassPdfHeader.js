import DASS_PDF_THEME
  from "./dassPdfTheme.js";

import path
  from "path";

import {
  fileURLToPath
} from "url";


const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );


const logoPath =
  path.resolve(
    __dirname,
    "../../../assets/brand/unwind-dark-full.png"
  );
/* =========================================================
   HEADER
========================================================= */

export function drawDassPdfHeader(
  doc,
  options = {}
) {
  const {
    pageLabel = "",
    showLogoPlaceholder = true
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


  const headerY =
    24;


  const headerHeight =
    48;


  /* =======================================================
     CLEAN WHITE HEADER AREA
  ======================================================= */

  doc
    .save()
    .rect(
      left,
      headerY,
      width,
      headerHeight
    )
    .fillColor(
      colors.background
    )
    .fill()
    .restore();


  /* =======================================================
     BRAND MARK
  ======================================================= */

  if (
    showLogoPlaceholder
  ) {
    const markX =
      left;

    const markY =
      headerY + 5;


    /* LOGO TILE */
/* ACTUAL UNWIND LOGO */

doc.image(
  logoPath,
  markX,
  markY,
  {
    fit: [
      36,
      36
    ]
  }
);
    /* BRAND */

    doc
      .fillColor(
        colors.heading
      )
      .font(
        fonts.heading
      )
      .fontSize(14)
      .text(
        "UNWIND",
        markX + 44,
        headerY + 8,
        {
          width: 100,
          lineBreak: false
        }
      );


    /* TAGLINE */

    doc
      .fillColor(
        colors.textSoft
      )
      .font(
        fonts.body
      )
      .fontSize(8.2)
      .text(
        "Mental wellness",
        markX + 44,
        headerY + 24,
        {
          width: 110,
          lineBreak: false
        }
      );
  }


  /* =======================================================
     PAGE LABEL
  ======================================================= */

  if (
    pageLabel
  ) {
    doc
      .fillColor(
        colors.primaryStrong
      )
      .font(
        fonts.bodyBold
      )
      .fontSize(8.3)
      .text(
        String(
          pageLabel
        ).toUpperCase(),
        right - 190,
        headerY + 14,
        {
          width: 190,
          align: "right",
          characterSpacing: 0.8,
          lineBreak: false
        }
      );
  }


  /* =======================================================
     DIVIDER
  ======================================================= */

  doc
    .save()
    .strokeColor(
      colors.divider
    )
    .lineWidth(0.8)
    .moveTo(
      left,
      headerY +
        headerHeight
    )
    .lineTo(
      right,
      headerY +
        headerHeight
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
    .lineWidth(2)
    .moveTo(
      left,
      headerY +
        headerHeight
    )
    .lineTo(
      left + 42,
      headerY +
        headerHeight
    )
    .stroke()
    .restore();


  /* =======================================================
     CONTENT START
  ======================================================= */

  doc.y =
    headerY +
    headerHeight +
    22;


  return doc.y;
}


export default drawDassPdfHeader;