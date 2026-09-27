export type PortfolioKind = "photo" | "film" | "application" | "creative";

export type PortfolioItem = {
  id?: string;
  kind: PortfolioKind;
  title: string;
  title_ar?: string | null;
  subtitle?: string | null;
  description?: string | null;
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

export const demoItems: PortfolioItem[] = [
  { kind: "photo", title: "Faces of the City", category: "People", cover_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=85", sort_order: 1, is_published: true },
  { kind: "photo", title: "Golden River", category: "Travel", cover_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85", sort_order: 2, is_published: true },
  { kind: "photo", title: "Old Streets", category: "Urban", cover_url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1000&q=85", sort_order: 3, is_published: true },
  { kind: "photo", title: "Silent Portrait", category: "Black & White", cover_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=85", sort_order: 4, is_published: true },
  { kind: "photo", title: "Palm Stories", category: "Nature", cover_url: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=85", sort_order: 5, is_published: true },
  { kind: "photo", title: "City Lights", category: "Urban", cover_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=85", sort_order: 6, is_published: true },
  { kind: "film", title: "Between Two Banks", title_ar: "بين الضفتين", year: "2026", duration: "18 min", cover_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=85", is_featured: true, sort_order: 1, is_published: true },
  { kind: "film", title: "Voices from the City", title_ar: "أصوات من المدينة", year: "2025", duration: "12 min", cover_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85", sort_order: 2, is_published: true },
  { kind: "film", title: "Memory of the Place", title_ar: "ذاكرة المكان", year: "2025", duration: "15 min", cover_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85", sort_order: 3, is_published: true },
  { kind: "application", title: "Security Approvals", subtitle: "Flutter App", description: "Document workflow, OCR and approvals management.", tags: ["Flutter", "Supabase"], sort_order: 1, is_published: true },
  { kind: "application", title: "Sports Predictions", subtitle: "Flutter App", description: "Sports data, predictions, quizzes and user management.", tags: ["Flutter", "Supabase"], sort_order: 2, is_published: true },
  { kind: "application", title: "Rover Tools", subtitle: "Creative Toolkit", description: "A growing collection of utilities for creative workflows.", tags: ["Web", "AI"], sort_order: 3, is_published: true },
  { kind: "application", title: "AI Visuals", subtitle: "AI Project", description: "Exploring generative tools for visual storytelling.", tags: ["AI", "Creative"], sort_order: 4, is_published: true },
  { kind: "creative", title: "Design", category: "Design", cover_url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=85", sort_order: 1, is_published: true },
  { kind: "creative", title: "Video Editing", category: "Video Editing", cover_url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=85", sort_order: 2, is_published: true },
  { kind: "creative", title: "AI Art", category: "AI Art", cover_url: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=85", sort_order: 3, is_published: true },
  { kind: "creative", title: "Creative Concepts", category: "Creative Concept", cover_url: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=85", sort_order: 4, is_published: true }
];
