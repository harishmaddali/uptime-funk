import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const monitor = await prisma.monitor.findFirst({
    where: { publicSlug: slug },
    select: {
      id: true,
      name: true,
      url: true,
      status: true,
      lastCheckedAt: true,
      lastResponseTimeMs: true,
      publicSlug: true,
    },
  });
  if (!monitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ monitor });
}
