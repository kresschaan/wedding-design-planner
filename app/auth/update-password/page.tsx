import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f2ea] px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-heading text-2xl tracking-tight">Set a new password</CardTitle>
          <CardDescription>Choose a strong password you have not used here before.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-xs hover:underline">
            ← Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
