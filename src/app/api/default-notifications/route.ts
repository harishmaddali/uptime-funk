import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { defaultNotification } from "@/db/app-schema";
import { createId } from "@/lib/id";

const schema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  slack: z.boolean(),
  telegram: z.boolean(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(defaultNotification)
    .where(eq(defaultNotification.userId, session.user.id))
    .limit(1);
  let row = rows[0];
  if (!row) {
    const id = createId();
    await db.insert(defaultNotification).values({
      id,
      userId: session.user.id,
      email: true,
      sms: false,
      slack: false,
      telegram: false,
    });
    const again = await db
      .select()
      .from(defaultNotification)
      .where(eq(defaultNotification.userId, session.user.id))
      .limit(1);
    row = again[0]!;
  }
  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const existing = await db
      .select()
      .from(defaultNotification)
      .where(eq(defaultNotification.userId, session.user.id))
      .limit(1);
    if (existing[0]) {
      await db
        .update(defaultNotification)
        .set(parsed.data)
        .where(eq(defaultNotification.userId, session.user.id));
    } else {
      await db.insert(defaultNotification).values({
        id: createId(),
        userId: session.user.id,
        ...parsed.data,
      });
    }
    const [row] = await db
      .select()
      .from(defaultNotification)
      .where(eq(defaultNotification.userId, session.user.id))
      .limit(1);
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
