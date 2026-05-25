import mongoose, { Schema, Document } from "mongoose";

export interface IBroker extends Document {
  brokerId: string;
  name: string;
  relation?: string;
  remark?: string;
  bankAccountNumber: string;
  email?: string;
  phone: string;
  address: string;
  ifscCode: string;
  aadharNumber?: string;
  panNumber?: string;
  profilePhoto?: string;
  passwordHash: string;
  role: "broker";
  totalReceived: number;
  isActive: boolean;
}

const brokerSchema = new Schema<IBroker>(
  {
    brokerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    relation: String,
    remark: String,
    bankAccountNumber: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    ifscCode: { type: String, required: true },
    aadharNumber: String,
    panNumber: { type: String, uppercase: true, trim: true },
    profilePhoto: String,
    passwordHash: { type: String, required: true },
    role: { type: String, default: "broker", immutable: true },
    totalReceived: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Broker = mongoose.model<IBroker>("Broker", brokerSchema);
