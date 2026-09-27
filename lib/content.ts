export type PortfolioKind = "photo" | "video" | "movie" | "music" | "game" | "film" | "application" | "creative";

export type PortfolioItem = {
  id?: string;
  kind: PortfolioKind;
  title: string;
  title_ar?: string | null;
  subtitle?: string | null;
  subtitle_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  category?: string | null;
  cover_url?: string | null;
  video_url?: string | null;
  external_url?: string | null;
  year?: string | null;
  duration?: string | null;
  tags?: string[] | null;
  sort_order?: number | null;
  is_featured?: boolean | null;
  is_published?: boolean | null;
};

// Kept only for compatibility with the older V5 components.
export const demoItems: PortfolioItem[] = [];
