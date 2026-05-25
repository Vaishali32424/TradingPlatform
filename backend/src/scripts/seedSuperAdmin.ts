import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { SuperAdmin } from "../models/SuperAdmin.js";

async function seed() {
  await connectDB();

  const loginId = process.env.SUPERADMIN_LOGIN_ID ?? "superadmin";
  const password = process.env.SUPERADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.SUPERADMIN_NAME ?? "Platform Admin";

  const existing = await SuperAdmin.findOne({ loginId });
  if (existing) {
    console.log(`Super admin already exists (loginId: ${loginId})`);
    process.exit(0);
  }

  await SuperAdmin.create({
    loginId,
    passwordHash: await bcrypt.hash(password, 10),
    name,
  });

  console.log("Super admin created:");
  console.log(`  Login ID: ${loginId}`);
  console.log(`  Password: (from SUPERADMIN_PASSWORD in .env)`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
