import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const SCOPES = ["incoming-webhook", "chat:write", "channels:read"].join(",");

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL));
  }
  const clientId = process.env.SLACK_CLIENT_ID;
  const base = process.env.AUTH_URL || "http://localhost:3000";
  if (!clientId) {
    return NextResponse.json(
      { error: "Slack OAuth not configured (SLACK_CLIENT_ID)" },
      { status: 503 }
    );
  }
  const redirectUri = `${base}/api/integrations/slack/callback`;
  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id, t: Date.now() })
  ).toString("base64url");
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url.toString());
}
