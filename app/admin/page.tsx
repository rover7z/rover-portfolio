import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { createClient } from "../../lib/supabase/server";
import type { PortfolioItem } from "../../lib/content";
import { mergeSiteConfig } from "../../lib/site-settings";
import { VisualEditor } from "./visual-editor";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return <main className="adminSetupPage"><section className="adminSetupCard"><p className="adminKicker">ROVER / ADMIN</p><h1>Backend ready to connect.</h1><p>Supabase environment variables are missing.</p><a href="/" className="adminPrimary adminInlineButton">View portfolio</a></section></main>;
  }
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/admin/login");
  const { data: adminRow } = await supabase.from("admin_users").select("id").eq("id", userId).maybeSingle();
  if (!adminRow) redirect("/admin/login?error=not-admin");

  const [{ data: items }, { data: settingsRow }] = await Promise.all([
    supabase.from("portfolio_items").select("id,kind,title,title_ar,subtitle,description,category,cover_url,video_url,external_url,year,duration,tags,sort_order,is_featured,is_published").order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("value").eq("key", "site_config").maybeSingle(),
  ]);

  return <VisualEditor initialItems={(items ?? []) as PortfolioItem[]} initialSettings={mergeSiteConfig(settingsRow?.value)} />;
}
