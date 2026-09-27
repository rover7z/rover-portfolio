import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

function cityHeader(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).slice(0, 120);
  } catch {
    return value.slice(0, 120);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const visitorId = text(body.visitorId, 100);
    const sessionId = text(body.sessionId, 100);

    if (visitorId.length < 8 || sessionId.length < 8) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("record_site_visit", {
      p_visitor_id: visitorId,
      p_session_id: sessionId,
      p_path: text(body.path, 300) || "/",
      p_referrer: text(body.referrer, 1000) || null,
      p_user_agent: text(body.userAgent, 1000) || request.headers.get("user-agent"),
      p_language: text(body.language, 50) || null,
      p_screen_width: numberOrNull(body.screenWidth),
      p_screen_height: numberOrNull(body.screenHeight),
      p_country_code: request.headers.get("x-vercel-ip-country")?.slice(0, 10) ?? null,
      p_city: cityHeader(request.headers.get("x-vercel-ip-city")),
    });

    if (error) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
