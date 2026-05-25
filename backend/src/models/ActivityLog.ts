import mongoose, { Schema, Document } from "mongoose";

export interface ActivityTradeMeta {
  companyName: string;
  expiryDate: string;
  strikePrice: number;
  optionType: string;
  lots: number;
  side: string;
  amount: number;
  currency: string;
}

export interface ActivityMetadata {
  brokerId?: string;
  brokerName?: string;
  userId?: string;
  userName?: string;
  amount?: number;
  trade?: ActivityTradeMeta;
  note?: string;
}

export interface IActivityLog extends Document {
  actorRole: "superadmin" | "broker" | "user";
  actorId: string;
  action: string;
  details?: string;
  brokerId?: string;
  metadata?: ActivityMetadata;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actorRole: {
      type: String,
      enum: ["superadmin", "broker", "user"],
      required: true,
    },
    actorId: { type: String, required: true },
    action: { type: String, required: true },
    details: String,
    brokerId: String,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  activityLogSchema
);
