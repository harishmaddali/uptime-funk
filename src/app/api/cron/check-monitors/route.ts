import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { monitor, monitorCheck } from "@/db/app-schema";
import { user } from "@/db/auth-schema";
import { runMonitorCheck } from "@/lib/monitor-check";
import {
  resolveChannelsForMonitor,
  sendIncidentNotifications,
} from "@/lib/notifications";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const monitors = await db
    .select({
      monitor,
      ownerEmail: user.email,
    })
    .from(monitor)
    .innerJoin(user, eq(monitor.userId, user.id))
    .where(eq(monitor.enabled, true));

  const due = monitors.filter(({ monitor: m }) => {
    const last = m.lastCheckedAt?.getTime() ?? 0;
    return now - last >= m.intervalSeconds * 1000;
  });

  let checked = 0;
  for (const { monitor: m } of due) {
    const result = await runMonitorCheck({
      url: m.url,
      method: m.method,
      expectedStatus: m.expectedStatus,
      expectedBody: m.expectedBody,
    });

    const wasUp = m.status === "up";
    const newStatus = result.ok ? "up" : "down";
    const failures = result.ok ? 0 : m.consecutiveFailures + 1;

    await db.insert(monitorCheck).values({
      id: createId(),
      monitorId: m.id,
      ok: result.ok,
      statusCode: result.statusCode,
      responseTime: result.responseTimeMs,
      error: result.error,
    });

    await db
      .update(monitor)
      .set({
        status: newStatus,
        lastCheckedAt: new Date(),
        lastResponseTimeMs: result.responseTimeMs,
        lastError: result.error,
        consecutiveFailures: failures,
      })
      .where(eq(monitor.id, m.id));

    checked += 1;

    if (!result.ok && wasUp) {
      const channels = await resolveChannelsForMonitor(m.userId, m);
      await sendIncidentNotifications({
        userId: m.userId,
        monitorName: m.name,
        url: m.url,
        error: result.error || "Check failed",
        channels,
      });
    }
  }

  return NextResponse.json({ checked, due: due.length });
}
