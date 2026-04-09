"use client";

import { Suspense, useState } from "react";
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

function VerifyEmailForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { toast } = useToast();
  const initialEmail = search.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function resend() {
    if (!email) return;
    setSending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setSending(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Could not send code",
        description: error.message,
      });
      return;
    }
    toast({ title: "Code sent", description: "Check your inbox." });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !otp) return;
    setVerifying(true);
    const { error } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });
    setVerifying(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: error.message,
      });
      return;
    }
    toast({ title: "Email verified", description: "You can sign in now." });
    router.push("/login");
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
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the code we sent via email. Didn&apos;t get it? Resend below.
          </CardDescription>
        </CardHeader>
        <form onSubmit={verify}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? "Verifying…" : "Verify & continue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={sending || !email}
              onClick={resend}
            >
              {sending ? "Sending…" : "Resend code"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline">
                Back to login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
