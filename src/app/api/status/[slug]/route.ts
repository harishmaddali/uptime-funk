import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { monitor } from "@/db/app-schema";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const rows = await db
    .select({
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      status: monitor.status,
      lastCheckedAt: monitor.lastCheckedAt,
      lastResponseTimeMs: monitor.lastResponseTimeMs,
      publicSlug: monitor.publicSlug,
    })
    .from(monitor)
    .where(eq(monitor.publicSlug, slug))
    .limit(1);
  const m = rows[0];
  if (!m) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ monitor: m });
}
