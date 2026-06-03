import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedKey] = passwordHash.split(":");

  if (!salt || !storedKey) return false;

  const storedKeyBuffer = Buffer.from(storedKey, "hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  if (storedKeyBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(storedKeyBuffer, derivedKey);
}
