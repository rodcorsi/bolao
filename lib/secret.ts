import { createHash, timingSafeEqual } from "crypto";

function toBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function verifySecret(secret: string, expectedHash: string) {
  const hashed = hashSecret(secret);
  return timingSafeEqual(toBuffer(hashed), toBuffer(expectedHash));
}
