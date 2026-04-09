import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { monitor, monitorCheck } from "@/db/app-schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const monitorsList = await db
    .select()
    .from(monitor)
    .where(eq(monitor.userId, uid));

  const checks24hRows = await db
    .select({ c: sql<number>`count(*)`.mapWith(Number) })
    .from(monitorCheck)
    .innerJoin(monitor, eq(monitorCheck.monitorId, monitor.id))
    .where(
      and(eq(monitor.userId, uid), gte(monitorCheck.createdAt, since))
    );
  const checks24h = checks24hRows[0]?.c ?? 0;

  const up = monitorsList.filter((m) => m.status === "up").length;
  const down = monitorsList.filter((m) => m.status === "down").length;
  const total = monitorsList.length;
  const avgRt =
    monitorsList.reduce((s, m) => s + (m.lastResponseTimeMs ?? 0), 0) /
    Math.max(total, 1);

  return NextResponse.json({
    totalMonitors: total,
    up,
    down,
    unknown: total - up - down,
    checks24h,
    avgResponseTimeMs: Math.round(avgRt),
  });
}
