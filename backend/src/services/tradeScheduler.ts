import { Trade } from "../models/Trade.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

export async function processScheduledTrades(): Promise<number> {
  const now = new Date();
  const result = await Trade.updateMany(
    {
      inOrderHistory: { $ne: true },
      scheduledMoveAt: { $lte: now, $ne: null },
    },
    {
      $set: { inOrderHistory: true, movedToHistoryAt: now },
      $unset: { scheduledMoveAt: "" },
    }
  );
  return result.modifiedCount;
}

export function startTradeScheduler(): void {
  if (intervalId) return;
  const tick = () => {
    processScheduledTrades().catch((err) =>
      console.error("Scheduled trade processing failed:", err)
    );
  };
  tick();
  intervalId = setInterval(tick, 60_000);
}
