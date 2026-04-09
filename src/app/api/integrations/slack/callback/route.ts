import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const base = process.env.AUTH_URL || "http://localhost:3000";
  if (!code || !state) {
    return NextResponse.redirect(`${base}/settings/integrations?slack=error`);
  }
  let userId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    userId = parsed.userId;
    if (!userId) throw new Error("no user");
  } catch {
    return NextResponse.redirect(`${base}/settings/integrations?slack=error`);
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${base}/api/integrations/slack/callback`;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/settings/integrations?slack=missing_config`);
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
      `${base}/settings/integrations?slack=denied&message=${encodeURIComponent(data.error || "oauth_failed")}`
    );
  }

  const config: Record<string, string> = {
    accessToken: data.access_token,
    teamId: data.team?.id ?? "",
    teamName: data.team?.name ?? "",
  };
  if (data.incoming_webhook?.url) {
    config.webhookUrl = data.incoming_webhook.url;
  }

  await prisma.integration.upsert({
    where: {
      userId_type: { userId, type: "slack" },
    },
    create: {
      userId,
      type: "slack",
      enabled: true,
      config: JSON.stringify(config),
    },
    update: {
      enabled: true,
      config: JSON.stringify(config),
    },
  });

  return NextResponse.redirect(`${base}/settings/integrations?slack=connected`);
}
