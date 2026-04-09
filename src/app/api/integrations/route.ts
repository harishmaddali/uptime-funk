import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const upsertSchema = z.object({
  type: z.enum(["email", "sms", "slack", "telegram"]),
  enabled: z.boolean().optional(),
  config: z.record(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.integration.findMany({
    where: { userId: session.user.id },
    orderBy: { type: "asc" },
  });
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
  const session = await auth();
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
    const existing = await prisma.integration.findFirst({
      where: { userId: session.user.id, type },
    });
    const prev = existing ? safeParseConfig(existing.config) : {};
    const mergedConfig = { ...prev, ...(config ?? {}) };
    const row = existing
      ? await prisma.integration.update({
          where: { id: existing.id },
          data: {
            enabled: enabled ?? existing.enabled,
            config: JSON.stringify(mergedConfig),
          },
        })
      : await prisma.integration.create({
          data: {
            userId: session.user.id,
            type,
            enabled: enabled ?? true,
            config: JSON.stringify(mergedConfig),
          },
        });
    return NextResponse.json({ integration: row });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
