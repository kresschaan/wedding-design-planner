"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { getEmailAuthConfirmRedirectUrl } from "@/lib/auth-confirm-redirect";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/ui/password-field";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);
    if (error) {
      const raw = error.message;
      const lower = raw.toLowerCase();
      const unconfirmed =
        lower.includes("not confirmed") ||
        lower.includes("email_not_confirmed") ||
        error.code === "email_not_confirmed";
      toast.error("Sign-in failed", {
        description: unconfirmed
          ? `${raw} Use “Resend confirmation email” below (needs email quota), or in Supabase Dashboard → Authentication → Users find your user and confirm manually for testing.`
          : raw,
      });
      return;
    }
    toast.success("Signed in");
    router.replace(next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  async function resendConfirmation() {
    const email = form.getValues("email").trim();
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    setResending(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: origin ? { emailRedirectTo: getEmailAuthConfirmRedirectUrl(origin) } : undefined,
    });
    setResending(false);
    if (error) {
      toast.error("Could not resend", { description: error.message });
      return;
    }
    toast.success("Confirmation email requested", {
      description: "If this address is waiting on confirmation, check inbox and spam. If you are rate-limited, wait before trying again.",
    });
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordField
          id="password"
          label="password"
          autoComplete="current-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
      <div className="text-center">
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
          disabled={resending}
          onClick={() => void resendConfirmation()}
        >
          {resending ? "Sending…" : "Resend confirmation email"}
        </button>
      </div>
    </form>
  );
}
