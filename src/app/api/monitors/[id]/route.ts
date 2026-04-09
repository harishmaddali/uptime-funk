import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  return prisma.monitor.findFirst({
    where: { id, userId },
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const monitor = await getOwnedMonitor(id, session.user.id);
  if (!monitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const checks = await prisma.monitorCheck.findMany({
    where: { monitorId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ monitor, checks });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
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
        await prisma.monitor.findFirst({
          where: { publicSlug: candidate, NOT: { id } },
        })
      ) {
        n += 1;
        candidate = `${base}-${n}`;
      }
      publicSlug = candidate;
    }
    if (d.public === false) {
      publicSlug = null;
    }
    const monitor = await prisma.monitor.update({
      where: { id },
      data: {
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
      },
    });
    return NextResponse.json({ monitor });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getOwnedMonitor(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.monitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
