import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type Summary = {
  total_visits?: number;
  unique_visitors?: number;
  today_visits?: number;
  identified_visitors?: number;
};

type VisitorRow = {
  visitor_id: string;
  last_visit: string;
  visit_count: number;
  last_path: string | null;
  referrer: string | null;
  user_agent: string | null;
  language: string | null;
  country_code: string | null;
  city: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
};

function device(ua: string | null) {
  const value = ua ?? "";
  const os =
    /iPhone/i.test(value) ? "iPhone" :
    /iPad/i.test(value) ? "iPad" :
    /Android/i.test(value) ? "Android" :
    /Windows/i.test(value) ? "Windows" :
    /Macintosh|Mac OS X/i.test(value) ? "Mac" :
    /Linux/i.test(value) ? "Linux" : "جهاز غير معروف";

  const browser =
    /Edg\//i.test(value) ? "Edge" :
    /OPR\//i.test(value) ? "Opera" :
    /Chrome\//i.test(value) ? "Chrome" :
    /Firefox\//i.test(value) ? "Firefox" :
    /Safari\//i.test(value) ? "Safari" : "";

  return browser ? `${os} • ${browser}` : os;
}

function source(referrer: string | null) {
  if (!referrer) return "مباشر";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("google")) return "Google";
    if (host.includes("facebook")) return "Facebook";
    if (host.includes("tiktok")) return "TikTok";
    return host;
  } catch {
    return "رابط خارجي";
  }
}

function when(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Baghdad",
  }).format(date);
}

export default async function VisitorsPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/admin/login");

  const { data: adminRow } = await supabase.from("admin_users").select("id").eq("id", userId).maybeSingle();
  if (!adminRow) redirect("/admin/login?error=not-admin");

  const [{ data: summaryData }, { data: visitorsData }] = await Promise.all([
    supabase.rpc("get_site_analytics_summary"),
    supabase.rpc("get_recent_site_visitors", { p_limit: 100 }),
  ]);

  const summary = (summaryData ?? {}) as Summary;
  const visitors = (visitorsData ?? []) as VisitorRow[];

  return (
    <main className="rvVisitorsPage" dir="rtl">
      <header className="rvVisitorsTop">
        <div>
          <span>ROVER / ANALYTICS</span>
          <h1>زوار الموقع</h1>
          <p>الزائر الذي يختار الدخول بحساب Google يظهر باسمه وإيميله. البقية يظهرون كزوار مجهولين.</p>
        </div>
        <a href="/admin">← الرجوع للأدمن</a>
      </header>

      <section className="rvStats">
        <article><small>إجمالي الزيارات</small><strong>{Number(summary.total_visits ?? 0).toLocaleString("en-US")}</strong></article>
        <article><small>زوار مختلفون</small><strong>{Number(summary.unique_visitors ?? 0).toLocaleString("en-US")}</strong></article>
        <article><small>زيارات اليوم</small><strong>{Number(summary.today_visits ?? 0).toLocaleString("en-US")}</strong></article>
        <article><small>معروفون بـ Google</small><strong>{Number(summary.identified_visitors ?? 0).toLocaleString("en-US")}</strong></article>
      </section>

      <section className="rvVisitorsPanel">
        <div className="rvVisitorsHeading">
          <div><span>LATEST VISITORS</span><h2>آخر الزوار</h2></div>
          <small>آخر 100 زائر</small>
        </div>

        {!visitors.length ? (
          <div className="rvVisitorsEmpty">لا توجد زيارات مسجلة بعد. افتح الموقع من جهاز آخر حتى تبدأ الإحصائيات.</div>
        ) : (
          <div className="rvVisitorList">
            {visitors.map((visitor) => {
              const known = Boolean(visitor.email);
              const shortId = visitor.visitor_id.slice(-8).toUpperCase();
              const location = [visitor.city, visitor.country_code].filter(Boolean).join(" • ");
              return (
                <article className="rvVisitorCard" key={visitor.visitor_id}>
                  <div className="rvVisitorPerson">
                    {visitor.avatar_url ? <img src={visitor.avatar_url} alt="" /> : <span>{known ? (visitor.full_name || visitor.email || "G").slice(0, 1).toUpperCase() : "?"}</span>}
                    <div>
                      <div className="rvVisitorNameLine">
                        <strong>{known ? (visitor.full_name || "زائر Google") : `زائر مجهول #${shortId}`}</strong>
                        <em className={known ? "known" : ""}>{known ? "Google" : "Anonymous"}</em>
                      </div>
                      {visitor.email && <a href={`mailto:${visitor.email}`}>{visitor.email}</a>}
                    </div>
                  </div>

                  <div className="rvVisitorMeta">
                    <span><b>{visitor.visit_count}</b> زيارة</span>
                    <span>{when(visitor.last_visit)}</span>
                    <span>{device(visitor.user_agent)}</span>
                    <span>المصدر: {source(visitor.referrer)}</span>
                    {location && <span>{location}</span>}
                    {visitor.last_path && <span>الصفحة: {visitor.last_path}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="rvPrivacyNote">لا يتم تخزين عنوان IP الخام. الاسم والإيميل يظهران فقط للزائر الذي يوافق على تسجيل الدخول بحسابه.</p>
    </main>
  );
}
