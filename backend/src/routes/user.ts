import { Router } from "express";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth.js";
import { createAvatarUpload, photoPublicPath } from "../middleware/upload.js";
import { Broker } from "../models/Broker.js";
import { PlatformUser } from "../models/PlatformUser.js";
import { Trade } from "../models/Trade.js";
import { Transaction } from "../models/Transaction.js";
import { WithdrawalRequest } from "../models/WithdrawalRequest.js";
import { generateUserId } from "../utils/ids.js";
import { normalizeTrade, tradeProfitLoss } from "../utils/tradeCalc.js";
import { buildStatementLedger } from "../utils/statement.js";

function maskId(value?: string): string | undefined {
  if (!value || value.length < 4) return value;
  return `${value.slice(0, 4)}${"X".repeat(Math.max(0, value.length - 4))}`;
}

const router = Router();

const signupSchema = z.object({
  brokerId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits"),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format"),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid signup data" });
    return;
  }
  const data = parsed.data;
  if (data.password !== data.confirmPassword) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }

  const broker = await Broker.findOne({ brokerId: data.brokerId, isActive: true });
  if (!broker) {
    res.status(400).json({ message: "Invalid broker link. Contact your broker." });
    return;
  }

  const email = data.email?.trim().toLowerCase() || undefined;
  if (email) {
    const taken = await PlatformUser.findOne({ email });
    if (taken) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }
  }

  const userId = generateUserId();
  const user = await PlatformUser.create({
    userId,
    brokerId: broker.brokerId,
    brokerRef: broker._id,
    name: data.name,
    phone: data.phone,
    email,
    aadharNumber: data.aadharNumber,
    panNumber: data.panNumber.toUpperCase(),
    passwordHash: await bcrypt.hash(data.password, 10),
    passwordPlain: data.password,
    isActive: false,
    approvalStatus: "pending",
  });

  // Broker approval flow: user cannot log in until approved.
  // We log activity for broker visibility.
  const { logActivity } = await import("../utils/activity.js");
  await logActivity(
    "user",
    user.userId,
    "signup_request_sent",
    `Signup request sent to broker ${broker.brokerId}`,
    broker.brokerId,
    {
      brokerId: broker.brokerId,
      brokerName: broker.name,
      userId: user.userId,
      userName: user.name,
    }
  );

  res.status(201).json({
    message: "Account created. Waiting for broker approval.",
    userId: user.userId,
  });
});

router.get("/broker-info/:brokerId", async (req, res) => {
  const broker = await Broker.findOne({
    brokerId: req.params.brokerId,
    isActive: true,
  }).select("name brokerId");
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }
  res.json(broker);
});

router.use(requireAuth, requireRole("user"));

router.get("/profile", async (req: AuthRequest, res) => {
  const user = await PlatformUser.findOne({ userId: req.user!.loginId })
    .select("-passwordHash")
    .lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const broker = await Broker.findOne({ brokerId: user.brokerId }).select("phone");
  res.json({
    user: {
      ...user,
      aadharMasked: maskId(user.aadharNumber),
      panMasked: maskId(user.panNumber),
      aadharNumber: undefined,
      panNumber: undefined,
    },
    brokerPhone: broker?.phone ?? "",
  });
});

const userPhotoUpload = createAvatarUpload("user");

router.post("/profile/photo", (req, res, next) => {
  userPhotoUpload(req, res, (err) => {
    if (err) {
      res.status(400).json({ message: err instanceof Error ? err.message : "Upload failed" });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No photo uploaded" });
    return;
  }
  const user = await PlatformUser.findOne({ userId: req.user!.loginId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  if (user.profilePhoto) {
    const oldPath = path.join(process.cwd(), user.profilePhoto.replace(/^\//, ""));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  user.profilePhoto = photoPublicPath(req.file.filename);
  await user.save();
  const obj = user.toObject();
  delete (obj as { passwordHash?: string }).passwordHash;
  res.json({ user: obj, profilePhoto: user.profilePhoto });
});

const profileUpdateSchema = z.object({
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits").optional().or(z.literal("")),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
});

router.put("/profile", async (req: AuthRequest, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid data" });
    return;
  }

  const user = await PlatformUser.findOne({ userId: req.user!.loginId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const data = parsed.data;
  if (data.aadharNumber !== undefined) {
    user.aadharNumber = data.aadharNumber || undefined;
  }
  if (data.panNumber !== undefined) {
    user.panNumber = data.panNumber ? data.panNumber.toUpperCase() : undefined;
  }

  await user.save();
  const obj = user.toObject();
  delete (obj as { passwordHash?: string }).passwordHash;
  res.json({ user: obj });
});

async function allUserTrades(userId: string) {
  const raw = await Trade.find({ userId }).lean();
  return raw.map((t) => normalizeTrade(t as unknown as Record<string, unknown>));
}

router.get("/portfolio", async (req: AuthRequest, res) => {
  const user = await PlatformUser.findOne({ userId: req.user!.loginId }).lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const allTrades = await allUserTrades(req.user!.loginId);
  const trades = allTrades.filter((t) => !t.inOrderHistory);
  // Total Trade should reflect open positions only (exclude order history).
  const totalPL = trades.reduce((sum, t) => sum + Number(t.profitLoss ?? 0), 0);
  const balance = user.totalDeposited;
  const margin = trades
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + Number(t.buyAmount ?? 0) * Number(t.lots ?? 1) * 0.1, 0);
  const equity = balance + totalPL;
  const freeMargin = Math.max(0, equity - margin);
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;

  res.json({
    trades,
    summary: {
      balance,
      equity: Number(equity.toFixed(2)),
      margin: Number(margin.toFixed(2)),
      freeMargin: Number(freeMargin.toFixed(2)),
      marginLevel: Number(marginLevel.toFixed(2)),
      totalPL: Number(totalPL.toFixed(3)),
      currency: "USD",
    },
  });
});

router.get("/portfolio/statement", async (req: AuthRequest, res) => {
  const user = await PlatformUser.findOne({ userId: req.user!.loginId }).lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const [credits, withdrawals, allTrades] = await Promise.all([
    Transaction.find({
      userId: user.userId,
      type: "broker_credit",
      status: "completed",
    })
      .sort({ createdAt: 1 })
      .lean(),
    WithdrawalRequest.find({ userId: user.userId }).sort({ createdAt: 1 }).lean(),
    allUserTrades(user.userId),
  ]);
  const portfolioTrades = allTrades.filter((t) => !t.inOrderHistory);
  const totalPL = portfolioTrades.reduce((sum, t) => sum + Number(t.profitLoss ?? 0), 0);
  const ledger = buildStatementLedger({
    deposits: credits.map((c) => ({
      amount: c.amount,
      createdAt: (c as { createdAt?: Date }).createdAt ?? new Date(),
      note: c.note,
      addedBy: c.addedByBrokerName,
    })),
    withdrawals: withdrawals.map((w) => ({
      amount: w.amount,
      createdAt: w.reviewedAt ?? (w as { createdAt?: Date }).createdAt ?? new Date(),
      status: w.status,
    })),
    trades: portfolioTrades as Parameters<typeof buildStatementLedger>[0]["trades"],
    openingBalance: 0,
  });
  res.json({
    user: { name: user.name, userId: user.userId },
    trades: portfolioTrades,
    summary: {
      balance: user.totalDeposited,
      equity: Number((user.totalDeposited + totalPL).toFixed(2)),
      totalPL: Number(totalPL.toFixed(3)),
      currency: "USD",
    },
    ledger,
    credits,
    generatedAt: new Date().toISOString(),
  });
});

router.get("/order-history", async (req: AuthRequest, res) => {
  const user = await PlatformUser.findOne({ userId: req.user!.loginId }).lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const raw = await Trade.find({ userId: user.userId, inOrderHistory: true })
    .sort({ movedToHistoryAt: -1, createdAt: -1 })
    .lean();
  const trades = raw.map((t) => normalizeTrade(t as unknown as Record<string, unknown>));
  res.json({ trades });
});

router.get("/order-history/statement", async (req: AuthRequest, res) => {
  const user = await PlatformUser.findOne({ userId: req.user!.loginId }).lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const raw = await Trade.find({ userId: user.userId, inOrderHistory: true })
    .sort({ movedToHistoryAt: 1 })
    .lean();
  const trades = raw.map((t) => normalizeTrade(t as unknown as Record<string, unknown>));
  const ledger = buildStatementLedger({
    deposits: [],
    withdrawals: [],
    trades: trades as Parameters<typeof buildStatementLedger>[0]["trades"],
    openingBalance: 0,
  });
  res.json({
    user: { name: user.name, userId: user.userId },
    trades,
    ledger,
    generatedAt: new Date().toISOString(),
  });
});

router.get("/wallet", async (req: AuthRequest, res) => {
  const user = await PlatformUser.findOne({ userId: req.user!.loginId }).lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const [credits, withdrawals] = await Promise.all([
    Transaction.find({ userId: user.userId, type: "broker_credit", status: "completed" })
      .sort({ createdAt: -1 })
      .lean(),
    WithdrawalRequest.find({ userId: user.userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const trades = await allUserTrades(user.userId);
  const openPL = trades
    .filter((t) => !t.inOrderHistory)
    .reduce((sum, t) => sum + Number(t.profitLoss ?? 0), 0);
  // Realized P/L is already applied to `totalDeposited` when broker moves trades to history.
  const balance = Number((user.totalDeposited + openPL).toFixed(3));

  res.json({
    balance,
    breakdown: {
      baseBalance: user.totalDeposited,
      openPL: Number(openPL.toFixed(3)),
      realizedPL: 0,
    },
    credits,
    withdrawals,
  });
});

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  userNote: z.string().optional(),
});

router.get("/withdrawals", async (req: AuthRequest, res) => {
  const list = await WithdrawalRequest.find({ userId: req.user!.loginId }).sort({
    createdAt: -1,
  });
  res.json(list);
});

router.post("/withdrawals", async (req: AuthRequest, res) => {
  const parsed = withdrawalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Enter a valid withdrawal amount" });
    return;
  }

  const user = await PlatformUser.findOne({ userId: req.user!.loginId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const openTrades = await allUserTrades(user.userId);
  const openPL = openTrades
    .filter((t) => !t.inOrderHistory)
    .reduce((sum, t) => sum + Number(t.profitLoss ?? 0), 0);
  const available = Number((user.totalDeposited + openPL).toFixed(3));

  if (parsed.data.amount > available) {
    res.status(400).json({
      message: `Insufficient balance. Available: $${available.toLocaleString()}`,
    });
    return;
  }

  const pending = await WithdrawalRequest.countDocuments({
    userId: user.userId,
    status: { $in: ["pending", "on_hold"] },
  });
  if (pending > 0) {
    res.status(400).json({
      message: "You already have a pending withdrawal request. Track its status below.",
    });
    return;
  }

  const request = await WithdrawalRequest.create({
    userRef: user._id,
    userId: user.userId,
    userName: user.name,
    brokerRef: user.brokerRef,
    brokerId: user.brokerId,
    amount: parsed.data.amount,
    userNote: parsed.data.userNote,
    status: "pending",
  });

  res.status(201).json({
    message: "Withdrawal request sent to your broker",
    request,
  });
});

export default router;
