import jwt from "jsonwebtoken";

export type UserRole = "superadmin" | "broker" | "user";

export interface AuthPayload {
  id: string;
  loginId: string;
  role: UserRole;
  name: string;
  brokerId?: string;
}

export function signToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret) as AuthPayload;
}
