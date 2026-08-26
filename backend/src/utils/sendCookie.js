const REFRESH_COOKIE_NAME =
  "refreshToken";


function getBaseCookieOptions() {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,

    secure: isProduction,

    sameSite: "lax",

    path: "/"
  };
}


export function sendRefreshTokenCookie(
  res,
  refreshToken,
  rememberMe = false
) {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  const options = {
    httpOnly: true,

    secure: isProduction,

    sameSite: "lax",

    path: "/"
  };


  if (rememberMe) {
    options.maxAge =
      30 *
      24 *
      60 *
      60 *
      1000;
  }


  res.cookie(
    REFRESH_COOKIE_NAME,
    refreshToken,
    options
  );
}


export function clearRefreshTokenCookie(
  res
) {
  res.clearCookie(
    REFRESH_COOKIE_NAME,
    getBaseCookieOptions()
  );
}