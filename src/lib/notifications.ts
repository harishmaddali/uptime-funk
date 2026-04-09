import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { defaultNotification, integration } from "@/db/app-schema";

type NotifyChannels = {
  email: boolean;
  sms: boolean;
  slack: boolean;
  telegram: boolean;
};

function parseIntegrationConfig(config: string): Record<string, string> {
  try {
    const o = JSON.parse(config) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export async function resolveChannelsForMonitor(
  userId: string,
  mon: {
    useCustomNotify: boolean;
    notifyEmail: boolean | null;
    notifySms: boolean | null;
    notifySlack: boolean | null;
    notifyTelegram: boolean | null;
  }
): Promise<NotifyChannels> {
  const rows = await db
    .select()
    .from(defaultNotification)
    .where(eq(defaultNotification.userId, userId))
    .limit(1);
  const defaults = rows[0] ?? {
    email: true,
    sms: false,
    slack: false,
    telegram: false,
  };

  if (!mon.useCustomNotify) {
    return {
      email: defaults.email,
      sms: defaults.sms,
      slack: defaults.slack,
      telegram: defaults.telegram,
    };
  }
  return {
    email: mon.notifyEmail ?? defaults.email,
    sms: mon.notifySms ?? defaults.sms,
    slack: mon.notifySlack ?? defaults.slack,
    telegram: mon.notifyTelegram ?? defaults.telegram,
  };
}

export async function sendIncidentNotifications(params: {
  userId: string;
  monitorName: string;
  url: string;
  error: string;
  channels: NotifyChannels;
}) {
  const urows = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);
  const u = urows[0];
  if (!u?.email) return;

  const integrations = await db
    .select()
    .from(integration)
    .where(eq(integration.userId, params.userId));

  const enabledInts = integrations.filter((i) => i.enabled);

  const text = `🔴 *${params.monitorName}* is DOWN\n${params.url}\n_${params.error}_`;

  const promises: Promise<void>[] = [];

  if (params.channels.email) {
    const emailInt = enabledInts.find((i) => i.type === "email");
    const cfg = emailInt ? parseIntegrationConfig(emailInt.config) : {};
    const to = cfg.to || u.email;
    promises.push(sendResendEmail(to, `Down: ${params.monitorName}`, text));
  }

  if (params.channels.slack) {
    const slack = enabledInts.find((i) => i.type === "slack");
    if (slack) {
      const cfg = parseIntegrationConfig(slack.config);
      if (cfg.webhookUrl) {
        promises.push(sendSlackWebhook(cfg.webhookUrl, text));
      }
    }
  }

  if (params.channels.telegram) {
    const tg = enabledInts.find((i) => i.type === "telegram");
    if (tg) {
      const cfg = parseIntegrationConfig(tg.config);
      if (cfg.chatId && process.env.TELEGRAM_BOT_TOKEN) {
        promises.push(
          sendTelegram(process.env.TELEGRAM_BOT_TOKEN, cfg.chatId, text)
        );
      }
    }
  }

  if (params.channels.sms) {
    const sms = enabledInts.find((i) => i.type === "sms");
    if (sms) {
      const cfg = parseIntegrationConfig(sms.config);
      if (cfg.to) {
        promises.push(
          sendTwilioSms(
            cfg.to,
            `DOWN ${params.monitorName}: ${params.error.slice(0, 120)}`
          )
        );
      }
    }
  }

  await Promise.allSettled(promises);
}

async function sendResendEmail(to: string, subject: string, body: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: body.replace(/\*/g, ""),
      }),
    });
  } catch {
    /* ignore */
  }
}

async function sendSlackWebhook(url: string, text: string) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    /* ignore */
  }
}

async function sendTelegram(token: string, chatId: string, text: string) {
  try {
    const u = new URL(`https://api.telegram.org/bot${token}/sendMessage`);
    u.searchParams.set("chat_id", chatId);
    u.searchParams.set("text", text.replace(/\*/g, ""));
    u.searchParams.set("parse_mode", "Markdown");
    await fetch(u.toString());
  } catch {
    /* ignore */
  }
}

async function sendTwilioSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return;
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams();
    params.set("To", to);
    params.set("From", from);
    params.set("Body", body);
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch {
    /* ignore */
  }
}
