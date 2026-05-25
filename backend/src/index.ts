import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import superAdminRoutes from "./routes/superadmin.js";
import brokerRoutes from "./routes/broker.js";
import userRoutes from "./routes/user.js";
import marketRoutes from "./routes/market.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    db: dbReady ? "connected" : "connecting",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/api/user", userRoutes);
app.use("/api/market", marketRoutes);

const port = Number(process.env.PORT ?? 5000);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on 0.0.0.0:${port}`);
});

connectDB().catch((err) => {
  console.error("MongoDB connection failed:", err);
});
