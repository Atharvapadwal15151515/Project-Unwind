import crypto from "crypto";

export function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}