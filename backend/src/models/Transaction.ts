import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  userRef: Types.ObjectId;
  userId: string;
  brokerRef: Types.ObjectId;
  brokerId: string;
  amount: number;
  type: "broker_credit";
  status: "pending" | "completed" | "failed";
  paymentRef?: string;
  note?: string;
  addedByBrokerName?: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userRef: { type: Schema.Types.ObjectId, ref: "PlatformUser", required: true },
    userId: { type: String, required: true, index: true },
    brokerRef: { type: Schema.Types.ObjectId, ref: "Broker", required: true },
    brokerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["broker_credit"],
      default: "broker_credit",
    },
    addedByBrokerName: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentRef: String,
    note: String,
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);
