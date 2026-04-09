import { NextResponse } from "next/server";
import { z } from "zod";
import { asc, and, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { integration } from "@/db/app-schema";
import { createId } from "@/lib/id";

const upsertSchema = z.object({
  type: z.enum(["email", "sms", "slack", "telegram"]),
  enabled: z.boolean().optional(),
  config: z.record(z.string()).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await db
    .select()
    .from(integration)
    .where(eq(integration.userId, session.user.id))
    .orderBy(asc(integration.type));

  const sanitized = list.map((i) => {
    const cfg = safeParseConfig(i.config);
    const masked: Record<string, string> = { ...cfg };
    if (masked.webhookUrl) masked.webhookUrl = mask(masked.webhookUrl);
    if (masked.accessToken) masked.accessToken = "***";
    if (masked.botToken) masked.botToken = "***";
    return { ...i, config: masked };
  });
  return NextResponse.json({ integrations: sanitized });
}

function safeParseConfig(s: string) {
  try {
    return JSON.parse(s) as Record<string, string>;
  } catch {
    return {};
  }
}

function mask(s: string) {
  if (s.length < 12) return "***";
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { type, enabled, config } = parsed.data;
    const existingRows = await db
      .select()
      .from(integration)
      .where(
        and(eq(integration.userId, session.user.id), eq(integration.type, type))
      )
      .limit(1);
    const existing = existingRows[0];
    const prev = existing ? safeParseConfig(existing.config) : {};
    const mergedConfig = { ...prev, ...(config ?? {}) };

    if (existing) {
      await db
        .update(integration)
        .set({
          enabled: enabled ?? existing.enabled,
          config: JSON.stringify(mergedConfig),
        })
        .where(eq(integration.id, existing.id));
    } else {
      await db.insert(integration).values({
        id: createId(),
        userId: session.user.id,
        type,
        enabled: enabled ?? true,
        config: JSON.stringify(mergedConfig),
      });
    }

    const [row] = await db
      .select()
      .from(integration)
      .where(
        and(eq(integration.userId, session.user.id), eq(integration.type, type))
      )
      .limit(1);
    return NextResponse.json({ integration: row });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
