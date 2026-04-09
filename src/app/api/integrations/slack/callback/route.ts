import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integration } from "@/db/app-schema";
import { createId } from "@/lib/id";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const base =
    process.env.BETTER_AUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  if (!code || !state) {
    return NextResponse.redirect(`${base}/settings?slack=error`);
  }
  let userId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    userId = parsed.userId;
    if (!userId) throw new Error("no user");
  } catch {
    return NextResponse.redirect(`${base}/settings?slack=error`);
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${base}/api/integrations/slack/callback`;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/settings?slack=missing_config`);
  }

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });
  const data = (await tokenRes.json()) as {
    ok?: boolean;
    access_token?: string;
    team?: { id?: string; name?: string };
    incoming_webhook?: { url?: string; channel?: string };
    error?: string;
  };

  if (!data.ok || !data.access_token) {
    return NextResponse.redirect(
      `${base}/settings?slack=denied&message=${encodeURIComponent(data.error || "oauth_failed")}`
    );
  }

  const cfg: Record<string, string> = {
    accessToken: data.access_token,
    teamId: data.team?.id ?? "",
    teamName: data.team?.name ?? "",
  };
  if (data.incoming_webhook?.url) {
    cfg.webhookUrl = data.incoming_webhook.url;
  }

  const existing = await db
    .select()
    .from(integration)
    .where(and(eq(integration.userId, userId), eq(integration.type, "slack")))
    .limit(1);

  if (existing[0]) {
    await db
      .update(integration)
      .set({ enabled: true, config: JSON.stringify(cfg) })
      .where(eq(integration.id, existing[0].id));
  } else {
    await db.insert(integration).values({
      id: createId(),
      userId,
      type: "slack",
      enabled: true,
      config: JSON.stringify(cfg),
    });
  }

  return NextResponse.redirect(`${base}/settings?slack=connected`);
}
