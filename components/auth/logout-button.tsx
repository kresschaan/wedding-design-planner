"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      toast.error("Sign out failed", { description: error.message });
      return;
    }
    toast.success("Signed out");
    router.replace("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void logout()} disabled={loading}>
      {loading ? "Signing out…" : "Log out"}
    </Button>
  );
}
