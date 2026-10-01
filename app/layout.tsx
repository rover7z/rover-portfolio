import type { Metadata } from "next";
import { loadPersonalSiteConfig } from "../lib/personal-data";
import { VisitorTracker } from "../components/visitor-tracker";
import "./globals.css";
import "./personal-v6.css";
import "./rover-backgrounds.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadPersonalSiteConfig();
  return {
    title: `${settings.hero.name} — ${settings.hero.alias}`,
    description: settings.hero.subtitle.en || `Personal site of ${settings.hero.name}`,
    icons: settings.brand.faviconUrl ? { icon: settings.brand.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<VisitorTracker /></body></html>;
}
