import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) next = "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const host = forwardedHost || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || "https";
      const targetOrigin = host ? `${proto}://${host}` : url.origin;
      return NextResponse.redirect(`${targetOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${url.origin}/?google=error`);
}
