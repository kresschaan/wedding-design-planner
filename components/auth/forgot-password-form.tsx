"use client";

import { useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { verifyPasswordResetChallenge } from "@/app/forgot-password/actions";
import { createClient } from "@/lib/supabase/client";
import { getTurnstileSiteKeyForClient, TURNSTILE_TEST_SITE_KEY } from "@/lib/turnstile-public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const siteKey = getTurnstileSiteKeyForClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("turnstile", turnstileToken);

    setSubmitting(true);
    const gate = await verifyPasswordResetChallenge(fd);
    if (!gate.ok) {
      setSubmitting(false);
      setError(gate.error);
      return;
    }

    const supabase = createClient();
    const confirm = new URL("/auth/confirm", window.location.origin);
    confirm.searchParams.set("next", "/auth/update-password");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(gate.email, {
      redirectTo: confirm.toString(),
    });
    setSubmitting(false);

    if (resetError) {
      setError("Could not start reset. Try again or contact support if this persists.");
      return;
    }

    setSuccess(true);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={success}
        />
      </div>

      {siteKey ? (
        <div className="flex justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30 py-2">
          <Turnstile
            siteKey={siteKey}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileToken("")}
          />
        </div>
      ) : (
        <p className="text-center text-xs text-destructive">
          Turnstile is not configured. Set{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> for production.
        </p>
      )}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-muted-foreground" role="status">
          If an account exists for that email, you will receive a link to choose a new password. Check
          your inbox and spam folder.
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting || !siteKey || !turnstileToken || success}>
        {submitting ? "Sending…" : "Send reset link"}
      </Button>

      {siteKey === TURNSTILE_TEST_SITE_KEY && process.env.NODE_ENV === "development" ? (
        <p className="text-center text-[10px] text-muted-foreground">
          Dev mode: using Cloudflare Turnstile test keys. Configure real keys before production.
        </p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
