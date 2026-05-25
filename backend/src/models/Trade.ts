import mongoose, { Schema, Document, Types } from "mongoose";

export type OptionType = "call" | "put";
export type TradeSide = "buy" | "sell";
export type TradeCurrency = "INR" | "USD";

export interface ITrade extends Document {
  brokerRef: Types.ObjectId;
  brokerId: string;
  userRef: Types.ObjectId;
  userId: string;
  companyName: string;
  expiryDate?: Date;
  strikePrice?: number;
  optionType?: OptionType;
  lots: number;
  side: TradeSide;
  buyAmount: number;
  sellAmount: number;
  amount?: number;
  currency: TradeCurrency;
  tradeName?: string;
  status: "active" | "closed" | "pending";
  notes?: string;
}

const tradeSchema = new Schema<ITrade>(
  {
    brokerRef: { type: Schema.Types.ObjectId, ref: "Broker", required: true },
    brokerId: { type: String, required: true, index: true },
    userRef: { type: Schema.Types.ObjectId, ref: "PlatformUser", required: true },
    userId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    expiryDate: Date,
    strikePrice: Number,
    optionType: { type: String, enum: ["call", "put"] },
    lots: { type: Number, required: true, min: 0.01 },
    side: { type: String, enum: ["buy", "sell"], required: true },
    buyAmount: { type: Number, default: 0 },
    sellAmount: { type: Number, default: 0 },
    amount: Number,
    currency: { type: String, enum: ["INR", "USD"], default: "USD" },
    tradeName: String,
    status: {
      type: String,
      enum: ["active", "closed", "pending"],
      default: "active",
    },
    notes: String,
  },
  { timestamps: true }
);

export const Trade = mongoose.model<ITrade>("Trade", tradeSchema);
