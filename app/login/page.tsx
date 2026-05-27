import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f2ea] px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-heading text-2xl tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Sign in to design and save your wedding and reception layouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading form…</p>}>
            <LoginForm />
          </Suspense>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <span>
            New here?{" "}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </span>
          <Link href="/" className="text-xs hover:underline">
            ← Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
