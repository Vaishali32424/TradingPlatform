import mongoose from "mongoose";

export async function connectDB(maxAttempts = 30): Promise<void> {
  const uri =
      process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "MongoDB connection string is not set. Add MONGODB_URI to .env / Render environment variables."
    );
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
