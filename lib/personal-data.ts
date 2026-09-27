import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";
import type { PortfolioItem } from "./content";
import { defaultPersonalSiteConfig, mergePersonalSiteConfig, type PersonalSiteConfig } from "./personal-site";

const itemFields = "id,kind,title,title_ar,subtitle,subtitle_ar,description,description_ar,category,cover_url,video_url,external_url,year,duration,tags,sort_order,is_featured,is_published";

export async function loadPersonalItems(): Promise<PortfolioItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select(itemFields)
      .in("kind", ["photo", "video", "movie", "music", "game"])
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []) as PortfolioItem[];
  } catch {
    return [];
  }
}

export async function loadPersonalSiteConfig(): Promise<PersonalSiteConfig> {
  if (!isSupabaseConfigured()) return defaultPersonalSiteConfig;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "site_config_v6").maybeSingle();
    if (error) return defaultPersonalSiteConfig;
    return mergePersonalSiteConfig(data?.value);
  } catch {
    return defaultPersonalSiteConfig;
  }
}

export const personalItemFields = itemFields;
