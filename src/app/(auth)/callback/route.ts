import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback — exchanges a one-time code for a session.
 * Used by magic links and email confirmations.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Validate redirect is a relative path
      const safe =
        redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/";
      return NextResponse.redirect(`${origin}${safe}`);
    }
  }

  // Code missing or exchange failed — send to sign-in with an error hint
  return NextResponse.redirect(
    `${origin}/sign-in?error=Could+not+verify+your+email.+Please+try+again.`,
  );
}
