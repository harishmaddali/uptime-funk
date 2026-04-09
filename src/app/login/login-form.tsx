"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const callback = search.get("callbackUrl") || "/dashboard";
  const googleEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
  );
  const githubEnabled = Boolean(
    process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === "true"
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: callback,
    });
    setLoading(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Check your email and password.",
      });
      return;
    }
    router.push(callback);
    router.refresh();
  }

  async function oauth(provider: "google" | "github") {
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: callback,
    });
    setLoading(false);
    if (error) {
      toast({
        variant: "destructive",
        title: `${provider} sign-in failed`,
        description: error.message,
      });
    }
  }

  return (
    <>
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Activity className="h-5 w-5" />
        </span>
        Uptime Funk
      </Link>
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in to your monitoring workspace.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            {(googleEnabled || githubEnabled) && (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Separator className="flex-1" />
                  or continue with
                  <Separator className="flex-1" />
                </div>
                <div className="flex gap-2">
                  {googleEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                      onClick={() => oauth("google")}
                    >
                      Google
                    </Button>
                  )}
                  {githubEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                      onClick={() => oauth("github")}
                    >
                      GitHub
                    </Button>
                  )}
                </div>
              </>
            )}
            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link href="/signup" className="text-primary underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
