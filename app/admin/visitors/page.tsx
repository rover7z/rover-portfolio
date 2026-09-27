import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type Summary = {
  total_visits?: number;
  unique_visitors?: number;
  today_visits?: number;
};

export default async function VisitorsPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/admin/login");

  const { data: adminRow } = await supabase.from("admin_users").select("id").eq("id", userId).maybeSingle();
  if (!adminRow) redirect("/admin/login?error=not-admin");

  const { data: summaryData } = await supabase.rpc("get_site_analytics_summary");
  const summary = (summaryData ?? {}) as Summary;

  return (
    <main className="rvVisitorsPage" dir="rtl">
      <header className="rvVisitorsTop">
        <div>
          <span>ROVER / ANALYTICS</span>
          <h1>زوار الموقع</h1>
          <p>إحصائيات مجهولة بالكامل — بدون أسماء أو إيميلات.</p>
        </div>
        <a href="/admin">← الرجوع للأدمن</a>
      </header>

      <section className="rvStats rvStatsSimple">
        <article>
          <small>عدد الزوار</small>
          <strong>{Number(summary.unique_visitors ?? 0).toLocaleString("en-US")}</strong>
          <p>أجهزة/متصفحات مختلفة زارت الموقع.</p>
        </article>

        <article>
          <small>إجمالي الزيارات</small>
          <strong>{Number(summary.total_visits ?? 0).toLocaleString("en-US")}</strong>
          <p>يشمل تكرار الزيارة من نفس الزائر.</p>
        </article>

        <article>
          <small>زيارات اليوم</small>
          <strong>{Number(summary.today_visits ?? 0).toLocaleString("en-US")}</strong>
          <p>عدد الزيارات المسجلة اليوم.</p>
        </article>
      </section>

      <section className="rvSimpleInfo">
        <span>PRIVACY</span>
        <h2>الزوار مجهولون</h2>
        <p>الموقع يستخدم معرفًا عشوائيًا داخل المتصفح لعدّ الزوار فقط، ولا يحتاج الزائر إلى تسجيل دخول.</p>
      </section>
    </main>
  );
}
