import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f2ea] px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-heading text-2xl tracking-tight">
            Create your planner
          </CardTitle>
          <CardDescription>
            Save reception floor plans, seating, and venue notes securely in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <span>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
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
