import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPlatformUser extends Document {
  userId: string;
  brokerId: string;
  brokerRef: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  aadharNumber?: string;
  panNumber?: string;
  profilePhoto?: string;
  dematNumber?: string;
  passwordHash: string;
  passwordPlain?: string;
  role: "user";
  totalDeposited: number;
  isActive: boolean;
  approvalStatus: "pending" | "approved" | "declined";
}

const platformUserSchema = new Schema<IPlatformUser>(
  {
    userId: { type: String, required: true, unique: true },
    brokerId: { type: String, required: true, index: true },
    brokerRef: { type: Schema.Types.ObjectId, ref: "Broker", required: true },
    name: { type: String, required: true },
    phone: String,
    email: { type: String, lowercase: true, trim: true, sparse: true },
    aadharNumber: String,
    panNumber: { type: String, uppercase: true, trim: true },
    profilePhoto: String,
    dematNumber: { type: String, match: /^\d{12}$/ },
    passwordHash: { type: String, required: true },
    passwordPlain: String,
    role: { type: String, default: "user", immutable: true },
    totalDeposited: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "approved",
    },
  },
  { timestamps: true }
);

export const PlatformUser = mongoose.model<IPlatformUser>(
  "PlatformUser",
  platformUserSchema
);
