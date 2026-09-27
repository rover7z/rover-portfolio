import { lookup } from "node:dns/promises";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "movie" | "music" | "game" | "video" | "photo";

type Metadata = {
  url: string;
  kind: Kind;
  title: string;
  subtitle: string;
  description: string;
  platform: string;
  cover_url: string;
  year: string;
  source_rating_text: string;
  source_rating_label: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!adminRow) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { url?: string; kind?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.url) {
    return Response.json({ error: "Missing URL" }, { status: 400 });
  }

  try {
    const input = new URL(body.url);
    const requestedKind = isKind(body.kind) ? body.kind : undefined;
    const result = await collectMetadata(input, requestedKind);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not fetch metadata";
    return Response.json({ error: message }, { status: 400 });
  }
}

function isKind(value: unknown): value is Kind {
  return (
    value === "movie" ||
    value === "music" ||
    value === "game" ||
    value === "video" ||
    value === "photo"
  );
}

async function collectMetadata(
  input: URL,
  requestedKind?: Kind,
): Promise<Metadata> {
  await assertPublicUrl(input);

  const host = input.hostname.toLowerCase();
  const result: Metadata = {
    url: input.toString(),
    kind: requestedKind ?? inferKind(input),
    title: "",
    subtitle: "",
    description: "",
    platform: platformFor(input),
    cover_url: "",
    year: "",
    source_rating_text: "",
    source_rating_label: "",
  };

  // IMDb title pages are frequently WAF-blocked for server-side HTML fetches.
  // Resolve the tt-ID directly through IMDb's JSON/GraphQL endpoints instead.
  if (host.includes("imdb.com")) {
    await enrichImdbDirect(input, result);
    cleanMetadata(result);
    if (result.title) return result;
  }

  if (host.includes("steampowered.com")) {
    await enrichSteam(input, result);
  }

  if (host.includes("spotify.com")) {
    await enrichOEmbed(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(input.toString())}`,
      result,
    );
  } else if (host === "youtu.be" || host.includes("youtube.com")) {
    await enrichOEmbed(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(input.toString())}`,
      result,
      true,
    );
  }

  try {
    const html = await fetchHtml(input);
    enrichFromHtml(html, input, result);
  } catch {
    // Source-specific metadata may already be enough.
  }

  cleanMetadata(result);

  // For movies from Netflix/Prime/etc, use IMDb as a rating/poster fallback.
  if (result.kind === "movie" && result.title && !result.source_rating_text) {
    await enrichImdbByTitle(result);
  }

  if (!result.title) {
    throw new Error(
      "Could not read the title from this link. You can still enter the details manually.",
    );
  }

  return result;
}

async function enrichImdbDirect(input: URL, result: Metadata) {
  const id = input.pathname.match(/\/title\/(tt\d+)/i)?.[1];
  if (!id) return;

  result.platform = "IMDb";

  const ok = await enrichImdbId(id, result);
  if (ok) return;

  // Reliable lightweight fallback: IMDb suggestion endpoint by tt-ID.
  try {
    const suggestion = await fetchJson(
      new URL(
        `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(id)}.json`,
      ),
    );
    const candidate = Array.isArray(suggestion?.d)
      ? suggestion.d.find((x: any) => x?.id === id) ?? suggestion.d[0]
      : null;

    if (candidate) {
      result.title ||= stringValue(candidate.l);
      result.year ||= candidate.y ? String(candidate.y) : "";
      result.cover_url ||= stringValue(
        candidate.i?.imageUrl || candidate.i?.url,
      );
      result.subtitle ||= stringValue(candidate.s);
    }
  } catch {
    // Keep manual entry available if IMDb changes this endpoint.
  }
}

async function enrichImdbByTitle(result: Metadata) {
  try {
    const suggestion = await fetchJson(
      new URL(
        `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(result.title)}.json`,
      ),
    );

    const candidates = Array.isArray(suggestion?.d) ? suggestion.d : [];
    const candidate =
      candidates.find(
        (x: any) =>
          typeof x?.id === "string" &&
          x.id.startsWith("tt") &&
          normalizeTitle(x.l) === normalizeTitle(result.title),
      ) ??
      candidates.find(
        (x: any) => typeof x?.id === "string" && x.id.startsWith("tt"),
      );

    if (candidate?.id) {
      await enrichImdbId(candidate.id, result);
    }
  } catch {
    // IMDb enrichment is best effort.
  }
}

async function enrichImdbId(id: string, result: Metadata): Promise<boolean> {
  const query = `
    query RoverTitleDetail($id: ID!) {
      title(id: $id) {
        id
        titleText { text }
        originalTitleText { text }
        titleType { text id }
        releaseYear { year endYear }
        ratingsSummary { aggregateRating voteCount }
        runtime { seconds }
        genres { genres { text } }
        plot { plotText { plainText } }
        primaryImage { url }
      }
    }
  `;

  try {
    const response = await safeFetch(new URL("https://api.graphql.imdb.com/"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "user-agent": "Mozilla/5.0 (compatible; RoverPortfolio/1.0)",
      },
      body: JSON.stringify({ query, variables: { id } }),
    });

    if (!response.ok) return false;

    const payload = await response.json();
    const t = payload?.data?.title;
    if (!t) return false;

    result.title ||= stringValue(t.titleText?.text);
    result.description ||= stringValue(t.plot?.plotText?.plainText);
    result.cover_url ||= stringValue(t.primaryImage?.url);
    result.year ||= t.releaseYear?.year ? String(t.releaseYear.year) : "";

    const rating = Number(t.ratingsSummary?.aggregateRating);
    if (Number.isFinite(rating) && rating > 0) {
      result.source_rating_label = "IMDb";
      result.source_rating_text = `${rating.toFixed(1)}/10`;
    }

    return Boolean(result.title);
  } catch {
    return false;
  }
}

async function enrichOEmbed(
  url: string,
  result: Metadata,
  useAuthor = false,
) {
  try {
    const data = await fetchJson(new URL(url));
    if (!result.title && typeof data.title === "string") {
      result.title = data.title;
    }
    if (!result.cover_url && typeof data.thumbnail_url === "string") {
      result.cover_url = data.thumbnail_url;
    }
    if (
      useAuthor &&
      !result.subtitle &&
      typeof data.author_name === "string"
    ) {
      result.subtitle = data.author_name;
    }
    if (!result.platform && typeof data.provider_name === "string") {
      result.platform = data.provider_name;
    }
  } catch {
    // Best effort.
  }
}

async function enrichSteam(input: URL, result: Metadata) {
  const match = input.pathname.match(/\/app\/(\d+)/);
  if (!match) return;

  const appId = match[1];

  try {
    const raw = await fetchJson(
      new URL(
        `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`,
      ),
    );
    const data = raw?.[appId]?.data;

    if (data) {
      result.title ||= stringValue(data.name);
      result.subtitle ||= Array.isArray(data.developers)
        ? data.developers.join(", ")
        : "";
      result.description ||= stripHtml(stringValue(data.short_description));
      result.cover_url ||= stringValue(data.header_image);
      result.year ||= firstYear(stringValue(data.release_date?.date));
      result.platform = "Steam";

      if (data.metacritic?.score) {
        result.source_rating_label = "Metacritic";
        result.source_rating_text = `${data.metacritic.score}/100`;
      }
    }
  } catch {
    // Continue with public page metadata.
  }

  try {
    const reviews = await fetchJson(
      new URL(
        `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`,
      ),
    );
    const q = reviews?.query_summary;

    if (q?.total_reviews > 0) {
      const percent = Math.round(
        (Number(q.total_positive || 0) / Number(q.total_reviews)) * 100,
      );
      result.source_rating_label = "Steam";
      result.source_rating_text = `${percent}% positive`;
    }
  } catch {
    // Keep any Metacritic fallback.
  }
}

function enrichFromHtml(html: string, input: URL, result: Metadata) {
  const ld = bestJsonLd(html);

  const rawTitle = firstNonEmpty(
    textFromLd(ld?.name),
    meta(html, "og:title"),
    meta(html, "twitter:title"),
    titleTag(html),
  );

  const rawDescription = firstNonEmpty(
    textFromLd(ld?.description),
    meta(html, "og:description"),
    meta(html, "description"),
    meta(html, "twitter:description"),
  );

  const image = firstNonEmpty(
    imageFromLd(ld?.image),
    meta(html, "og:image"),
    meta(html, "twitter:image"),
  );

  const creator = firstNonEmpty(
    nameFromLd(ld?.byArtist),
    nameFromLd(ld?.author),
    nameFromLd(ld?.creator),
    meta(html, "music:musician"),
  );

  const date = firstNonEmpty(
    textFromLd(ld?.datePublished),
    meta(html, "article:published_time"),
  );

  const rating = ratingFromLd(ld?.aggregateRating);

  result.title ||= cleanupTitle(rawTitle, result.platform);
  result.description ||= stripHtml(rawDescription);
  result.cover_url ||= resolveUrl(image, input);
  result.subtitle ||= creator;
  result.year ||= firstYear(date);

  if (rating && !result.source_rating_text) {
    result.source_rating_text = rating.text;
    result.source_rating_label = result.platform;
  }

  const siteName = meta(html, "og:site_name");
  if ((!result.platform || result.platform.includes(".")) && siteName) {
    result.platform = decodeHtml(siteName);
  }

  if (result.platform === "Spotify") {
    const spotify = rawTitle.match(
      /^(.*?)\s+-\s+song and lyrics by\s+(.+?)(?:\s+\|\s+Spotify)?$/i,
    );
    if (spotify) {
      result.title = spotify[1].trim();
      result.subtitle ||= spotify[2].trim();
    }
  }
}

function inferKind(url: URL): Kind {
  const host = url.hostname.toLowerCase();

  if (
    host.includes("spotify.com") ||
    host.includes("soundcloud.com") ||
    host.includes("deezer.com") ||
    host === "music.apple.com"
  ) {
    return "music";
  }

  if (
    host.includes("steampowered.com") ||
    host.includes("playstation.com") ||
    host.includes("xbox.com") ||
    host.includes("epicgames.com") ||
    host === "play.google.com" ||
    host === "apps.apple.com"
  ) {
    return "game";
  }

  if (
    host.includes("netflix.com") ||
    host.includes("imdb.com") ||
    host.includes("themoviedb.org") ||
    host.includes("primevideo.com") ||
    host.includes("shahid")
  ) {
    return "movie";
  }

  return "video";
}

function platformFor(url: URL) {
  const h = url.hostname.toLowerCase().replace(/^www\./, "");

  if (h.includes("spotify.com")) return "Spotify";
  if (h === "music.apple.com") return "Apple Music";
  if (h.includes("soundcloud.com")) return "SoundCloud";
  if (h.includes("deezer.com")) return "Deezer";
  if (h === "youtu.be" || h.includes("youtube.com")) {
    return h.startsWith("music.") ? "YouTube Music" : "YouTube";
  }
  if (h.includes("netflix.com")) return "Netflix";
  if (h.includes("imdb.com")) return "IMDb";
  if (h.includes("themoviedb.org")) return "TMDB";
  if (h.includes("primevideo.com") || h.includes("amazon.com")) {
    return "Prime Video";
  }
  if (h.includes("shahid")) return "Shahid";
  if (h.includes("steampowered.com")) return "Steam";
  if (h.includes("playstation.com")) return "PlayStation";
  if (h === "play.google.com") return "Google Play";
  if (h === "apps.apple.com") return "App Store";
  if (h.includes("epicgames.com")) return "Epic Games";
  if (h.includes("xbox.com")) return "Xbox";
  if (h.includes("gog.com")) return "GOG";

  return h;
}

async function fetchHtml(url: URL) {
  const response = await safeFetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; RoverPortfolio/1.0)",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`);
  }

  const type = response.headers.get("content-type") || "";
  if (
    !type.includes("text/html") &&
    !type.includes("application/xhtml+xml")
  ) {
    throw new Error("The link is not a public web page.");
  }

  const text = await response.text();
  return text.slice(0, 2_500_000);
}

async function fetchJson(url: URL): Promise<any> {
  const response = await safeFetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; RoverPortfolio/1.0)",
      accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`);
  }

  return response.json();
}

async function safeFetch(start: URL, init: RequestInit = {}) {
  let current = start;

  for (let redirects = 0; redirects < 5; redirects++) {
    await assertPublicUrl(current);

    const response = await fetch(current, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return response;
      current = new URL(location, current);
      continue;
    }

    return response;
  }

  throw new Error("Too many redirects");
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http/https links are supported.");
  }

  const host = url.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Private addresses are not allowed.");
  }

  const records = await lookup(host, { all: true });

  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("Private addresses are not allowed.");
  }
}

function isPrivateIp(ip: string) {
  if (ip === "::1" || ip === "::") return true;

  const lower = ip.toLowerCase();
  if (
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80:")
  ) {
    return true;
  }

  const v4 = lower.startsWith("::ffff:") ? lower.slice(7) : lower;
  const parts = v4.split(".").map(Number);

  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function meta(html: string, key: string) {
  const escaped = escapeRegExp(key);

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

function titleTag(html: string) {
  return decodeHtml(
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "",
  )
    .replace(/\s+/g, " ")
    .trim();
}

function bestJsonLd(html: string): any {
  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  const candidates: any[] = [];

  for (const match of scripts) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1].trim()));
      collectLd(parsed, candidates);
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  return (
    candidates.find((x) => x?.aggregateRating) ||
    candidates.find((x) => x?.name && x?.image) ||
    candidates.find((x) => x?.name) ||
    null
  );
}

function collectLd(value: any, out: any[]) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((x) => collectLd(x, out));
    return;
  }

  if (typeof value !== "object") return;

  if (Array.isArray(value["@graph"])) {
    value["@graph"].forEach((x: any) => collectLd(x, out));
  }

  out.push(value);
}

function ratingFromLd(value: any): { text: string } | null {
  if (!value || typeof value !== "object") return null;

  const rating = Number(value.ratingValue);
  if (!Number.isFinite(rating)) return null;

  const best = Number(value.bestRating);
  return {
    text:
      Number.isFinite(best) && best > 0
        ? `${rating}/${best}`
        : String(rating),
  };
}

function imageFromLd(value: any): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return imageFromLd(value[0]);

  if (value && typeof value === "object") {
    return stringValue(value.url || value.contentUrl);
  }

  return "";
}

function nameFromLd(value: any): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map(nameFromLd).filter(Boolean).join(", ");
  }

  if (value && typeof value === "object") {
    return stringValue(value.name);
  }

  return "";
}

function textFromLd(value: any) {
  return typeof value === "string" ? decodeHtml(value) : "";
}

function cleanupTitle(title: string, platform: string) {
  let out = decodeHtml(title).replace(/\s+/g, " ").trim();
  if (!out) return "";

  const escaped = escapeRegExp(platform);
  out = out
    .replace(
      new RegExp(`\\s*[|–—-]\\s*${escaped}\\s*$`, "i"),
      "",
    )
    .trim();

  out = out
    .replace(/^Watch\s+/i, "")
    .replace(/\s+\|\s+Netflix$/i, "")
    .trim();

  return out;
}

function cleanMetadata(result: Metadata) {
  result.title = cleanupTitle(result.title, result.platform);
  result.subtitle = stripHtml(result.subtitle).slice(0, 250);
  result.description = stripHtml(result.description).slice(0, 1200);
  result.cover_url = result.cover_url.trim();
  result.year = firstYear(result.year);

  if (!result.platform) result.platform = "Website";
}

function stripHtml(value: string) {
  return decodeHtml(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return (value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCharCode(Number(n)),
    );
}

function resolveUrl(value: string, base: URL) {
  if (!value) return "";

  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

function firstYear(value: string) {
  return value?.match(/\b(19|20)\d{2}\b/)?.[0] || "";
}

function firstNonEmpty(
  ...values: Array<string | undefined | null>
) {
  return (
    values.find(
      (x) => typeof x === "string" && x.trim(),
    )?.trim() || ""
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeTitle(value: unknown) {
  return stringValue(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
