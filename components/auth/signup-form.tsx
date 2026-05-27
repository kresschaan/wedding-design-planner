"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signupSchema, type SignupInput } from "@/lib/validators/auth";
import { getEmailAuthConfirmRedirectUrl } from "@/lib/auth-confirm-redirect";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/ui/password-field";

export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupInput) {
    setSubmitting(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const emailRedirectTo = origin ? getEmailAuthConfirmRedirectUrl(origin) : undefined;

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        /** Same host as PKCE verifier; `/auth/confirm` exchanges `code` or `token_hash` then sends user to `next`. */
        emailRedirectTo,
      },
    });
    setSubmitting(false);
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("already registered") || lower.includes("user already registered")) {
        form.setError("email", {
          type: "server",
          message: "This email is already registered. Sign in or use Forgot password.",
        });
        form.setFocus("email");
        return;
      }
      const isRateLimited =
        lower.includes("rate") || lower.includes("too many") || lower.includes("429");
      toast.error("Could not create account", {
        description: isRateLimited
          ? `${error.message} Wait a few minutes or try again later.`
          : error.message,
      });
      return;
    }

    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      form.setError("email", {
        type: "server",
        message: "This email is already registered. Sign in or use Forgot password.",
      });
      form.setFocus("email");
      return;
    }

    toast.success("Check your email", {
      description:
        "We sent a confirmation link if your project requires it. After you confirm, you can sign in.",
    });
    router.replace("/login");
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
        {form.formState.errors.fullName ? (
          <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordField
          id="password"
          label="password"
          autoComplete="new-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordField
          id="confirmPassword"
          label="confirm password"
          autoComplete="new-password"
          aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
