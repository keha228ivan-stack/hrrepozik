import bcrypt from "bcryptjs";
import { HttpError } from "@/server/http-error";

function getSaltRounds(): number {
  const configured = process.env.BCRYPT_SALT_ROUNDS;
  if (!configured) {
    return 12;
  }

  const rounds = Number.parseInt(configured, 10);
  if (Number.isNaN(rounds) || rounds < 10 || rounds > 15) {
    throw new HttpError(500, "Password hashing is misconfigured");
  }

  return rounds;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, getSaltRounds());
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
