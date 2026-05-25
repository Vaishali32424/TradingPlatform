import mongoose from "mongoose";

export async function connectDB(maxAttempts = 30): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.warn(`MongoDB connect failed (${attempt}/${maxAttempts}), retrying...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
