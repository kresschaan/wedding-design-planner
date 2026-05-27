import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f2ea] px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-heading text-2xl tracking-tight">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and complete the verification step. We will send a reset link if an account
            exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <Link href="/" className="text-xs hover:underline">
            ← Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
