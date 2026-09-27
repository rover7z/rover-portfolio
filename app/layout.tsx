import type { Metadata } from "next";
import { loadSiteConfig } from "../lib/load-content";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteConfig();
  return {
    title: `${settings.hero.name} — ${settings.hero.alias} | Portfolio`,
    description: settings.hero.subtitle.en || `Portfolio of ${settings.hero.name}`,
    icons: settings.brand.faviconUrl ? { icon: settings.brand.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
