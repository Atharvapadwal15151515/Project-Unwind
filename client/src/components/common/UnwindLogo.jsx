import fullLightLogo
  from "../../assets/brand/unwind-light-full.png";

import fullDarkLogo
  from "../../assets/brand/unwind-dark-full.png";

import symbolLightLogo
  from "../../assets/brand/unwind-symbol-light.png";

import symbolDarkLogo
  from "../../assets/brand/unwind-dark-full.png";

function UnwindLogo({
  variant = "symbol",
  theme = "light",
  className = "",
  alt = "UNWIND"
}) {
  let src;

  if (variant === "full") {
    src =
      theme === "dark"
        ? fullDarkLogo
        : fullLightLogo;
  } else {
    src =
      theme === "dark"
        ? symbolDarkLogo
        : symbolLightLogo;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable="false"
    />
  );
}

export default UnwindLogo;