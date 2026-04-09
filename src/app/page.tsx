import Link from "next/link";
import { Activity, Bell, Globe, LineChart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/25 via-background to-background" />
      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Activity className="h-5 w-5" />
            </span>
            Uptime Funk
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Endpoint & feature-set monitoring
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Keep your stack in the groove.
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
              Uptime Funk checks your URLs on your schedule, validates status
              codes and response bodies, and pages your team on{" "}
              <span className="text-foreground">Slack</span>,{" "}
              <span className="text-foreground">email</span>,{" "}
              <span className="text-foreground">SMS</span>, or{" "}
              <span className="text-foreground">Telegram</span> when things go
              sideways.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Start monitoring free
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Create a public status page
                </Button>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
            <Card className="border-border/80 bg-card/50">
              <CardHeader>
                <Globe className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Deep HTTP checks</CardTitle>
                <CardDescription>
                  Method, expected status, optional body substring — perfect for
                  APIs and feature flags.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/80 bg-card/50">
              <CardHeader>
                <Bell className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Multi-channel alerts</CardTitle>
                <CardDescription>
                  Connect Slack with OAuth, plus Resend, Twilio, and Telegram
                  bot delivery.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/80 bg-card/50">
              <CardHeader>
                <LineChart className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Dashboard & status</CardTitle>
                <CardDescription>
                  Roll-up health metrics and optional public status pages per
                  monitor.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="mx-auto mt-16 max-w-4xl border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle>Per-monitor notification modes</CardTitle>
              <CardDescription>
                Use account defaults for every check, or override channels per
                monitor for noisy vs. critical paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="outline">Default: email on</Badge>
              <Badge variant="outline">Custom: Slack + Telegram</Badge>
              <Badge variant="outline">Custom: SMS only</Badge>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Uptime Funk. Built with Next.js.</p>
        </footer>
      </main>
    </div>
  );
}
