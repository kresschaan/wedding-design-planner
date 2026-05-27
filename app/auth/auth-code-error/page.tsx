import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f2ea] px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-heading text-2xl tracking-tight">Link could not be verified</CardTitle>
          <CardDescription>
            We could not finish signing you in from this link. Common causes are an expired link, a link
            already used once, or a missing session cookie (see below).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
          <p>
            If you just clicked a <strong>password reset</strong> link: open it in the{" "}
            <strong>same browser</strong> where you requested the reset (PKCE needs the same cookies), or
            customize the reset email template to use{" "}
            <code className="rounded bg-muted px-1 text-xs">token_hash</code> so the link works on any
            device — see the{" "}
            <a
              href="https://supabase.com/docs/guides/auth/passwords#forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Supabase password reset guide
            </a>
            .
          </p>
          <p>If the problem continues, confirm your app URL matches Supabase redirect settings.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
            Request a new reset link
          </Link>
          <Link href="/login" className="text-muted-foreground hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
