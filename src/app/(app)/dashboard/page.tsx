import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Radio } from "lucide-react";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { monitor, monitorCheck } from "@/db/app-schema";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const uid = session.user.id;

  const [recent, allForStats, checks24hRow, up, down, total] = await Promise.all([
    db
      .select()
      .from(monitor)
      .where(eq(monitor.userId, uid))
      .orderBy(desc(monitor.updatedAt))
      .limit(8),
    db
      .select({ lastResponseTimeMs: monitor.lastResponseTimeMs })
      .from(monitor)
      .where(eq(monitor.userId, uid)),
    db
      .select({ c: count() })
      .from(monitorCheck)
      .innerJoin(monitor, eq(monitorCheck.monitorId, monitor.id))
      .where(
        and(
          eq(monitor.userId, uid),
          gte(monitorCheck.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      ),
    db
      .select({ id: monitor.id })
      .from(monitor)
      .where(and(eq(monitor.userId, uid), eq(monitor.status, "up"))),
    db
      .select({ id: monitor.id })
      .from(monitor)
      .where(and(eq(monitor.userId, uid), eq(monitor.status, "down"))),
    db.select({ id: monitor.id }).from(monitor).where(eq(monitor.userId, uid)),
  ]);

  const checks24h = Number(checks24hRow[0]?.c ?? 0);
  const avgRt =
    allForStats.reduce((s, m) => s + (m.lastResponseTimeMs ?? 0), 0) /
    Math.max(allForStats.length, 1);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Health at a glance for {session.user.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/monitors/new">
            <Button>Add monitor</Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline">Integrations</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monitors</CardDescription>
            <CardTitle className="text-3xl">{total.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Active checks you own
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Up / Down</CardDescription>
            <CardTitle className="flex items-baseline gap-2 text-3xl">
              <span className="text-emerald-400">{up.length}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-red-400">{down.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Current probe status
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Checks (24h)</CardDescription>
            <CardTitle className="text-3xl">{checks24h}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Total probe results stored
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg latency</CardDescription>
            <CardTitle className="text-3xl">{Math.round(avgRt)} ms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Across listed monitors
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent monitors</CardTitle>
            <CardDescription>Latest activity and status</CardDescription>
          </div>
          <Link href="/monitors">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No monitors yet.{" "}
              <Link href="/monitors/new" className="text-primary underline">
                Create your first
              </Link>
              .
            </p>
          ) : (
            recent.map((m) => (
              <Link
                key={m.id}
                href={`/monitors/${m.id}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 transition hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <Radio
                    className={`h-4 w-4 ${
                      m.status === "up"
                        ? "text-emerald-400"
                        : m.status === "down"
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground max-w-[220px] md:max-w-md">
                      {m.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.lastResponseTimeMs != null && (
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {m.lastResponseTimeMs} ms
                    </span>
                  )}
                  <Badge
                    variant={
                      m.status === "up"
                        ? "success"
                        : m.status === "down"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {m.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
