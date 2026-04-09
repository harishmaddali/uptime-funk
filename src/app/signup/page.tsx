"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const googleEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
  );
  const githubEnabled = Boolean(
    process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === "true"
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signUp.email({
      name: name.trim() || "User",
      email,
      password,
      callbackURL: "/verify-email",
    });
    setLoading(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "Try a different email.",
      });
      return;
    }
    toast({
      title: "Check your email",
      description: "We sent a verification code to your inbox.",
    });
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  async function oauth(provider: "google" | "github") {
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard",
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Activity className="h-5 w-5" />
        </span>
        Uptime Funk
      </Link>
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription>
            Sign up with email — we&apos;ll verify with a one-time code (Resend).
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
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
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
