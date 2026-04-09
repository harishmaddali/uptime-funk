import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const session = await auth();
  const monitor = await prisma.monitor.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!monitor) notFound();

  const checks = await prisma.monitorCheck.findMany({
    where: { monitorId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8 pb-16">
      <MonitorForm
        mode="edit"
        headerExtra={
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  monitor.status === "up"
                    ? "success"
                    : monitor.status === "down"
                      ? "destructive"
                      : "secondary"
                }
              >
                {monitor.status}
              </Badge>
              <MonitorActions monitorId={monitor.id} />
            </div>
            {monitor.publicSlug && (
              <p className="text-sm text-muted-foreground">
                Public:{" "}
                <Link
                  href={`/status/${monitor.publicSlug}`}
                  className="text-primary underline"
                  target="_blank"
                >
                  /status/{monitor.publicSlug}
                </Link>
              </p>
            )}
          </div>
        }
        initial={{
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          method: monitor.method,
          expectedStatus: monitor.expectedStatus,
          expectedBody: monitor.expectedBody ?? "",
          intervalSeconds: monitor.intervalSeconds,
          enabled: monitor.enabled,
          useCustomNotify: monitor.useCustomNotify,
          notifyEmail: monitor.notifyEmail ?? true,
          notifySms: monitor.notifySms ?? false,
          notifySlack: monitor.notifySlack ?? false,
          notifyTelegram: monitor.notifyTelegram ?? false,
          public: !!monitor.publicSlug,
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
                    {c.statusCode != null && (
                      <span>HTTP {c.statusCode}</span>
                    )}
                    {c.responseTime != null && <span>{c.responseTime} ms</span>}
                    {c.error && (
                      <span className="w-full text-xs text-destructive">
                        {c.error}
                      </span>
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
