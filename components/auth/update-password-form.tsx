"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/ui/password-field";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setSessionOk(Boolean(user));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: UpdatePasswordInput) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSubmitting(false);
    if (error) {
      toast.error("Could not update password", { description: error.message });
      return;
    }
    toast.success("Password updated");
    router.replace("/dashboard");
    router.refresh();
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Checking your reset link…</p>;
  }

  if (sessionOk === false) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>This reset link is invalid or has expired. Request a new one from the sign-in page.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordField
          id="confirmPassword"
          label="confirm password"
          autoComplete="new-password"
          aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
