import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { createClient } from "../../lib/supabase/server";
import type { PortfolioItem } from "../../lib/content";
import { defaultPersonalSiteConfig, mergePersonalSiteConfig } from "../../lib/personal-site";
import { PersonalEditor } from "./personal-editor";

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
    supabase.from("portfolio_items").select("id,kind,title,title_ar,subtitle,subtitle_ar,description,description_ar,category,cover_url,video_url,external_url,year,duration,rating,tags,sort_order,is_featured,is_published").in("kind", ["photo", "video", "movie", "music", "game"]).order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("value").eq("key", "site_config_v6").maybeSingle(),
  ]);

  return <PersonalEditor initialItems={(items ?? []) as PortfolioItem[]} initialSettings={settingsRow?.value ? mergePersonalSiteConfig(settingsRow.value) : defaultPersonalSiteConfig} />;
}
