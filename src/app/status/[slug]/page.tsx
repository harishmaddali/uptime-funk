import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
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
  const monitor = await prisma.monitor.findFirst({
    where: { publicSlug: slug },
    select: {
      name: true,
      url: true,
      status: true,
      lastCheckedAt: true,
      lastResponseTimeMs: true,
      lastError: true,
    },
  });
  if (!monitor) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Status page</p>
            <h1 className="text-xl font-semibold">{monitor.name}</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Current status</CardTitle>
              <CardDescription className="font-mono text-xs break-all">
                {monitor.url}
              </CardDescription>
            </div>
            <Badge
              variant={
                monitor.status === "up"
                  ? "success"
                  : monitor.status === "down"
                    ? "destructive"
                    : "secondary"
              }
              className="text-sm uppercase"
            >
              {monitor.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Last check:{" "}
              {monitor.lastCheckedAt
                ? monitor.lastCheckedAt.toLocaleString()
                : "Never"}
            </p>
            {monitor.lastResponseTimeMs != null && (
              <p>Response time: {monitor.lastResponseTimeMs} ms</p>
            )}
            {monitor.lastError && monitor.status === "down" && (
              <p className="text-destructive">{monitor.lastError}</p>
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
