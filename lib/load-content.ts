import { demoItems, type PortfolioItem } from "./content";
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
