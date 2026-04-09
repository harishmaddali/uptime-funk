import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;
  const [monitors, checks24h, upCount, downCount] = await Promise.all([
    prisma.monitor.findMany({ where: { userId: uid } }),
    prisma.monitorCheck.count({
      where: {
        monitor: { userId: uid },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.monitor.count({ where: { userId: uid, status: "up" } }),
    prisma.monitor.count({ where: { userId: uid, status: "down" } }),
  ]);

  const avgRt =
    monitors.reduce((s, m) => s + (m.lastResponseTimeMs ?? 0), 0) /
    Math.max(monitors.length, 1);

  return NextResponse.json({
    totalMonitors: monitors.length,
    up: upCount,
    down: downCount,
    unknown: monitors.length - upCount - downCount,
    checks24h,
    avgResponseTimeMs: Math.round(avgRt),
  });
}
