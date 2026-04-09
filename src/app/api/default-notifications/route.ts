import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  slack: z.boolean(),
  telegram: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let row = await prisma.defaultNotification.findUnique({
    where: { userId: session.user.id },
  });
  if (!row) {
    row = await prisma.defaultNotification.create({
      data: {
        userId: session.user.id,
        email: true,
        sms: false,
        slack: false,
        telegram: false,
      },
    });
  }
  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const row = await prisma.defaultNotification.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...parsed.data },
      update: parsed.data,
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
