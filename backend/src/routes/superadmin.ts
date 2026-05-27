import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth.js";
import { Broker } from "../models/Broker.js";
import { PlatformUser } from "../models/PlatformUser.js";
import { Transaction } from "../models/Transaction.js";
import { Trade } from "../models/Trade.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { generateBrokerId } from "../utils/ids.js";
import { logActivity } from "../utils/activity.js";

const router = Router();
router.use(requireAuth, requireRole("superadmin"));

router.get("/dashboard", async (_req, res) => {
  const [totalMoney, brokerCount, userCount, recentActivity, recentTrades] = await Promise.all([
    Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Broker.countDocuments({ isActive: true }),
    PlatformUser.countDocuments({ isActive: true }),
    ActivityLog.find({ actorRole: "broker" })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    Trade.find().sort({ createdAt: -1 }).limit(15).lean(),
  ]);

  const brokerIds = [...new Set(recentActivity.map((a) => a.actorId))];
  const brokers = await Broker.find({ brokerId: { $in: brokerIds } })
    .select("brokerId name profilePhoto")
    .lean();
  const brokerMap = Object.fromEntries(brokers.map((b) => [b.brokerId, b]));

  const enrichedActivity = await Promise.all(
    recentActivity.map(async (a) => {
      const meta = a.metadata ?? {};
      const broker =
        brokerMap[a.actorId] ??
        (meta.brokerId
          ? await Broker.findOne({ brokerId: meta.brokerId }).select("brokerId name profilePhoto").lean()
          : null);
      return {
        ...a,
        brokerName: meta.brokerName ?? broker?.name ?? a.actorId,
        brokerDisplayId: meta.brokerId ?? broker?.brokerId ?? a.actorId,
        userId: meta.userId,
        userName: meta.userName,
        metadata: meta,
      };
    })
  );

  const tradeUserIds = [...new Set(recentTrades.map((t) => t.userId))];
  const tradeBrokerIds = [...new Set(recentTrades.map((t) => t.brokerId))];
  const [tradeUsers, tradeBrokers] = await Promise.all([
    PlatformUser.find({ userId: { $in: tradeUserIds } })
      .select("userId name profilePhoto")
      .lean(),
    Broker.find({ brokerId: { $in: tradeBrokerIds } })
      .select("brokerId name profilePhoto")
      .lean(),
  ]);
  const userMap = Object.fromEntries(tradeUsers.map((u) => [u.userId, u]));
  const tradeBrokerMap = Object.fromEntries(tradeBrokers.map((b) => [b.brokerId, b]));

  res.json({
    totalPlatformMoney: totalMoney[0]?.total ?? 0,
    activeBrokers: brokerCount,
    activeUsers: userCount,
    brokerActivity: enrichedActivity,
    recentTrades: recentTrades.map((t) => ({
      ...t,
      userName: userMap[t.userId]?.name,
      userProfilePhoto: userMap[t.userId]?.profilePhoto,
      brokerName: tradeBrokerMap[t.brokerId]?.name,
      brokerProfilePhoto: tradeBrokerMap[t.brokerId]?.profilePhoto,
    })),
  });
});

router.get("/trades", async (_req, res) => {
  const trades = await Trade.find().sort({ createdAt: -1 }).limit(100).lean();
  const userIds = [...new Set(trades.map((t) => t.userId))];
  const brokerIds = [...new Set(trades.map((t) => t.brokerId))];
  const [users, brokers] = await Promise.all([
    PlatformUser.find({ userId: { $in: userIds } })
      .select("userId name profilePhoto")
      .lean(),
    Broker.find({ brokerId: { $in: brokerIds } })
      .select("brokerId name profilePhoto")
      .lean(),
  ]);
  const userMap = Object.fromEntries(users.map((u) => [u.userId, u]));
  const brokerMap = Object.fromEntries(brokers.map((b) => [b.brokerId, b]));
  res.json(
    trades.map((t) => ({
      ...t,
      userName: userMap[t.userId]?.name,
      userProfilePhoto: userMap[t.userId]?.profilePhoto,
      brokerName: brokerMap[t.brokerId]?.name,
      brokerProfilePhoto: brokerMap[t.brokerId]?.profilePhoto,
    }))
  );
});

router.get("/brokers", async (_req, res) => {
  const [brokers, users] = await Promise.all([
    Broker.find().sort({ createdAt: -1 }).lean(),
    PlatformUser.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const usersByBroker = users.reduce<Record<string, typeof users>>((acc, u) => {
    if (!acc[u.brokerId]) acc[u.brokerId] = [];
    acc[u.brokerId].push(u);
    return acc;
  }, {});
  res.json(
    brokers.map((b) => ({
      ...b,
      passwordHash: undefined,
      userCount: usersByBroker[b.brokerId]?.length ?? 0,
      users: usersByBroker[b.brokerId] ?? [],
    }))
  );
});

const aadharSchema = z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits");
const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format");

const brokerSchema = z.object({
  name: z.string().min(1),
  relation: z.string().optional(),
  remark: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bankAccountNumber: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  ifscCode: z.string().min(1),
  aadharNumber: aadharSchema,
  panNumber: panSchema,
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

router.post("/brokers", async (req: AuthRequest, res) => {
  const parsed = brokerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0]?.message });
    return;
  }
  const data = parsed.data;
  if (data.password !== data.confirmPassword) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }

  const email = data.email?.trim().toLowerCase() || undefined;
  if (email) {
    const taken = await Broker.findOne({ email });
    if (taken) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }
  }

  const brokerId = generateBrokerId();
  const passwordHash = await bcrypt.hash(data.password, 10);
  const broker = await Broker.create({
    brokerId,
    name: data.name,
    relation: data.relation,
    remark: data.remark,
    email,
    bankAccountNumber: data.bankAccountNumber,
    phone: data.phone,
    address: data.address,
    ifscCode: data.ifscCode,
    aadharNumber: data.aadharNumber,
    panNumber: data.panNumber.toUpperCase(),
    passwordHash,
    passwordPlain: data.password,
  });

  await logActivity(
    "superadmin",
    req.user!.loginId,
    "broker_created",
    `Created broker ${brokerId}`,
    brokerId
  );

  res.status(201).json({
    broker: { ...broker.toObject(), passwordHash: undefined },
    signupLink: `${process.env.CLIENT_URL}/signup?brokerId=${brokerId}`,
  });
});

router.put("/brokers/:id", async (req: AuthRequest, res) => {
  const parsed = brokerSchema.partial().extend({
    password: z.string().min(6).optional(),
    confirmPassword: z.string().optional(),
    isActive: z.boolean().optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  const broker = await Broker.findById(req.params.id);
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }

  const data = parsed.data;
  if (data.password) {
    if (data.password !== data.confirmPassword) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }
    broker.passwordHash = await bcrypt.hash(data.password, 10);
    broker.passwordPlain = data.password;
  }

  if (data.name) broker.name = data.name;
  if (data.relation !== undefined) broker.relation = data.relation;
  if (data.remark !== undefined) broker.remark = data.remark;
  if (data.email !== undefined) {
    const email = data.email?.trim().toLowerCase() || undefined;
    if (email) {
      const taken = await Broker.findOne({ email, _id: { $ne: broker._id } });
      if (taken) {
        res.status(400).json({ message: "Email already in use" });
        return;
      }
    }
    broker.email = email;
  }
  if (data.bankAccountNumber) broker.bankAccountNumber = data.bankAccountNumber;
  if (data.phone) broker.phone = data.phone;
  if (data.address) broker.address = data.address;
  if (data.ifscCode) broker.ifscCode = data.ifscCode;
  if (data.aadharNumber !== undefined) broker.aadharNumber = data.aadharNumber;
  if (data.panNumber !== undefined) {
    broker.panNumber = data.panNumber ? data.panNumber.toUpperCase() : undefined;
  }
  if (data.isActive !== undefined) broker.isActive = data.isActive;

  await broker.save();
  await logActivity("superadmin", req.user!.loginId, "broker_updated", broker.brokerId);

  res.json({ broker: { ...broker.toObject(), passwordHash: undefined } });
});

router.delete("/brokers/:id", async (req: AuthRequest, res) => {
  const broker = await Broker.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!broker) {
    res.status(404).json({ message: "Broker not found" });
    return;
  }
  await logActivity("superadmin", req.user!.loginId, "broker_deactivated", broker.brokerId);
  res.json({ message: "Broker deactivated" });
});

router.get("/users", async (req, res) => {
  const filter = req.query.brokerId
    ? { brokerId: String(req.query.brokerId) }
    : {};
  const users = await PlatformUser.find(filter).sort({ createdAt: -1 }).lean();
  res.json(users);
});

export default router;
