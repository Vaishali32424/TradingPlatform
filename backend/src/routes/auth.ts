import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SuperAdmin } from "../models/SuperAdmin.js";
import { Broker } from "../models/Broker.js";
import { PlatformUser } from "../models/PlatformUser.js";
import { signToken } from "../utils/jwt.js";

const router = Router();

const loginSchema = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1),
});

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Login ID or email and password are required" });
    return;
  }

  const { loginId, password } = parsed.data;
  const id = loginId.trim();
  const emailLower = isEmail(id) ? id.toLowerCase() : null;
  const idRegex = new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

  const superAdmin = await SuperAdmin.findOne({ loginId: idRegex });
  if (superAdmin && (await bcrypt.compare(password, superAdmin.passwordHash))) {
    const token = signToken({
      id: superAdmin._id.toString(),
      loginId: superAdmin.loginId,
      role: "superadmin",
      name: superAdmin.name,
    });
    res.json({
      token,
      user: {
        id: superAdmin._id,
        loginId: superAdmin.loginId,
        role: "superadmin",
        name: superAdmin.name,
      },
    });
    return;
  }

  const broker = emailLower
    ? await Broker.findOne({ email: emailLower, isActive: true })
    : await Broker.findOne({ brokerId: idRegex, isActive: true });
  if (broker && (await bcrypt.compare(password, broker.passwordHash))) {
    const token = signToken({
      id: broker._id.toString(),
      loginId: broker.brokerId,
      role: "broker",
      name: broker.name,
      brokerId: broker.brokerId,
    });
    res.json({
      token,
      user: {
        id: broker._id,
        loginId: broker.brokerId,
        role: "broker",
        name: broker.name,
        brokerId: broker.brokerId,
      },
    });
    return;
  }

  const user = emailLower
    ? await PlatformUser.findOne({ email: emailLower, isActive: true, approvalStatus: "approved" })
    : await PlatformUser.findOne({ userId: idRegex, isActive: true, approvalStatus: "approved" });
  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    const token = signToken({
      id: user._id.toString(),
      loginId: user.userId,
      role: "user",
      name: user.name,
      brokerId: user.brokerId,
    });
    res.json({
      token,
      user: {
        id: user._id,
        loginId: user.userId,
        role: "user",
        name: user.name,
        brokerId: user.brokerId,
      },
    });
    return;
  }

  res.status(401).json({ message: "Invalid login ID, email, or password" });
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not logged in" });
    return;
  }
  try {
    const { verifyToken } = await import("../utils/jwt.js");
    const payload = verifyToken(header.slice(7));
    res.json({ user: payload });
  } catch {
    res.status(401).json({ message: "Invalid session" });
  }
});

export default router;
