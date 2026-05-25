import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

const app = express();
const port = Number(process.env.PORT || 5000);

// Bind port immediately so Render detects an open port (before routes/DB load)
app.get("/api/health", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    db: dbReady ? "connected" : "connecting",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on 0.0.0.0:${port} (PORT=${process.env.PORT ?? "5000"})`);
});

async function loadApp(): Promise<void> {
  const cors = (await import("cors")).default;
  const path = (await import("path")).default;
  const { connectDB } = await import("./config/db.js");
  const authRoutes = (await import("./routes/auth.js")).default;
  const superAdminRoutes = (await import("./routes/superadmin.js")).default;
  const brokerRoutes = (await import("./routes/broker.js")).default;
  const userRoutes = (await import("./routes/user.js")).default;
  const marketRoutes = (await import("./routes/market.js")).default;

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

  app.use("/api/auth", authRoutes);
  app.use("/api/superadmin", superAdminRoutes);
  app.use("/api/broker", brokerRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/market", marketRoutes);

  console.log("Routes registered");

  connectDB().catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
}

loadApp().catch((err) => {
  console.error("Failed to load application:", err);
});
