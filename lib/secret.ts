import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

function toBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(secret, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  }).toString("hex");
  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt,
    hash,
  ].join("$");
}

export function verifySecret(secret: string, expectedHash: string) {
  if (expectedHash.startsWith("scrypt$")) {
    return verifyScryptSecret(secret, expectedHash);
  }
  return verifySha256Secret(secret, expectedHash);
}

function verifyScryptSecret(secret: string, expectedHash: string) {
  const [, cost, blockSize, parallelization, salt, hash] = expectedHash.split("$");
  if (!cost || !blockSize || !parallelization || !salt || !hash) {
    return false;
  }
  const expected = Buffer.from(hash, "hex");
  if (expected.length === 0) {
    return false;
  }
  try {
    const actual = scryptSync(secret, salt, expected.length, {
      N: Number(cost),
      r: Number(blockSize),
      p: Number(parallelization),
    });
    return safeCompare(actual, expected);
  } catch {
    return false;
  }
}

function verifySha256Secret(secret: string, expectedHash: string) {
  const legacyHash = createHash("sha256").update(secret).digest("hex");
  return safeCompare(toBuffer(legacyHash), toBuffer(expectedHash));
}

function safeCompare(actual: Buffer, expected: Buffer) {
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}
