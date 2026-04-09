"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

type Defaults = {
  email: boolean;
  sms: boolean;
  slack: boolean;
  telegram: boolean;
};

export function SettingsTabsInner({ userEmail }: { userEmail: string }) {
  const { toast } = useToast();
  const search = useSearchParams();
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [emailTo, setEmailTo] = useState(userEmail);
  const [smsTo, setSmsTo] = useState("");
  const [tgChat, setTgChat] = useState("");

  useEffect(() => {
    fetch("/api/default-notifications")
      .then((r) => r.json())
      .then((d) => {
        setDefaults({
          email: d.email,
          sms: d.sms,
          slack: d.slack,
          telegram: d.telegram,
        });
      })
      .finally(() => setLoading(false));

    fetch("/api/integrations")
      .then((r) => r.json())
      .then((d: { integrations: { type: string; config: Record<string, string> }[] }) => {
        const email = d.integrations?.find((i) => i.type === "email");
        if (email?.config?.to) setEmailTo(email.config.to);
        const sms = d.integrations?.find((i) => i.type === "sms");
        if (sms?.config?.to) setSmsTo(sms.config.to);
        const tg = d.integrations?.find((i) => i.type === "telegram");
        if (tg?.config?.chatId) setTgChat(tg.config.chatId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const slack = search.get("slack");
    if (slack === "connected") {
      toast({ title: "Slack connected" });
    } else if (slack === "error" || slack === "denied") {
      toast({
        variant: "destructive",
        title: "Slack connection failed",
      });
    }
  }, [search, toast]);

  async function saveDefaults() {
    if (!defaults) return;
    setSaving(true);
    try {
      const res = await fetch("/api/default-notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Defaults saved" });
    } catch {
      toast({ variant: "destructive", title: "Could not save" });
    } finally {
      setSaving(false);
    }
  }

  async function saveIntegration(
    type: "email" | "sms" | "telegram",
    config: Record<string, string>
  ) {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, config }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Integration updated" });
    } catch {
      toast({ variant: "destructive", title: "Could not save integration" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !defaults) {
    return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  }

  return (
    <Tabs defaultValue="defaults" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid md:grid-cols-3">
        <TabsTrigger value="defaults">Defaults</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="cron">Scheduler</TabsTrigger>
      </TabsList>

      <TabsContent value="defaults" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Default notification channels</CardTitle>
            <CardDescription>
              Applied to monitors that use &quot;account default&quot; notification mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["email", "Email"],
                ["sms", "SMS"],
                ["slack", "Slack"],
                ["telegram", "Telegram"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border/60 p-4"
              >
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">
                    {key === "email" && "Uses Resend + integration email below"}
                    {key === "sms" && "Uses Twilio + SMS number below"}
                    {key === "slack" && "Uses Slack webhook from OAuth"}
                    {key === "telegram" && "Uses bot token env + chat id below"}
                  </p>
                </div>
                <Switch
                  checked={defaults[key]}
                  onCheckedChange={(v) => setDefaults({ ...defaults, [key]: v })}
                />
              </div>
            ))}
            <Button onClick={saveDefaults} disabled={saving}>
              Save defaults
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations" className="mt-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Slack
                <Badge variant="outline">OAuth</Badge>
              </CardTitle>
              <CardDescription>
                Install the app to your workspace. We store the incoming webhook URL
                for incident posts.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/api/integrations/slack/authorize">Connect Slack</Link>
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email (Resend)</CardTitle>
            <CardDescription>
              Set <code className="text-xs">RESEND_API_KEY</code> and{" "}
              <code className="text-xs">EMAIL_FROM</code> in your environment. Optional
              override recipient:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Send alerts to</Label>
              <Input
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder={userEmail}
              />
            </div>
            <Button
              onClick={() => saveIntegration("email", { to: emailTo })}
              disabled={saving}
            >
              Save email routing
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMS (Twilio)</CardTitle>
            <CardDescription>
              Configure <code className="text-xs">TWILIO_*</code> env vars, then your
              E.164 mobile number:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input
                value={smsTo}
                onChange={(e) => setSmsTo(e.target.value)}
                placeholder="+15551234567"
              />
            </div>
            <Button
              onClick={() => saveIntegration("sms", { to: smsTo })}
              disabled={saving}
            >
              Save SMS destination
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telegram</CardTitle>
            <CardDescription>
              Set <code className="text-xs">TELEGRAM_BOT_TOKEN</code> for your bot, then
              your chat ID:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Chat ID</Label>
              <Input
                value={tgChat}
                onChange={(e) => setTgChat(e.target.value)}
                placeholder="123456789"
              />
            </div>
            <Button
              onClick={() => saveIntegration("telegram", { chatId: tgChat })}
              disabled={saving}
            >
              Save Telegram chat
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cron" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Check scheduler</CardTitle>
            <CardDescription>
              Uptime Funk uses a single cron endpoint to fan out checks. Point Vercel
              Cron, GitHub Actions, or any scheduler at it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              1. Add <code className="rounded bg-muted px-1">CRON_SECRET</code> to{" "}
              <code className="rounded bg-muted px-1">.env</code>
            </p>
            <Separator />
            <p className="font-mono text-xs break-all">
              curl -H &quot;Authorization: Bearer $CRON_SECRET&quot;{" "}
              {typeof window !== "undefined"
                ? `${window.location.origin}/api/cron/check-monitors`
                : "/api/cron/check-monitors"}
            </p>
            <p>
              Run at least as often as your shortest monitor interval (e.g. every minute
              for 60s checks).
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
