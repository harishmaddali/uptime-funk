import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity } from "lucide-react";
import { db } from "@/db";
import { monitor } from "@/db/app-schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = await db
    .select({
      name: monitor.name,
      url: monitor.url,
      status: monitor.status,
      lastCheckedAt: monitor.lastCheckedAt,
      lastResponseTimeMs: monitor.lastResponseTimeMs,
      lastError: monitor.lastError,
    })
    .from(monitor)
    .where(eq(monitor.publicSlug, slug))
    .limit(1);
  const m = rows[0];
  if (!m) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Status page</p>
            <h1 className="text-xl font-semibold">{m.name}</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Current status</CardTitle>
              <CardDescription className="font-mono text-xs break-all">
                {m.url}
              </CardDescription>
            </div>
            <Badge
              variant={
                m.status === "up"
                  ? "success"
                  : m.status === "down"
                    ? "destructive"
                    : "secondary"
              }
              className="text-sm uppercase"
            >
              {m.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Last check:{" "}
              {m.lastCheckedAt ? m.lastCheckedAt.toLocaleString() : "Never"}
            </p>
            {m.lastResponseTimeMs != null && (
              <p>Response time: {m.lastResponseTimeMs} ms</p>
            )}
            {m.lastError && m.status === "down" && (
              <p className="text-destructive">{m.lastError}</p>
            )}
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="underline">
            Uptime Funk
          </Link>
        </p>
      </main>
    </div>
  );
}
