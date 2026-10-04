import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../lib/supabase/env";
import { createClient } from "../../../lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "cache-control": "no-store" };

function uuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function unavailable() {
  return NextResponse.json({ ok: false }, { status: 503, headers: noStore });
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return unavailable();

  const params = new URL(request.url).searchParams;
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const visitorId = params.get("visitorId");
  if (!uuid(visitorId) || !ids.length || ids.length > 80 || ids.some((id) => !uuid(id))) {
    return NextResponse.json({ ok: false }, { status: 400, headers: noStore });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_photo_like_states", {
      p_photo_ids: ids,
      p_visitor_id: visitorId,
    });
    if (error) return unavailable();

    const likes = (data ?? []).map((row: { photo_id: string; like_count: number | string; liked: boolean }) => ({
      photoId: row.photo_id,
      count: Number(row.like_count) || 0,
      liked: Boolean(row.liked),
    }));
    return NextResponse.json({ ok: true, likes }, { headers: noStore });
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return unavailable();

  let body: { photoId?: unknown; visitorId?: unknown; liked?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: noStore });
  }

  if (!uuid(body.photoId) || !uuid(body.visitorId) || typeof body.liked !== "boolean") {
    return NextResponse.json({ ok: false }, { status: 400, headers: noStore });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("set_photo_like", {
      p_photo_id: body.photoId,
      p_visitor_id: body.visitorId,
      p_liked: body.liked,
    });
    if (error) return unavailable();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return NextResponse.json({ ok: false }, { status: 404, headers: noStore });

    return NextResponse.json({
      ok: true,
      like: {
        photoId: row.photo_id,
        count: Number(row.like_count) || 0,
        liked: Boolean(row.liked),
      },
    }, { headers: noStore });
  } catch {
    return unavailable();
  }
}
