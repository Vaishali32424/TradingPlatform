import mongoose, { Schema, Document, Types } from "mongoose";

export type WithdrawalStatus = "pending" | "approved" | "declined" | "on_hold";

export interface IWithdrawalRequest extends Document {
  userRef: Types.ObjectId;
  userId: string;
  userName: string;
  brokerRef: Types.ObjectId;
  brokerId: string;
  amount: number;
  status: WithdrawalStatus;
  userNote?: string;
  brokerRemark?: string;
  reviewedAt?: Date;
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userRef: { type: Schema.Types.ObjectId, ref: "PlatformUser", required: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    brokerRef: { type: Schema.Types.ObjectId, ref: "Broker", required: true },
    brokerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "on_hold"],
      default: "pending",
    },
    userNote: String,
    brokerRemark: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>(
  "WithdrawalRequest",
  withdrawalRequestSchema
);
