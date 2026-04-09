import Link from "next/link";
import { Plus, Radio } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MonitorsPage() {
  const session = await auth();
  const monitors = await prisma.monitor.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitors</h1>
          <p className="text-muted-foreground">
            Configure URLs, expectations, cadence, and alerts.
          </p>
        </div>
        <Link href="/monitors/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New monitor
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {monitors.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No monitors yet</CardTitle>
              <CardDescription>
                Add an HTTP endpoint to start collecting uptime and latency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/monitors/new">
                <Button>Create monitor</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          monitors.map((m) => (
            <Link key={m.id} href={`/monitors/${m.id}`}>
              <Card className="transition hover:border-primary/40">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <Radio
                      className={`mt-1 h-5 w-5 shrink-0 ${
                        m.status === "up"
                          ? "text-emerald-400"
                          : m.status === "down"
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <CardTitle className="text-lg">{m.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {m.method} {m.url}
                      </CardDescription>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Every {m.intervalSeconds}s · expect {m.expectedStatus}
                        {m.expectedBody ? " + body match" : ""}
                        {m.publicSlug ? ` · /status/${m.publicSlug}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
                    {m.lastResponseTimeMs != null && (
                      <span className="text-xs text-muted-foreground">
                        {m.lastResponseTimeMs} ms
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
