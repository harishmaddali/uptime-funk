import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { monitor, monitorCheck } from "@/db/app-schema";
import { and, desc, eq } from "drizzle-orm";
import { MonitorForm } from "@/components/monitor-form";
import { MonitorActions } from "@/components/monitor-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const rows = await db
    .select()
    .from(monitor)
    .where(and(eq(monitor.id, id), eq(monitor.userId, session.user.id)))
    .limit(1);
  const mon = rows[0];
  if (!mon) notFound();

  const checks = await db
    .select()
    .from(monitorCheck)
    .where(eq(monitorCheck.monitorId, id))
    .orderBy(desc(monitorCheck.createdAt))
    .limit(50);

  return (
    <div className="space-y-8 pb-16">
      <MonitorForm
        mode="edit"
        headerExtra={
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  mon.status === "up"
                    ? "success"
                    : mon.status === "down"
                      ? "destructive"
                      : "secondary"
                }
              >
                {mon.status}
              </Badge>
              <MonitorActions monitorId={mon.id} />
            </div>
            {mon.publicSlug && (
              <p className="text-sm text-muted-foreground">
                Public:{" "}
                <Link
                  href={`/status/${mon.publicSlug}`}
                  className="text-primary underline"
                  target="_blank"
                >
                  /status/{mon.publicSlug}
                </Link>
              </p>
            )}
          </div>
        }
        initial={{
          id: mon.id,
          name: mon.name,
          url: mon.url,
          method: mon.method,
          expectedStatus: mon.expectedStatus,
          expectedBody: mon.expectedBody ?? "",
          intervalSeconds: mon.intervalSeconds,
          enabled: mon.enabled,
          useCustomNotify: mon.useCustomNotify,
          notifyEmail: mon.notifyEmail ?? true,
          notifySms: mon.notifySms ?? false,
          notifySlack: mon.notifySlack ?? false,
          notifyTelegram: mon.notifyTelegram ?? false,
          public: !!mon.publicSlug,
        }}
      />

      <div className="mx-auto max-w-3xl px-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent checks</CardTitle>
            <CardDescription>Last 50 probe results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {checks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No checks yet. Ensure{" "}
                <code className="rounded bg-muted px-1 text-xs">CRON_SECRET</code>{" "}
                is set and hit{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  GET /api/cron/check-monitors
                </code>{" "}
                with Bearer auth.
              </p>
            ) : (
              <ul className="max-h-96 space-y-2 overflow-auto text-sm">
                {checks.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
                  >
                    <span className={c.ok ? "text-emerald-400" : "text-red-400"}>
                      {c.ok ? "OK" : "FAIL"}
                    </span>
                    <span className="text-muted-foreground">
                      {c.createdAt.toLocaleString()}
                    </span>
                    {c.statusCode != null && <span>HTTP {c.statusCode}</span>}
                    {c.responseTime != null && <span>{c.responseTime} ms</span>}
                    {c.error && (
                      <span className="w-full text-xs text-destructive">{c.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
