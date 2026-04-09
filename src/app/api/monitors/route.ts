import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { monitor } from "@/db/app-schema";
import { slugify } from "@/lib/utils";
import { createId } from "@/lib/id";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  method: z.enum(["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE"]).default("GET"),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  expectedBody: z.string().max(2000).optional().nullable(),
  intervalSeconds: z
    .number()
    .int()
    .refine((n) => [60, 120, 300, 600, 900, 1800, 3600].includes(n), {
      message: "Invalid interval",
    }),
  enabled: z.boolean().optional(),
  useCustomNotify: z.boolean().optional(),
  notifyEmail: z.boolean().optional().nullable(),
  notifySms: z.boolean().optional().nullable(),
  notifySlack: z.boolean().optional().nullable(),
  notifyTelegram: z.boolean().optional().nullable(),
  public: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const monitors = await db
    .select()
    .from(monitor)
    .where(eq(monitor.userId, session.user.id))
    .orderBy(desc(monitor.createdAt));

  return NextResponse.json({ monitors });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const d = parsed.data;
    let publicSlug: string | null = null;
    if (d.public) {
      const base = slugify(d.name) || "monitor";
      let candidate = base;
      let n = 0;
      while (
        (
          await db
            .select({ id: monitor.id })
            .from(monitor)
            .where(eq(monitor.publicSlug, candidate))
            .limit(1)
        ).length > 0
      ) {
        n += 1;
        candidate = `${base}-${n}`;
      }
      publicSlug = candidate;
    }
    const id = createId();
    await db.insert(monitor).values({
      id,
      userId: session.user.id,
      name: d.name,
      url: d.url,
      method: d.method,
      expectedStatus: d.expectedStatus,
      expectedBody: d.expectedBody ?? null,
      intervalSeconds: d.intervalSeconds,
      enabled: d.enabled ?? true,
      useCustomNotify: d.useCustomNotify ?? false,
      notifyEmail: d.notifyEmail ?? null,
      notifySms: d.notifySms ?? null,
      notifySlack: d.notifySlack ?? null,
      notifyTelegram: d.notifyTelegram ?? null,
      publicSlug,
    });
    const [created] = await db.select().from(monitor).where(eq(monitor.id, id)).limit(1);
    return NextResponse.json({ monitor: created });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
