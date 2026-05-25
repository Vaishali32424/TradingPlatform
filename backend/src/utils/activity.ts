import { ActivityLog, ActivityMetadata } from "../models/ActivityLog.js";
import { UserRole } from "./jwt.js";

export async function logActivity(
  actorRole: UserRole,
  actorId: string,
  action: string,
  details?: string,
  brokerId?: string,
  metadata?: ActivityMetadata
): Promise<void> {
  await ActivityLog.create({
    actorRole,
    actorId,
    action,
    details,
    brokerId,
    metadata,
  });
}
