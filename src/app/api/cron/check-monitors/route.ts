import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runMonitorCheck } from "@/lib/monitor-check";
import {
  resolveChannelsForMonitor,
  sendIncidentNotifications,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const monitors = await prisma.monitor.findMany({
    where: { enabled: true },
    include: { user: true },
  });

  const due = monitors.filter((m) => {
    const last = m.lastCheckedAt?.getTime() ?? 0;
    return now - last >= m.intervalSeconds * 1000;
  });

  let checked = 0;
  for (const m of due) {
    const result = await runMonitorCheck({
      url: m.url,
      method: m.method,
      expectedStatus: m.expectedStatus,
      expectedBody: m.expectedBody,
    });

    const wasUp = m.status === "up";
    const newStatus = result.ok ? "up" : "down";
    const failures = result.ok ? 0 : m.consecutiveFailures + 1;

    await prisma.monitorCheck.create({
      data: {
        monitorId: m.id,
        ok: result.ok,
        statusCode: result.statusCode,
        responseTime: result.responseTimeMs,
        error: result.error,
      },
    });

    await prisma.monitor.update({
      where: { id: m.id },
      data: {
        status: newStatus,
        lastCheckedAt: new Date(),
        lastResponseTimeMs: result.responseTimeMs,
        lastError: result.error,
        consecutiveFailures: failures,
      },
    });

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
