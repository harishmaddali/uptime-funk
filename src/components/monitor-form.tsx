"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const INTERVALS = [
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
];

export type MonitorFormInitial = {
  id?: string;
  name: string;
  url: string;
  method: string;
  expectedStatus: number;
  expectedBody: string;
  intervalSeconds: number;
  enabled: boolean;
  useCustomNotify: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifySlack: boolean;
  notifyTelegram: boolean;
  public: boolean;
};

const defaultInitial: MonitorFormInitial = {
  name: "",
  url: "https://",
  method: "GET",
  expectedStatus: 200,
  expectedBody: "",
  intervalSeconds: 300,
  enabled: true,
  useCustomNotify: false,
  notifyEmail: true,
  notifySms: false,
  notifySlack: false,
  notifyTelegram: false,
  public: false,
};

export function MonitorForm({
  initial,
  mode,
  headerExtra,
}: {
  initial?: Partial<MonitorFormInitial>;
  mode: "create" | "edit";
  headerExtra?: ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MonitorFormInitial>({
    ...defaultInitial,
    ...initial,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        url: form.url,
        method: form.method,
        expectedStatus: form.expectedStatus,
        expectedBody: form.expectedBody.trim() || null,
        intervalSeconds: form.intervalSeconds,
        enabled: form.enabled,
        useCustomNotify: form.useCustomNotify,
        notifyEmail: form.notifyEmail,
        notifySms: form.notifySms,
        notifySlack: form.notifySlack,
        notifyTelegram: form.notifyTelegram,
        public: form.public,
      };
      const url =
        mode === "create" ? "/api/monitors" : `/api/monitors/${form.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error)
        );
      }
      toast({
        title: mode === "create" ? "Monitor created" : "Saved",
      });
      router.push(`/monitors/${data.monitor.id}`);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === "create" ? "New monitor" : "Edit monitor"}
          </h1>
          <p className="text-muted-foreground">
            Define what to check and how often to probe.
          </p>
        </div>
        {headerExtra}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="API health"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              required
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={form.method}
                onValueChange={(v) => setForm({ ...form, method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Expected HTTP status</Label>
              <Input
                id="status"
                type="number"
                min={100}
                max={599}
                value={form.expectedStatus}
                onChange={(e) =>
                  setForm({ ...form, expectedStatus: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Expected body contains (optional)</Label>
            <Textarea
              id="body"
              value={form.expectedBody}
              onChange={(e) => setForm({ ...form, expectedBody: e.target.value })}
              placeholder='e.g. "ok":true or feature flag name'
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Check every</Label>
            <Select
              value={String(form.intervalSeconds)}
              onValueChange={(v) =>
                setForm({ ...form, intervalSeconds: Number(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((i) => (
                  <SelectItem key={i.value} value={String(i.value)}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="font-medium">Monitor enabled</p>
              <p className="text-sm text-muted-foreground">
                Paused monitors are not checked by the cron job.
              </p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => setForm({ ...form, enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="font-medium">Public status page</p>
              <p className="text-sm text-muted-foreground">
                Expose read-only status at /status/&lt;slug&gt;
              </p>
            </div>
            <Switch
              checked={form.public}
              onCheckedChange={(v) => setForm({ ...form, public: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="font-medium">Custom notification settings</p>
              <p className="text-sm text-muted-foreground">
                Override your account defaults for this monitor only.
              </p>
            </div>
            <Switch
              checked={form.useCustomNotify}
              onCheckedChange={(v) => setForm({ ...form, useCustomNotify: v })}
            />
          </div>
          {form.useCustomNotify && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Choose channels for incident alerts (when status flips to down).
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["notifyEmail", "Email"],
                    ["notifySms", "SMS"],
                    ["notifySlack", "Slack"],
                    ["notifyTelegram", "Telegram"],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                  >
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={form[key]}
                      onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create monitor" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
