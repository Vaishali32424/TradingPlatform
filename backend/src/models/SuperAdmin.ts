import mongoose, { Schema, Document } from "mongoose";

export interface ISuperAdmin extends Document {
  loginId: string;
  passwordHash: string;
  name: string;
  role: "superadmin";
}

const superAdminSchema = new Schema<ISuperAdmin>(
  {
    loginId: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: "superadmin", immutable: true },
  },
  { timestamps: true }
);

export const SuperAdmin = mongoose.model<ISuperAdmin>(
  "SuperAdmin",
  superAdminSchema
);
