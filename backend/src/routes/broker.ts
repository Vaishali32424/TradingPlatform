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
import { logActivity } from "../utils/activity.js";

const router = Router();
router.use(requireAuth, requireRole("broker"));

async function getBroker(req: AuthRequest) {
  return Broker.findOne({ brokerId: req.user!.brokerId });
}

router.get("/dashboard", async (req: AuthRequest, res) => {
  const broker = await getBroker(req);
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }
  const [userCount, pendingWithdrawals] = await Promise.all([
    PlatformUser.countDocuments({ brokerId: broker.brokerId, isActive: true }),
    WithdrawalRequest.countDocuments({ brokerId: broker.brokerId, status: "pending" }),
  ]);
  res.json({
    totalReceived: broker.totalReceived,
    userCount,
    pendingWithdrawals,
    brokerId: broker.brokerId,
    signupLink: `${process.env.CLIENT_URL}/signup?brokerId=${broker.brokerId}`,
    bankDetails: {
      accountNumber: broker.bankAccountNumber,
      ifscCode: broker.ifscCode,
      name: broker.name,
    },
  });
});

router.get("/profile", async (req: AuthRequest, res) => {
  const broker = await getBroker(req);
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }
  const obj = broker.toObject();
  delete (obj as { passwordHash?: string }).passwordHash;
  res.json(obj);
});

const brokerPhotoUpload = createAvatarUpload("broker");

router.post("/profile/photo", (req, res, next) => {
  brokerPhotoUpload(req, res, (err) => {
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
  const broker = await getBroker(req);
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }
  if (broker.profilePhoto) {
    const oldPath = path.join(process.cwd(), broker.profilePhoto.replace(/^\//, ""));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  broker.profilePhoto = photoPublicPath(req.file.filename);
  await broker.save();
  const obj = broker.toObject();
  delete (obj as { passwordHash?: string }).passwordHash;
  res.json({ broker: obj, profilePhoto: broker.profilePhoto });
});

router.get("/users", async (req: AuthRequest, res) => {
  const users = await PlatformUser.find({ brokerId: req.user!.brokerId })
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();
  res.json(users);
});

const panField = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "PAN must be 10 characters like ABCDE1234F");
const aadharField = z.string().regex(/^\d{12}$/, "Aadhar must be exactly 12 digits");
const dematField = z
  .string()
  .regex(/^\d{12}$/, "Demat must be exactly 12 digits")
  .optional()
  .or(z.literal(""));

const userCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  aadharNumber: aadharField,
  panNumber: panField,
  dematNumber: dematField,
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
});

const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  aadharNumber: aadharField.optional().or(z.literal("")),
  panNumber: panField.optional().or(z.literal("")),
  dematNumber: dematField,
  password: z.string().min(6).optional().or(z.literal("")),
  confirmPassword: z.string().optional(),
});

function validationMessage(result: z.SafeParseError<unknown>): string {
  return result.error.errors[0]?.message ?? "Invalid data";
}

router.post("/users", async (req: AuthRequest, res) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: validationMessage(parsed) });
    return;
  }
  const data = parsed.data;
  if (data.password !== data.confirmPassword) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }

  const broker = await getBroker(req);
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }

  const email = data.email?.trim().toLowerCase() || undefined;
  if (email) {
    const taken = await PlatformUser.findOne({ email });
    if (taken) {
      res.status(400).json({ message: "Email already in use" });
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
    aadharNumber: data.aadharNumber || undefined,
    panNumber: data.panNumber ? data.panNumber.toUpperCase() : undefined,
    dematNumber: data.dematNumber || undefined,
    passwordHash: await bcrypt.hash(data.password, 10),
  });

  await logActivity(
    "broker",
    broker.brokerId,
    "user_created",
    `Created user ${user.name}`,
    broker.brokerId,
    {
      brokerId: broker.brokerId,
      brokerName: broker.name,
      userId: user.userId,
      userName: user.name,
    }
  );

  res.status(201).json({
    user: { ...user.toObject(), passwordHash: undefined },
  });
});

router.put("/users/:id", async (req: AuthRequest, res) => {
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: validationMessage(parsed) });
    return;
  }

  const user = await PlatformUser.findOne({
    _id: req.params.id,
    brokerId: req.user!.brokerId,
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const data = parsed.data;
  if (data.password) {
    if (data.password !== data.confirmPassword) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }
    user.passwordHash = await bcrypt.hash(data.password, 10);
  }
  if (data.name) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.email !== undefined) {
    const email = data.email?.trim().toLowerCase() || undefined;
    if (email) {
      const taken = await PlatformUser.findOne({ email, _id: { $ne: user._id } });
      if (taken) {
        res.status(400).json({ message: "Email already in use" });
        return;
      }
    }
    user.email = email;
  }
  if (data.aadharNumber !== undefined) {
    user.aadharNumber = data.aadharNumber || undefined;
  }
  if (data.panNumber !== undefined) {
    user.panNumber = data.panNumber ? data.panNumber.toUpperCase() : undefined;
  }
  if (data.dematNumber !== undefined) {
    user.dematNumber = data.dematNumber || undefined;
  }

  await user.save();
  res.json({ user: { ...user.toObject(), passwordHash: undefined } });
});

router.delete("/users/:id", async (req: AuthRequest, res) => {
  const user = await PlatformUser.findOneAndUpdate(
    { _id: req.params.id, brokerId: req.user!.brokerId },
    { isActive: false },
    { new: true }
  );
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ message: "User deactivated" });
});

const addMoneySchema = z.object({
  amount: z.number().positive(),
  note: z.string().optional(),
});

router.post("/users/:id/add-money", async (req: AuthRequest, res) => {
  const parsed = addMoneySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid amount" });
    return;
  }

  const broker = await getBroker(req);
  const user = await PlatformUser.findOne({
    _id: req.params.id,
    brokerId: req.user!.brokerId,
    isActive: true,
  });
  if (!broker || !user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const tx = await Transaction.create({
    userRef: user._id,
    userId: user.userId,
    brokerRef: broker._id,
    brokerId: broker.brokerId,
    amount: parsed.data.amount,
    type: "broker_credit",
    status: "completed",
    paymentRef: `BROKER-${Date.now()}`,
    note: parsed.data.note,
    addedByBrokerName: broker.name,
  });

  user.totalDeposited += parsed.data.amount;
  broker.totalReceived += parsed.data.amount;
  await Promise.all([user.save(), broker.save()]);

  await logActivity(
    "broker",
    broker.brokerId,
    "money_added",
    `₹${parsed.data.amount} to ${user.name}`,
    broker.brokerId,
    {
      brokerId: broker.brokerId,
      brokerName: broker.name,
      userId: user.userId,
      userName: user.name,
      amount: parsed.data.amount,
      note: parsed.data.note,
    }
  );

  res.status(201).json({
    message: `₹${parsed.data.amount.toLocaleString()} added to ${user.name}`,
    transaction: tx,
    user: { ...user.toObject(), passwordHash: undefined },
  });
});

router.get("/withdrawals", async (req: AuthRequest, res) => {
  const list = await WithdrawalRequest.find({ brokerId: req.user!.brokerId })
    .sort({ createdAt: -1 })
    .lean();
  res.json(list);
});

const reviewWithdrawalSchema = z.object({
  status: z.enum(["approved", "declined", "on_hold"]),
  brokerRemark: z.string().optional(),
});

router.put("/withdrawals/:id", async (req: AuthRequest, res) => {
  const parsed = reviewWithdrawalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid review data" });
    return;
  }

  const broker = await getBroker(req);
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }

  const request = await WithdrawalRequest.findOne({
    _id: req.params.id,
    brokerId: broker.brokerId,
  });
  if (!request) {
    res.status(404).json({ message: "Withdrawal request not found" });
    return;
  }

  if (request.status !== "pending" && request.status !== "on_hold") {
    res.status(400).json({ message: "This request was already reviewed" });
    return;
  }

  const { status, brokerRemark } = parsed.data;

  if (status === "approved") {
    const user = await PlatformUser.findById(request.userRef);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (request.amount > user.totalDeposited) {
      res.status(400).json({
        message: `User balance (₹${user.totalDeposited}) is less than requested amount`,
      });
      return;
    }
    user.totalDeposited -= request.amount;
    await user.save();
  }

  request.status = status;
  request.brokerRemark = brokerRemark;
  request.reviewedAt = new Date();
  await request.save();

  await logActivity(
    "broker",
    broker.brokerId,
    `withdrawal_${status}`,
    `${request.userName} — ₹${request.amount}`,
    broker.brokerId,
    {
      brokerId: broker.brokerId,
      brokerName: broker.name,
      userId: request.userId,
      userName: request.userName,
      amount: request.amount,
    }
  );

  res.json({
    message: `Withdrawal ${status.replace("_", " ")}`,
    request,
  });
});

router.get("/users/:userId/trades", async (req: AuthRequest, res) => {
  const trades = await Trade.find({
    brokerId: req.user!.brokerId,
    userRef: req.params.userId,
  }).sort({ createdAt: -1 });
  res.json(trades);
});

const tradeSchema = z.object({
  userId: z.string(),
  companyName: z.string().min(1),
  lots: z.number().positive(),
  side: z.enum(["buy", "sell"]),
  buyAmount: z.number().positive(),
  sellAmount: z.number().positive(),
  currency: z.enum(["INR", "USD"]).optional(),
  expiryDate: z.string().optional(),
  strikePrice: z.number().positive().optional(),
  optionType: z.enum(["call", "put"]).optional(),
  status: z.enum(["active", "closed", "pending"]).optional(),
  notes: z.string().optional(),
});

router.post("/trades", async (req: AuthRequest, res) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid trade data" });
    return;
  }

  const broker = await getBroker(req);
  const platformUser = await PlatformUser.findOne({
    userId: parsed.data.userId,
    brokerId: req.user!.brokerId,
  });
  if (!broker || !platformUser) {
    res.status(404).json({ message: "User not found under your broker account" });
    return;
  }

  const data = parsed.data;
  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
  if (data.expiryDate && expiryDate && Number.isNaN(expiryDate.getTime())) {
    res.status(400).json({ message: "Invalid expiry date" });
    return;
  }

  const tradeLabel = `${data.companyName} · ${data.side} ${data.lots}`;
  const trade = await Trade.create({
    brokerRef: broker._id,
    brokerId: broker.brokerId,
    userRef: platformUser._id,
    userId: platformUser.userId,
    companyName: data.companyName,
    expiryDate,
    strikePrice: data.strikePrice,
    optionType: data.optionType,
    lots: data.lots,
    side: data.side,
    buyAmount: data.buyAmount,
    sellAmount: data.sellAmount,
    amount: data.sellAmount,
    currency: data.currency ?? "USD",
    tradeName: tradeLabel,
    status: data.status ?? "active",
    notes: data.notes,
  });

  await logActivity(
    "broker",
    broker.brokerId,
    "trade_created",
    tradeLabel,
    broker.brokerId,
    {
      brokerId: broker.brokerId,
      brokerName: broker.name,
      userId: platformUser.userId,
      userName: platformUser.name,
      trade: {
        companyName: data.companyName,
        expiryDate: expiryDate?.toISOString() ?? "",
        strikePrice: data.strikePrice ?? 0,
        optionType: data.optionType ?? "",
        lots: data.lots,
        side: data.side,
        amount: data.sellAmount - data.buyAmount,
        currency: data.currency ?? "USD",
      },
    }
  );
  res.status(201).json(trade);
});

router.put("/trades/:id", async (req: AuthRequest, res) => {
  const parsed = tradeSchema.partial().omit({ userId: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid trade data" });
    return;
  }

  const trade = await Trade.findOneAndUpdate(
    { _id: req.params.id, brokerId: req.user!.brokerId },
    parsed.data,
    { new: true }
  );
  if (!trade) {
    res.status(404).json({ message: "Trade not found" });
    return;
  }
  res.json(trade);
});

router.delete("/trades/:id", async (req: AuthRequest, res) => {
  const deleted = await Trade.findOneAndDelete({
    _id: req.params.id,
    brokerId: req.user!.brokerId,
  });
  if (!deleted) {
    res.status(404).json({ message: "Trade not found" });
    return;
  }
  res.json({ message: "Trade deleted" });
});

export default router;
