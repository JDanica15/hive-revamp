import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { authClient } from "@/lib/supabase";

// Landing point for links in Supabase Auth emails (password reset, invites). Supports both link
// styles: "token_hash" (works on any device; used by the custom email templates in
// supabase/email-templates) and "code" (Supabase's default, same browser only).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = params.get("next")?.startsWith("/admin") ? params.get("next")! : "/admin";
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  const supabase = await authClient();
  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Missing token") };

  if (error) {
    const url = new URL("/admin/forgot-password", request.url);
    url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL(next, request.url));
}
