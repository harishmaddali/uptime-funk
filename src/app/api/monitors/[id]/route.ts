import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, ne } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { monitor, monitorCheck } from "@/db/app-schema";
import { slugify } from "@/lib/utils";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().url().optional(),
  method: z.enum(["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE"]).optional(),
  expectedStatus: z.number().int().min(100).max(599).optional(),
  expectedBody: z.string().max(2000).optional().nullable(),
  intervalSeconds: z
    .number()
    .int()
    .refine((n) => [60, 120, 300, 600, 900, 1800, 3600].includes(n))
    .optional(),
  enabled: z.boolean().optional(),
  useCustomNotify: z.boolean().optional(),
  notifyEmail: z.boolean().optional().nullable(),
  notifySms: z.boolean().optional().nullable(),
  notifySlack: z.boolean().optional().nullable(),
  notifyTelegram: z.boolean().optional().nullable(),
  public: z.boolean().optional(),
});

async function getOwnedMonitor(id: string, userId: string) {
  const rows = await db
    .select()
    .from(monitor)
    .where(and(eq(monitor.id, id), eq(monitor.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const row = await getOwnedMonitor(id, session.user.id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const checks = await db
    .select()
    .from(monitorCheck)
    .where(eq(monitorCheck.monitorId, id))
    .orderBy(desc(monitorCheck.createdAt))
    .limit(100);
  return NextResponse.json({ monitor: row, checks });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getOwnedMonitor(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const d = parsed.data;
    let publicSlug = existing.publicSlug;
    if (d.public === true && !existing.publicSlug) {
      const base = slugify(d.name ?? existing.name) || "monitor";
      let candidate = base;
      let n = 0;
      while (
        (
          await db
            .select({ id: monitor.id })
            .from(monitor)
            .where(and(eq(monitor.publicSlug, candidate), ne(monitor.id, id)))
            .limit(1)
        ).length > 0
      ) {
        n += 1;
        candidate = `${base}-${n}`;
      }
      publicSlug = candidate;
    }
    if (d.public === false) {
      publicSlug = null;
    }

    await db
      .update(monitor)
      .set({
        ...(d.name !== undefined && { name: d.name }),
        ...(d.url !== undefined && { url: d.url }),
        ...(d.method !== undefined && { method: d.method }),
        ...(d.expectedStatus !== undefined && { expectedStatus: d.expectedStatus }),
        ...(d.expectedBody !== undefined && { expectedBody: d.expectedBody }),
        ...(d.intervalSeconds !== undefined && { intervalSeconds: d.intervalSeconds }),
        ...(d.enabled !== undefined && { enabled: d.enabled }),
        ...(d.useCustomNotify !== undefined && { useCustomNotify: d.useCustomNotify }),
        ...(d.notifyEmail !== undefined && { notifyEmail: d.notifyEmail }),
        ...(d.notifySms !== undefined && { notifySms: d.notifySms }),
        ...(d.notifySlack !== undefined && { notifySlack: d.notifySlack }),
        ...(d.notifyTelegram !== undefined && { notifyTelegram: d.notifyTelegram }),
        ...(d.public !== undefined && { publicSlug }),
      })
      .where(eq(monitor.id, id));

    const [updated] = await db.select().from(monitor).where(eq(monitor.id, id)).limit(1);
    return NextResponse.json({ monitor: updated });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getOwnedMonitor(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(monitor).where(eq(monitor.id, id));
  return NextResponse.json({ ok: true });
}
