import { randomBytes } from "crypto";

export function generateBrokerId(): string {
  return `BRK-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function generateUserId(): string {
  return `USR-${randomBytes(4).toString("hex").toUpperCase()}`;
}
