import { demoItems, type PortfolioItem } from "./content";
import { defaultSiteConfig, mergeSiteConfig, type SiteConfig } from "./site-settings";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";

export async function loadPortfolioItems(): Promise<PortfolioItem[]> {
  if (!isSupabaseConfigured()) return demoItems;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id,kind,title,title_ar,subtitle,description,category,cover_url,video_url,external_url,year,duration,tags,sort_order,is_featured,is_published")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) return demoItems;
    return data as PortfolioItem[];
  } catch {
    return demoItems;
  }
}

export async function loadSiteConfig(): Promise<SiteConfig> {
  if (!isSupabaseConfigured()) return defaultSiteConfig;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "site_config").maybeSingle();
    if (error) return defaultSiteConfig;
    return mergeSiteConfig(data?.value);
  } catch {
    return defaultSiteConfig;
  }
}
