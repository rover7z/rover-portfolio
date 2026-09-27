import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { createClient } from "../../lib/supabase/server";
import type { PortfolioItem } from "../../lib/content";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="adminSetupPage">
        <section className="adminSetupCard">
          <p className="adminKicker">ROVER / ADMIN</p>
          <h1>Backend ready to connect.</h1>
          <p>The dashboard code is built. Create a dedicated Supabase project for this portfolio, run <code>supabase/schema.sql</code>, then copy <code>.env.example</code> to <code>.env.local</code> and add the project URL and publishable key.</p>
          <a href="/" className="adminPrimary adminInlineButton">View portfolio</a>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/admin/login");

  const { data: adminRow } = await supabase.from("admin_users").select("id").eq("id", userId).maybeSingle();
  if (!adminRow) redirect("/admin/login?error=not-admin");

  const { data } = await supabase
    .from("portfolio_items")
    .select("id,kind,title,title_ar,subtitle,description,category,cover_url,video_url,external_url,year,duration,tags,sort_order,is_featured,is_published")
    .order("sort_order", { ascending: true });

  return <AdminDashboard initialItems={(data ?? []) as PortfolioItem[]} />;
}
