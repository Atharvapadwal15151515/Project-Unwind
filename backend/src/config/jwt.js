import "dotenv/config";

const requiredVariables = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `${variable} is missing from environment variables`
    );
  }
}

export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,

  accessExpiresIn:
    process.env.JWT_ACCESS_EXPIRES_IN || "15m",

  refreshExpiresIn:
    process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  refreshTokenDays: Number(
    process.env.REFRESH_TOKEN_DAYS || 30
  )
};